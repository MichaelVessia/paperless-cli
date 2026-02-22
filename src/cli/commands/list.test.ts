import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect, Option } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { listHandler } from './list.ts'

const defaultArgs = {
  inbox: false,
  tag: [] as readonly string[],
  correspondent: Option.none<string>(),
  type: Option.none<string>(),
  after: Option.none<string>(),
  before: Option.none<string>(),
  limit: 10,
  all: false,
}

describe('listHandler', () => {
  it.effect('returns success envelope with all documents', () =>
    Effect.gen(function* () {
      const env = yield* listHandler(defaultArgs)
      expect(env.ok).toBe(true)
      expect(env.command).toBe('list')
      if (!env.ok) return
      expect(env.result.count).toBe(5)
      expect(env.result.documents.length).toBe(5)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('resolves documents with inline names', () =>
    Effect.gen(function* () {
      const env = yield* listHandler(defaultArgs)
      expect(env.ok).toBe(true)
      if (!env.ok) return
      const doc = env.result.documents[0]
      expect(doc?.correspondent).toEqual({ id: 1, name: 'Amazon' })
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('filters by inbox', () =>
    Effect.gen(function* () {
      const env = yield* listHandler({ ...defaultArgs, inbox: true })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.documents.every((d) => d.tags.some((t) => t.name === 'inbox'))).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error envelope for unknown tag', () =>
    Effect.gen(function* () {
      const env = yield* listHandler({ ...defaultArgs, tag: ['nonexistent'] })
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('TagNotFound')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions', () =>
    Effect.gen(function* () {
      const env = yield* listHandler(defaultArgs)
      expect(env.next_actions.length).toBeGreaterThan(0)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
