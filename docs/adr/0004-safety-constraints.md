# ADR 0004: Safety Constraints

## Status

Accepted

## Context

The CLI interacts with a document management system containing potentially irreplaceable documents. We need to balance functionality with safety to prevent accidental data loss.

## Decision

Implement hard constraints on destructive operations:

### Allowed Operations

- **GET** - All read operations
- **PATCH** - Document metadata only (title, correspondent, type, tags)
- **POST** - Create tags, correspondents, document types

### Blocked Operations

- **DELETE** - Any resource (documents, tags, correspondents, types)
- **Bulk operations** - No batch updates or deletes
- **Document content modification** - OCR text is read-only

## Consequences

### Positive

- **Data safety**: Impossible to accidentally delete documents via CLI
- **Audit trail**: All changes are metadata-only and reversible
- **Trust**: Users can experiment without fear of data loss
- **AI safety**: Safe to use with Claude/AI assistants

### Negative

- **Limited functionality**: Users must use web UI for deletions
- **Workflow gaps**: Can't clean up test tags via CLI

### Implementation

The `PaperlessClient` service only implements safe operations. The HTTP client is configured at the type level to prevent adding unsafe endpoints:

```typescript
// Only these mutations are exposed
readonly editDocument: (id, input) => Effect<Document, Error>
readonly createTag: (input) => Effect<Tag, Error>
readonly createCorrespondent: (input) => Effect<Correspondent, Error>
readonly createDocumentType: (input) => Effect<DocumentType, Error>
```

No DELETE methods exist in the service interface.

### Rationale

Documents in Paperless-ngx often contain:
- Tax records (legally required retention)
- Medical records
- Financial documents
- Irreplaceable personal documents

The cost of accidental deletion far outweighs the inconvenience of using the web UI for destructive operations.
