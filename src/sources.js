// Where release notes come from: a file, stdin, git history or a GitHub release.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseCommits, parseRelease } from './core/parse.js';

/**
 * --from accepts:
 *   CHANGELOG.md / notes.txt       file (format auto-detected)
 *   -                              stdin
 *   git:v1.2.0..HEAD               conventional commits in a git range
 *   github:owner/repo@v1.3.0       a GitHub release (use @latest for the newest)
 */
export async function loadRelease(from, { version } = {}) {
  if (from.startsWith('git:')) {
    const range = from.slice(4) || `${lastTag()}..HEAD`;
    const log = execFileSync('git', ['log', '--no-merges', '--format=%s', range], { encoding: 'utf8' });
    return parseCommits(log, version ?? range.split('..')[1]?.replace(/^HEAD$/, '') ?? null);
  }
  if (from.startsWith('github:')) {
    const [repo, tag = 'latest'] = from.slice(7).split('@');
    const url = tag === 'latest' ? `https://api.github.com/repos/${repo}/releases/latest` : `https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`;
    const headers = { accept: 'application/vnd.github+json', 'user-agent': 'release-launch-kit' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub release not found (${res.status}): ${repo}@${tag}`);
    const r = await res.json();
    const rel = parseRelease(r.body || '', { version: version ?? r.tag_name });
    return { ...rel, version: rel.version ?? r.tag_name, date: r.published_at?.slice(0, 10) ?? null };
  }
  const text = from === '-' ? await readStdin() : await readFile(from, 'utf8');
  return parseRelease(text, { version });
}

function lastTag() {
  try { return execFileSync('git', ['describe', '--tags', '--abbrev=0'], { encoding: 'utf8' }).trim(); }
  catch { throw new Error('No git tag found. Pass an explicit range, e.g. --from git:v1.0.0..HEAD'); }
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}
