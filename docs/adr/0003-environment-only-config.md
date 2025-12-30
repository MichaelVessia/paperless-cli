# ADR 0003: Environment-Only Configuration

## Status

Accepted

## Context

The CLI needs Paperless-ngx server URL and authentication token. Configuration options:
1. **Config file** (e.g., `~/.paperless-cli.json`)
2. **Environment variables** only
3. **Both** with environment taking precedence

## Decision

Use environment variables exclusively:
- `PAPERLESS_URL` - Base URL of Paperless instance
- `PAPERLESS_TOKEN` - API authentication token

No config file support.

## Consequences

### Positive

- **Simplicity**: No file parsing, path resolution, or format decisions
- **12-factor compliance**: Environment-based config is standard for CLI tools
- **Security**: Tokens aren't written to disk (when using shell exports)
- **Container-friendly**: Easy to configure in Docker/Kubernetes
- **Shell integration**: Can be set in `.bashrc`, `.zshrc`, or per-session

### Negative

- **No per-directory config**: Can't have different settings per project
- **Discoverability**: Users must know about the variables
- **Shell persistence**: Users must manage their own shell config

### Usage

```bash
# In shell config (~/.bashrc, ~/.zshrc)
export PAPERLESS_URL=https://paperless.example.com
export PAPERLESS_TOKEN=abc123

# Or per-session
PAPERLESS_URL=... PAPERLESS_TOKEN=... paperless-cli search
```

### Error Handling

Missing credentials produce a clear error:
```
Error: PAPERLESS_URL and PAPERLESS_TOKEN environment variables are required
```

## Alternatives Considered

**Config file**: Would add complexity for file discovery, parsing, and merging with environment. The additional flexibility isn't needed for this use case.
