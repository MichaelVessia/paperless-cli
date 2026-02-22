import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import type { Tag } from '../../schema/index.ts'
import { resolveTag } from '../helpers.ts'
import { docIdArg, tagNameArg, createOption } from '../options.ts'

export const addTagHandler = (id: number, tagName: string, create: boolean) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient

    // Find tag (with fuzzy matching)
    const tagResult = yield* resolveTag(client, tagName).pipe(Effect.either)
    let tag: Tag
    if (tagResult._tag === 'Left') {
      const err = tagResult.left
      if (err._tag === 'AmbiguousMatch') {
        return Envelope.error(
          'add-tag',
          `Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`,
          'AmbiguousMatch',
          'Specify the full tag name.',
          [NextActions.listTags()],
        )
      }
      if (create) {
        tag = yield* client.createTag({ name: tagName })
      } else {
        return yield* Effect.fail(err)
      }
    } else {
      tag = tagResult.right
    }

    // Get document and add tag
    const doc = yield* client.getDocument(id)
    const alreadyHadTag = doc.tags.includes(tag.id)
    if (!alreadyHadTag) {
      yield* client.editDocument(id, { tags: [...doc.tags, tag.id] })
    }

    return Envelope.success(
      'add-tag',
      { document_id: id, tag: { id: tag.id, name: tag.name }, already_had_tag: alreadyHadTag },
      [NextActions.getDocument(id), NextActions.removeTag(id, tag.name)],
    )
  })

export const addTag = Command.make(
  'add-tag',
  { id: docIdArg, tagName: tagNameArg, create: createOption },
  ({ id, tagName, create }) => addTagHandler(id, tagName, create).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Add tag to document'))
