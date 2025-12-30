import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatDocumentTypeList, formatSuccess } from '../../format/output.ts'
import { jsonOption, nameArg } from '../options.ts'

export const types = Command.make('types', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listDocumentTypes()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatDocumentTypeList(result.results))
    }
  }),
).pipe(Command.withDescription('List all document types'))

export const createType = Command.make('create-type', { name: nameArg }, ({ name }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const docType = yield* client.createDocumentType({ name })
    yield* Console.log(formatSuccess(`Created document type "${docType.name}" (id: ${docType.id})`))
  }),
).pipe(Command.withDescription('Create a new document type'))
