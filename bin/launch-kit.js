#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { classify } from '../src/core/classify.js';
import { checkLimits } from '../src/core/limits.js';
import { templateKit } from '../src/core/templates.js';
import { loadRelease } from '../src/sources.js';
import { renderFiles, writeKit } from '../src/write.js';

const HELP = `launch-kit: turn release notes into a launch kit

Usage
  launch-kit --from <source> [options]

Sources (--from)
  CHANGELOG.md                 Keep a Changelog, commits or plain notes (auto-detected)
  git:v1.2.0..HEAD             conventional commits in a range (git: alone = since last tag)
  github:owner/repo@v1.3.0     a GitHub release (@latest for newest)
  -                            read from stdin

Options
  --version <v>     pick a version from a changelog (default: newest released)
  --config <file>   brand voice config (default: ./launchkit.config.json if present)
  --mode <m>        ai | template (default: ai if ANTHROPIC_API_KEY is set, else template)
  --model <id>      Claude model for ai mode (default: claude-opus-5-5)
  --out <dir>       output folder (default: launch) → <dir>/<version>/
  --json            print the kit as JSON to stdout instead of writing files
  --dry-run         show the parsed release (and AI prompt) without generating
  -h, --help

Examples
  launch-kit --from CHANGELOG.md
  launch-kit --from git:v2.3.0..HEAD --version 2.4.0 --mode template
  launch-kit --from github:vercel/next.js@latest --json`;

const { values: o } = parseArgs({
  options: {
    from: { type: 'string' }, version: { type: 'string' }, config: { type: 'string' }, mode: { type: 'string' },
    model: { type: 'string' }, out: { type: 'string', default: 'launch' }, json: { type: 'boolean' },
    'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  },
});

/** Without a config, name the product after package.json "name" or the folder ("my-app" → "My App"). */
async function guessProductName() {
  let name;
  try { name = JSON.parse(await readFile('package.json', 'utf8')).name; } catch {}
  name = (name || basename(process.cwd())).replace(/^@[^/]+\//, '');
  return name ? name.split(/[-_\s]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : undefined;
}

async function main() {
  if (o.help || !o.from) { console.log(HELP); return o.help ? 0 : 1; }

  const cfgPath = o.config ?? (existsSync('launchkit.config.json') ? 'launchkit.config.json' : null);
  const cfg = cfgPath ? JSON.parse(await readFile(cfgPath, 'utf8')) : {};
  if (!cfg.product) cfg.product = await guessProductName();
  const rel = classify(await loadRelease(o.from, { version: o.version }));
  if (!rel.external.length) throw new Error(`No customer-facing changes found (${rel.internal.length} internal). Nothing to announce.`);

  const mode = o.mode ?? (process.env.ANTHROPIC_API_KEY ? 'ai' : 'template');
  if (!['ai', 'template'].includes(mode)) throw new Error('--mode must be ai or template');

  if (o['dry-run']) {
    console.log(JSON.stringify({ version: rel.version, size: rel.size, headline: rel.headline?.text, counts: rel.counts, internal: rel.internal.length, items: rel.external }, null, 2));
    if (mode === 'ai') { const { _prompts } = await import('../src/ai.js'); console.log('\n--- system ---\n' + _prompts.systemPrompt(cfg) + '\n\n--- user ---\n' + _prompts.userPrompt(rel)); }
    return 0;
  }

  let kit, meta = { mode, warnings: [] };
  if (mode === 'ai') {
    const { aiKit } = await import('../src/ai.js');
    console.error(`Writing launch kit for ${rel.version ?? 'release'} with Claude…`);
    const r = await aiKit(rel, cfg, { model: o.model });
    kit = r.kit; meta.model = r.model;
  } else {
    if (!o.mode) console.error('ANTHROPIC_API_KEY not set, so using template mode (no AI). Set the key for polished AI copy.');
    kit = templateKit(rel, cfg);
  }
  meta.warnings = checkLimits(kit);

  if (o.json) { console.log(JSON.stringify({ release: { version: rel.version, size: rel.size }, kit, warnings: meta.warnings }, null, 2)); return 0; }

  const dir = join(o.out, rel.version ?? 'unversioned');
  await writeKit(dir, renderFiles(rel, kit, meta));
  console.error(`✓ Launch kit written to ${dir}/ (${rel.size} release · ${rel.external.length} changes · ${mode} mode)`);
  if (meta.warnings.length) console.error(`⚠ ${meta.warnings.length} length warning(s). See ${dir}/README.md`);
  return 0;
}

// Set exitCode instead of process.exit() so piped stdout is fully flushed (Windows-safe).
main().then(code => { process.exitCode = code; }, err => { console.error(`✗ ${err.message}`); process.exitCode = 1; });
