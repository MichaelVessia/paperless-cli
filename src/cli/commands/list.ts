import { Command, Options } from '@effect/cli'
import { Console, Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatDocumentList } from '../../format/output.ts'
import { resolveTag } from '../helpers.ts'
import type { TagList } from '../../schema/index.ts'
import {
  jsonOption,
  limitOption,
  allOption,
  countOption,
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
    count: countOption,
    json: jsonOption,
  },
  ({ inbox, tag: tagNames, correspondent, type, after, before, limit, all, count, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const correspondentName = Option.getOrUndefined(correspondent)
      const typeName = Option.getOrUndefined(type)

      // Get inbox tag if needed
      const tagIds: number[] = []
      let allTags: TagList | undefined
      if (inbox) {
        allTags = yield* client.listTags()
        const inboxTag = allTags.results.find((t) => t.is_inbox_tag)
        if (inboxTag) tagIds.push(inboxTag.id)
      }

      // Resolve tag names to IDs
      for (const tagName of tagNames) {
        const result = yield* resolveTag(client, tagName, allTags).pipe(
          Effect.mapError((e) =>
            e._tag === 'AmbiguousMatch'
              ? `Tag "${tagName}" is ambiguous. Matches: ${e.matches.join(', ')}`
              : `Tag not found: ${tagName}`,
          ),
          Effect.either,
        )
        if (result._tag === 'Left') {
          yield* Console.error(result.left)
          return
        }
        tagIds.push(result.right.id)
      }

      // Resolve correspondent name to ID
      let correspondentId: number | undefined
      if (correspondentName) {
        const found = yield* client.findCorrespondentByName(correspondentName)
        if (!found) {
          yield* Console.error(`Correspondent not found: ${correspondentName}`)
          return
        }
        correspondentId = found.id
      }

      // Resolve type name to ID
      let typeId: number | undefined
      if (typeName) {
        const found = yield* client.findDocumentTypeByName(typeName)
        if (!found) {
          yield* Console.error(`Document type not found: ${typeName}`)
          return
        }
        typeId = found.id
      }

      const afterDate = Option.getOrUndefined(after)
      const beforeDate = Option.getOrUndefined(before)
      const effectiveLimit = all ? 10000 : limit
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

      if (count) {
        yield* Console.log(String(result.count))
      } else if (json) {
        yield* Console.log(JSON.stringify(result, null, 2))
      } else if (result.results.length === 0) {
        yield* Console.log('No documents found.')
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
).pipe(Command.withDescription('List recent documents'))
