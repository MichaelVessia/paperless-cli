# paperless-cli

Effect-based CLI for [Paperless-ngx](https://docs.paperless-ngx.com/) document management.

## Features

- **Search & Browse**: Full-text search, filter by tags/correspondent/type
- **Document Management**: View, download, edit metadata, manage tags
- **Organization**: Create tags, correspondents, document types
- **Type-Safe**: Built with Effect for robust error handling and typed APIs

## Installation

### Homebrew (macOS)

```bash
brew tap MichaelVessia/tap
brew install paperless-cli
```

### With Nix

```bash
# Run directly
nix run github:MichaelVessia/paperless-cli -- search "invoice"

# Or install
nix profile install github:MichaelVessia/paperless-cli
```

### Download Binary

```bash
# macOS ARM64 (Apple Silicon)
curl -L https://github.com/MichaelVessia/paperless-cli/releases/latest/download/paperless-cli-darwin-arm64 -o paperless-cli
chmod +x paperless-cli && mv paperless-cli /usr/local/bin/

# macOS x64 (Intel)
curl -L https://github.com/MichaelVessia/paperless-cli/releases/latest/download/paperless-cli-darwin-x64 -o paperless-cli
chmod +x paperless-cli && mv paperless-cli /usr/local/bin/

# Linux x64
curl -L https://github.com/MichaelVessia/paperless-cli/releases/latest/download/paperless-cli-linux-x64 -o paperless-cli
chmod +x paperless-cli && sudo mv paperless-cli /usr/local/bin/
```

### From Source

Requires [Bun](https://bun.sh/).

```bash
git clone https://github.com/MichaelVessia/paperless-cli.git
cd paperless-cli
bun install
bun run build
```

## Configuration

Set environment variables:

```bash
export PAPERLESS_URL=https://paperless.example.com
export PAPERLESS_TOKEN=your-api-token
```

Get your API token from Paperless-ngx Settings > Administration > Auth tokens.

## Quick Start

```bash
# Search documents
paperless-cli search "tax 2023"
paperless-cli search --tag=receipt --correspondent=amazon

# List recent documents
paperless-cli list
paperless-cli list --inbox

# Get document details
paperless-cli get 1234
paperless-cli get 1234 --content-only

# Download original file
paperless-cli download 1234

# Edit metadata
paperless-cli edit 1234 --title="Updated Title"
paperless-cli edit 1234 --correspondent=amazon --create

# Tag management
paperless-cli add-tag 1234 reviewed
paperless-cli remove-tag 1234 inbox

# List tags, correspondents, types
paperless-cli tags
paperless-cli correspondents
paperless-cli types

# System stats
paperless-cli stats
```

## Commands

| Command | Description |
|---------|-------------|
| `search [query]` | Full-text search with optional filters |
| `list` | List recent documents |
| `get <id>` | Get document details and content |
| `download <id>` | Download original file |
| `edit <id>` | Edit document metadata |
| `similar <id>` | Find similar documents |
| `add-tag <id> <tag>` | Add tag to document |
| `remove-tag <id> <tag>` | Remove tag from document |
| `create-tag <name>` | Create new tag |
| `create-correspondent <name>` | Create new correspondent |
| `create-type <name>` | Create new document type |
| `tags` | List all tags |
| `correspondents` | List all correspondents |
| `types` | List all document types |
| `stats` | Show system statistics |

Use `--help` on any command for detailed options.

## Global Flags

- `--json` - Output raw JSON (most commands)
- `--help` - Show help
- `--version` - Show version

## Development

```bash
bun install          # Install dependencies
bun run typecheck    # Type check
bun test             # Run tests
bun run src/main.ts  # Run CLI
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [@effect/cli](https://github.com/Effect-TS/effect)
- **HTTP**: [@effect/platform](https://github.com/Effect-TS/effect)
- **Validation**: [Effect Schema](https://effect.website/docs/schema/introduction)

## Architecture

```
src/
├── main.ts              # CLI entrypoint and command definitions
├── client/
│   └── PaperlessClient.ts   # API client service with retry logic
├── schema/              # Effect Schema definitions
├── errors/              # Typed domain errors
├── format/              # Output formatters
└── test/                # Mock client and fixtures
```

See [docs/adr](docs/adr/) for architecture decision records.

## Claude Code Integration

This CLI includes a Claude Code skill for natural language document access. See [nixos-config/skills/paperless](https://github.com/MichaelVessia/nixos-config/tree/master/modules/programs/claude-code/skills/paperless) for integration details.

## License

MIT
