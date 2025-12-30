import { HelpDoc, ValidationError } from '@effect/cli'
import { Console, Effect } from 'effect'
import type { PaperlessClient, PaperlessClientError } from '../client/PaperlessClient.ts'
import { TagNotFound, AmbiguousMatch } from '../errors/index.ts'
import type { Tag, TagList } from '../schema/index.ts'

// Resolve tag name to Tag with fuzzy matching
export const resolveTag = (
  client: (typeof PaperlessClient)['Service'],
  tagName: string,
  cachedTags?: TagList,
): Effect.Effect<Tag, TagNotFound | AmbiguousMatch | PaperlessClientError> =>
  Effect.gen(function* () {
    // Try exact match first
    const foundTag = yield* client.findTagByName(tagName)
    if (foundTag) return foundTag

    // Fall back to partial match
    const allTags = cachedTags ?? (yield* client.listTags())
    const lowerName = tagName.toLowerCase()
    const matches = allTags.results.filter((t: Tag) => t.name.toLowerCase().includes(lowerName))

    if (matches.length === 1) return matches[0]!
    if (matches.length > 1) {
      return yield* Effect.fail(new AmbiguousMatch({ type: 'tag', matches: matches.map((t: Tag) => t.name) }))
    }
    return yield* Effect.fail(new TagNotFound({ name: tagName }))
  })

// Command options registry for better error messages
// Maps command name -> Set of valid flags (--name and -alias forms)
export const commandOptions: Record<string, Set<string>> = {
  search: new Set([
    '--tag',
    '-t',
    '--correspondent',
    '-c',
    '--type',
    '-d',
    '--after',
    '--before',
    '--limit',
    '-l',
    '--all',
    '--count',
    '--json',
  ]),
  list: new Set([
    '--inbox',
    '--tag',
    '-t',
    '--correspondent',
    '-c',
    '--type',
    '-d',
    '--after',
    '--before',
    '--limit',
    '-l',
    '--all',
    '--count',
    '--json',
  ]),
  get: new Set(['--content-only', '--max-length', '-m', '--json']),
  download: new Set(['--output', '-o', '--force', '-f']),
  similar: new Set(['--limit', '-l', '--json']),
  edit: new Set(['--title', '--correspondent', '--type', '--no-correspondent', '--no-type', '--create']),
  'add-tag': new Set(['--create']),
  'remove-tag': new Set([]),
  'create-tag': new Set([]),
  'create-correspondent': new Set([]),
  'create-type': new Set([]),
  tags: new Set(['--json']),
  correspondents: new Set(['--json']),
  types: new Set(['--json']),
  stats: new Set(['--json']),
}

// Helper to detect flag-after-positional errors and provide better messages
export const handleFlagOrderingError = (
  error: ValidationError.InvalidValue,
  argv: string[],
): Effect.Effect<void, never, never> | null => {
  const errorText = HelpDoc.toAnsiText(error.error)
  const match = errorText.match(/Received unknown argument: '(--?[a-zA-Z][-a-zA-Z0-9]*)(?:=.*)?'/)
  if (!match) return null

  const unknownFlag = match[1]!
  // Find command name from argv (skip executable and script name)
  const commandIdx = argv.findIndex((arg, i) => i >= 2 && !arg.startsWith('-') && commandOptions[arg])
  if (commandIdx === -1) return null

  const commandName = argv[commandIdx]!
  const validFlags = commandOptions[commandName]
  if (!validFlags || !validFlags.has(unknownFlag)) return null

  // Build corrected example by reordering arguments
  const args = argv.slice(commandIdx + 1)
  const flags: string[] = []
  const positional: string[] = []
  let expectingValue = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (expectingValue) {
      flags.push(arg)
      expectingValue = false
    } else if (arg.startsWith('--')) {
      flags.push(arg)
      // Check if this flag expects a value (not a boolean flag)
      if (
        !arg.includes('=') &&
        ![
          '--all',
          '--count',
          '--json',
          '--inbox',
          '--force',
          '--create',
          '--content-only',
          '--no-correspondent',
          '--no-type',
        ].includes(arg)
      ) {
        expectingValue = true
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      flags.push(arg)
      // Short flags that take values
      if (['-t', '-c', '-d', '-l', '-m', '-o'].includes(arg)) {
        expectingValue = true
      }
    } else {
      positional.push(arg)
    }
  }

  const correctedArgs = ['paperless-cli', commandName, ...flags, ...positional].join(' ')

  return Console.error(
    `Error: Flag '${unknownFlag}' must appear before positional arguments.\n` + `Hint: ${correctedArgs}`,
  )
}
