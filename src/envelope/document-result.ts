import type { Correspondent, Document, DocumentType, Tag } from '../schema/index.ts'
import { truncateContent } from './truncate.ts'

export interface ResolvedCorrespondent {
  readonly id: number
  readonly name: string
}

export interface ResolvedTag {
  readonly id: number
  readonly name: string
}

export interface ResolvedDocumentType {
  readonly id: number
  readonly name: string
}

export interface DocumentSummary {
  readonly id: number
  readonly title: string
  readonly created_date: string
  readonly correspondent: ResolvedCorrespondent | null
  readonly document_type: ResolvedDocumentType | null
  readonly tags: readonly ResolvedTag[]
}

export interface DocumentDetail extends DocumentSummary {
  readonly content: { readonly text: string; readonly truncated: boolean; readonly original_length: number }
  readonly added: string
  readonly modified: string
  readonly archive_serial_number: number | null
  readonly original_file_name: string
}

/** Resolve a document to a summary with inline names. */
export const toSummary = (
  doc: Document,
  allTags: readonly Tag[],
  allCorrespondents: readonly Correspondent[],
  allDocumentTypes: readonly DocumentType[],
): DocumentSummary => {
  const correspondent = doc.correspondent ? resolveCorrespondent(doc.correspondent, allCorrespondents) : null

  const documentType = doc.document_type ? resolveDocumentType(doc.document_type, allDocumentTypes) : null

  const tags = doc.tags.map((tagId) => resolveTagById(tagId, allTags)).filter(isNonNull)

  return {
    id: doc.id,
    title: doc.title,
    created_date: doc.created_date,
    correspondent,
    document_type: documentType,
    tags,
  }
}

/** Resolve a document to a detail view with content truncation. */
export const toDetail = (
  doc: Document,
  allTags: readonly Tag[],
  allCorrespondents: readonly Correspondent[],
  allDocumentTypes: readonly DocumentType[],
  maxContentLength?: number,
): DocumentDetail => {
  const summary = toSummary(doc, allTags, allCorrespondents, allDocumentTypes)
  const content = truncateContent(doc.content, maxContentLength)

  return {
    ...summary,
    content,
    added: doc.added,
    modified: doc.modified,
    archive_serial_number: doc.archive_serial_number,
    original_file_name: doc.original_file_name,
  }
}

const resolveCorrespondent = (id: number, all: readonly Correspondent[]): ResolvedCorrespondent | null => {
  const found = all.find((c) => c.id === id)
  return found ? { id: found.id, name: found.name } : null
}

const resolveDocumentType = (id: number, all: readonly DocumentType[]): ResolvedDocumentType | null => {
  const found = all.find((dt) => dt.id === id)
  return found ? { id: found.id, name: found.name } : null
}

const resolveTagById = (id: number, all: readonly Tag[]): ResolvedTag | null => {
  const found = all.find((t) => t.id === id)
  return found ? { id: found.id, name: found.name } : null
}

const isNonNull = <T>(value: T | null): value is T => value !== null
