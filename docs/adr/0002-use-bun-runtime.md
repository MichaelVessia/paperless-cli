# ADR 0002: Use Bun Runtime

## Status

Accepted

## Context

We need a JavaScript/TypeScript runtime for the CLI. Options:
1. **Node.js** - Established, widely supported
2. **Deno** - Security-focused, built-in TypeScript
3. **Bun** - Fast, all-in-one toolchain

## Decision

Use Bun as the runtime and package manager.

## Consequences

### Positive

- **Speed**: Significantly faster startup and execution than Node.js
- **All-in-one**: Built-in bundler, test runner, package manager
- **TypeScript native**: No separate compilation step needed
- **Effect compatibility**: `@effect/platform-bun` provides native integration

### Negative

- **Maturity**: Bun is newer and less battle-tested than Node.js
- **Compatibility**: Some Node.js APIs may not be fully supported
- **Distribution**: Users need Bun installed (though single-file binaries are possible)

### Usage

```bash
# Development
bun run src/main.ts <command>

# Testing
bun test

# Type checking
bun run typecheck
```

## References

- [Bun Documentation](https://bun.sh)
- [@effect/platform-bun](https://github.com/Effect-TS/effect/tree/main/packages/platform-bun)
