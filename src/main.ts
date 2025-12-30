import { Args, Command, HelpDoc, Options, ValidationError } from '@effect/cli'
import { FileSystem, FetchHttpClient, Path } from '@effect/platform'
import { BunContext, BunRuntime } from '@effect/platform-bun'
import { Console, Effect, Layer, Option } from 'effect'
import { PaperlessClient, PaperlessClientLive, PaperlessConfigFromEnv } from './client/PaperlessClient.ts'
import { TagNotFound, AmbiguousMatch } from './errors/index.ts'
import {
  formatStatistics,
  formatTagList,
  formatCorrespondentList,
  formatDocumentTypeList,
  formatDocumentList,
  formatDocumentFull,
  formatSuccess,
} from './format/output.ts'
import type { Tag, TagList } from './schema/index.ts'
import type { PaperlessClientError } from './client/PaperlessClient.ts'

// Resolve tag name to Tag with fuzzy matching
const resolveTag = (
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
const commandOptions: Record<string, Set<string>> = {
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
const handleFlagOrderingError = (
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

// Global options
const jsonOption = Options.boolean('json').pipe(Options.withDescription('Output raw JSON'), Options.withDefault(false))

// Stats command
const stats = Command.make('stats', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.getStatistics()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatStatistics(result))
    }
  }),
).pipe(Command.withDescription('Show system statistics'))

// Tags command
const tags = Command.make('tags', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listTags()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatTagList(result.results))
    }
  }),
).pipe(Command.withDescription('List all tags'))

// Correspondents command
const correspondents = Command.make('correspondents', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listCorrespondents()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatCorrespondentList(result.results))
    }
  }),
).pipe(Command.withDescription('List all correspondents'))

// Types command
const types = Command.make('types', { json: jsonOption }, ({ json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.listDocumentTypes()

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else {
      yield* Console.log(formatDocumentTypeList(result.results))
    }
  }),
).pipe(Command.withDescription('List all document types'))

// Create tag command
const createTagName = Args.text({ name: 'name' })
const createTag = Command.make('create-tag', { name: createTagName }, ({ name }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const tag = yield* client.createTag({ name })
    yield* Console.log(formatSuccess(`Created tag "${tag.name}" (id: ${tag.id})`))
  }),
).pipe(Command.withDescription('Create a new tag'))

// Create correspondent command
const createCorrespondentName = Args.text({ name: 'name' })
const createCorrespondent = Command.make('create-correspondent', { name: createCorrespondentName }, ({ name }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const correspondent = yield* client.createCorrespondent({ name })
    yield* Console.log(formatSuccess(`Created correspondent "${correspondent.name}" (id: ${correspondent.id})`))
  }),
).pipe(Command.withDescription('Create a new correspondent'))

// Create type command
const createTypeName = Args.text({ name: 'name' })
const createType = Command.make('create-type', { name: createTypeName }, ({ name }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const docType = yield* client.createDocumentType({ name })
    yield* Console.log(formatSuccess(`Created document type "${docType.name}" (id: ${docType.id})`))
  }),
).pipe(Command.withDescription('Create a new document type'))

// Search command
const searchQuery = Args.text({ name: 'query' }).pipe(Args.optional)
const searchTagOption = Options.text('tag').pipe(
  Options.withAlias('t'),
  Options.withDescription('Filter by tag name (repeatable for AND)'),
  Options.repeated,
)
const searchCorrespondentOption = Options.text('correspondent').pipe(
  Options.withAlias('c'),
  Options.withDescription('Filter by correspondent name'),
  Options.optional,
)
const searchTypeOption = Options.text('type').pipe(
  Options.withAlias('d'),
  Options.withDescription('Filter by document type name'),
  Options.optional,
)
const limitOption = Options.integer('limit').pipe(
  Options.withAlias('l'),
  Options.withDescription('Max results (default: 10)'),
  Options.withDefault(10),
)
const afterOption = Options.text('after').pipe(
  Options.withDescription('Filter by created date after (YYYY-MM-DD)'),
  Options.optional,
)
const beforeOption = Options.text('before').pipe(
  Options.withDescription('Filter by created date before (YYYY-MM-DD)'),
  Options.optional,
)
const countOption = Options.boolean('count').pipe(
  Options.withDescription('Only output result count'),
  Options.withDefault(false),
)
const allOption = Options.boolean('all').pipe(
  Options.withDescription('Return all results (no pagination)'),
  Options.withDefault(false),
)

const search = Command.make(
  'search',
  {
    query: searchQuery,
    tag: searchTagOption,
    correspondent: searchCorrespondentOption,
    type: searchTypeOption,
    after: afterOption,
    before: beforeOption,
    limit: limitOption,
    all: allOption,
    count: countOption,
    json: jsonOption,
  },
  ({ query, tag: tagNames, correspondent, type, after, before, limit, all, count, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const correspondentName = Option.getOrUndefined(correspondent)
      const typeName = Option.getOrUndefined(type)
      const queryStr = Option.getOrUndefined(query)

      // Resolve tag names to IDs
      const tagIds: number[] = []
      for (const tagName of tagNames) {
        const result = yield* resolveTag(client, tagName).pipe(
          Effect.mapError((e) =>
            e._tag === 'AmbiguousMatch'
              ? `Tag "${tagName}" is ambiguous. Matches: ${e.matches.join(', ')}`
              : `Tag not found: ${tagName}`,
          ),
          Effect.either,
        )
        if (result._tag === 'Left') {
          yield* Console.error(result.left)
          return
        }
        tagIds.push(result.right.id)
      }

      // Resolve correspondent name to ID
      let correspondentId: number | undefined
      if (correspondentName) {
        const found = yield* client.findCorrespondentByName(correspondentName)
        if (!found) {
          yield* Console.error(`Correspondent not found: ${correspondentName}`)
          return
        }
        correspondentId = found.id
      }

      // Resolve type name to ID
      let typeId: number | undefined
      if (typeName) {
        const found = yield* client.findDocumentTypeByName(typeName)
        if (!found) {
          yield* Console.error(`Document type not found: ${typeName}`)
          return
        }
        typeId = found.id
      }

      const afterDate = Option.getOrUndefined(after)
      const beforeDate = Option.getOrUndefined(before)
      const effectiveLimit = all ? 10000 : limit
      const searchParams: Parameters<typeof client.searchDocuments>[0] = { limit: effectiveLimit }
      if (queryStr) searchParams.query = queryStr
      if (tagIds.length > 0) searchParams.tags = tagIds
      if (correspondentId !== undefined) searchParams.correspondent = correspondentId
      if (typeId !== undefined) searchParams.documentType = typeId
      if (afterDate) searchParams.createdAfter = afterDate
      if (beforeDate) searchParams.createdBefore = beforeDate
      const result = yield* client.searchDocuments(searchParams)

      if (count) {
        yield* Console.log(String(result.count))
      } else if (json) {
        yield* Console.log(JSON.stringify(result, null, 2))
      } else if (result.results.length === 0) {
        // Empty results - no output per spec
      } else {
        const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
          client.listTags(),
          client.listCorrespondents(),
          client.listDocumentTypes(),
        ])
        yield* Console.log(
          formatDocumentList(result.results, {
            tags: tagsResult.results,
            correspondents: corrsResult.results,
            documentTypes: typesResult.results,
            showPreview: true,
          }),
        )
      }
    }),
).pipe(Command.withDescription('Search documents'))

// List command
const inboxOption = Options.boolean('inbox').pipe(
  Options.withDescription('Show only inbox documents'),
  Options.withDefault(false),
)

const list = Command.make(
  'list',
  {
    inbox: inboxOption,
    tag: searchTagOption,
    correspondent: searchCorrespondentOption,
    type: searchTypeOption,
    after: afterOption,
    before: beforeOption,
    limit: limitOption,
    all: allOption,
    count: countOption,
    json: jsonOption,
  },
  ({ inbox, tag: tagNames, correspondent, type, after, before, limit, all, count, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const correspondentName = Option.getOrUndefined(correspondent)
      const typeName = Option.getOrUndefined(type)

      // Get inbox tag if needed
      const tagIds: number[] = []
      let allTags: typeof import('./schema/index.ts').TagList.Type | undefined
      if (inbox) {
        allTags = yield* client.listTags()
        const inboxTag = allTags.results.find((t) => t.is_inbox_tag)
        if (inboxTag) tagIds.push(inboxTag.id)
      }

      // Resolve tag names to IDs
      for (const tagName of tagNames) {
        const result = yield* resolveTag(client, tagName, allTags).pipe(
          Effect.mapError((e) =>
            e._tag === 'AmbiguousMatch'
              ? `Tag "${tagName}" is ambiguous. Matches: ${e.matches.join(', ')}`
              : `Tag not found: ${tagName}`,
          ),
          Effect.either,
        )
        if (result._tag === 'Left') {
          yield* Console.error(result.left)
          return
        }
        tagIds.push(result.right.id)
      }

      // Resolve correspondent name to ID
      let correspondentId: number | undefined
      if (correspondentName) {
        const found = yield* client.findCorrespondentByName(correspondentName)
        if (!found) {
          yield* Console.error(`Correspondent not found: ${correspondentName}`)
          return
        }
        correspondentId = found.id
      }

      // Resolve type name to ID
      let typeId: number | undefined
      if (typeName) {
        const found = yield* client.findDocumentTypeByName(typeName)
        if (!found) {
          yield* Console.error(`Document type not found: ${typeName}`)
          return
        }
        typeId = found.id
      }

      const afterDate = Option.getOrUndefined(after)
      const beforeDate = Option.getOrUndefined(before)
      const effectiveLimit = all ? 10000 : limit
      const listParams: Parameters<typeof client.searchDocuments>[0] = {
        ordering: '-added',
        limit: effectiveLimit,
      }
      if (tagIds.length > 0) listParams.tags = tagIds
      if (correspondentId !== undefined) listParams.correspondent = correspondentId
      if (typeId !== undefined) listParams.documentType = typeId
      if (afterDate) listParams.createdAfter = afterDate
      if (beforeDate) listParams.createdBefore = beforeDate
      const result = yield* client.searchDocuments(listParams)

      if (count) {
        yield* Console.log(String(result.count))
      } else if (json) {
        yield* Console.log(JSON.stringify(result, null, 2))
      } else if (result.results.length === 0) {
        yield* Console.log('No documents found.')
      } else {
        const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
          client.listTags(),
          client.listCorrespondents(),
          client.listDocumentTypes(),
        ])
        yield* Console.log(
          formatDocumentList(result.results, {
            tags: tagsResult.results,
            correspondents: corrsResult.results,
            documentTypes: typesResult.results,
          }),
        )
      }
    }),
).pipe(Command.withDescription('List recent documents'))

// Get command
const docIdArg = Args.integer({ name: 'id' })
const contentOnlyOption = Options.boolean('content-only').pipe(
  Options.withDescription('Only output document text'),
  Options.withDefault(false),
)
const maxLengthOption = Options.integer('max-length').pipe(
  Options.withAlias('m'),
  Options.withDescription('Truncate content (default: 50000)'),
  Options.withDefault(50000),
)

const get = Command.make(
  'get',
  {
    id: docIdArg,
    contentOnly: contentOnlyOption,
    maxLength: maxLengthOption,
    json: jsonOption,
  },
  ({ id, contentOnly, maxLength, json }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const doc = yield* client.getDocument(id)

      if (json) {
        yield* Console.log(JSON.stringify(doc, null, 2))
      } else if (contentOnly) {
        yield* Console.log(doc.content)
      } else {
        const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
          client.listTags(),
          client.listCorrespondents(),
          client.listDocumentTypes(),
        ])
        yield* Console.log(
          formatDocumentFull(doc, {
            tags: tagsResult.results,
            correspondents: corrsResult.results,
            documentTypes: typesResult.results,
            maxContentLength: maxLength,
          }),
        )
      }
    }),
).pipe(Command.withDescription('Get document details'))

// Download command
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

const download = Command.make(
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

// Similar command
const similar = Command.make('similar', { id: docIdArg, limit: limitOption, json: jsonOption }, ({ id, limit, json }) =>
  Effect.gen(function* () {
    const client = yield* PaperlessClient
    const result = yield* client.getSimilarDocuments(id, limit)

    if (json) {
      yield* Console.log(JSON.stringify(result, null, 2))
    } else if (result.results.length === 0) {
      yield* Console.log('No similar documents found.')
    } else {
      const [tagsResult, corrsResult, typesResult] = yield* Effect.all([
        client.listTags(),
        client.listCorrespondents(),
        client.listDocumentTypes(),
      ])
      yield* Console.log(
        formatDocumentList(result.results, {
          tags: tagsResult.results,
          correspondents: corrsResult.results,
          documentTypes: typesResult.results,
        }),
      )
    }
  }),
).pipe(Command.withDescription('Find similar documents'))

// Edit command
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
const createOption = Options.boolean('create').pipe(
  Options.withDescription('Create correspondent/type if not found'),
  Options.withDefault(false),
)

const edit = Command.make(
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

// Add-tag command
const tagNameArg = Args.text({ name: 'tag-name' })

const addTag = Command.make(
  'add-tag',
  { id: docIdArg, tagName: tagNameArg, create: createOption },
  ({ id, tagName, create }) =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient

      // Find tag (with fuzzy matching)
      const tagResult = yield* resolveTag(client, tagName).pipe(Effect.either)
      let tag: Tag
      if (tagResult._tag === 'Left') {
        const err = tagResult.left
        if (err._tag === 'AmbiguousMatch') {
          yield* Console.error(`Tag "${tagName}" is ambiguous. Matches: ${err.matches.join(', ')}`)
          return
        }
        if (create) {
          tag = yield* client.createTag({ name: tagName })
          yield* Console.log(`Created tag "${tagName}"`)
        } else {
          return yield* Effect.fail(err)
        }
      } else {
        tag = tagResult.right
      }

      // Get document and add tag
      const doc = yield* client.getDocument(id)
      if (!doc.tags.includes(tag.id)) {
        yield* client.editDocument(id, { tags: [...doc.tags, tag.id] })
      }
      yield* Console.log(formatSuccess(`Added tag "${tag.name}" to document ${id}`))
    }),
).pipe(Command.withDescription('Add tag to document'))

// Remove-tag command
const removeTag = Command.make('remove-tag', { id: docIdArg, tagName: tagNameArg }, ({ id, tagName }) =>
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

// Main command with subcommands
const mainCommand = Command.make('paperless-cli').pipe(
  Command.withDescription('CLI for Paperless-ngx document management'),
  Command.withSubcommands([
    search,
    list,
    get,
    download,
    similar,
    edit,
    addTag,
    removeTag,
    createTag,
    createCorrespondent,
    createType,
    tags,
    correspondents,
    types,
    stats,
  ]),
)

// Layer composition
const ClientLayer = PaperlessClientLive.pipe(
  Layer.provide(PaperlessConfigFromEnv),
  Layer.provide(FetchHttpClient.layer),
)

const MainLayer = Layer.mergeAll(ClientLayer, BunContext.layer)

// Run CLI
const cli = Command.run(mainCommand, {
  name: 'paperless-cli',
  version: '0.1.0',
})

cli(process.argv).pipe(
  Effect.provide(MainLayer),
  Effect.catchTag('InvalidValue', (e) => {
    const betterError = handleFlagOrderingError(e, process.argv)
    return betterError ?? Effect.fail(e)
  }),
  Effect.catchTag('MissingCredentials', () =>
    Console.error('Error: PAPERLESS_URL and PAPERLESS_TOKEN environment variables are required'),
  ),
  BunRuntime.runMain,
)
