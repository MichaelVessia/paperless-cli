import { Command } from '@effect/cli'
import { FetchHttpClient } from '@effect/platform'
import { BunContext, BunRuntime } from '@effect/platform-bun'
import { Console, Effect, Layer } from 'effect'
import { PaperlessClientLive, PaperlessConfigFromEnv } from './client/PaperlessClient.ts'
import {
  stats,
  tags,
  createTag,
  correspondents,
  createCorrespondent,
  types,
  createType,
  search,
  list,
  get,
  download,
  similar,
  edit,
  addTag,
  removeTag,
  upload,
  handleFlagOrderingError,
} from './cli/index.ts'
import * as Envelope from './envelope/index.ts'

const commandTree = {
  name: 'paperless-cli',
  version: '0.1.0',
  description: 'CLI for Paperless-ngx document management',
  commands: [
    {
      name: 'search',
      description: 'Search documents',
      args: '[query]',
      flags: ['--tag', '--correspondent', '--type', '--after', '--before', '--limit', '--all'],
    },
    {
      name: 'list',
      description: 'List recent documents',
      flags: ['--inbox', '--tag', '--correspondent', '--type', '--after', '--before', '--limit', '--all'],
    },
    { name: 'get', description: 'Get document details', args: '<id>', flags: ['--max-length'] },
    { name: 'download', description: 'Download document', args: '<id>', flags: ['--output', '--force'] },
    {
      name: 'upload',
      description: 'Upload a document',
      args: '<file>',
      flags: ['--title', '--correspondent', '--type', '--tag', '--create'],
    },
    { name: 'similar', description: 'Find similar documents', args: '<id>', flags: ['--limit'] },
    {
      name: 'edit',
      description: 'Edit document metadata',
      args: '<id>',
      flags: ['--title', '--correspondent', '--type', '--no-correspondent', '--no-type', '--create'],
    },
    { name: 'add-tag', description: 'Add tag to document', args: '<id> <tag-name>', flags: ['--create'] },
    { name: 'remove-tag', description: 'Remove tag from document', args: '<id> <tag-name>' },
    { name: 'create-tag', description: 'Create a new tag', args: '<name>' },
    { name: 'create-correspondent', description: 'Create a new correspondent', args: '<name>' },
    { name: 'create-type', description: 'Create a new document type', args: '<name>' },
    { name: 'tags', description: 'List all tags' },
    { name: 'correspondents', description: 'List all correspondents' },
    { name: 'types', description: 'List all document types' },
    { name: 'stats', description: 'Show system statistics' },
  ],
  environment: {
    PAPERLESS_URL: { description: 'Base URL of the Paperless-ngx instance', required: true },
    PAPERLESS_TOKEN: { description: 'API authentication token', required: true },
  },
}

// Main command outputs command tree JSON when no subcommand is given
const mainCommand = Command.make('paperless-cli', {}, () => Console.log(JSON.stringify(commandTree, null, 2))).pipe(
  Command.withDescription('CLI for Paperless-ngx document management'),
  Command.withSubcommands([
    search,
    list,
    get,
    download,
    upload,
    similar,
    edit,
    addTag,
    removeTag,
    createTag,
    createCorrespondent,
    createType,
    tags,
    correspondents,
    types,
    stats,
  ]),
)

// Layer composition
const ClientLayer = PaperlessClientLive.pipe(
  Layer.provide(PaperlessConfigFromEnv),
  Layer.provide(FetchHttpClient.layer),
)

const MainLayer = Layer.mergeAll(ClientLayer, BunContext.layer)

// Run CLI
const cli = Command.run(mainCommand, {
  name: 'paperless-cli',
  version: '0.1.0',
})

cli(process.argv).pipe(
  Effect.provide(MainLayer),
  Effect.catchTag('InvalidValue', (e) => {
    const betterError = handleFlagOrderingError(e, process.argv)
    return betterError ?? Effect.fail(e)
  }),
  Effect.catchTag('MissingCredentials', () =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        'PAPERLESS_URL and PAPERLESS_TOKEN environment variables are required.',
        'MissingCredentials',
        'Set PAPERLESS_URL and PAPERLESS_TOKEN environment variables.',
        [],
      ),
    ),
  ),
  Effect.catchTag('InvalidToken', () =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        'Invalid API token.',
        'InvalidToken',
        'Check your PAPERLESS_TOKEN. Regenerate from Settings > Users in Paperless-ngx.',
        [],
      ),
    ),
  ),
  Effect.catchTag('ConnectionFailed', (e) =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        `Could not connect to ${e.url}.`,
        'ConnectionFailed',
        'Check PAPERLESS_URL and that the server is running.',
        [],
      ),
    ),
  ),
  Effect.catchTag('DocumentNotFound', (e) =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        `Document not found: ${e.id}.`,
        'DocumentNotFound',
        'Verify the document ID. Use "paperless-cli search" to find documents.',
        [],
      ),
    ),
  ),
  Effect.catchTag('ServerError', (e) =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        `Server error (${e.status}): ${e.message}.`,
        'ServerError',
        'Check Paperless-ngx server logs.',
        [],
      ),
    ),
  ),
  Effect.catchTag('TagNotFound', (e) =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        `Tag not found: ${e.name}.`,
        'TagNotFound',
        'Check available tags with "paperless-cli tags". Use --create to auto-create.',
        [],
      ),
    ),
  ),
  Effect.catchAll((e) =>
    Envelope.output(
      Envelope.error(
        'paperless-cli',
        String(e),
        'UnknownError',
        'An unexpected error occurred. Check command syntax and try again.',
        [],
      ),
    ),
  ),
  BunRuntime.runMain,
)
