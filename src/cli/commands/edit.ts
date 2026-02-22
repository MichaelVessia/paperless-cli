import { Command, Options } from '@effect/cli'
import { Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { toSummary } from '../../envelope/document-result.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { docIdArg, createOption } from '../options.ts'

const titleOption = Options.text('title').pipe(Options.withDescription('Set document title'), Options.optional)
const editCorrespondentOption = Options.text('correspondent').pipe(
  Options.withDescription('Set correspondent'),
  Options.optional,
)
const editTypeOption = Options.text('type').pipe(Options.withDescription('Set document type'), Options.optional)
const noCorrespondentOption = Options.boolean('no-correspondent').pipe(
  Options.withDescription('Clear correspondent'),
  Options.withDefault(false),
)
const noTypeOption = Options.boolean('no-type').pipe(
  Options.withDescription('Clear document type'),
  Options.withDefault(false),
)

export const editHandler = (args: {
  id: number
  title: Option.Option<string>
  correspondent: Option.Option<string>
  type: Option.Option<string>
  noCorrespondent: boolean
  noType: boolean
  create: boolean
}) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const titleVal = Option.getOrUndefined(args.title)
    const correspondentName = Option.getOrUndefined(args.correspondent)
    const typeName = Option.getOrUndefined(args.type)

    // Must have at least one field
    if (!titleVal && !correspondentName && !typeName && !args.noCorrespondent && !args.noType) {
      return Envelope.error(
        'edit',
        'At least one field must be specified',
        'InvalidValue',
        'Use --title, --correspondent, --type, --no-correspondent, or --no-type.',
        [NextActions.getDocument(args.id)],
      )
    }

    const updates: {
      title?: string
      correspondent?: number | null
      document_type?: number | null
    } = {}
    const updatedFields: string[] = []

    if (titleVal) {
      updates.title = titleVal
      updatedFields.push('title')
    }

    if (args.noCorrespondent) {
      updates.correspondent = null
      updatedFields.push('correspondent')
    } else if (correspondentName) {
      let found = yield* client.findCorrespondentByName(correspondentName)
      if (!found) {
        if (args.create) {
          found = yield* client.createCorrespondent({ name: correspondentName })
        } else {
          return Envelope.error(
            'edit',
            `Correspondent not found: ${correspondentName}`,
            'CorrespondentNotFound',
            'Use --create to auto-create, or check with "paperless-cli correspondents".',
            [NextActions.listCorrespondents(), NextActions.createCorrespondent(correspondentName)],
          )
        }
      }
      updates.correspondent = found.id
      updatedFields.push('correspondent')
    }

    if (args.noType) {
      updates.document_type = null
      updatedFields.push('document_type')
    } else if (typeName) {
      let found = yield* client.findDocumentTypeByName(typeName)
      if (!found) {
        if (args.create) {
          found = yield* client.createDocumentType({ name: typeName })
        } else {
          return Envelope.error(
            'edit',
            `Document type not found: ${typeName}`,
            'DocumentTypeNotFound',
            'Use --create to auto-create, or check with "paperless-cli types".',
            [NextActions.listTypes(), NextActions.createType(typeName)],
          )
        }
      }
      updates.document_type = found.id
      updatedFields.push('document_type')
    }

    const updatedDoc = yield* client.editDocument(args.id, updates)

    const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
      client.listTags(),
      client.listCorrespondents(),
      client.listDocumentTypes(),
    ])
    const document = toSummary(updatedDoc, tagsResult.results, corrsResult.results, typesResult.results)

    return Envelope.success('edit', { id: args.id, updated_fields: updatedFields, document }, [
      NextActions.getDocument(args.id),
      NextActions.downloadDocument(args.id),
    ])
  })

export const edit = Command.make(
  'edit',
  {
    id: docIdArg,
    title: titleOption,
    correspondent: editCorrespondentOption,
    type: editTypeOption,
    noCorrespondent: noCorrespondentOption,
    noType: noTypeOption,
    create: createOption,
  },
  (cmdArgs) => editHandler(cmdArgs).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Edit document metadata'))
