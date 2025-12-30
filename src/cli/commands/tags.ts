import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatTagList, formatSuccess } from '../../format/output.ts'
import { jsonOption, nameArg } from '../options.ts'

export const tags = Command.make('tags', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listTags()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatTagList(result.results))
    }
  }),
).pipe(Command.withDescription('List all tags'))

export const createTag = Command.make('create-tag', { name: nameArg }, ({ name }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const tag = yield* client.createTag({ name })
    yield* Console.log(formatSuccess(`Created tag "${tag.name}" (id: ${tag.id})`))
  }),
).pipe(Command.withDescription('Create a new tag'))
