# Group CLI commands by resource noun; SDK provides 1:1 coverage of every Platform API endpoint

The CLI's flat command names (`create-run`, `list-application-runs`,
`cancel-run`, ...) don't scale as API surface grows and don't read naturally.
We're regrouping them under resource nouns: `applications` (`list`, `get`,
`versions list`, `versions get`), `runs` (`create`, `list`, `get`, `cancel`,
`items list`, `items get`, metadata get/set, `results delete`), and `auth`
(`login`, `logout`, `status`). This mirrors the python SDK's grouped CLI
structure but only covers the core Platform API — bucket upload, IDC
datasets, QuPath, WSI inspection, Launchpad, and notebook/MCP tooling are
python/desktop-specific and out of scope here.

To keep the CLI's ongoing maintenance cost low as new endpoints are added, we
require the SDK (`PlatformSDKHttp`) to provide a dedicated method for every
generated Platform API operation, even thin pass-throughs, rather than having
the CLI call the generated `PublicApi` client directly for "simple" ones. This
keeps the SDK as the single, fully-documented public surface and the CLI's
job purely mechanical (arg parsing → SDK call → format output), at the cost
of some low-value thin wrapper methods on the SDK.

This is a breaking rewrite: old flat command names are removed outright and
shipped as a major version bump, rather than kept as deprecated aliases.
`runs create` also replaces the raw `--items <json-string>` argument with
`--items` (inline JSON), `--items-file <path>`, and stdin support.
