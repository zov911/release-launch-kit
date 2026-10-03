// AI mode: Claude writes the launch kit as schema-validated JSON (same shape as template mode).
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { TYPE_LABEL, TYPE_ORDER } from './core/classify.js';
import { LIMITS } from './core/limits.js';

export const DEFAULT_MODEL = 'claude-opus-5-5';

export const KitSchema = z.object({
  blog: z.object({
    title: z.string(),
    slug: z.string(),
    meta_description: z.string().describe(`Max ${LIMITS.meta_description} characters`),
    markdown: z.string().describe('Full post in markdown, starting with "# title". 400-700 words.'),
  }),
  email: z.object({
    subject_options: z.array(z.string()).describe(`Exactly 3 subject lines, each max ${LIMITS.email_subject} characters, different angles (benefit, curiosity, direct)`),
    preview_text: z.string().describe(`Max ${LIMITS.email_preview} characters`),
    body_markdown: z.string().describe('Short email (120-200 words). Start with "Hi {{first_name}},". One clear CTA link.'),
  }),
  linkedin: z.object({ post: z.string().describe('900-1,300 characters. Hook in the first line, short paragraphs, CTA, hashtags last.') }),
  x: z.object({ thread: z.array(z.string()).describe(`2-5 posts, each max ${LIMITS.x_tweet} characters. First post works on its own.`) }),
  in_app: z.object({
    title: z.string().describe(`Max ${LIMITS.in_app_title} characters`),
    body: z.string().describe(`Max ${LIMITS.in_app_body} characters`),
    cta_label: z.string().describe('Max 20 characters'),
    cta_url: z.string(),
  }),
  customer_notes: z.object({ markdown: z.string().describe('Customer-facing release notes grouped by type, plain language, no internal jargon') }),
  sales_brief: z.object({ markdown: z.string().describe('Internal brief: one-liner, what changed, who to tell (segments/personas), talk track, objection handling, FAQ') }),
});

function systemPrompt(cfg) {
  // Stable per project, so it goes in the cached system prompt.
  return `You are a product marketing writer. You turn engineering release notes into launch assets for ${cfg.product || 'a software product'}.

Brand voice
- Product: ${cfg.product || 'n/a'}${cfg.url ? ` (${cfg.url})` : ''}
- Audience: ${cfg.audience || 'customers and prospects'}
- Tone: ${cfg.tone || 'clear, confident, specific, no hype'}
- Primary CTA: ${cfg.cta?.text || 'See what’s new'} → ${cfg.cta?.url || cfg.url || '{{cta_url}}'}
- Never use: ${(cfg.avoid || ['revolutionary', 'game-changer', 'seamless', 'cutting-edge']).join(', ')}
${cfg.hashtags?.length ? `- Hashtags: ${cfg.hashtags.join(' ')}` : ''}
${cfg.sender ? `- Email sender: ${cfg.sender}` : ''}
${cfg.examples ? `\nVoice examples:\n${cfg.examples}` : ''}

Rules
- Lead with customer outcomes, not implementation details. Translate technical changes into what users can now do.
- Only claim what the release notes support. Don't invent metrics, customers or quotes; use [placeholders] where a fact is needed.
- Internal changes (refactors, CI, dependencies) never appear in external assets.
- Breaking changes must be clearly flagged in the blog, email and customer notes.
- Respect every character limit in the schema.`;
}

function userPrompt(rel) {
  const groups = TYPE_ORDER.filter(t => rel.byType[t].length)
    .map(t => `${TYPE_LABEL[t]}\n${rel.byType[t].map(i => `- ${i.text}${i.scope ? ` [${i.scope}]` : ''}`).join('\n')}`).join('\n\n');
  return `Release ${rel.version ?? '(unversioned)'}${rel.date ? `, ${rel.date}` : ''}. Size: ${rel.size} (${rel.size === 'patch' ? 'keep it low-key' : 'announce it'}).
Suggested headline item: ${rel.headline?.text ?? 'none'}

<release_notes>
${groups}
</release_notes>

Write the complete launch kit.`;
}

/** @returns {Promise<{ kit: z.infer<typeof KitSchema>, usage: object, model: string }>} */
export async function aiKit(rel, cfg, { model = DEFAULT_MODEL, effort = 'medium' } = {}) {
  const client = new Anthropic(); // ANTHROPIC_API_KEY or `ant auth login` profile
  const format = zodOutputFormat(KitSchema);
  let response;
  try {
    // Server-side fallback re-runs the request on Anthropic's recommended model if a safety classifier declines.
    response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format: { type: format.type, schema: format.schema } },
      system: [{ type: 'text', text: systemPrompt(cfg), cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt(rel) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error('Invalid or missing ANTHROPIC_API_KEY. Use --mode template to run without AI.');
    if (err instanceof Anthropic.RateLimitError) throw new Error('Anthropic rate limit reached. Retry in a minute.');
    if (err instanceof Anthropic.APIError) throw new Error(`Anthropic API error ${err.status}: ${err.message}`);
    throw err;
  }
  if (response.stop_reason === 'refusal') throw new Error(`Claude declined this request (${response.stop_details?.category ?? 'unspecified'}).`);
  if (response.stop_reason === 'max_tokens') throw new Error('Output was cut off (max_tokens). Try fewer release items or a smaller model.');
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const parsed = KitSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Claude returned an unexpected shape: ${parsed.error.message}`);
  return { kit: parsed.data, usage: response.usage, model: response.model };
}

export const _prompts = { systemPrompt, userPrompt }; // exported for --dry-run and tests
