import { Args, Command, Options } from '@effect/cli'
import { FileSystem, Path } from '@effect/platform'
import { Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { FileNotFound } from '../../errors/index.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
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

export const uploadHandler = (args: {
  file: string
  title: Option.Option<string>
  correspondent: Option.Option<string>
  type: Option.Option<string>
  tags: readonly string[]
  create: boolean
}) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const fs = yield* FileSystem.FileSystem
    const pathService = yield* Path.Path

    // Read file
    const exists = yield* fs.exists(args.file)
    if (!exists) {
      return yield* Effect.fail(new FileNotFound({ path: args.file }))
    }
    const fileContent = yield* fs.readFile(args.file)

    const filename = pathService.basename(args.file)
    const titleVal = Option.getOrElse(args.title, () => filename)

    // Resolve correspondent
    let correspondentId: number | undefined
    const correspondentName = Option.getOrUndefined(args.correspondent)
    if (correspondentName) {
      let found = yield* client.findCorrespondentByName(correspondentName)
      if (!found) {
        if (args.create) {
          found = yield* client.createCorrespondent({ name: correspondentName })
        } else {
          return Envelope.error(
            'upload',
            `Correspondent not found: ${correspondentName}`,
            'CorrespondentNotFound',
            'Use --create to auto-create, or check with "paperless-cli correspondents".',
            [NextActions.listCorrespondents(), NextActions.createCorrespondent(correspondentName)],
          )
        }
      }
      correspondentId = found.id
    }

    // Resolve document type
    let documentTypeId: number | undefined
    const typeName = Option.getOrUndefined(args.type)
    if (typeName) {
      let found = yield* client.findDocumentTypeByName(typeName)
      if (!found) {
        if (args.create) {
          found = yield* client.createDocumentType({ name: typeName })
        } else {
          return Envelope.error(
            'upload',
            `Document type not found: ${typeName}`,
            'DocumentTypeNotFound',
            'Use --create to auto-create, or check with "paperless-cli types".',
            [NextActions.listTypes(), NextActions.createType(typeName)],
          )
        }
      }
      documentTypeId = found.id
    }

    // Resolve tags
    const tagIds: number[] = []
    for (const tagName of args.tags) {
      let found = yield* client.findTagByName(tagName)
      if (!found) {
        if (args.create) {
          found = yield* client.createTag({ name: tagName })
        } else {
          return Envelope.error(
            'upload',
            `Tag not found: ${tagName}`,
            'TagNotFound',
            'Use --create to auto-create, or check with "paperless-cli tags".',
            [NextActions.listTags(), NextActions.createTag(tagName)],
          )
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

    return Envelope.success('upload', { task_id: taskId, filename, title: titleVal }, [
      NextActions.listDocuments(),
      NextActions.searchDocuments(),
    ])
  })

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
  (cmdArgs) => uploadHandler(cmdArgs).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Upload a document'))
