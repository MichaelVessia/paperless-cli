# Paperless CLI + Claude Skill

Effect-based CLI for Paperless-ngx with a Claude skill for natural language access.

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  paperless-cli  │────▶│  Paperless-ngx  │
│  (Skill)        │◀────│  (Effect CLI)   │◀────│  REST API       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Tech Stack

- **Runtime**: Bun
- **CLI Framework**: @effect/cli
- **HTTP**: @effect/platform HttpClient
- **Validation**: effect/Schema

## Output Format

All commands output structured JSON envelopes. No human-readable text output.

### Success Envelope

```json
{
  "ok": true,
  "command": "search",
  "result": { ... },
  "next_actions": [
    { "command": "paperless-cli get 1", "description": "View full document details" }
  ]
}
```

### Error Envelope

```json
{
  "ok": false,
  "command": "search",
  "error": { "message": "Tag not found: foo", "code": "TagNotFound" },
  "fix": "Check available tags with \"paperless-cli tags\".",
  "next_actions": [
    { "command": "paperless-cli tags", "description": "List all tags" }
  ]
}
```

### Self-Documenting Root

Running `paperless-cli` with no subcommand outputs a JSON command tree describing all available commands, their arguments, flags, and required environment variables.

## CLI Specification

### Configuration

```bash
export PAPERLESS_URL=https://paperless.example.com
export PAPERLESS_TOKEN=your-api-token
```

Environment variables only. No config file.

### Global Flags

- `--version` - Show version number
- `--help` - Show help (human-readable, for debugging)

---

## Commands

### `search [query]`

Full-text search across documents. Query is optional, filters can be used alone.

```bash
paperless-cli search "tax 2023"
paperless-cli search --tag=tax
paperless-cli search "invoice" --correspondent=comcast --limit=20
```

**Arguments:**
- `query` - Search query (optional)

**Flags:**
- `--tag, -t <name>` - Filter by tag name (repeatable)
- `--correspondent, -c <name>` - Filter by correspondent name (case-insensitive)
- `--type, -d <name>` - Filter by document type name (case-insensitive)
- `--after <date>` - Documents created after date (YYYY-MM-DD)
- `--before <date>` - Documents created before date (YYYY-MM-DD)
- `--limit, -l <n>` - Max results (default: 10)
- `--all` - Return all results (no pagination)

**Result:** `{ count, documents: DocumentSummary[] }`

Each `DocumentSummary` has inline-resolved names:
```json
{
  "id": 1,
  "title": "Amazon Order",
  "created_date": "2024-01-15",
  "correspondent": { "id": 1, "name": "Amazon" },
  "document_type": { "id": 2, "name": "Receipt" },
  "tags": [{ "id": 4, "name": "receipt" }]
}
```

---

### `list`

List recent documents (ordered by added date).

```bash
paperless-cli list
paperless-cli list --inbox
paperless-cli list --limit=20
```

**Flags:**
- `--inbox` - Show only documents with inbox tags
- `--tag, -t <name>` - Filter by tag name (repeatable)
- `--correspondent, -c <name>` - Filter by correspondent
- `--type, -d <name>` - Filter by document type
- `--after <date>` - Documents created after date
- `--before <date>` - Documents created before date
- `--limit, -l <n>` - Max results (default: 10)
- `--all` - Return all results

**Result:** `{ count, documents: DocumentSummary[] }`

---

### `get <id>`

Retrieve full document content and metadata.

```bash
paperless-cli get 1234
paperless-cli get 1234 --max-length=1000
```

**Arguments:**
- `id` - Document ID (required)

**Flags:**
- `--max-length, -m <n>` - Truncate content (default: 50000 chars)

**Result:** `DocumentDetail` with content truncation info:
```json
{
  "id": 1,
  "title": "...",
  "content": { "text": "...", "truncated": false, "original_length": 5000 },
  "correspondent": { "id": 1, "name": "Amazon" },
  "document_type": { "id": 2, "name": "Receipt" },
  "tags": [...],
  "added": "2024-01-15T10:35:00Z",
  "modified": "2024-01-15T10:30:00Z",
  "archive_serial_number": null,
  "original_file_name": "receipt.pdf"
}
```

---

### `download <id>`

Download original document file.

```bash
paperless-cli download 1234
paperless-cli download 1234 --output=~/Downloads/receipt.pdf
paperless-cli download 1234 --force
```

**Arguments:**
- `id` - Document ID (required)

**Flags:**
- `--output, -o <path>` - Save to specific path (default: current directory)
- `--force, -f` - Overwrite existing file

**Result:** `{ document_id, filename, path, size_bytes }`

---

### `upload <file>`

Upload a document to Paperless-ngx.

```bash
paperless-cli upload receipt.pdf
paperless-cli upload invoice.pdf --title="January Invoice" --correspondent=Amazon --create
```

**Arguments:**
- `file` - Path to file to upload (required)

**Flags:**
- `--title, -t <value>` - Document title (defaults to filename)
- `--correspondent <name>` - Correspondent name
- `--type <name>` - Document type name
- `--tag <name>` - Tag name (repeatable)
- `--create` - Create correspondent/type/tag if not found

**Result:** `{ task_id, filename, title }`

---

### `edit <id>`

Edit document metadata.

```bash
paperless-cli edit 1234 --title="Updated Title"
paperless-cli edit 1234 --correspondent=comcast
paperless-cli edit 1234 --no-correspondent
paperless-cli edit 1234 --correspondent=newcorp --create
```

**Arguments:**
- `id` - Document ID (required)

**Flags:**
- `--title <value>` - Set document title
- `--correspondent <name>` - Set correspondent (by name, case-insensitive)
- `--type <name>` - Set document type (by name, case-insensitive)
- `--no-correspondent` - Clear correspondent
- `--no-type` - Clear document type
- `--create` - Create correspondent/type if not found

**Result:** `{ id, updated_fields, document: DocumentSummary }`

---

### `similar <id>`

Find documents similar to a given document.

```bash
paperless-cli similar 1234
paperless-cli similar 1234 --limit=10
```

**Arguments:**
- `id` - Document ID (required)

**Flags:**
- `--limit, -l <n>` - Max results (default: 10)

**Result:** `{ source_id, documents: DocumentSummary[] }`

---

### `add-tag <document-id> <tag-name>`

Add a tag to a document.

```bash
paperless-cli add-tag 1234 reviewed
paperless-cli add-tag 1234 "needs-review" --create
```

**Arguments:**
- `document-id` - Document ID (required)
- `tag-name` - Tag name (required)

**Flags:**
- `--create` - Create tag if it doesn't exist

**Tag matching:** Exact match first (case-insensitive), then partial match. Ambiguous matches return an error envelope with matching tag names.

**Result:** `{ document_id, tag: { id, name }, already_had_tag }`

---

### `remove-tag <document-id> <tag-name>`

Remove a tag from a document. Idempotent.

```bash
paperless-cli remove-tag 1234 "needs-review"
```

**Arguments:**
- `document-id` - Document ID (required)
- `tag-name` - Tag name (required)

**Result:** `{ document_id, tag: { id, name }, was_present }`

---

### `tags`

List all tags.

```bash
paperless-cli tags
```

**Result:** `{ count, tags: Tag[] }`

---

### `correspondents`

List all correspondents.

```bash
paperless-cli correspondents
```

**Result:** `{ count, correspondents: Correspondent[] }`

---

### `types`

List all document types.

```bash
paperless-cli types
```

**Result:** `{ count, document_types: DocumentType[] }`

---

### `create-tag <name>`

Create a new tag.

```bash
paperless-cli create-tag reviewed
```

**Arguments:**
- `name` - Tag name (required)

**Result:** Created `Tag` object.

---

### `create-correspondent <name>`

Create a new correspondent.

```bash
paperless-cli create-correspondent comcast
```

**Arguments:**
- `name` - Correspondent name (required)

**Result:** Created `Correspondent` object.

---

### `create-type <name>`

Create a new document type.

```bash
paperless-cli create-type receipt
```

**Arguments:**
- `name` - Document type name (required)

**Result:** Created `DocumentType` object.

---

### `stats`

Show system statistics.

```bash
paperless-cli stats
```

**Result:** Raw statistics object from the API.

---

## Project Structure

```
paperless-cli/
├── src/
│   ├── main.ts                   # CLI entrypoint, command tree, error handling
│   ├── cli/
│   │   ├── index.ts              # Command + handler exports
│   │   ├── options.ts            # Shared CLI options/args
│   │   ├── helpers.ts            # Tag resolution, flag ordering
│   │   └── commands/             # Command implementations
│   ├── client/
│   │   └── PaperlessClient.ts    # Effect service
│   ├── schema/
│   │   ├── Document.ts
│   │   ├── Tag.ts
│   │   ├── Correspondent.ts
│   │   └── DocumentType.ts
│   ├── envelope/
│   │   ├── index.ts              # Envelope constructors + output
│   │   ├── types.ts              # Envelope type definitions
│   │   ├── truncate.ts           # Context-protecting truncation
│   │   ├── next-actions.ts       # HATEOAS action templates
│   │   └── document-result.ts    # Document enrichment builders
│   ├── errors/
│   │   └── index.ts              # Typed domain errors
│   └── test/
│       ├── fixtures.ts           # Sample data
│       └── MockPaperlessClient.ts
├── package.json
└── tsconfig.json
```

---

## Error Handling

### Error Codes

All errors are returned as error envelopes with a `code` and `fix` field:

| Error Code | Fix Guidance |
|-----------|-------------|
| `MissingCredentials` | Set PAPERLESS_URL and PAPERLESS_TOKEN |
| `InvalidToken` | Check token, regenerate from Settings > Users |
| `ConnectionFailed` | Check URL and server status |
| `DocumentNotFound` | Verify ID, search for documents |
| `TagNotFound` | Check available tags, use --create |
| `AmbiguousMatch` | Specify the full tag name |
| `CorrespondentNotFound` | Check correspondents, use --create |
| `DocumentTypeNotFound` | Check types, use --create |
| `ServerError` | Check server logs |
| `InvalidValue` | Check command syntax (flag ordering) |
| `UnknownError` | Generic fallback |

### Retry Strategy

Network failures (connection refused, timeout) retry with exponential backoff:
- 3 retries: 1s, 2s, 4s delays
- Uses Effect's `Schedule.exponential` with `retry`

---

## Safety

### Allowed Operations
- All GET requests (read)
- PATCH document metadata (title, correspondent, type, tags)
- POST to create tags/correspondents/types
- POST to upload documents

### Blocked Operations
- DELETE anything
- Bulk operations
- Document content modification

---

## Claude Skill Specification

### SKILL.md

```markdown
---
description: Search and manage documents in Paperless-ngx document management system
allowed-tools: ["Bash", "Read"]
---

# Paperless-ngx

Use this skill when the user wants to:
- Search for documents (invoices, receipts, tax forms, etc.)
- Find documents by correspondent, tag, or type
- Read document contents
- Tag or untag documents
- Browse their document library
- Download documents

## Usage

Use the `paperless-cli` command. All output is JSON. Parse the `ok` field to determine success/failure. Use `next_actions` to discover follow-up commands.

## Workflow

1. Start with `search` or `list` to find documents
2. Use `get` to read full content when needed
3. Use `add-tag`/`remove-tag` to organize
4. Use `similar` to find related documents
5. Use `download` to save original files

## Environment

Required:
- `PAPERLESS_URL` - Base URL of Paperless instance
- `PAPERLESS_TOKEN` - API authentication token
```
