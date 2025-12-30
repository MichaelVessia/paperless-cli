# ADR 0005: Single File CLI Structure

## Status

Superseded by [ADR 0006](0006-modular-cli-structure.md)

## Context

We need to decide how to organize CLI command implementations. Options:
1. **Separate files per command** (e.g., `cli/search.ts`, `cli/list.ts`)
2. **Single main.ts** with all commands inline
3. **Grouped files** by domain (documents, tags, etc.)

## Decision

Use a single `main.ts` file containing all command definitions.

## Consequences

### Positive

- **Simplicity**: All CLI logic in one place
- **Discoverability**: Easy to see all commands at once
- **No import complexity**: No circular dependencies or barrel files
- **Fast navigation**: Jump to any command in one file

### Negative

- **File size**: `main.ts` is ~600 lines
- **Merge conflicts**: Multiple people editing CLI more likely to conflict
- **No code reuse**: Similar patterns repeated across commands

### Structure

```typescript
// main.ts structure
// 1. Imports
// 2. Global options (--json, etc.)
// 3. Simple commands (stats, tags, correspondents, types)
// 4. Create commands (create-tag, create-correspondent, create-type)
// 5. Search and list commands
// 6. Document commands (get, download, edit, similar)
// 7. Tag operations (add-tag, remove-tag)
// 8. Main command composition
// 9. Layer setup and execution
```

### Trade-offs

At ~600 lines, `main.ts` is at the upper limit of comfortable single-file size. If significant new commands are added, consider splitting into domain-based files.

The service layer (`PaperlessClient.ts`) is already separate, keeping main.ts focused on CLI concerns only.

### Alternatives Considered

**Separate files per command**: Would add ~15 files with similar boilerplate. The cognitive overhead of navigating between files outweighs benefits at this scale.

**Domain grouping**: Could work (`cli/documents.ts`, `cli/tags.ts`) but adds import complexity without significant benefit for current command count.
