// Parse release notes from Keep a Changelog, conventional commits, GitHub release bodies or plain text
// into one shape: { version, date, items: [{ type, text, scope, breaking }] }.
// Pure JS (no Node APIs) so the browser demo can use it too.

/** @typedef {'feature'|'improvement'|'fix'|'breaking'|'security'|'deprecation'|'removal'|'internal'} ItemType */
/** @typedef {{ type: ItemType, text: string, scope?: string, breaking?: boolean }} Item */
/** @typedef {{ version: string|null, date: string|null, items: Item[], format: string }} Release */

const KAC_HEADINGS = {
  added: 'feature', new: 'feature', features: 'feature',
  changed: 'improvement', improved: 'improvement', improvements: 'improvement', performance: 'improvement',
  fixed: 'fix', fixes: 'fix', 'bug fixes': 'fix',
  removed: 'removal', deprecated: 'deprecation', security: 'security',
  breaking: 'breaking', 'breaking changes': 'breaking',
};

const CC_TYPES = {
  feat: 'feature', feature: 'feature', fix: 'fix', bugfix: 'fix', perf: 'improvement', improvement: 'improvement',
  security: 'security', deprecate: 'deprecation', revert: 'fix',
  refactor: 'internal', chore: 'internal', ci: 'internal', build: 'internal', test: 'internal', tests: 'internal', style: 'internal', docs: 'internal',
};

const CC_RE = /^(\w+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/;

/** Strip GitHub noise: "by @user in https://…/pull/12", trailing PR refs, markdown links. */
export function cleanText(s) {
  return s
    .replace(/\s+by @[\w-]+ in https?:\/\/\S+/gi, '')
    .replace(/\s*\(#\d+\)\s*$/g, '')
    .replace(/\s*\[#?\d+\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keyword fallback when there's no heading or commit type. */
export function guessType(text) {
  const t = text.toLowerCase();
  if (/\bbreaking\b/.test(t)) return 'breaking';
  if (/\b(security|vulnerab|cve-|xss|csrf)\b/.test(t)) return 'security';
  if (/^(fix|fixed|fixes|resolve|resolved|bug)\b|\bbug\b|\bcrash/.test(t)) return 'fix';
  if (/^(remove|removed|drop|dropped)\b/.test(t)) return 'removal';
  if (/^(deprecate)/.test(t)) return 'deprecation';
  if (/^(add|added|new|introduce|introducing|launch|support)\b/.test(t)) return 'feature';
  if (/^(improve|improved|faster|speed|optimi[sz]e|update|updated|better|enhance|redesign)/.test(t)) return 'improvement';
  if (/^(chore|refactor|bump|ci|test|docs?)\b/.test(t)) return 'internal';
  return 'improvement';
}

function fromBullet(raw, sectionType) {
  let text = cleanText(raw.replace(/^[-*+]\s+(\[[ x]\]\s+)?/, ''));
  if (!text) return null;
  const cc = text.match(CC_RE);
  let type = sectionType, scope, breaking = false;
  if (cc && CC_TYPES[cc[1].toLowerCase()]) {
    type = CC_TYPES[cc[1].toLowerCase()];
    scope = cc[2];
    breaking = Boolean(cc[3]);
    text = cc[4];
  }
  if (/\*\*breaking\*\*|^breaking:?/i.test(text)) { breaking = true; text = text.replace(/\*\*breaking\*\*:?\s*|^breaking:?\s*/i, ''); }
  text = text.replace(/\*\*/g, '');
  type = type || guessType(text);
  if (breaking) type = 'breaking';
  return { type, text: text.charAt(0).toUpperCase() + text.slice(1), ...(scope ? { scope } : {}), ...(breaking ? { breaking } : {}) };
}

/**
 * Keep a Changelog. Picks the requested version, or the newest non-"Unreleased" section.
 * @returns {Release}
 */
export function parseKeepAChangelog(md, version) {
  const sections = md.split(/^## /m).slice(1).map(s => {
    const [header, ...body] = s.split('\n');
    const m = header.match(/\[?v?([^\]\s]+)\]?(?:\s*[-–]\s*(\d{4}-\d{2}-\d{2}))?/);
    return { version: m?.[1] ?? header.trim(), date: m?.[2] ?? null, body: body.join('\n') };
  });
  const pick = version
    ? sections.find(s => s.version.replace(/^v/, '') === version.replace(/^v/, ''))
    : sections.find(s => !/unreleased/i.test(s.version));
  if (!pick) throw new Error(version ? `Version ${version} not found in changelog` : 'No released version found in changelog');
  const items = [];
  let sectionType = null;
  for (const line of pick.body.split('\n')) {
    const h = line.match(/^###\s+(.+)/);
    if (h) { sectionType = KAC_HEADINGS[h[1].trim().toLowerCase().replace(/[^a-z ]/g, '').trim()] ?? null; continue; }
    if (/^\s{0,3}[-*+]\s+/.test(line)) { const it = fromBullet(line.trim(), sectionType); if (it) items.push(it); }
  }
  return { version: pick.version, date: pick.date, items, format: 'keep-a-changelog' };
}

/** One conventional commit subject per line (e.g. output of `git log --format=%s`). */
export function parseCommits(text, version = null) {
  const items = text.split('\n').map(l => l.trim()).filter(Boolean)
    .filter(l => !/^merge (pull request|branch)/i.test(l))
    .map(l => fromBullet(l, null)).filter(Boolean);
  return { version, date: null, items, format: 'conventional-commits' };
}

/** Anything else: GitHub release bodies, Notion/Linear exports, plain bullet lists. */
export function parseFreeform(text, version = null) {
  const items = [];
  let sectionType = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const h = line.match(/^#{1,4}\s+(.+)/);
    if (h) { sectionType = KAC_HEADINGS[h[1].toLowerCase().replace(/[^a-z ]/g, '').trim()] ?? (/what'?s changed|changes/i.test(h[1]) ? null : sectionType); continue; }
    if (/^full changelog/i.test(line) || /^new contributors/i.test(line)) break;
    if (/^[-*+]\s+/.test(line)) { const it = fromBullet(line, sectionType); if (it) items.push(it); }
  }
  if (!items.length) {
    // No bullets: treat each prose line as an item, skipping code blocks, bare links and headings.
    let inCode = false;
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (line.startsWith('```')) { inCode = !inCode; continue; }
      if (inCode || !line || line.startsWith('#') || /^(<?https?:\/\/\S+>?|\[[^\]]+\]\([^)]+\))$/.test(line) || line.split(/\s+/).length < 3) continue;
      const it = fromBullet(line, null); if (it) items.push(it);
    }
  }
  return { version, date: null, items, format: 'freeform' };
}

/** Auto-detect the format. */
export function parseRelease(text, { version } = {}) {
  if (/^## \[?v?\d+\.\d+/m.test(text) || /^## \[unreleased\]/im.test(text)) return parseKeepAChangelog(text, version);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length && lines.filter(l => CC_RE.test(l)).length / lines.length > 0.6) return parseCommits(text, version ?? null);
  return parseFreeform(text, version ?? null);
}
