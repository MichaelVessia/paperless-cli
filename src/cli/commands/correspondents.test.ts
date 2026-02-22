import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { correspondentsHandler, createCorrespondentHandler } from './correspondents.ts'

describe('correspondentsHandler', () => {
  it.effect('returns success envelope with correspondent list', () =>
    Effect.gen(function* () {
      const env = yield* correspondentsHandler()
      expect(env.ok).toBe(true)
      expect(env.command).toBe('correspondents')
      if (!env.ok) return
      expect(env.result.count).toBe(4)
      expect(env.result.correspondents.length).toBe(4)
      expect(env.result.correspondents[0]?.name).toBe('Amazon')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})

describe('createCorrespondentHandler', () => {
  it.effect('returns success envelope with created correspondent', () =>
    Effect.gen(function* () {
      const env = yield* createCorrespondentHandler('New Corp')
      expect(env.ok).toBe(true)
      expect(env.command).toBe('create-correspondent')
      if (!env.ok) return
      expect(env.result.name).toBe('New Corp')
      expect(env.result.id).toBeGreaterThan(0)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
