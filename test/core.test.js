import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRelease, parseKeepAChangelog, cleanText, guessType } from '../src/core/parse.js';
import { classify, channelPlan } from '../src/core/classify.js';
import { templateKit, short } from '../src/core/templates.js';
import { checkLimits, LIMITS } from '../src/core/limits.js';

const changelog = readFileSync(new URL('../examples/CHANGELOG.md', import.meta.url), 'utf8');
const cfg = JSON.parse(readFileSync(new URL('../examples/launchkit.config.json', import.meta.url), 'utf8'));

test('Keep a Changelog: newest released version, sections mapped, chores internal', () => {
  const r = parseRelease(changelog);
  assert.equal(r.format, 'keep-a-changelog');
  assert.equal(r.version, '2.4.0');
  assert.equal(r.date, '2026-09-30');
  const types = r.items.map(i => i.type);
  assert.ok(types.includes('breaking'));
  assert.equal(types.filter(t => t === 'internal').length, 2);
  assert.equal(parseKeepAChangelog(changelog, '2.3.1').items.length, 1);
});

test('conventional commits', () => {
  const r = parseRelease('feat(auth): add SSO login\nfix: crash on empty export\nchore: bump deps\nfeat!: drop Node 18\nMerge pull request #9 from x/y');
  assert.equal(r.format, 'conventional-commits');
  assert.deepEqual(r.items.map(i => i.type), ['feature', 'fix', 'internal', 'breaking']);
  assert.equal(r.items[0].scope, 'auth');
});

test('GitHub release body: strips authors and PR links', () => {
  const r = parseRelease("## What's Changed\n* feat: dark mode by @ana in https://github.com/o/r/pull/12\n* Fix login redirect by @bo in https://github.com/o/r/pull/13\n\n**Full Changelog**: https://github.com/o/r/compare/v1...v2");
  assert.deepEqual(r.items.map(i => [i.type, i.text]), [['feature', 'Dark mode'], ['fix', 'Fix login redirect']]);
  assert.equal(cleanText('Add X (#42)'), 'Add X');
  assert.equal(guessType('Improved search speed'), 'improvement');
});

test('classify: size, headline, channel plan', () => {
  const rel = classify(parseRelease(changelog));
  assert.equal(rel.size, 'major');
  assert.match(rel.headline.text, /AI lead scoring/);
  assert.equal(rel.internal.length, 2);
  assert.deepEqual(channelPlan('patch'), ['in_app', 'customer_notes']);
});

test('template kit: within limits, no internal changes leaked', () => {
  const rel = classify(parseRelease(changelog));
  const kit = templateKit(rel, cfg);
  assert.deepEqual(checkLimits(kit), []);
  const all = JSON.stringify(kit);
  assert.ok(!/eslint|playwright/i.test(all), 'internal chores must not leak');
  assert.ok(kit.x.thread.every(t => t.length <= LIMITS.x_tweet));
  assert.match(kit.blog.markdown, /Before you upgrade/);
  assert.equal(kit.email.subject_options.length, 3);
  assert.equal(short('AI lead scoring that ranks every new HubSpot contact by fit and intent'), 'AI lead scoring');
});

