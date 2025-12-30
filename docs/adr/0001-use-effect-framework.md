# ADR 0001: Use Effect Framework

## Status

Accepted

## Context

We need a robust foundation for building a CLI that interacts with a REST API. Key requirements:
- Type-safe error handling
- Composable HTTP operations
- Testability via dependency injection
- Retry logic for network operations

Options considered:
1. **Plain TypeScript** with manual error handling
2. **fp-ts** functional programming library
3. **Effect** full-featured effect system

## Decision

Use Effect and related packages:
- `effect` - Core effect system
- `@effect/cli` - CLI argument parsing
- `@effect/platform` - HTTP client
- `effect/Schema` - Runtime validation

## Consequences

### Positive

- **Type-safe errors**: Tagged errors with `Data.TaggedError` enable exhaustive error handling
- **Dependency injection**: `Context.Tag` and `Layer` provide clean service composition
- **Testability**: Services can be mocked via layer substitution
- **Retry logic**: Built-in `Schedule` for exponential backoff
- **Schema validation**: Runtime type checking for API responses

### Negative

- **Learning curve**: Effect has significant concepts to learn
- **Bundle size**: Effect is a larger dependency than alternatives
- **Ecosystem**: Smaller community than mainstream tools

### Example

```typescript
// Typed errors
class DocumentNotFound extends Data.TaggedError("DocumentNotFound")<{ id: number }> {}

// Service definition
class PaperlessClient extends Context.Tag("PaperlessClient")<
  PaperlessClient,
  { getDocument: (id: number) => Effect.Effect<Document, DocumentNotFound> }
>() {}

// Layer-based testing
const MockClient = Layer.succeed(PaperlessClient, { ... })
```

## References

- [Effect Documentation](https://effect.website)
- [@effect/cli](https://github.com/Effect-TS/effect/tree/main/packages/cli)
