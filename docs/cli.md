# CLI reference

```
launch-kit --from <source> [options]
```

| Option | Description |
|---|---|
| `--from` | `CHANGELOG.md` · `git:v1.2.0..HEAD` · `git:` (since last tag) · `github:owner/repo@tag` · `-` (stdin) |
| `--version` | Version to pick from a changelog (default: newest released, skips `Unreleased`) |
| `--config` | Brand voice file (default: `./launchkit.config.json` if present) |
| `--mode` | `ai` or `template` (default: `ai` if `ANTHROPIC_API_KEY` is set) |
| `--model` | Claude model (default `claude-opus-5-5`) |
| `--out` | Output folder (default `launch`) → `<out>/<version>/` |
| `--json` | Print the kit as JSON instead of writing files |
| `--dry-run` | Show the parsed release (and AI prompt) without generating |

## Output files

`README.md` (checklist + warnings) · `blog.md` (front matter + post) · `email.md` · `linkedin.md` · `x-thread.md` · `in-app.json` · `customer-notes.md` · `sales-brief.md`

## How changes are classified

| Source | feature | improvement | fix | breaking | internal (hidden) |
|---|---|---|---|---|---|
| Keep a Changelog | `### Added` | `### Changed` | `### Fixed` | `**BREAKING**`, `### Removed` → removal | none |
| Conventional commits | `feat` | `perf` | `fix` | `!` or `BREAKING` | `chore`, `ci`, `build`, `test`, `refactor`, `docs`, `style` |
| Free text | starts with add / new / support | improve / faster / update | fix / bug | contains "breaking" | chore / bump |

Release size: **major** (3+ features or any breaking change), **minor** (1–2 features), **patch** (fixes only). The checklist recommends channels by size.

## Exit codes

`0` success · `1` error (message on stderr), including "no customer-facing changes".
