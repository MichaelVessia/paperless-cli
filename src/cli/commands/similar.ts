import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatDocumentList } from '../../format/output.ts'
import { jsonOption, limitOption, docIdArg } from '../options.ts'

export const similar = Command.make(
  'similar',
  { id: docIdArg, limit: limitOption, json: jsonOption },
  ({ id, limit, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.getSimilarDocuments(id, limit)

      if (json) {
        yield* Console.log(JSON.stringify(result, null, 2))
      } else if (result.results.length === 0) {
        yield* Console.log('No similar documents found.')
      } else {
        const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
          client.listTags(),
          client.listCorrespondents(),
          client.listDocumentTypes(),
        ])
        yield* Console.log(
          formatDocumentList(result.results, {
            tags: tagsResult.results,
            correspondents: corrsResult.results,
            documentTypes: typesResult.results,
          }),
        )
      }
    }),
).pipe(Command.withDescription('Find similar documents'))
