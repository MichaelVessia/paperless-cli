# paperless-cli

Effect-based CLI for Paperless-ngx document management.

## Tech Stack

- **Runtime**: Bun
- **Framework**: @effect/cli, @effect/platform
- **Validation**: effect/Schema

## Commands

```bash
bun install          # Install dependencies
bun run typecheck    # Type check
bun test             # Run tests
bun run index.ts     # Run CLI
```

## Project Structure

```
src/
├── main.ts           # CLI entrypoint
├── cli/              # Command implementations
├── client/           # PaperlessClient service
├── schema/           # Effect Schema definitions
├── errors/           # Domain errors
└── format/           # Output formatters
```

## Key Patterns

- See `paperless-cli.md` for full CLI specification
- Domain errors use `Data.TaggedError`
- HTTP retries: 3 attempts with exponential backoff
- Safety: no DELETE operations, no bulk mutations

## Environment

```bash
export PAPERLESS_URL=https://paperless.example.com
export PAPERLESS_TOKEN=your-api-token
```

<!-- effect-solutions:start -->
## Effect Best Practices

Run `effect-solutions list` before implementing Effect features.

**Effect Source Reference:** `~/.local/share/effect-solutions/effect`
<!-- effect-solutions:end -->
