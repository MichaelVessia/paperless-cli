import { Command, Options } from '@effect/cli'
import { FileSystem, Path } from '@effect/platform'
import { Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import * as Envelope from '../../envelope/index.ts'
import * as NextActions from '../../envelope/next-actions.ts'
import { docIdArg } from '../options.ts'

const outputOption = Options.file('output').pipe(
  Options.withAlias('o'),
  Options.withDescription('Save to specific path'),
  Options.optional,
)
const forceOption = Options.boolean('force').pipe(
  Options.withAlias('f'),
  Options.withDescription('Overwrite existing file'),
  Options.withDefault(false),
)

export const downloadHandler = (id: number, outputPath: Option.Option<string>, force: boolean) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const fs = yield* FileSystem.FileSystem
    const pathService = yield* Path.Path
    const outPath = Option.getOrUndefined(outputPath)

    const result = yield* client.downloadDocument(id)
    const targetPath = outPath ?? pathService.join(process.cwd(), result.filename)

    // Check if file exists
    const exists = yield* fs.exists(targetPath)
    if (exists && !force) {
      return Envelope.error(
        'download',
        `File already exists: ${targetPath}`,
        'FileExists',
        'Use --force to overwrite.',
        [NextActions.getDocument(id)],
      )
    }

    yield* fs.writeFile(targetPath, result.content)

    return Envelope.success(
      'download',
      {
        document_id: id,
        filename: result.filename,
        path: targetPath,
        size_bytes: result.content.byteLength,
      },
      [NextActions.getDocument(id), NextActions.similarDocuments(id)],
    )
  })

export const download = Command.make(
  'download',
  { id: docIdArg, output: outputOption, force: forceOption },
  ({ id, output: outputPath, force }) => downloadHandler(id, outputPath, force).pipe(Effect.flatMap(Envelope.output)),
).pipe(Command.withDescription('Download document'))
