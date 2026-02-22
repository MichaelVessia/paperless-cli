import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'

export const statsHandler = () =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.getStatistics()
    return Envelope.success('stats', result, [
      NextActions.searchDocuments(),
      NextActions.listDocuments(),
      NextActions.listTags(),
      NextActions.listCorrespondents(),
      NextActions.listTypes(),
    ])
  })

export const stats = Command.make('stats', {}, () => statsHandler().pipe(Effect.flatMap(Envelope.output))).pipe(
  Command.withDescription('Show system statistics'),
)
