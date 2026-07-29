# Changelog

## [4.0.0](https://github.com/aignostics/typescript-sdk/compare/cli-v3.6.1...cli-v4.0.0) (2026-07-29)


### ⚠ BREAKING CHANGES

* **cli:** old flat command names (create-run, list-application-runs, cancel-run, login, etc.) are removed, not aliased. Update scripts to use the new grouped syntax, e.g. `aignostics-platform runs create` instead of `aignostics-platform create-run`.

### Features

* **cli:** add human-friendly text output format (--format text|json) ([73bb415](https://github.com/aignostics/typescript-sdk/commit/73bb415f3ec8e2ecc47c52aa43de84ae30996a47))
* **cli:** restructure CLI commands into resource-based groups ([456824a](https://github.com/aignostics/typescript-sdk/commit/456824ac72a3b7bc95abc8fb18cff5052e0d7c50))
* **sdk,cli:** fill gaps for run items and metadata management ([08961e7](https://github.com/aignostics/typescript-sdk/commit/08961e724788486d9801da1fe02c322ba2d52cb7))
* **sdk:** add support for access grants and share tokens ([d1597db](https://github.com/aignostics/typescript-sdk/commit/d1597db5d30f546f99c61f795a183eac55a9e34f))


### Bug Fixes

* **ci:** download coverage-reports artifact into packages/ to restore lcov paths ([dc54c3b](https://github.com/aignostics/typescript-sdk/commit/dc54c3b731428ef13d29fb0784be9b8e16576273))
* **cli:** don't hardcode version in info command test ([9d7432b](https://github.com/aignostics/typescript-sdk/commit/9d7432ba6ba797160b8cf5f9eba6873169ae8c3a))
* **cli:** read package.json version lazily in handleInfo ([b6fe81a](https://github.com/aignostics/typescript-sdk/commit/b6fe81ad988761a935ea3229e376a706162099cf))
* **deps:** update dependency open to v11 ([8b9a00f](https://github.com/aignostics/typescript-sdk/commit/8b9a00f43e70e0a69ab80a38e38e068a45a29c2b))
* **workspace:** fix format script glob missing top-level src files ([d6c9d1e](https://github.com/aignostics/typescript-sdk/commit/d6c9d1e1f84852bc22ff7a5092a45f7627eef87d))
