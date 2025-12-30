import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatCorrespondentList, formatSuccess } from '../../format/output.ts'
import { jsonOption, nameArg } from '../options.ts'

export const correspondents = Command.make('correspondents', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listCorrespondents()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatCorrespondentList(result.results))
    }
  }),
).pipe(Command.withDescription('List all correspondents'))

export const createCorrespondent = Command.make('create-correspondent', { name: nameArg }, ({ name }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const correspondent = yield* client.createCorrespondent({ name })
    yield* Console.log(formatSuccess(`Created correspondent "${correspondent.name}" (id: ${correspondent.id})`))
  }),
).pipe(Command.withDescription('Create a new correspondent'))
