import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { PaperlessClient } from '../../client/PaperlessClient.ts'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'

describe('uploadDocument', () => {
  it.effect('returns task UUID', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // PDF magic bytes
      const result = yield* client.uploadDocument(fileContent, 'test.pdf')
      expect(result).toBe('mock-task-uuid-12345')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('accepts title option', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      const result = yield* client.uploadDocument(fileContent, 'test.pdf', {
        title: 'Test Document',
      })
      expect(result).toBe('mock-task-uuid-12345')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('accepts correspondent option', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      const result = yield* client.uploadDocument(fileContent, 'test.pdf', {
        correspondent: 1,
      })
      expect(result).toBe('mock-task-uuid-12345')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('accepts documentType option', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      const result = yield* client.uploadDocument(fileContent, 'test.pdf', {
        documentType: 2,
      })
      expect(result).toBe('mock-task-uuid-12345')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('accepts tags option', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      const result = yield* client.uploadDocument(fileContent, 'test.pdf', {
        tags: [1, 2, 3],
      })
      expect(result).toBe('mock-task-uuid-12345')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('accepts all options together', () =>
    Effect.gen(function* () {
      const client = yield* PaperlessClient
      const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      const result = yield* client.uploadDocument(fileContent, 'invoice.pdf', {
        title: 'Amazon Invoice',
        correspondent: 1,
        documentType: 2,
        tags: [1, 3],
      })
      expect(result).toBe('mock-task-uuid-12345')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
