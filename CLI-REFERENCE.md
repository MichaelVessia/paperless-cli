# paperless-cli Reference

## Commands

### search [query]
Search documents by content. Query optional if using filters.

```bash
paperless-cli search "tax 2023"
paperless-cli search --tag=receipt --correspondent=amazon
paperless-cli search --limit=20
```

Flags:
- `--tag, -t <name>` - Filter by tag
- `--correspondent, -c <name>` - Filter by correspondent
- `--type, -d <name>` - Filter by document type
- `--limit, -l <n>` - Max results (default: 10)
- `--json` - JSON output

### list
List recent documents.

```bash
paperless-cli list
paperless-cli list --inbox
paperless-cli list --tag=tax --limit=20
```

Flags:
- `--inbox` - Show inbox documents only
- `--tag, -t <name>` - Filter by tag
- `--correspondent, -c <name>` - Filter by correspondent
- `--type, -d <name>` - Filter by type
- `--limit, -l <n>` - Max results (default: 10)
- `--json` - JSON output

### get <id>
Get document details and content.

```bash
paperless-cli get 1234
paperless-cli get 1234 --content-only
paperless-cli get 1234 --json
```

Flags:
- `--content-only` - Only output text (for piping)
- `--max-length, -m <n>` - Truncate content (default: 50000)
- `--json` - JSON output

### download <id>
Download original document file.

```bash
paperless-cli download 1234
paperless-cli download 1234 --output=~/Downloads/receipt.pdf
paperless-cli download 1234 --force
```

Flags:
- `--output, -o <path>` - Save path (default: current directory)
- `--force, -f` - Overwrite existing file

### edit <id>
Edit document metadata.

```bash
paperless-cli edit 1234 --title="Updated Title"
paperless-cli edit 1234 --correspondent=amazon
paperless-cli edit 1234 --correspondent=newcorp --create
paperless-cli edit 1234 --no-correspondent
```

Flags:
- `--title <value>` - Set title
- `--correspondent <name>` - Set correspondent
- `--type <name>` - Set document type
- `--no-correspondent` - Clear correspondent
- `--no-type` - Clear document type
- `--create` - Create correspondent/type if not found

### similar <id>
Find similar documents.

```bash
paperless-cli similar 1234
paperless-cli similar 1234 --limit=10
```

Flags:
- `--limit, -l <n>` - Max results (default: 5)
- `--json` - JSON output

### add-tag <document-id> <tag-name>
Add tag to document.

```bash
paperless-cli add-tag 1234 reviewed
paperless-cli add-tag 1234 "needs-review" --create
```

Flags:
- `--create` - Create tag if not found

### remove-tag <document-id> <tag-name>
Remove tag from document (idempotent).

```bash
paperless-cli remove-tag 1234 inbox
```

### tags
List all tags with document counts.

```bash
paperless-cli tags
paperless-cli tags --json
```

Flags:
- `--json` - JSON output

### correspondents
List all correspondents with document counts.

```bash
paperless-cli correspondents
paperless-cli correspondents --json
```

Flags:
- `--json` - JSON output

### types
List all document types with document counts.

```bash
paperless-cli types
paperless-cli types --json
```

Flags:
- `--json` - JSON output

### create-tag <name>
Create a new tag.

```bash
paperless-cli create-tag reviewed
```

### create-correspondent <name>
Create a new correspondent.

```bash
paperless-cli create-correspondent amazon
```

### create-type <name>
Create a new document type.

```bash
paperless-cli create-type receipt
```

### stats
Show system statistics.

```bash
paperless-cli stats
paperless-cli stats --json
```

Flags:
- `--json` - JSON output

## Environment

Required:
- `PAPERLESS_URL` - Base URL of Paperless instance
- `PAPERLESS_TOKEN` - API authentication token

## Output Format

Default output shows:
```
[1234] Document Title
       Correspondent: Company Name
       Tags: tag1, tag2
       Created: 2023-01-15
       Preview: First 100 characters of content...
```

Use `--json` for machine-readable output.
