# Contributing

## Branches

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Released, stable. What `npx github:zov911/release-launch-kit` and `uses: zov911/release-launch-kit@v1` run | Only release merges from `develop`. Every merge is tagged `vX.Y.Z` |
| `develop` | Integration of finished work | Merge feature branches via PR; CI must pass |
| `feature/<name>` | One feature or fix | Branch from `develop`, PR back into `develop` |
| `hotfix/<name>` | Urgent fix for a release | Branch from `main`, PR into `main` and `develop` |

## Workflow

```bash
git checkout develop && git pull
git checkout -b feature/my-change
npm test
git commit -m "feat: add X"     # conventional commits: feat / fix / docs / refactor / test / chore
git push -u origin feature/my-change
gh pr create --base develop
```

Release: PR `develop` → `main`, bump `version` in `package.json`, update `CHANGELOG.md`, tag `vX.Y.Z` and move the `v1` tag.

## Checklist for a change

- [ ] `npm test` passes
- [ ] Template output still passes the schema and limit tests
- [ ] New inputs or channels are documented in `docs/`
- [ ] `npm run example` re-run if output changed
