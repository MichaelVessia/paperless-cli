import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { nameArg } from '../options.ts'

export const correspondentsHandler = () =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listCorrespondents()
    return Envelope.success('correspondents', { count: result.count, correspondents: result.results }, [
      NextActions.createCorrespondent(),
      NextActions.searchDocuments(),
    ])
  })

export const correspondents = Command.make('correspondents', {}, () =>
  correspondentsHandler().pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('List all correspondents'))

export const createCorrespondentHandler = (name: string) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const correspondent = yield* client.createCorrespondent({ name })
    return Envelope.success('create-correspondent', correspondent, [
      NextActions.listCorrespondents(),
      NextActions.searchDocuments(),
    ])
  })

export const createCorrespondent = Command.make('create-correspondent', { name: nameArg }, ({ name }) =>
  createCorrespondentHandler(name).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Create a new correspondent'))
