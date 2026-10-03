# GitHub Action

Generate a launch kit whenever you publish a release. Add `.github/workflows/launch-kit.yml`:

```yaml
name: Launch kit
on:
  release:
    types: [published]

jobs:
  kit:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4

      - id: kit
        uses: zov911/release-launch-kit@v1
        with:
          from: github:${{ github.repository }}@${{ github.event.release.tag_name }}
          config: launchkit.config.json                         # optional
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}    # optional: omit for template mode

      - uses: actions/upload-artifact@v4
        with:
          name: launch-kit-${{ github.event.release.tag_name }}
          path: ${{ steps.kit.outputs.dir }}
```

The kit's checklist appears in the job summary. Download the files from the run's **Artifacts**.

## Inputs

| Input | Default | |
|---|---|---|
| `from` | `CHANGELOG.md` | file, `git:range`, or `github:owner/repo@tag` |
| `version` | newest | version to pick from a changelog |
| `config` | none | brand voice file |
| `mode` | auto | `ai` or `template` |
| `model` | `claude-opus-5-5` | Claude model |
| `out` | `launch` | output folder |
| `anthropic-api-key` | none | enables AI mode |

Output: `dir`, the folder with the generated files.

## Variations

- **From your changelog file:** `from: CHANGELOG.md` with `version: ${{ github.event.release.tag_name }}`
- **Open a PR with the kit:** add a step with `peter-evans/create-pull-request` pointing at `${{ steps.kit.outputs.dir }}`
- **Post to Slack:** send `${{ steps.kit.outputs.dir }}/linkedin.md` to a webhook for review
