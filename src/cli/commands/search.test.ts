import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect, Option } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { searchHandler } from './search.ts'

const defaultArgs = {
  query: Option.none<string>(),
  tag: [] as readonly string[],
  correspondent: Option.none<string>(),
  type: Option.none<string>(),
  after: Option.none<string>(),
  before: Option.none<string>(),
  limit: 10,
  all: false,
}

describe('searchHandler', () => {
  it.effect('returns success envelope with all documents when no filters', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler(defaultArgs)
      expect(env.ok).toBe(true)
      expect(env.command).toBe('search')
      if (!env.ok) return
      expect(env.result.count).toBe(5)
      expect(env.result.documents.length).toBe(5)
      expect(env.result.documents[0]?.title).toBe('Amazon Order Confirmation')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('filters by query', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({ ...defaultArgs, query: Option.some('W-2') })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.documents.length).toBe(1)
      expect(env.result.documents[0]?.title).toBe('2023 W-2 Form')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('resolves documents with inline names', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler(defaultArgs)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      const doc = env.result.documents[0]
      expect(doc?.correspondent).toEqual({ id: 1, name: 'Amazon' })
      expect(doc?.document_type).toEqual({ id: 2, name: 'Receipt' })
      expect(doc?.tags).toEqual([{ id: 4, name: 'receipt' }])
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('filters by tag name', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({ ...defaultArgs, tag: ['tax'] })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.documents.length).toBe(1)
      expect(env.result.documents[0]?.title).toBe('2023 W-2 Form')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error envelope for unknown tag', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({ ...defaultArgs, tag: ['nonexistent'] })
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('TagNotFound')
      expect(env.error.message).toContain('nonexistent')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error envelope for unknown correspondent', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({
        ...defaultArgs,
        correspondent: Option.some('NonexistentCorp'),
      })
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('CorrespondentNotFound')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error envelope for unknown document type', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({
        ...defaultArgs,
        type: Option.some('NonexistentType'),
      })
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('DocumentTypeNotFound')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions pointing to result documents', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler(defaultArgs)
      expect(env.ok).toBe(true)
      expect(env.next_actions.length).toBeGreaterThan(0)
      expect(env.next_actions[0]?.command).toContain('get')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('respects limit', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({ ...defaultArgs, limit: 2 })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.documents.length).toBe(2)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('filters by correspondent name', () =>
    Effect.gen(function* () {
      const env = yield* searchHandler({
        ...defaultArgs,
        correspondent: Option.some('Amazon'),
      })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.documents.every((d) => d.correspondent?.name === 'Amazon')).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
