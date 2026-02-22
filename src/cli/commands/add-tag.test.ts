import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { addTagHandler } from './add-tag.ts'

describe('addTagHandler', () => {
  it.effect('adds tag to document', () =>
    Effect.gen(function* () {
      const env = yield* addTagHandler(1, 'tax', false)
      expect(env.ok).toBe(true)
      expect(env.command).toBe('add-tag')
      if (!env.ok) return
      expect(env.result.document_id).toBe(1)
      expect(env.result.tag).toEqual({ id: 2, name: 'tax' })
      expect(env.result.already_had_tag).toBe(false)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('detects already present tag', () =>
    Effect.gen(function* () {
      // Doc 1 has tag 4 (receipt)
      const env = yield* addTagHandler(1, 'receipt', false)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.already_had_tag).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error envelope for ambiguous tag', () =>
    Effect.gen(function* () {
      // "re" matches both "receipt" and "reviewed"
      const env = yield* addTagHandler(1, 're', false)
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('AmbiguousMatch')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('creates tag with --create when not found', () =>
    Effect.gen(function* () {
      const env = yield* addTagHandler(1, 'brand-new-tag', true)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.tag.name).toBe('brand-new-tag')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('fails with TagNotFound without --create', () =>
    Effect.gen(function* () {
      const result = yield* addTagHandler(1, 'nonexistent-tag', false).pipe(Effect.either)
      expect(result._tag).toBe('Left')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions', () =>
    Effect.gen(function* () {
      const env = yield* addTagHandler(1, 'tax', false)
      expect(env.ok).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('get'))).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('remove-tag'))).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
