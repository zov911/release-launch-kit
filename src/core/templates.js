// Template mode: a complete launch kit without any AI, from parsed + classified release notes.
// Deterministic, instant and free. AI mode (src/ai.js) produces the same shape with better copy.
import { TYPE_LABEL, TYPE_ORDER } from './classify.js';
import { LIMITS, truncate } from './limits.js';

const strip = s => s.replace(/[.!]+$/, '');
// Lowercase the first letter for mid-sentence use, but keep acronyms and brand-like words ("AI", "HubSpot").
const lc = s => (!s || /^[A-Z][A-Z0-9]|^[A-Z][a-z]+[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');
const list = items => items.map(i => `- ${strip(i.text)}`).join('\n');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** Short form for subjects, titles and headings: "AI lead scoring that ranks…" → "AI lead scoring". */
export function short(text, max = 42) {
  const t = strip(text);
  if (t.length <= max) return t;
  const m = t.match(/^(.{8,}?)\s+(that|which|with|when|so|for|to|by|across|via|in|on)\s/i);
  return m && m[1].length <= max ? m[1] : truncate(t, max);
}

function ctx(rel, cfg) {
  const product = cfg.product || 'Our product';
  const v = rel.version ? ` ${rel.version.startsWith('v') ? rel.version : 'v' + rel.version}` : '';
  const h = rel.headline ? strip(rel.headline.text) : 'Improvements across the product';
  const hs = rel.headline ? short(rel.headline.text) : 'Fixes and improvements';
  const others = rel.external.length - (rel.headline ? 1 : 0);
  const url = cfg.cta?.url || cfg.url || '';
  return { product, v, h, hs, others, url, notesUrl: cfg.changelog_url || url, ctaText: cfg.cta?.text || 'See what’s new' };
}

export function blog(rel, cfg) {
  const { product, v, h, hs, others, notesUrl, ctaText, url } = ctx(rel, cfg);
  const title = `${product}${v}: ${hs}${others > 0 ? ` and ${plural(others, 'more update')}` : ''}`;
  const intro = rel.size === 'patch'
    ? `${product}${v} is a maintenance release focused on reliability.`
    : `Today we're releasing ${product}${v}. The highlight: ${h}${others > 0 ? `, plus ${plural(others, 'more update')}` : ''}.${cfg.audience ? ` Here's what it means for ${cfg.audience}.` : ''}`;
  const sections = rel.byType.feature.map(f => {
    const head = short(f.text, 60), full = strip(f.text);
    return `### ${head}\n\n${head === full ? '' : full + '. '}${cfg.feature_blurb || 'Available now for all customers.'}`;
  });
  const rest = TYPE_ORDER.filter(t => t !== 'feature' && rel.byType[t].length)
    .map(t => `## ${TYPE_LABEL[t].replace(/^\S+\s/, '')}\n\n${list(rel.byType[t])}`);
  const upgrade = rel.byType.breaking.length ? `> **Before you upgrade:** this release includes ${plural(rel.byType.breaking.length, 'breaking change')}. Review them above and update your integration first.` : '';
  const markdown = [
    `# ${title}`,
    intro,
    sections.length ? `## What's new\n\n${sections.join('\n\n')}` : '',
    ...rest,
    upgrade,
    `---\n\n**${ctaText}${url ? ` → [${url.replace(/^https?:\/\//, '').split('?')[0]}](${url})` : ''}**${notesUrl && notesUrl !== url ? `\n\nFull release notes: ${notesUrl}` : ''}`,
  ].filter(Boolean).join('\n\n');
  return {
    title,
    slug: slugify(`${product}${v} ${hs}`),
    meta_description: truncate(`${product}${v}: ${h}.${others > 0 ? ` Plus ${plural(others, 'more update')}.` : ''}`, LIMITS.meta_description),
    markdown,
  };
}

export function email(rel, cfg) {
  const { product, v, h, hs, others, url, ctaText } = ctx(rel, cfg);
  const second = rel.byType.feature.find(f => f !== rel.headline);
  const subject_options = [
    truncate(`New in ${product}: ${hs}`, LIMITS.email_subject),
    truncate(`${product}${v} is here${others > 0 ? ` (${others + 1} updates)` : ''}`, LIMITS.email_subject),
    truncate(second ? `${hs} + ${short(second.text, 24)}` : `Meet ${lc(hs)}`, LIMITS.email_subject),
  ];
  const also = rel.external.filter(i => i !== rel.headline).slice(0, 4);
  const body_markdown = [
    'Hi {{first_name}},',
    `We just shipped ${product}${v}. Headline: **${h}**.`,
    also.length ? `Also new:\n\n${list(also)}` : '',
    rel.byType.breaking.length ? `⚠️ Heads-up: ${plural(rel.byType.breaking.length, 'breaking change')}. Check the release notes before upgrading.` : '',
    url ? `[${ctaText} →](${url})` : '',
    `Thanks for building with us,\n${cfg.sender || `The ${product} team`}`,
  ].filter(Boolean).join('\n\n');
  return { subject_options, preview_text: truncate(`${h}${others > 0 ? `, plus ${plural(others, 'more update')}` : ''}.`, LIMITS.email_preview), body_markdown };
}

export function linkedin(rel, cfg) {
  const { product, v, h, url } = ctx(rel, cfg);
  const also = rel.external.filter(i => i !== rel.headline).slice(0, 4);
  const emoji = { feature: '✨', improvement: '⚡', fix: '🛠️', security: '🔒', breaking: '⚠️', deprecation: '⏳', removal: '🧹' };
  const post = [
    `${product}${v} is live 🚀`,
    `${h}.${cfg.audience ? ` Built for ${cfg.audience}.` : ''}`,
    also.length ? `Also in this release:\n${also.map(i => `${emoji[i.type] ?? '•'} ${strip(i.text)}`).join('\n')}` : '',
    url ? `Try it: ${url}` : '',
    (cfg.hashtags || []).join(' '),
  ].filter(Boolean).join('\n\n');
  return { post: truncate(post, LIMITS.linkedin_post) };
}

export function x(rel, cfg) {
  const { product, v, h, url } = ctx(rel, cfg);
  const items = rel.external.filter(i => i !== rel.headline).slice(0, 4);
  const thread = [truncate(`${product}${v} is out: ${h}${items.length ? ' 🧵' : '.'}${url ? `\n\n${url}` : ''}`, LIMITS.x_tweet)];
  items.forEach((i, n) => thread.push(truncate(`${n + 2}/ ${strip(i.text)}.`, LIMITS.x_tweet)));
  return { thread };
}

export function inApp(rel, cfg) {
  const { h, hs, others, url, ctaText } = ctx(rel, cfg);
  return {
    title: truncate(rel.size === 'patch' ? 'Fixes and improvements' : `New: ${hs}`, LIMITS.in_app_title),
    body: truncate(others > 0 ? `${h}, plus ${plural(others, 'more update')}.` : `${h}.`, LIMITS.in_app_body),
    cta_label: rel.size === 'patch' ? 'View notes' : ctaText.length <= 20 ? ctaText : 'Take a look',
    cta_url: url,
  };
}

export function customerNotes(rel, cfg) {
  const { product, v } = ctx(rel, cfg);
  const groups = TYPE_ORDER.filter(t => rel.byType[t].length).map(t => `### ${TYPE_LABEL[t]}\n\n${list(rel.byType[t])}`);
  return { markdown: [`## ${product}${v}${rel.date ? ` (${rel.date})` : ''}`, ...groups].join('\n\n') };
}

export function salesBrief(rel, cfg) {
  const { product, v, h } = ctx(rel, cfg);
  const f = rel.byType.feature;
  return { markdown: [
    `# Sales & CS brief: ${product}${v}`,
    `**One-liner:** ${h}.`,
    `## What changed\n${list(rel.external.slice(0, 8))}`,
    `## Who should hear about it\n- Prospects who asked about: ${f.length ? f.map(i => lc(short(i.text, 40))).slice(0, 3).join('; ') : 'reliability and performance'}\n- Customers who reported the fixed issues (${plural(rel.byType.fix.length, 'fix')} in this release)${rel.byType.breaking.length ? '\n- **Every API/integration customer**: breaking changes, so contact them before they upgrade' : ''}`,
    `## Talk track\n> "New in ${product}: ${lc(h)}. Teams like yours use it to [outcome]. Want a 5-minute walkthrough?"`,
    `## If customers ask\n- **Is it on my plan?** [fill in]\n- **Do I need to do anything?** ${rel.byType.breaking.length ? 'Yes, review the breaking changes in the release notes.' : 'No, it’s live automatically.'}\n- **Where are the details?** ${cfg.changelog_url || cfg.url || '[release notes link]'}`,
  ].join('\n\n') };
}

/** Build the complete kit (same shape as AI mode). */
export function templateKit(rel, cfg = {}) {
  return {
    blog: blog(rel, cfg), email: email(rel, cfg), linkedin: linkedin(rel, cfg), x: x(rel, cfg),
    in_app: inApp(rel, cfg), customer_notes: customerNotes(rel, cfg), sales_brief: salesBrief(rel, cfg),
  };
}
