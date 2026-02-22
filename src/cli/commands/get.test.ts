import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { getHandler } from './get.ts'

describe('getHandler', () => {
  it.effect('returns success envelope with document detail', () =>
    Effect.gen(function* () {
      const env = yield* getHandler(1, 50000)
      expect(env.ok).toBe(true)
      expect(env.command).toBe('get')
      if (!env.ok) return
      expect(env.result.id).toBe(1)
      expect(env.result.title).toBe('Amazon Order Confirmation')
      expect(env.result.correspondent).toEqual({ id: 1, name: 'Amazon' })
      expect(env.result.document_type).toEqual({ id: 2, name: 'Receipt' })
      expect(env.result.tags).toEqual([{ id: 4, name: 'receipt' }])
      expect(env.result.content.truncated).toBe(false)
      expect(env.result.original_file_name).toBe('amazon-order-123456789.pdf')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('truncates content with max-length', () =>
    Effect.gen(function* () {
      const env = yield* getHandler(1, 20)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.content.truncated).toBe(true)
      expect(env.result.content.text.length).toBe(20)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions for document operations', () =>
    Effect.gen(function* () {
      const env = yield* getHandler(1, 50000)
      expect(env.next_actions.some((a) => a.command.includes('download'))).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('similar'))).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('edit'))).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('fails with DocumentNotFound for invalid ID', () =>
    Effect.gen(function* () {
      const result = yield* getHandler(999, 50000).pipe(Effect.either)
      expect(result._tag).toBe('Left')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
