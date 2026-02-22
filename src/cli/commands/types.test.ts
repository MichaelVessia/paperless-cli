import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { typesHandler, createTypeHandler } from './types.ts'

describe('typesHandler', () => {
  it.effect('returns success envelope with document type list', () =>
    Effect.gen(function* () {
      const env = yield* typesHandler()
      expect(env.ok).toBe(true)
      expect(env.command).toBe('types')
      if (!env.ok) return
      expect(env.result.count).toBe(4)
      expect(env.result.document_types.length).toBe(4)
      expect(env.result.document_types[0]?.name).toBe('Invoice')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})

describe('createTypeHandler', () => {
  it.effect('returns success envelope with created type', () =>
    Effect.gen(function* () {
      const env = yield* createTypeHandler('New Type')
      expect(env.ok).toBe(true)
      expect(env.command).toBe('create-type')
      if (!env.ok) return
      expect(env.result.name).toBe('New Type')
      expect(env.result.id).toBeGreaterThan(0)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
