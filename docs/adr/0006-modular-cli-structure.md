# ADR 0006: Modular CLI Structure

## Status

Accepted

## Context

ADR 0005 established a single-file CLI approach. At ~800 lines, `main.ts` exceeded the comfort threshold noted in that ADR. The file became difficult to navigate and changes to one command required loading the entire file.

## Decision

Split CLI commands into separate files under `src/cli/`:

```
src/
├── main.ts              # Entry point, composition only (~70 lines)
└── cli/
    ├── index.ts         # Barrel export
    ├── options.ts       # Shared options (jsonOption, limitOption, etc.)
    ├── helpers.ts       # Shared utilities (resolveTag, error handling)
    └── commands/
        ├── stats.ts
        ├── tags.ts          # tags + create-tag
        ├── correspondents.ts # correspondents + create-correspondent
        ├── types.ts         # types + create-type
        ├── search.ts
        ├── list.ts
        ├── get.ts
        ├── download.ts
        ├── similar.ts
        ├── edit.ts
        ├── add-tag.ts
        └── remove-tag.ts
```

## Consequences

### Positive

- **Focused files**: Each command is ~30-100 lines
- **Easier navigation**: Jump directly to the command you need
- **Reduced merge conflicts**: Changes isolated to specific files
- **Shared code extraction**: Common options and helpers centralized
- **Scalable**: Adding commands doesn't bloat a single file

### Negative

- **More files**: 15 files vs 1
- **Import chains**: Commands import from shared modules
- **Discoverability**: Must check multiple files to see all commands

### Trade-offs

The barrel export (`cli/index.ts`) maintains a single import point for `main.ts`, keeping composition simple. Related commands (e.g., `tags` + `create-tag`) share a file to reduce file count while maintaining cohesion.
