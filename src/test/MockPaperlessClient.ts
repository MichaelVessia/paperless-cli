import { Effect, Layer } from 'effect'
import { PaperlessClient } from '../client/PaperlessClient.ts'
import { DocumentNotFound } from '../errors/index.ts'
import type { Document, Tag, Correspondent, DocumentType } from '../schema/index.ts'
import {
  sampleDocuments,
  sampleTags,
  sampleCorrespondents,
  sampleDocumentTypes,
  sampleStatistics,
  findDocumentById,
  findTagByName,
  findCorrespondentByName,
  findDocumentTypeByName,
} from './fixtures.ts'

// Mock implementation of PaperlessClient
export const MockPaperlessClient = Layer.succeed(PaperlessClient, {
  searchDocuments: (params) =>
    Effect.sync(() => {
      let results = [...sampleDocuments] as Document[]

      // Filter by query (simple content search)
      if (params.query) {
        const q = params.query.toLowerCase()
        results = results.filter((d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q))
      }

      // Filter by tags
      if (params.tags && params.tags.length > 0) {
        results = results.filter((d) => params.tags!.some((tagId) => d.tags.includes(tagId)))
      }

      // Filter by correspondent
      if (params.correspondent) {
        results = results.filter((d) => d.correspondent === params.correspondent)
      }

      // Filter by document type
      if (params.documentType) {
        results = results.filter((d) => d.document_type === params.documentType)
      }

      // Apply limit
      const limit = params.limit ?? 10
      results = results.slice(0, limit)

      return {
        count: results.length,
        next: null,
        previous: null,
        results,
      }
    }),

  getDocument: (id) =>
    Effect.gen(function* () {
      const doc = findDocumentById(id)
      if (!doc) {
        return yield* Effect.fail(new DocumentNotFound({ id }))
      }
      return doc as Document
    }),

  editDocument: (id, input) =>
    Effect.gen(function* () {
      const doc = findDocumentById(id)
      if (!doc) {
        return yield* Effect.fail(new DocumentNotFound({ id }))
      }
      // Return updated document (merge input)
      return {
        ...doc,
        ...input,
        modified: new Date().toISOString(),
      } as Document
    }),

  getSimilarDocuments: (id, limit = 5) =>
    Effect.sync(() => {
      // Return other documents (excluding the one with the given id)
      const results = sampleDocuments.filter((d) => d.id !== id).slice(0, limit) as Document[]
      return {
        count: results.length,
        next: null,
        previous: null,
        results,
      }
    }),

  listTags: () =>
    Effect.succeed({
      count: sampleTags.length,
      next: null,
      previous: null,
      results: [...sampleTags] as Tag[],
    }),

  findTagByName: (name) =>
    Effect.sync(() => {
      const tag = findTagByName(name)
      return tag ? (tag as Tag) : null
    }),

  createTag: (input) =>
    Effect.sync(
      (): Tag => ({
        id: Math.floor(Math.random() * 1000) + 100,
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        colour: input.colour ?? 1,
        text_color: '#ffffff',
        match: input.match ?? '',
        matching_algorithm: input.matching_algorithm ?? 1,
        is_inbox_tag: input.is_inbox_tag ?? false,
        is_insensitive: input.is_insensitive ?? true,
        document_count: 0,
      }),
    ),

  listCorrespondents: () =>
    Effect.succeed({
      count: sampleCorrespondents.length,
      next: null,
      previous: null,
      results: [...sampleCorrespondents] as Correspondent[],
    }),

  findCorrespondentByName: (name) =>
    Effect.sync(() => {
      const correspondent = findCorrespondentByName(name)
      return correspondent ? (correspondent as Correspondent) : null
    }),

  createCorrespondent: (input) =>
    Effect.sync(
      (): Correspondent => ({
        id: Math.floor(Math.random() * 1000) + 100,
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        match: input.match ?? '',
        matching_algorithm: input.matching_algorithm ?? 1,
        is_insensitive: input.is_insensitive ?? true,
        document_count: 0,
      }),
    ),

  listDocumentTypes: () =>
    Effect.succeed({
      count: sampleDocumentTypes.length,
      next: null,
      previous: null,
      results: [...sampleDocumentTypes] as DocumentType[],
    }),

  findDocumentTypeByName: (name) =>
    Effect.sync(() => {
      const docType = findDocumentTypeByName(name)
      return docType ? (docType as DocumentType) : null
    }),

  createDocumentType: (input) =>
    Effect.sync(
      (): DocumentType => ({
        id: Math.floor(Math.random() * 1000) + 100,
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        match: input.match ?? '',
        matching_algorithm: input.matching_algorithm ?? 1,
        is_insensitive: input.is_insensitive ?? true,
        document_count: 0,
      }),
    ),

  getStatistics: () => Effect.succeed(sampleStatistics),

  downloadDocument: (id) =>
    Effect.gen(function* () {
      const doc = findDocumentById(id)
      if (!doc) {
        return yield* Effect.fail(new DocumentNotFound({ id }))
      }
      // Return fake binary content
      const content = new TextEncoder().encode(`Mock PDF content for document ${id}`)
      return {
        content: new Uint8Array(content),
        filename: doc.original_file_name,
      }
    }),
})
