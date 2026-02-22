import { describe, expect, it } from 'bun:test'
import { sampleDocuments, sampleTags, sampleCorrespondents, sampleDocumentTypes } from '../test/fixtures.ts'
import type { Document } from '../schema/index.ts'
import { toSummary, toDetail } from './document-result.ts'

describe('document-result', () => {
  describe('toSummary', () => {
    it('resolves correspondent, type, and tags by ID', () => {
      const doc = sampleDocuments[0] as Document
      const summary = toSummary(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)

      expect(summary.id).toBe(1)
      expect(summary.title).toBe('Amazon Order Confirmation')
      expect(summary.created_date).toBe('2024-01-15')
      expect(summary.correspondent).toEqual({ id: 1, name: 'Amazon' })
      expect(summary.document_type).toEqual({ id: 2, name: 'Receipt' })
      expect(summary.tags).toEqual([{ id: 4, name: 'receipt' }])
    })

    it('returns null for missing correspondent', () => {
      const doc = { ...sampleDocuments[0], correspondent: null } as Document
      const summary = toSummary(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)
      expect(summary.correspondent).toBeNull()
    })

    it('returns null for missing document type', () => {
      const doc = { ...sampleDocuments[0], document_type: null } as Document
      const summary = toSummary(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)
      expect(summary.document_type).toBeNull()
    })

    it('resolves multiple tags', () => {
      const doc = sampleDocuments[4] as Document // has tags [4, 5]
      const summary = toSummary(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)
      expect(summary.tags).toEqual([
        { id: 4, name: 'receipt' },
        { id: 5, name: 'reviewed' },
      ])
    })

    it('filters out unresolvable tag IDs', () => {
      const doc = { ...sampleDocuments[0], tags: [4, 999] } as Document
      const summary = toSummary(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)
      expect(summary.tags).toEqual([{ id: 4, name: 'receipt' }])
    })
  })

  describe('toDetail', () => {
    it('includes content with truncation info', () => {
      const doc = sampleDocuments[0] as Document
      const detail = toDetail(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)

      expect(detail.content.truncated).toBe(false)
      expect(detail.content.text).toBe(doc.content)
      expect(detail.content.original_length).toBe(doc.content.length)
    })

    it('truncates content when maxContentLength is set', () => {
      const doc = sampleDocuments[0] as Document
      const detail = toDetail(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes, 20)

      expect(detail.content.truncated).toBe(true)
      expect(detail.content.text.length).toBe(20)
      expect(detail.content.original_length).toBe(doc.content.length)
    })

    it('includes metadata fields', () => {
      const doc = sampleDocuments[1] as Document // W-2 form with archive_serial_number
      const detail = toDetail(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)

      expect(detail.added).toBe('2024-01-20T14:05:00Z')
      expect(detail.modified).toBe('2024-01-20T14:00:00Z')
      expect(detail.archive_serial_number).toBe(1001)
      expect(detail.original_file_name).toBe('w2-2023.pdf')
    })

    it('inherits resolved fields from summary', () => {
      const doc = sampleDocuments[0] as Document
      const detail = toDetail(doc, sampleTags, sampleCorrespondents, sampleDocumentTypes)

      expect(detail.correspondent).toEqual({ id: 1, name: 'Amazon' })
      expect(detail.document_type).toEqual({ id: 2, name: 'Receipt' })
      expect(detail.tags).toEqual([{ id: 4, name: 'receipt' }])
    })
  })
})
