import { Args, Options } from '@effect/cli'

// Global options
export const jsonOption = Options.boolean('json').pipe(
  Options.withDescription('Output raw JSON'),
  Options.withDefault(false),
)

export const limitOption = Options.integer('limit').pipe(
  Options.withAlias('l'),
  Options.withDescription('Max results (default: 10)'),
  Options.withDefault(10),
)

export const allOption = Options.boolean('all').pipe(
  Options.withDescription('Return all results (no pagination)'),
  Options.withDefault(false),
)

export const countOption = Options.boolean('count').pipe(
  Options.withDescription('Only output result count'),
  Options.withDefault(false),
)

export const createOption = Options.boolean('create').pipe(
  Options.withDescription('Create correspondent/type if not found'),
  Options.withDefault(false),
)

// Filter options
export const tagFilterOption = Options.text('tag').pipe(
  Options.withAlias('t'),
  Options.withDescription('Filter by tag name (repeatable for AND)'),
  Options.repeated,
)

export const correspondentFilterOption = Options.text('correspondent').pipe(
  Options.withAlias('c'),
  Options.withDescription('Filter by correspondent name'),
  Options.optional,
)

export const typeFilterOption = Options.text('type').pipe(
  Options.withAlias('d'),
  Options.withDescription('Filter by document type name'),
  Options.optional,
)

export const afterOption = Options.text('after').pipe(
  Options.withDescription('Filter by created date after (YYYY-MM-DD)'),
  Options.optional,
)

export const beforeOption = Options.text('before').pipe(
  Options.withDescription('Filter by created date before (YYYY-MM-DD)'),
  Options.optional,
)

// Args
export const docIdArg = Args.integer({ name: 'id' })
export const tagNameArg = Args.text({ name: 'tag-name' })
export const nameArg = Args.text({ name: 'name' })
