import { Args, Command } from '@effect/cli'
import { Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { toSummary } from '../../envelope/document-result.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { resolveTag } from '../helpers.ts'
import {
  limitOption,
  allOption,
  tagFilterOption,
  correspondentFilterOption,
  typeFilterOption,
  afterOption,
  beforeOption,
} from '../options.ts'

const searchQuery = Args.text({ name: 'query' }).pipe(Args.optional)

export const searchHandler = (args: {
  query: Option.Option<string>
  tag: readonly string[]
  correspondent: Option.Option<string>
  type: Option.Option<string>
  after: Option.Option<string>
  before: Option.Option<string>
  limit: number
  all: boolean
}) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const correspondentName = Option.getOrUndefined(args.correspondent)
    const typeName = Option.getOrUndefined(args.type)
    const queryStr = Option.getOrUndefined(args.query)

    // Resolve tag names to IDs
    const tagIds: number[] = []
    for (const tagName of args.tag) {
      const tagResult = yield* resolveTag(client, tagName).pipe(Effect.either)
      if (tagResult._tag === 'Left') {
        const err = tagResult.left
        if (err._tag === 'AmbiguousMatch') {
          return Envelope.error(
            'search',
            `Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`,
            'AmbiguousMatch',
            'Specify the full tag name.',
            [NextActions.listTags()],
          )
        }
        return Envelope.error(
          'search',
          `Tag not found: ${tagName}`,
          'TagNotFound',
          'Check available tags with "paperless-cli tags".',
          [NextActions.listTags(), NextActions.createTag(tagName)],
        )
      }
      tagIds.push(tagResult.right.id)
    }

    // Resolve correspondent name to ID
    let correspondentId: number | undefined
    if (correspondentName) {
      const found = yield* client.findCorrespondentByName(correspondentName)
      if (!found) {
        return Envelope.error(
          'search',
          `Correspondent not found: ${correspondentName}`,
          'CorrespondentNotFound',
          'Check available correspondents with "paperless-cli correspondents".',
          [NextActions.listCorrespondents(), NextActions.createCorrespondent(correspondentName)],
        )
      }
      correspondentId = found.id
    }

    // Resolve type name to ID
    let typeId: number | undefined
    if (typeName) {
      const found = yield* client.findDocumentTypeByName(typeName)
      if (!found) {
        return Envelope.error(
          'search',
          `Document type not found: ${typeName}`,
          'DocumentTypeNotFound',
          'Check available types with "paperless-cli types".',
          [NextActions.listTypes(), NextActions.createType(typeName)],
        )
      }
      typeId = found.id
    }

    const afterDate = Option.getOrUndefined(args.after)
    const beforeDate = Option.getOrUndefined(args.before)
    const effectiveLimit = args.all ? 10000 : args.limit
    const searchParams: Parameters<typeof client.searchDocuments>[0] = { limit: effectiveLimit }
    if (queryStr) searchParams.query = queryStr
    if (tagIds.length > 0) searchParams.tags = tagIds
    if (correspondentId !== undefined) searchParams.correspondent = correspondentId
    if (typeId !== undefined) searchParams.documentType = typeId
    if (afterDate) searchParams.createdAfter = afterDate
    if (beforeDate) searchParams.createdBefore = beforeDate
    const result = yield* client.searchDocuments(searchParams)

    // Resolve document summaries
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
        : [NextActions.listDocuments(), NextActions.uploadDocument()]

    return Envelope.success('search', { count: result.count, documents }, nextActions)
  })

export const search = Command.make(
  'search',
  {
    query: searchQuery,
    tag: tagFilterOption,
    correspondent: correspondentFilterOption,
    type: typeFilterOption,
    after: afterOption,
    before: beforeOption,
    limit: limitOption,
    all: allOption,
  },
  (cmdArgs) => searchHandler(cmdArgs).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Search documents'))
