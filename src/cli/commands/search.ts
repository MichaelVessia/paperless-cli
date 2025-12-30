import { Args, Command } from '@effect/cli'
import { Console, Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatDocumentList } from '../../format/output.ts'
import { resolveTag } from '../helpers.ts'
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

const searchQuery = Args.text({ name: 'query' }).pipe(Args.optional)

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
    count: countOption,
    json: jsonOption,
  },
  ({ query, tag: tagNames, correspondent, type, after, before, limit, all, count, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const correspondentName = Option.getOrUndefined(correspondent)
      const typeName = Option.getOrUndefined(type)
      const queryStr = Option.getOrUndefined(query)

      // Resolve tag names to IDs
      const tagIds: number[] = []
      for (const tagName of tagNames) {
        const result = yield* resolveTag(client, tagName).pipe(
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
      const searchParams: Parameters<typeof client.searchDocuments>[0] = { limit: effectiveLimit }
      if (queryStr) searchParams.query = queryStr
      if (tagIds.length > 0) searchParams.tags = tagIds
      if (correspondentId !== undefined) searchParams.correspondent = correspondentId
      if (typeId !== undefined) searchParams.documentType = typeId
      if (afterDate) searchParams.createdAfter = afterDate
      if (beforeDate) searchParams.createdBefore = beforeDate
      const result = yield* client.searchDocuments(searchParams)

      if (count) {
        yield* Console.log(String(result.count))
      } else if (json) {
        yield* Console.log(JSON.stringify(result, null, 2))
      } else if (result.results.length === 0) {
        // Empty results - no output per spec
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
            showPreview: true,
          }),
        )
      }
    }),
).pipe(Command.withDescription('Search documents'))
