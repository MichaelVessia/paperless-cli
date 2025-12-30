import { Schema } from 'effect'
import { MatchingAlgorithm } from './Tag.ts'

export class Correspondent extends Schema.Class<Correspondent>('Correspondent')({
  id: Schema.Number,
  name: Schema.String,
  slug: Schema.String,
  match: Schema.String,
  matching_algorithm: MatchingAlgorithm,
  is_insensitive: Schema.Boolean,
  document_count: Schema.Number,
}) {}

export const CorrespondentList = Schema.Struct({
  count: Schema.Number,
  next: Schema.NullOr(Schema.String),
  previous: Schema.NullOr(Schema.String),
  results: Schema.Array(Correspondent),
})
export type CorrespondentList = typeof CorrespondentList.Type

// For creating correspondents
export const CreateCorrespondentInput = Schema.Struct({
  name: Schema.String,
  match: Schema.optional(Schema.String),
  matching_algorithm: Schema.optional(MatchingAlgorithm),
  is_insensitive: Schema.optional(Schema.Boolean),
})
export type CreateCorrespondentInput = typeof CreateCorrespondentInput.Type
