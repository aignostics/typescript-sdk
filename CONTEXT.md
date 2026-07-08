# Aignostics TypeScript SDK

TypeScript SDK and CLI for the Aignostics Platform API — the Node/TypeScript
counterpart to the [python-sdk](https://github.com/aignostics/python-sdk),
scoped to the Platform's core REST API (no desktop/Launchpad, QuPath, WSI
inspection, or IDC dataset tooling — those are python/desktop-only concerns).

## Language

**Application**:
A registered computational pathology workflow (e.g. Atlas H&E-TME) an
organization is subscribed to. Has one or more Application Versions.

**Application Version**:
A specific, immutable version of an Application, defining its input/output
schema.

**Run** (Application Run):
An execution instance of an Application Version against submitted Run Items.
Moves through `pending` → `processing` → `terminated`, the latter carrying a
termination reason.
_Avoid_: Application run job, task, execution (use "Run").

**Run Item**:
A single unit of processing within a Run, identified by a user-supplied
`external_id`, carrying one or more Input Artifacts and producing Output
Artifacts.
_Avoid_: item, entry (use "Run Item" in docs; `item` is fine as a positional/variable name).

**Artifact** (Input Artifact / Output Artifact):
A single file (e.g. a whole slide image, or a result file) attached to a Run
Item, referenced by a signed URL for input or downloadable by ID for output.

**CLI command group**:
A top-level noun (`applications`, `runs`, `auth`) under which related
subcommands are nested, e.g. `runs create`, `runs items list`. Introduced to
replace the flat `create-run`/`list-application-runs`-style command names.
