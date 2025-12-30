import { Command } from '@effect/cli'
import { Console, Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatSuccess } from '../../format/output.ts'
import { resolveTag } from '../helpers.ts'
import { docIdArg, tagNameArg } from '../options.ts'

export const removeTag = Command.make('remove-tag', { id: docIdArg, tagName: tagNameArg }, ({ id, tagName }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient

    // Find tag (with fuzzy matching)
    const tagResult = yield* resolveTag(client, tagName).pipe(Effect.either)
    if (tagResult._tag === 'Left') {
      const err = tagResult.left
      if (err._tag === 'AmbiguousMatch') {
        yield* Console.error(`Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`)
        return
      }
      return yield* Effect.fail(err)
    }
    const tag = tagResult.right

    // Get document and remove tag (idempotent)
    const doc = yield* client.getDocument(id)
    const newTags = doc.tags.filter((t) => t !== tag.id)
    if (newTags.length !== doc.tags.length) {
      yield* client.editDocument(id, { tags: newTags })
    }
    yield* Console.log(formatSuccess(`Removed tag "${tag.name}" from document ${id}`))
  }),
).pipe(Command.withDescription('Remove tag from document'))
