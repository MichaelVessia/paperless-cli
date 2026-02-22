import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { nameArg } from '../options.ts'

export const typesHandler = () =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listDocumentTypes()
    return Envelope.success('types', { count: result.count, document_types: result.results }, [
      NextActions.createType(),
      NextActions.searchDocuments(),
    ])
  })

export const types = Command.make('types', {}, () => typesHandler().pipe(Effect.flatMap(Envelope.output))).pipe(
  Command.withDescription('List all document types'),
)

export const createTypeHandler = (name: string) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const docType = yield* client.createDocumentType({ name })
    return Envelope.success('create-type', docType, [NextActions.listTypes(), NextActions.searchDocuments()])
  })

export const createType = Command.make('create-type', { name: nameArg }, ({ name }) =>
  createTypeHandler(name).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Create a new document type'))
