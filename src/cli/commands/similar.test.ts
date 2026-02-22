import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { similarHandler } from './similar.ts'

describe('similarHandler', () => {
  it.effect('returns success envelope with similar documents', () =>
    Effect.gen(function* () {
      const env = yield* similarHandler(1, 5)
      expect(env.ok).toBe(true)
      expect(env.command).toBe('similar')
      if (!env.ok) return
      expect(env.result.source_id).toBe(1)
      expect(env.result.documents.length).toBe(4) // 5 total minus doc 1
      // Should not contain the source document
      expect(env.result.documents.every((d) => d.id !== 1)).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('respects limit', () =>
    Effect.gen(function* () {
      const env = yield* similarHandler(1, 2)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.documents.length).toBe(2)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('resolves documents with inline names', () =>
    Effect.gen(function* () {
      const env = yield* similarHandler(1, 5)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      const doc = env.result.documents.find((d) => d.id === 2)
      expect(doc?.correspondent).toEqual({ id: 3, name: 'Internal Revenue Service' })
      expect(doc?.document_type).toEqual({ id: 4, name: 'Tax Form' })
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions', () =>
    Effect.gen(function* () {
      const env = yield* similarHandler(1, 5)
      expect(env.next_actions.length).toBeGreaterThan(0)
      expect(env.next_actions[0]?.command).toContain('get')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
