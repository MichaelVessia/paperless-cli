import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { statsHandler } from './stats.ts'

describe('statsHandler', () => {
  it.effect('returns success envelope with statistics', () =>
    Effect.gen(function* () {
      const env = yield* statsHandler()
      expect(env.ok).toBe(true)
      expect(env.command).toBe('stats')
      if (!env.ok) return
      expect(env.result.documents_total).toBe(156)
      expect(env.result.documents_inbox).toBe(5)
      expect(env.result.character_count).toBe(1250000)
      expect(env.result.document_file_type_counts.length).toBe(3)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes next_actions', () =>
    Effect.gen(function* () {
      const env = yield* statsHandler()
      expect(env.next_actions.length).toBeGreaterThan(0)
      expect(env.next_actions.some((a) => a.command.includes('search'))).toBe(true)
      expect(env.next_actions.some((a) => a.command.includes('tags'))).toBe(true)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
