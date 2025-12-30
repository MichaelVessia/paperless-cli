import { Schema } from 'effect'

// Matching algorithms used for auto-assignment
export const MatchingAlgorithm = Schema.Literal(
  0, // none
  1, // any
  2, // all
  3, // literal
  4, // regex
  5, // fuzzy
  6, // auto
)
export type MatchingAlgorithm = typeof MatchingAlgorithm.Type

export class Tag extends Schema.Class<Tag>('Tag')({
  id: Schema.Number,
  name: Schema.String,
  slug: Schema.String,
  colour: Schema.Number,
  text_color: Schema.optionalWith(Schema.String, { default: () => '#ffffff' }),
  match: Schema.String,
  matching_algorithm: MatchingAlgorithm,
  is_inbox_tag: Schema.Boolean,
  is_insensitive: Schema.Boolean,
  document_count: Schema.optionalWith(Schema.Number, { default: () => 0 }),
}) {}

export const TagList = Schema.Struct({
  count: Schema.Number,
  next: Schema.NullOr(Schema.String),
  previous: Schema.NullOr(Schema.String),
  results: Schema.Array(Tag),
})
export type TagList = typeof TagList.Type

// For creating tags
export const CreateTagInput = Schema.Struct({
  name: Schema.String,
  colour: Schema.optional(Schema.Number),
  is_inbox_tag: Schema.optional(Schema.Boolean),
  match: Schema.optional(Schema.String),
  matching_algorithm: Schema.optional(MatchingAlgorithm),
  is_insensitive: Schema.optional(Schema.Boolean),
})
export type CreateTagInput = typeof CreateTagInput.Type
