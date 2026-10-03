# AI mode

Set `ANTHROPIC_API_KEY` and AI mode turns on automatically (force it with `--mode ai`).

```bash
export ANTHROPIC_API_KEY=sk-ant-...
launch-kit --from CHANGELOG.md --config launchkit.config.json
launch-kit --from CHANGELOG.md --model claude-sonnet-5-5   # faster, cheaper
```

## How it works

1. Release notes are parsed and classified locally. Internal changes are never sent to the model.
2. One Claude request returns the whole kit as JSON, validated against a strict schema (`src/ai.js`).
3. The system prompt holds your brand voice and is cached, so repeated runs in a project cost less.
4. Character limits are checked after generation; anything over shows up as a warning in `README.md`.

## Check before you spend

```bash
launch-kit --from CHANGELOG.md --mode ai --dry-run   # shows the parsed release and the exact prompt
```

## Defaults and safety

| Setting | Value |
|---|---|
| Model | `claude-opus-5-5` (override with `--model`) |
| Effort | `medium` |
| Refusal fallback | on: if a safety classifier declines, the API retries on a fallback model |
| Hallucination guard | the prompt forbids invented metrics, customers or quotes; `[placeholders]` are used instead |

Cost: one request per release, a few thousand tokens in and out, typically a few cents.

Always review before publishing. AI mode writes good first drafts, not final copy.
