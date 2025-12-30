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
  handleFlagOrderingError,
} from './cli/index.ts'

// Main command with subcommands
const mainCommand = Command.make('paperless-cli').pipe(
  Command.withDescription('CLI for Paperless-ngx document management'),
  Command.withSubcommands([
    search,
    list,
    get,
    download,
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
    Console.error('Error: PAPERLESS_URL and PAPERLESS_TOKEN environment variables are required'),
  ),
  BunRuntime.runMain,
)
