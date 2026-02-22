import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { nameArg } from '../options.ts'

export const tagsHandler = () =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listTags()
    return Envelope.success('tags', { count: result.count, tags: result.results }, [
      NextActions.createTag(),
      NextActions.searchDocuments(),
    ])
  })

export const tags = Command.make('tags', {}, () => tagsHandler().pipe(Effect.flatMap(Envelope.output))).pipe(
  Command.withDescription('List all tags'),
)

export const createTagHandler = (name: string) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const tag = yield* client.createTag({ name })
    return Envelope.success('create-tag', tag, [NextActions.listTags(), NextActions.searchDocuments()])
  })

export const createTag = Command.make('create-tag', { name: nameArg }, ({ name }) =>
  createTagHandler(name).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Create a new tag'))
