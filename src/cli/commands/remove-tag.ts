import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { resolveTag } from '../helpers.ts'
import { docIdArg, tagNameArg } from '../options.ts'

export const removeTagHandler = (id: number, tagName: string) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient

    // Find tag (with fuzzy matching)
    const tagResult = yield* resolveTag(client, tagName).pipe(Effect.either)
    if (tagResult._tag === 'Left') {
      const err = tagResult.left
      if (err._tag === 'AmbiguousMatch') {
        return Envelope.error(
          'remove-tag',
          `Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`,
          'AmbiguousMatch',
          'Specify the full tag name.',
          [NextActions.listTags()],
        )
      }
      return yield* Effect.fail(err)
    }
    const tag = tagResult.right

    // Get document and remove tag (idempotent)
    const doc = yield* client.getDocument(id)
    const wasPresent = doc.tags.includes(tag.id)
    if (wasPresent) {
      const newTags = doc.tags.filter((t) => t !== tag.id)
      yield* client.editDocument(id, { tags: newTags })
    }

    return Envelope.success(
      'remove-tag',
      { document_id: id, tag: { id: tag.id, name: tag.name }, was_present: wasPresent },
      [NextActions.getDocument(id), NextActions.addTag(id)],
    )
  })

export const removeTag = Command.make('remove-tag', { id: docIdArg, tagName: tagNameArg }, ({ id, tagName }) =>
  removeTagHandler(id, tagName).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Remove tag from document'))
