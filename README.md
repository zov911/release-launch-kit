# 🚀 Release Launch Kit

**Changelog in. Launch kit out.** Turn release notes into everything marketing needs to announce them:

| You get | |
|---|---|
| 📝 Blog post | with title, slug and meta description |
| 📧 Customer email | 3 subject lines, preview text, body |
| 💼 LinkedIn post | hook, highlights, CTA, hashtags |
| 🧵 X thread | every post ≤ 280 characters |
| 🔔 In-app message | title ≤ 50, body ≤ 140, CTA |
| 📋 Customer release notes | grouped, plain language |
| 🎯 Sales & CS brief | talk track, who to tell, FAQ |
| ✅ Launch checklist | sized to the release (patch, minor or major) |

Internal changes (`chore`, `ci`, dependency bumps) are filtered out. Breaking changes are flagged everywhere.

**[Try it in your browser →](https://zov911.github.io/release-launch-kit/)** (no install, nothing uploaded)

## Quick start

```bash
npx github:zov911/release-launch-kit --from CHANGELOG.md
```

→ writes `launch/<version>/` with one file per channel. [Example output](examples/output/2.4.0/).

| Input (`--from`) | Example |
|---|---|
| Keep a Changelog file | `--from CHANGELOG.md --version 2.4.0` |
| Conventional commits | `--from git:v2.3.0..HEAD` (or `git:` = since last tag) |
| GitHub release | `--from github:owner/repo@latest` |
| Anything (stdin) | `cat notes.txt \| launch-kit --from -` |

## Two modes

| Mode | When | Quality |
|---|---|---|
| **AI** (Claude) | `ANTHROPIC_API_KEY` is set | Rewrites technical notes into customer benefits in your brand voice |
| **Template** | no key, or `--mode template` | Instant, free, deterministic, a solid first draft |

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npx github:zov911/release-launch-kit --from CHANGELOG.md --config launchkit.config.json
```

## Guides

- [Brand voice config](docs/config.md): product, audience, tone, CTA, words to avoid
- [GitHub Action](docs/github-action.md): generate a kit on every release
- [AI mode](docs/ai-mode.md): model, cost, dry run, how prompts work
- [CLI reference](docs/cli.md)

## Develop

```bash
npm install
npm test
npm run example     # regenerates examples/output from examples/CHANGELOG.md
```

Branches and releases: [CONTRIBUTING.md](CONTRIBUTING.md)

---

Built by **[zov911](https://zov911.com)**. Want an AI content pipeline wired into *your* release process and channels? **[Reach out →](https://zov911.com)**

© zov911. All rights reserved.
