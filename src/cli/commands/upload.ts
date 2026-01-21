import { Args, Command, Options } from '@effect/cli'
import { FileSystem, Path } from '@effect/platform'
import { Console, Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { FileNotFound } from '../../errors/index.ts'
import { formatSuccess } from '../../format/output.ts'
import { createOption } from '../options.ts'

const fileArg = Args.file({ name: 'file', exists: 'yes' }).pipe(Args.withDescription('Path to the file to upload'))

const titleOption = Options.text('title').pipe(
  Options.withAlias('t'),
  Options.withDescription('Document title (defaults to filename)'),
  Options.optional,
)

const correspondentOption = Options.text('correspondent').pipe(
  Options.withDescription('Correspondent name'),
  Options.optional,
)

const typeOption = Options.text('type').pipe(Options.withDescription('Document type name'), Options.optional)

const tagOption = Options.text('tag').pipe(Options.withDescription('Tag name (repeatable)'), Options.repeated)

export const upload = Command.make(
  'upload',
  {
    file: fileArg,
    title: titleOption,
    correspondent: correspondentOption,
    type: typeOption,
    tags: tagOption,
    create: createOption,
  },
  ({ file, title, correspondent, type, tags, create }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fs = yield* FileSystem.FileSystem
      const pathService = yield* Path.Path

      // Read file
      const exists = yield* fs.exists(file)
      if (!exists) {
        return yield* Effect.fail(new FileNotFound({ path: file }))
      }
      const fileContent = yield* fs.readFile(file)

      const filename = pathService.basename(file)
      const titleVal = Option.getOrElse(title, () => filename)

      // Resolve correspondent
      let correspondentId: number | undefined
      const correspondentName = Option.getOrUndefined(correspondent)
      if (correspondentName) {
        let found = yield* client.findCorrespondentByName(correspondentName)
        if (!found) {
          if (create) {
            found = yield* client.createCorrespondent({ name: correspondentName })
            yield* Console.log(`Created correspondent "${correspondentName}"`)
          } else {
            yield* Console.error(`Correspondent not found: ${correspondentName}`)
            return
          }
        }
        correspondentId = found.id
      }

      // Resolve document type
      let documentTypeId: number | undefined
      const typeName = Option.getOrUndefined(type)
      if (typeName) {
        let found = yield* client.findDocumentTypeByName(typeName)
        if (!found) {
          if (create) {
            found = yield* client.createDocumentType({ name: typeName })
            yield* Console.log(`Created document type "${typeName}"`)
          } else {
            yield* Console.error(`Document type not found: ${typeName}`)
            return
          }
        }
        documentTypeId = found.id
      }

      // Resolve tags
      const tagIds: number[] = []
      for (const tagName of tags) {
        let found = yield* client.findTagByName(tagName)
        if (!found) {
          if (create) {
            found = yield* client.createTag({ name: tagName })
            yield* Console.log(`Created tag "${tagName}"`)
          } else {
            yield* Console.error(`Tag not found: ${tagName}`)
            return
          }
        }
        tagIds.push(found.id)
      }

      // Upload document
      const uploadOptions: {
        title?: string
        correspondent?: number
        documentType?: number
        tags?: readonly number[]
      } = { title: titleVal }
      if (correspondentId !== undefined) uploadOptions.correspondent = correspondentId
      if (documentTypeId !== undefined) uploadOptions.documentType = documentTypeId
      if (tagIds.length > 0) uploadOptions.tags = tagIds

      const taskId = yield* client.uploadDocument(fileContent, filename, uploadOptions)

      yield* Console.log(formatSuccess(`Uploaded ${filename}`))
      yield* Console.log(`Task ID: ${taskId}`)
    }),
).pipe(Command.withDescription('Upload a document'))
