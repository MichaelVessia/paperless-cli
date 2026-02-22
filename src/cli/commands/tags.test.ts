import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { tagsHandler, createTagHandler } from './tags.ts'

describe('tagsHandler', () => {
  it.effect('returns success envelope with tag list', () =>
    Effect.gen(function* () {
      const env = yield* tagsHandler()
      expect(env.ok).toBe(true)
      expect(env.command).toBe('tags')
      if (!env.ok) return
      expect(env.result.count).toBe(5)
      expect(env.result.tags.length).toBe(5)
      expect(env.result.tags[0]?.name).toBe('inbox')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})

describe('createTagHandler', () => {
  it.effect('returns success envelope with created tag', () =>
    Effect.gen(function* () {
      const env = yield* createTagHandler('new-tag')
      expect(env.ok).toBe(true)
      expect(env.command).toBe('create-tag')
      if (!env.ok) return
      expect(env.result.name).toBe('new-tag')
      expect(env.result.id).toBeGreaterThan(0)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
