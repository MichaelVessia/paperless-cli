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

## Issue Tracking

This project uses **bd (beads)** for issue tracking.
Run `bd prime` for workflow context, or install hooks (`bd hooks install`) for auto-injection.

**Quick reference:**
- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd sync` - Sync with git (run at session end)

For full workflow details: `bd prime`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
