import { Schema } from 'effect'

export class Document extends Schema.Class<Document>('Document')({
  id: Schema.Number,
  title: Schema.String,
  content: Schema.String,
  correspondent: Schema.NullOr(Schema.Number),
  document_type: Schema.NullOr(Schema.Number),
  tags: Schema.Array(Schema.Number),
  created: Schema.String, // ISO date string
  created_date: Schema.String, // YYYY-MM-DD
  modified: Schema.String, // ISO date string
  added: Schema.String, // ISO date string
  archive_serial_number: Schema.NullOr(Schema.Number),
  original_file_name: Schema.String,
  archived_file_name: Schema.NullOr(Schema.String),
}) {}

export const DocumentList = Schema.Struct({
  count: Schema.Number,
  next: Schema.NullOr(Schema.String),
  previous: Schema.NullOr(Schema.String),
  results: Schema.Array(Document),
})
export type DocumentList = typeof DocumentList.Type

// For editing documents
export const EditDocumentInput = Schema.Struct({
  title: Schema.optional(Schema.String),
  correspondent: Schema.optional(Schema.NullOr(Schema.Number)),
  document_type: Schema.optional(Schema.NullOr(Schema.Number)),
  tags: Schema.optional(Schema.Array(Schema.Number)),
})
export type EditDocumentInput = typeof EditDocumentInput.Type
