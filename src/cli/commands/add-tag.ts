import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatSuccess } from '../../format/output.ts'
import type { Tag } from '../../schema/index.ts'
import { resolveTag } from '../helpers.ts'
import { docIdArg, tagNameArg, createOption } from '../options.ts'

export const addTag = Command.make(
  'add-tag',
  { id: docIdArg, tagName: tagNameArg, create: createOption },
  ({ id, tagName, create }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient

      // Find tag (with fuzzy matching)
      const tagResult = yield* resolveTag(client, tagName).pipe(Effect.either)
      let tag: Tag
      if (tagResult._tag === 'Left') {
        const err = tagResult.left
        if (err._tag === 'AmbiguousMatch') {
          yield* Console.error(`Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`)
          return
        }
        if (create) {
          tag = yield* client.createTag({ name: tagName })
          yield* Console.log(`Created tag "${tagName}"`)
        } else {
          return yield* Effect.fail(err)
        }
      } else {
        tag = tagResult.right
      }

      // Get document and add tag
      const doc = yield* client.getDocument(id)
      if (!doc.tags.includes(tag.id)) {
        yield* client.editDocument(id, { tags: [...doc.tags, tag.id] })
      }
      yield* Console.log(formatSuccess(`Added tag "${tag.name}" to document ${id}`))
    }),
).pipe(Command.withDescription('Add tag to document'))
