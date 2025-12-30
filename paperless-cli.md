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

## CLI Specification

### Installation

```bash
# Clone and build
cd ~/Projects/paperless-cli
bun install
bun run build

# Symlink to PATH
ln -s ~/Projects/paperless-cli/dist/paperless-cli ~/.local/bin/paperless-cli
```

### Configuration

```bash
export PAPERLESS_URL=https://paperless.example.com
export PAPERLESS_TOKEN=your-api-token
```

Environment variables only. No config file.

### Global Flags

- `--version` - Show version number
- `--json` - Output raw JSON (available on most commands)
- `--help` - Show help

---

## Commands

### `search [query]`

Full-text search across documents. Query is optional—filters can be used alone.

```bash
paperless-cli search "tax 2023"
paperless-cli search --tag=tax --after=-1y
paperless-cli search "invoice" --correspondent=comcast --limit=20
paperless-cli search --type=receipt --sort=created
```

**Arguments:**
- `query` - Search query (optional)

**Flags:**
- `--tag, -t <name>` - Filter by tag name (repeatable)
- `--correspondent, -c <name>` - Filter by correspondent name (case-insensitive)
- `--type, -d <name>` - Filter by document type name (case-insensitive)
- `--after <date>` - Documents created after date
- `--before <date>` - Documents created before date
- `--sort <field>` - Sort by: created, added, modified, title, correspondent, type (default: relevance for queries, added for no query)
- `--sort <field>:asc` - Ascending sort (default is descending/newest first)
- `--limit, -l <n>` - Max results (default: 10, max: 100)
- `--json` - Output raw JSON

**Date formats:**
- ISO 8601: `2023-01-01`
- Relative: `-7d` (7 days ago), `-1m` (1 month ago), `-1y` (1 year ago)

**Output (default):**
```
[1234] 2023 W-2 Form
       Correspondent: Employer Inc
       Tags: tax, 2023, income
       Created: 2023-01-15
       Preview: Wage and Tax Statement for tax year 2023...

[1235] 2023 1099-INT
       ...
```

**Empty results:** No output, exit 0. With `--json`: empty array.

---

### `list`

List recent documents.

```bash
paperless-cli list
paperless-cli list --inbox
paperless-cli list --limit=20 --sort=created
```

**Flags:**
- `--inbox` - Show only documents with inbox tags
- `--tag, -t <name>` - Filter by tag name (repeatable)
- `--correspondent, -c <name>` - Filter by correspondent
- `--type, -d <name>` - Filter by document type
- `--sort <field>` - Sort by: created, added, modified, title, correspondent, type (default: added)
- `--limit, -l <n>` - Max results (default: 10, max: 100)
- `--json` - Output raw JSON

---

### `get <id>`

Retrieve full document content and metadata.

```bash
paperless-cli get 1234
paperless-cli get 1234 --content-only
paperless-cli get 1234 --json
```

**Arguments:**
- `id` - Document ID (required)

**Flags:**
- `--content-only` - Only output document text (for piping)
- `--max-length, -m <n>` - Truncate content (default: 50000 chars)
- `--json` - Output raw JSON

**Output includes:**
- Document metadata (title, correspondent, type, tags, dates)
- Download URL for original file
- OCR text content (truncated if needed)

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

**Behavior:**
- Default filename: original filename from Paperless
- Saves to current directory unless `--output` specified
- Errors if file exists (use `--force` to overwrite)

---

### `edit <id>`

Edit document metadata.

```bash
paperless-cli edit 1234 --title="Updated Title"
paperless-cli edit 1234 --correspondent=comcast
paperless-cli edit 1234 --type=receipt --correspondent=amazon
paperless-cli edit 1234 --correspondent=newcorp --create
paperless-cli edit 1234 --no-correspondent
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

**Behavior:**
- At least one field flag required (errors otherwise)
- Names matched case-insensitively
- With `--create`: creates missing correspondent/type and confirms what was created
- Without `--create`: errors if correspondent/type not found

**Output:**
```
Created correspondent "NewCorp". Document 1234 updated.
```

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
- `--limit, -l <n>` - Max results (default: 5, max: 100)
- `--json` - Output raw JSON

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

**Behavior:**
1. Normalize tag name (trim whitespace, lowercase, collapse spaces)
2. Look up tag by name (case-insensitive)
3. If not found and `--create`: create the tag
4. If not found and no `--create`: error with list of similar tags if any
5. If ambiguous match (partial): list matching tags and exit
6. Add tag to document

**Tag matching:**
- Exact match (case-insensitive) required
- If multiple tags contain the search term but none match exactly, list all matches

---

### `remove-tag <document-id> <tag-name>`

Remove a tag from a document.

```bash
paperless-cli remove-tag 1234 "needs-review"
```

**Arguments:**
- `document-id` - Document ID (required)
- `tag-name` - Tag name (required)

**Behavior:**
- Idempotent: silent success if document doesn't have tag
- Same tag matching rules as `add-tag`

---

### `tags`

List all tags.

```bash
paperless-cli tags
paperless-cli tags --json
```

**Flags:**
- `--json` - Output raw JSON

**Output:**
```
Tags (23 total):

tax (45 documents)
medical (12 documents)
receipt (89 documents)
...
```

---

### `correspondents`

List all correspondents.

```bash
paperless-cli correspondents
paperless-cli correspondents --json
```

**Flags:**
- `--json` - Output raw JSON

---

### `types`

List all document types.

```bash
paperless-cli types
paperless-cli types --json
```

**Flags:**
- `--json` - Output raw JSON

---

### `create-tag <name>`

Create a new tag.

```bash
paperless-cli create-tag reviewed
paperless-cli create-tag urgent --color="#ff0000"
paperless-cli create-tag auto-file --match="invoice" --matching-algorithm=any
```

**Arguments:**
- `name` - Tag name (required)

**Flags:**
- `--color <hex>` - Color in hex format (e.g., #ff0000)
- `--is-inbox-tag` - Mark as inbox tag
- `--match <pattern>` - Auto-assignment match pattern
- `--matching-algorithm <algo>` - Algorithm: any, all, literal, regex, fuzzy (default: any)
- `--is-insensitive` - Case-insensitive matching (default: true)

---

### `create-correspondent <name>`

Create a new correspondent.

```bash
paperless-cli create-correspondent comcast
paperless-cli create-correspondent amazon --match="amazon"
```

**Arguments:**
- `name` - Correspondent name (required)

**Flags:**
- `--match <pattern>` - Auto-assignment match pattern
- `--matching-algorithm <algo>` - Algorithm: any, all, literal, regex, fuzzy (default: any)
- `--is-insensitive` - Case-insensitive matching (default: true)

---

### `create-type <name>`

Create a new document type.

```bash
paperless-cli create-type receipt
paperless-cli create-type invoice --match="invoice"
```

**Arguments:**
- `name` - Document type name (required)

**Flags:**
- `--match <pattern>` - Auto-assignment match pattern
- `--matching-algorithm <algo>` - Algorithm: any, all, literal, regex, fuzzy (default: any)
- `--is-insensitive` - Case-insensitive matching (default: true)

---

### `stats`

Show system statistics.

```bash
paperless-cli stats
paperless-cli stats --json
```

**Flags:**
- `--json` - Output raw JSON

**Output:**
```
Paperless-ngx v2.4.0

Documents: 1,234
Tags: 23
Correspondents: 45
Document Types: 8
```

---

## Project Structure

```
paperless-cli/
├── src/
│   ├── main.ts                # CLI entrypoint
│   ├── cli/
│   │   ├── search.ts
│   │   ├── list.ts
│   │   ├── get.ts
│   │   ├── download.ts
│   │   ├── edit.ts
│   │   ├── similar.ts
│   │   ├── addTag.ts
│   │   ├── removeTag.ts
│   │   ├── tags.ts
│   │   ├── correspondents.ts
│   │   ├── types.ts
│   │   ├── createTag.ts
│   │   ├── createCorrespondent.ts
│   │   ├── createType.ts
│   │   └── stats.ts
│   ├── client/
│   │   └── PaperlessClient.ts # Effect service
│   ├── schema/
│   │   ├── Document.ts
│   │   ├── Tag.ts
│   │   ├── Correspondent.ts
│   │   └── DocumentType.ts
│   ├── errors/
│   │   └── index.ts           # Typed domain errors
│   └── format/
│       └── output.ts          # Pretty printing
├── flake.nix
├── package.json
└── tsconfig.json
```

---

## Error Handling

### Domain Errors (Effect typed)

```typescript
// Auth errors
class InvalidToken extends Data.TaggedError("InvalidToken") {}
class MissingCredentials extends Data.TaggedError("MissingCredentials") {}

// Not found errors
class DocumentNotFound extends Data.TaggedError("DocumentNotFound")<{ id: number }> {}
class TagNotFound extends Data.TaggedError("TagNotFound")<{ name: string }> {}
class CorrespondentNotFound extends Data.TaggedError("CorrespondentNotFound")<{ name: string }> {}
class DocumentTypeNotFound extends Data.TaggedError("DocumentTypeNotFound")<{ name: string }> {}

// Validation errors
class InvalidDocumentId extends Data.TaggedError("InvalidDocumentId")<{ value: string }> {}
class InvalidQuery extends Data.TaggedError("InvalidQuery")<{ reason: string }> {}
class AmbiguousMatch extends Data.TaggedError("AmbiguousMatch")<{ type: string; matches: string[] }> {}

// Network errors
class ConnectionFailed extends Data.TaggedError("ConnectionFailed")<{ url: string }> {}
class Timeout extends Data.TaggedError("Timeout")<{ url: string }> {}
class ServerError extends Data.TaggedError("ServerError")<{ status: number; message: string }> {}
```

### Exit Codes

- `0` - Success
- `1` - Any error

### Retry Strategy

Network failures (connection refused, timeout) retry with exponential backoff:
- 3 retries: 1s, 2s, 4s delays
- Use Effect's `Schedule.exponential` with `retry`

---

## API Integration

### Pagination

- Paperless API paginates at 25 items per page
- CLI auto-paginates transparently up to `--limit`
- Hard cap at 100 results (4 API calls max)

### Name Normalization

All tag/correspondent/type names are normalized before API calls:
- Trim leading/trailing whitespace
- Collapse multiple spaces to single space
- Convert to lowercase for comparison

### Endpoints Used

| CLI Command | HTTP Method | Endpoint |
|-------------|-------------|----------|
| `search` | GET | `/api/documents/?query=...` |
| `list` | GET | `/api/documents/?ordering=-added` |
| `get` | GET | `/api/documents/{id}/` |
| `download` | GET | `/api/documents/{id}/download/` |
| `edit` | PATCH | `/api/documents/{id}/` |
| `similar` | GET | `/api/documents/?more_like_id=...` |
| `tags` | GET | `/api/tags/` |
| `correspondents` | GET | `/api/correspondents/` |
| `types` | GET | `/api/document_types/` |
| `add-tag` | GET | `/api/tags/?name__iexact=...` |
| `add-tag` | PATCH | `/api/documents/{id}/` |
| `remove-tag` | PATCH | `/api/documents/{id}/` |
| `create-tag` | POST | `/api/tags/` |
| `create-correspondent` | POST | `/api/correspondents/` |
| `create-type` | POST | `/api/document_types/` |
| `stats` | GET | `/api/statistics/` |

---

## Safety

### Allowed Operations
- All GET requests (read)
- PATCH document metadata (title, correspondent, type, tags)
- POST to create tags/correspondents/types

### Blocked Operations
- DELETE anything
- Bulk operations
- Document content modification

### Implementation

```typescript
const allowedMutations = [
  { method: "PATCH", pattern: /^\/api\/documents\/\d+\/$/ },
  { method: "POST", pattern: /^\/api\/tags\/$/ },
  { method: "POST", pattern: /^\/api\/correspondents\/$/ },
  { method: "POST", pattern: /^\/api\/document_types\/$/ },
] as const;
```

---

## Claude Skill Specification

### File Structure

```
~/.claude/skills/paperless/
├── SKILL.md
└── CLI-REFERENCE.md
```

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

Use the `paperless-cli` command to interact with Paperless-ngx.

See @CLI-REFERENCE.md for full command documentation.

## Behavior

Only respond to explicit requests about documents. Do not proactively suggest searches.

## Examples

**User says:** "Find my tax documents from 2023"
**Action:** Run `paperless-cli search "tax 2023"` or `paperless-cli search --tag=tax --after=2023-01-01 --before=2024-01-01`

**User says:** "Show me the full W-2"
**Action:** Run `paperless-cli get <id>` using the ID from search results

**User says:** "What tags do I have?"
**Action:** Run `paperless-cli tags`

**User says:** "Tag that document as reviewed"
**Action:** Run `paperless-cli add-tag <id> reviewed`

**User says:** "Find similar documents to this receipt"
**Action:** Run `paperless-cli similar <id>`

**User says:** "What's in my inbox?"
**Action:** Run `paperless-cli list --inbox`

**User says:** "Download that PDF"
**Action:** Run `paperless-cli download <id>`

## Workflow

1. Start with `search` or `list` to find documents
2. Use `get` to read full content when needed
3. Use `add-tag`/`remove-tag` to organize
4. Use `similar` to find related documents
5. Use `download` to save original files
```

### CLI-REFERENCE.md

```markdown
# paperless-cli Reference

## Commands

### search [query]
Search documents by content. Query optional if using filters.

Flags:
- `--tag, -t <name>` - Filter by tag (repeatable)
- `--correspondent, -c <name>` - Filter by correspondent
- `--type, -d <name>` - Filter by document type
- `--after <date>` - Created after (YYYY-MM-DD or -Nd/-Nm/-Ny)
- `--before <date>` - Created before
- `--sort <field>` - Sort by: created, added, modified, title, correspondent, type
- `--limit, -l <n>` - Max results (default: 10, max: 100)
- `--json` - JSON output

### list
List recent documents.

Flags:
- `--inbox` - Show inbox documents only
- `--tag, -t <name>` - Filter by tag
- `--correspondent, -c <name>` - Filter by correspondent
- `--type, -d <name>` - Filter by type
- `--sort <field>` - Sort field (default: added)
- `--limit, -l <n>` - Max results
- `--json` - JSON output

### get <id>
Get document details and content.

Flags:
- `--content-only` - Only output text
- `--max-length, -m <n>` - Truncate content
- `--json` - JSON output

### download <id>
Download original document file.

Flags:
- `--output, -o <path>` - Save path
- `--force, -f` - Overwrite existing

### edit <id>
Edit document metadata.

Flags:
- `--title <value>` - Set title
- `--correspondent <name>` - Set correspondent
- `--type <name>` - Set document type
- `--no-correspondent` - Clear correspondent
- `--no-type` - Clear document type
- `--create` - Create correspondent/type if not found

### similar <id>
Find similar documents.

Flags:
- `--limit, -l <n>` - Max results (default: 5)
- `--json` - JSON output

### add-tag <document-id> <tag-name>
Add tag to document.

Flags:
- `--create` - Create tag if not found

### remove-tag <document-id> <tag-name>
Remove tag from document.

### tags
List all tags with document counts.

### correspondents
List all correspondents with document counts.

### types
List all document types with document counts.

### create-tag <name>
Create a new tag.

Flags:
- `--color <hex>` - Color
- `--is-inbox-tag` - Mark as inbox tag
- `--match <pattern>` - Match pattern
- `--matching-algorithm <algo>` - any, all, literal, regex, fuzzy
- `--is-insensitive` - Case-insensitive matching

### create-correspondent <name>
Create a new correspondent.

Flags:
- `--match <pattern>` - Match pattern
- `--matching-algorithm <algo>` - any, all, literal, regex, fuzzy
- `--is-insensitive` - Case-insensitive matching

### create-type <name>
Create a new document type.

Flags:
- `--match <pattern>` - Match pattern
- `--matching-algorithm <algo>` - any, all, literal, regex, fuzzy
- `--is-insensitive` - Case-insensitive matching

### stats
Show system statistics (document count, tags, version).

## Environment

Required:
- `PAPERLESS_URL` - Base URL of Paperless instance
- `PAPERLESS_TOKEN` - API authentication token
```
