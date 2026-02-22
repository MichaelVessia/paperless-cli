import { describe, expect, it } from 'bun:test'
import * as Envelope from './index.ts'

describe('Envelope', () => {
  describe('success', () => {
    it('builds a success envelope with defaults', () => {
      const env = Envelope.success('stats', { documents_total: 5 })
      expect(env).toEqual({
        ok: true,
        command: 'stats',
        result: { documents_total: 5 },
        next_actions: [],
      })
    })

    it('includes next_actions', () => {
      const env = Envelope.success('get', { id: 1 }, [
        { command: 'paperless-cli download 1', description: 'Download file' },
      ])
      expect(env.ok).toBe(true)
      expect(env.next_actions).toHaveLength(1)
      expect(env.next_actions[0]?.command).toBe('paperless-cli download 1')
    })
  })

  describe('error', () => {
    it('builds an error envelope', () => {
      const env = Envelope.error(
        'search',
        'Tag not found: foo',
        'TagNotFound',
        'Check available tags with "paperless-cli tags".',
        [{ command: 'paperless-cli tags', description: 'List all tags' }],
      )
      expect(env).toEqual({
        ok: false,
        command: 'search',
        error: { message: 'Tag not found: foo', code: 'TagNotFound' },
        fix: 'Check available tags with "paperless-cli tags".',
        next_actions: [{ command: 'paperless-cli tags', description: 'List all tags' }],
      })
    })

    it('defaults to empty next_actions', () => {
      const env = Envelope.error('stats', 'Server error', 'ServerError', 'Try again later.')
      expect(env.next_actions).toEqual([])
    })
  })

  describe('truncateContent', () => {
    it('returns text unchanged if within limit', () => {
      const result = Envelope.truncateContent('hello', 100)
      expect(result).toEqual({ text: 'hello', truncated: false, original_length: 5 })
    })

    it('truncates text exceeding limit', () => {
      const result = Envelope.truncateContent('abcdefghij', 5)
      expect(result).toEqual({ text: 'abcde', truncated: true, original_length: 10 })
    })

    it('uses default maxLength of 10000', () => {
      const shortText = 'x'.repeat(9999)
      const result = Envelope.truncateContent(shortText)
      expect(result.truncated).toBe(false)

      const longText = 'x'.repeat(10001)
      const result2 = Envelope.truncateContent(longText)
      expect(result2.truncated).toBe(true)
      expect(result2.text.length).toBe(10000)
    })
  })

  describe('truncateList', () => {
    it('returns items unchanged if within limit', () => {
      const items = [1, 2, 3]
      const result = Envelope.truncateList(items, 5)
      expect(result).toEqual({ items: [1, 2, 3], truncated: false, total: 3 })
    })

    it('truncates items exceeding limit', () => {
      const items = [1, 2, 3, 4, 5]
      const result = Envelope.truncateList(items, 3)
      expect(result).toEqual({ items: [1, 2, 3], truncated: true, total: 5 })
    })

    it('uses default maxLength of 25', () => {
      const items = Array.from({ length: 26 }, (_, i) => i)
      const result = Envelope.truncateList(items)
      expect(result.truncated).toBe(true)
      expect(result.items.length).toBe(25)
      expect(result.total).toBe(26)
    })
  })
})
