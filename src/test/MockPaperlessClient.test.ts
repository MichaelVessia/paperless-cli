import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { PaperlessClient } from '../client/PaperlessClient.ts'
import { MockPaperlessClient } from './MockPaperlessClient.ts'

describe('MockPaperlessClient', () => {
  it.effect('searchDocuments returns documents', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.searchDocuments({})
      expect(result.count).toBeGreaterThan(0)
      expect(result.results.length).toBeGreaterThan(0)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('searchDocuments filters by query', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.searchDocuments({ query: 'amazon' })
      expect(result.results.length).toBe(2) // Two Amazon documents
      expect(
        result.results.every(
          (d) => d.title.toLowerCase().includes('amazon') || d.content.toLowerCase().includes('amazon'),
        ),
      ).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('searchDocuments filters by correspondent', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.searchDocuments({ correspondent: 1 }) // Amazon
      expect(result.results.length).toBe(2)
      expect(result.results.every((d) => d.correspondent === 1)).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('getDocument returns document by id', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const doc = yield* client.getDocument(1)
      expect(doc.id).toBe(1)
      expect(doc.title).toBe('Amazon Order Confirmation')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('getDocument fails for non-existent id', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.getDocument(999).pipe(Effect.flip)
      expect(result._tag).toBe('DocumentNotFound')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('listTags returns all tags', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.listTags()
      expect(result.count).toBe(5)
      expect(result.results.length).toBe(5)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('findTagByName finds tag', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const tag = yield* client.findTagByName('tax')
      expect(tag).not.toBeNull()
      expect(tag!.name).toBe('tax')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('findTagByName returns null for non-existent tag', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const tag = yield* client.findTagByName('nonexistent')
      expect(tag).toBeNull()
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('getStatistics returns stats', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const stats = yield* client.getStatistics()
      expect(stats.documents_total).toBe(156)
      expect(stats.documents_inbox).toBe(5)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('downloadDocument returns content', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const result = yield* client.downloadDocument(1)
      expect(result.filename).toBe('amazon-order-123456789.pdf')
      expect(result.content.length).toBeGreaterThan(0)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
