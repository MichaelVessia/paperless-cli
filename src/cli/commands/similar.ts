import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { toSummary } from '../../envelope/document-result.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { limitOption, docIdArg } from '../options.ts'

export const similarHandler = (id: number, limit: number) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.getSimilarDocuments(id, limit)

    const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
      client.listTags(),
      client.listCorrespondents(),
      client.listDocumentTypes(),
    ])
    const documents = result.results.map((doc) =>
      toSummary(doc, tagsResult.results, corrsResult.results, typesResult.results),
    )

    const nextActions =
      documents.length > 0
        ? documents.slice(0, 3).map((d) => NextActions.getDocument(d.id))
        : [NextActions.getDocument(id)]

    return Envelope.success('similar', { source_id: id, documents }, nextActions)
  })

export const similar = Command.make('similar', { id: docIdArg, limit: limitOption }, ({ id, limit }) =>
  similarHandler(id, limit).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Find similar documents'))
