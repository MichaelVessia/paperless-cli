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
**Action:** Run `paperless-cli search "tax 2023"` or `paperless-cli search --tag=tax`

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

## Environment

Requires these environment variables to be set:
- `PAPERLESS_URL` - Base URL of Paperless instance
- `PAPERLESS_TOKEN` - API authentication token
