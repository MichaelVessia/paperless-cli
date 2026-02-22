import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { removeTagHandler } from './remove-tag.ts'

describe('removeTagHandler', () => {
  it.effect('removes tag from document', () =>
    Effect.gen(function* () {
      // Doc 1 has tag 4 (receipt)
      const env = yield* removeTagHandler(1, 'receipt')
      expect(env.ok).toBe(true)
      expect(env.command).toBe('remove-tag')
      if (!env.ok) return
      expect(env.result.document_id).toBe(1)
      expect(env.result.tag).toEqual({ id: 4, name: 'receipt' })
      expect(env.result.was_present).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('reports was_present false for tag not on document', () =>
    Effect.gen(function* () {
      // Doc 1 does not have tag 2 (tax)
      const env = yield* removeTagHandler(1, 'tax')
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.was_present).toBe(false)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error envelope for ambiguous tag', () =>
    Effect.gen(function* () {
      const env = yield* removeTagHandler(1, 're')
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('AmbiguousMatch')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('fails with TagNotFound for unknown tag', () =>
    Effect.gen(function* () {
      const result = yield* removeTagHandler(1, 'nonexistent').pipe(Effect.either)
      expect(result._tag).toBe('Left')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions', () =>
    Effect.gen(function* () {
      const env = yield* removeTagHandler(1, 'receipt')
      expect(env.ok).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('get'))).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('add-tag'))).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
