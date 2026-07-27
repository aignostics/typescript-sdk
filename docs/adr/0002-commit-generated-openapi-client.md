# Commit the generated OpenAPI client, vendor the spec, verify with a drift check

The SDK's generated API client (`packages/sdk/src/generated/`) was git-ignored
and regenerated on every build via `npm run codegen` (Docker-based
`openapi-generator`, generating directly against a live staging URL). This made
the built client invisible in PRs, unbuildable without Docker + network, and
non-deterministic (the client depended on whatever staging served at build
time). We now **commit the generated client** so it's reviewable in PRs and a
fresh clone builds with `npm ci && npm run build:sdk` alone — no Docker, no network,
no codegen on the build path (the `codegen → build` `dependsOn` edge is
removed).

To keep the committed client trustworthy we **vendor the OpenAPI spec** at
`packages/sdk/openapi.json` and split codegen into two targets: `codegen`
regenerates from the vendored spec (no network — the deterministic primitive)
and `update-spec` fetches a fresh spec from the live API, pretty-prints it
through `jq`, overwrites `openapi.json`, then runs `codegen`. The spec is only
ever fetched inside `update-spec`, so we never pull-without-regen or
regen-without-pull. A scheduled GitHub Actions workflow runs `update-spec` and
opens a PR, so the vendored spec doesn't silently go stale.

A dedicated CI job (`check-generated`) runs `codegen` and
`git diff --exit-code packages/sdk/src/generated` on every PR and on `main`,
gating `release` — this is what makes committed generated code safe, catching
any hand-edit or forgotten regen. Because the check compares against **raw**
generator output, no CI step may reformat the generated code: the generator's
output is committed verbatim (including its own `.gitignore`, `.openapi-generator/`,
`docs/`, `git_push.sh`), and both `packages/sdk/src/generated/` and
`packages/sdk/openapi.json` are excluded from oxfmt (oxlint already excluded
`generated/`). Generated code is verified by the drift check, not by style tooling.

## Consequences

- Editing `openapi.json` (or the spec upstream) no longer affects a build until
  someone runs `npm run codegen` / `update-spec` and commits the result;
  regeneration is now an explicit, deliberate act. The drift check catches
  anyone who forgets.
- CI's normal build/test/release path no longer needs Docker or the generator;
  that dependency is isolated to the `check-generated` job and the scheduled
  `update-spec` workflow.
