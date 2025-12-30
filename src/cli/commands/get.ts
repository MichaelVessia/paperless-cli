import { Command, Options } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatDocumentFull } from '../../format/output.ts'
import { jsonOption, docIdArg } from '../options.ts'

const contentOnlyOption = Options.boolean('content-only').pipe(
  Options.withDescription('Only output document text'),
  Options.withDefault(false),
)
const maxLengthOption = Options.integer('max-length').pipe(
  Options.withAlias('m'),
  Options.withDescription('Truncate content (default: 50000)'),
  Options.withDefault(50000),
)

export const get = Command.make(
  'get',
  {
    id: docIdArg,
    contentOnly: contentOnlyOption,
    maxLength: maxLengthOption,
    json: jsonOption,
  },
  ({ id, contentOnly, maxLength, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const doc = yield* client.getDocument(id)

      if (json) {
        yield* Console.log(JSON.stringify(doc, null, 2))
      } else if (contentOnly) {
        yield* Console.log(doc.content)
      } else {
        const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
          client.listTags(),
          client.listCorrespondents(),
          client.listDocumentTypes(),
        ])
        yield* Console.log(
          formatDocumentFull(doc, {
            tags: tagsResult.results,
            correspondents: corrsResult.results,
            documentTypes: typesResult.results,
            maxContentLength: maxLength,
          }),
        )
      }
    }),
).pipe(Command.withDescription('Get document details'))
