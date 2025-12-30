import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatStatistics } from '../../format/output.ts'
import { jsonOption } from '../options.ts'

export const stats = Command.make('stats', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.getStatistics()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatStatistics(result))
    }
  }),
).pipe(Command.withDescription('Show system statistics'))
