import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { toDetail } from '../../envelope/document-result.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { docIdArg } from '../options.ts'

const maxLengthOption = Options.integer('max-length').pipe(
  Options.withAlias('m'),
  Options.withDescription('Truncate content (default: 50000)'),
  Options.withDefault(50000),
)

export const getHandler = (id: number, maxLength: number) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const doc = yield* client.getDocument(id)
    const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
      client.listTags(),
      client.listCorrespondents(),
      client.listDocumentTypes(),
    ])
    const detail = toDetail(doc, tagsResult.results, corrsResult.results, typesResult.results, maxLength)
    return Envelope.success('get', detail, [
      NextActions.downloadDocument(id),
      NextActions.similarDocuments(id),
      NextActions.editDocument(id),
      NextActions.addTag(id),
    ])
  })

export const get = Command.make('get', { id: docIdArg, maxLength: maxLengthOption }, ({ id, maxLength }) =>
  getHandler(id, maxLength).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Get document details'))
