import { Command, Options } from '@effect/cli'
import { FileSystem, Path } from '@effect/platform'
import { Console, Effect, Option } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { formatSuccess } from '../../format/output.ts'
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

export const download = Command.make(
  'download',
  { id: docIdArg, output: outputOption, force: forceOption },
  ({ id, output, force }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fs = yield* FileSystem.FileSystem
      const pathService = yield* Path.Path
      const outputPath = Option.getOrUndefined(output)

      const result = yield* client.downloadDocument(id)
      const targetPath = outputPath ?? pathService.join(process.cwd(), result.filename)

      // Check if file exists
      const exists = yield* fs.exists(targetPath)
      if (exists && !force) {
        yield* Console.error(`File already exists: ${targetPath}\nUse --force to overwrite.`)
        return
      }

      yield* fs.writeFile(targetPath, result.content)
      yield* Console.log(formatSuccess(`Downloaded to ${targetPath}`))
    }),
).pipe(Command.withDescription('Download document'))
