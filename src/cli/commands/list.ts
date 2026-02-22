import { Command, Options } from '@effect/cli'
import { Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { toSummary } from '../../envelope/document-result.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import type { TagList } from '../../schema/index.ts'
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

const inboxOption = Options.boolean('inbox').pipe(
  Options.withDescription('Show only inbox documents'),
  Options.withDefault(false),
)

export const listHandler = (args: {
  inbox: boolean
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

    // Get inbox tag if needed
    const tagIds: number[] = []
    let allTags: TagList | undefined
    if (args.inbox) {
      allTags = yield* client.listTags()
      const inboxTag = allTags.results.find((t) => t.is_inbox_tag)
      if (inboxTag) tagIds.push(inboxTag.id)
    }

    // Resolve tag names to IDs
    for (const tagName of args.tag) {
      const tagResult = yield* resolveTag(client, tagName, allTags).pipe(Effect.either)
      if (tagResult._tag === 'Left') {
        const err = tagResult.left
        if (err._tag === 'AmbiguousMatch') {
          return Envelope.error(
            'list',
            `Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`,
            'AmbiguousMatch',
            'Specify the full tag name.',
            [NextActions.listTags()],
          )
        }
        return Envelope.error(
          'list',
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
          'list',
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
          'list',
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
    const listParams: Parameters<typeof client.searchDocuments>[0] = {
      ordering: '-added',
      limit: effectiveLimit,
    }
    if (tagIds.length > 0) listParams.tags = tagIds
    if (correspondentId !== undefined) listParams.correspondent = correspondentId
    if (typeId !== undefined) listParams.documentType = typeId
    if (afterDate) listParams.createdAfter = afterDate
    if (beforeDate) listParams.createdBefore = beforeDate
    const result = yield* client.searchDocuments(listParams)

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
        : [NextActions.uploadDocument(), NextActions.searchDocuments()]

    return Envelope.success('list', { count: result.count, documents }, nextActions)
  })

export const list = Command.make(
  'list',
  {
    inbox: inboxOption,
    tag: tagFilterOption,
    correspondent: correspondentFilterOption,
    type: typeFilterOption,
    after: afterOption,
    before: beforeOption,
    limit: limitOption,
    all: allOption,
  },
  (cmdArgs) => listHandler(cmdArgs).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('List recent documents'))
