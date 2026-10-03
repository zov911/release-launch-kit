// Write the kit to launch/<version>/ as ready-to-paste files.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { channelPlan } from './core/classify.js';

export function renderFiles(rel, kit, meta) {
  const v = rel.version ?? 'unversioned';
  const plan = channelPlan(rel.size);
  const files = {
    'blog.md': `---\ntitle: "${kit.blog.title.replace(/"/g, '\\"')}"\nslug: ${kit.blog.slug}\ndescription: "${kit.blog.meta_description.replace(/"/g, '\\"')}"\n---\n\n${kit.blog.markdown}\n`,
    'email.md': `# Email\n\n**Subject options**\n${kit.email.subject_options.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n**Preview text:** ${kit.email.preview_text}\n\n---\n\n${kit.email.body_markdown}\n`,
    'linkedin.md': `${kit.linkedin.post}\n`,
    'x-thread.md': kit.x.thread.map((t, i) => `**${i + 1}/${kit.x.thread.length}** (${t.length} chars)\n\n${t}`).join('\n\n---\n\n') + '\n',
    'in-app.json': JSON.stringify(kit.in_app, null, 2) + '\n',
    'customer-notes.md': `${kit.customer_notes.markdown}\n`,
    'sales-brief.md': `${kit.sales_brief.markdown}\n`,
  };
  const label = { blog: 'Publish blog post (blog.md)', email: 'Schedule customer email (email.md)', linkedin: 'Post on LinkedIn (linkedin.md)', x: 'Post X thread (x-thread.md)', in_app: 'Ship in-app announcement (in-app.json)', customer_notes: 'Update public changelog / help center (customer-notes.md)', sales_brief: 'Send brief to sales & CS (sales-brief.md)' };
  files['README.md'] = [
    `# Launch kit: ${v}`,
    `Generated ${new Date().toISOString().slice(0, 10)} · mode: **${meta.mode}**${meta.model ? ` (${meta.model})` : ''} · release size: **${rel.size}** · ${rel.external.length} customer-facing / ${rel.internal.length} internal changes`,
    `## Launch checklist (recommended for a ${rel.size} release)\n${plan.map(c => `- [ ] ${label[c]}`).join('\n')}`,
    meta.warnings.length ? `## ⚠️ Review\n${meta.warnings.map(w => `- ${w}`).join('\n')}` : '',
    `## Files\n${Object.keys(files).filter(f => f !== 'README.md').map(f => `- [${f}](${f})`).join('\n')}`,
  ].filter(Boolean).join('\n\n') + '\n';
  return files;
}

export async function writeKit(dir, files) {
  await mkdir(dir, { recursive: true });
  await Promise.all(Object.entries(files).map(([name, body]) => writeFile(join(dir, name), body)));
}
