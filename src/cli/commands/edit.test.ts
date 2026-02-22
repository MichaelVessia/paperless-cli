import { describe, expect, it } from '@codeforbreakfast/bun-test-effect'
import { Effect, Option } from 'effect'
import { MockPaperlessClient } from '../../test/MockPaperlessClient.ts'
import { editHandler } from './edit.ts'

const defaultArgs = {
  id: 1,
  title: Option.none<string>(),
  correspondent: Option.none<string>(),
  type: Option.none<string>(),
  noCorrespondent: false,
  noType: false,
  create: false,
}

describe('editHandler', () => {
  it.effect('returns error when no fields specified', () =>
    Effect.gen(function* () {
      const env = yield* editHandler(defaultArgs)
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('InvalidValue')
      expect(env.error.message).toContain('At least one field')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('updates title', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({ ...defaultArgs, title: Option.some('New Title') })
      expect(env.ok).toBe(true)
      expect(env.command).toBe('edit')
      if (!env.ok) return
      expect(env.result.id).toBe(1)
      expect(env.result.updated_fields).toEqual(['title'])
      expect(env.result.document.id).toBe(1)
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('updates correspondent by name', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({
        ...defaultArgs,
        correspondent: Option.some('Amazon'),
      })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.updated_fields).toEqual(['correspondent'])
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error for unknown correspondent without --create', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({
        ...defaultArgs,
        correspondent: Option.some('Unknown Corp'),
      })
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('CorrespondentNotFound')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('creates correspondent with --create', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({
        ...defaultArgs,
        correspondent: Option.some('New Corp'),
        create: true,
      })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.updated_fields).toEqual(['correspondent'])
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('clears correspondent with --no-correspondent', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({ ...defaultArgs, noCorrespondent: true })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.updated_fields).toEqual(['correspondent'])
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('returns error for unknown type without --create', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({
        ...defaultArgs,
        type: Option.some('Unknown Type'),
      })
      expect(env.ok).toBe(false)
      if (env.ok) return
      expect(env.error.code).toBe('DocumentTypeNotFound')
    }).pipe(Effect.provide(MockPaperlessClient)),
  )

  it.effect('includes document summary in result', () =>
    Effect.gen(function* () {
      const env = yield* editHandler({ ...defaultArgs, title: Option.some('Updated') })
      expect(env.ok).toBe(true)
      if (!env.ok) return
      expect(env.result.document.correspondent).toEqual({ id: 1, name: 'Amazon' })
      expect(env.result.document.tags).toEqual([{ id: 4, name: 'receipt' }])
    }).pipe(Effect.provide(MockPaperlessClient)),
  )
})
