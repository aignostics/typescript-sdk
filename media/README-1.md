# Aignostics Platform CLI

Command-line interface for the Aignostics Platform.

## Installation

```bash
npm install -g @aignostics/cli
```

## Usage

### Authentication

```bash
# Login to the platform
aignostics-platform login --endpoint https://api.aignostics.com --client-id your-client-id

# Test API connection
aignostics-platform test --endpoint https://api.aignostics.com
```

### Application Management

```bash
# List applications
aignostics-platform applications list --endpoint https://api.aignostics.com

# List application versions
aignostics-platform applications versions --endpoint https://api.aignostics.com --application-id app-id

# List application runs
aignostics-platform applications runs list --endpoint https://api.aignostics.com
```

### Run Management

```bash
# Get run details
aignostics-platform runs get --endpoint https://api.aignostics.com --run-id run-id

# Cancel a run
aignostics-platform runs cancel --endpoint https://api.aignostics.com --run-id run-id

# List run results
aignostics-platform runs results --endpoint https://api.aignostics.com --run-id run-id
```

## Commands

- `info` - Display CLI version information
- `login` - Authenticate with the platform
- `test` - Test API connection
- `applications` - Manage applications
- `runs` - Manage application runs

For detailed usage information, use `aignostics-platform --help` or `aignostics-platform <command> --help`.
