import { Command, Options } from '@effect/cli'
import { Console, Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatSuccess } from '../../format/output.ts'
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
  ({ id, title, correspondent, type, noCorrespondent, noType, create }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const titleVal = Option.getOrUndefined(title)
      const correspondentName = Option.getOrUndefined(correspondent)
      const typeName = Option.getOrUndefined(type)

      // Must have at least one field
      if (!titleVal && !correspondentName && !typeName && !noCorrespondent && !noType) {
        yield* Console.error('At least one field must be specified')
        return
      }

      const updates: {
        title?: string
        correspondent?: number | null
        document_type?: number | null
      } = {}

      if (titleVal) updates.title = titleVal

      if (noCorrespondent) {
        updates.correspondent = null
      } else if (correspondentName) {
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
        updates.correspondent = found.id
      }

      if (noType) {
        updates.document_type = null
      } else if (typeName) {
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
        updates.document_type = found.id
      }

      yield* client.editDocument(id, updates)
      yield* Console.log(formatSuccess(`Document ${id} updated`))
    }),
).pipe(Command.withDescription('Edit document metadata'))
