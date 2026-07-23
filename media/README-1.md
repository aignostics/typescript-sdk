# Aignostics Platform CLI

Command-line interface for the Aignostics Platform.

## Installation

```bash
npm install -g @aignostics/cli
```

## Usage

All commands accept a global `--environment` option (`production` [default], `staging`, `develop`).

### Authentication

```bash
# Login to the platform (opens a browser)
aignostics-platform auth login

# Login using an existing refresh token
aignostics-platform auth login --refreshToken <token>

# Check authentication status
aignostics-platform auth status

# Logout and remove the stored token
aignostics-platform auth logout

# Test API connection
aignostics-platform test-api
```

### Application Discovery

```bash
# List applications
aignostics-platform applications list

# Get details for a specific application
aignostics-platform applications get <applicationId>

# List versions of an application
aignostics-platform applications versions list <applicationId>

# Get details of a specific application version
aignostics-platform applications versions get <applicationId> <versionNumber>
```

### Run Management

```bash
# Create a new application run, with items provided inline...
aignostics-platform runs create <applicationId> <versionNumber> --items '[{"wsi_id": "wsi-123"}]'

# ...from a file...
aignostics-platform runs create <applicationId> <versionNumber> --items-file ./items.json

# ...or piped via stdin
cat items.json | aignostics-platform runs create <applicationId> <versionNumber>

# List application runs, optionally filtered/sorted
aignostics-platform runs list --applicationId <applicationId> --sort '-submitted_at'

# Get run details
aignostics-platform runs get <applicationRunId>

# Cancel a run
aignostics-platform runs cancel <applicationRunId>

# List run results
aignostics-platform runs results list <applicationRunId>

# Delete run results
aignostics-platform runs results delete <applicationRunId>

# Get a single item within a run
aignostics-platform runs items get <applicationRunId> <externalId>

# Set (replace) a run's custom metadata (pass "null" to clear it)
aignostics-platform runs metadata set <applicationRunId> '{"note": "Reviewed by QA"}'

# Set (replace) a single item's custom metadata
aignostics-platform runs items metadata set <applicationRunId> <externalId> '{"reviewed": true}'
```

## Commands

- `info` - Display CLI version information
- `test-api` - Test API connection
- `auth` - `login`, `logout`, `status`
- `applications` - `list`, `get`, `versions list`, `versions get`
- `runs` - `create`, `list`, `get`, `cancel`, `metadata set`, `results list`, `results delete`, `items get`, `items metadata set`

For detailed usage information, use `aignostics-platform --help` or `aignostics-platform <command> --help`.
