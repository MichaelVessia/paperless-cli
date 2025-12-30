import { describe, expect, it } from 'bun:test'
import { formatDocumentListItem, formatDocumentList, formatTagList, formatStatistics } from './output.ts'
import { sampleDocuments, sampleTags, sampleCorrespondents, sampleStatistics } from '../test/fixtures.ts'

describe('output formatters', () => {
  it('formats document list item', () => {
    const output = formatDocumentListItem(sampleDocuments[0]!, {
      tags: sampleTags,
      correspondents: sampleCorrespondents,
      showPreview: true,
      previewLength: 50,
    })
    expect(output).toContain('[1]')
    expect(output).toContain('Amazon Order Confirmation')
    expect(output).toContain('Amazon')
    expect(output).toContain('receipt')
  })

  it('formats document list', () => {
    const output = formatDocumentList(sampleDocuments.slice(0, 2), {
      tags: sampleTags,
      correspondents: sampleCorrespondents,
    })
    expect(output).toContain('[1]')
    expect(output).toContain('[2]')
  })

  it('formats empty document list', () => {
    const output = formatDocumentList([])
    expect(output).toBe('')
  })

  it('formats tag list', () => {
    const output = formatTagList(sampleTags)
    expect(output).toContain('Tags (5 total)')
    expect(output).toContain('inbox [inbox]')
    expect(output).toContain('tax')
  })

  it('formats statistics', () => {
    const output = formatStatistics(sampleStatistics, 'v2.4.0')
    expect(output).toContain('Paperless-ngx v2.4.0')
    expect(output).toContain('Documents: 156')
    expect(output).toContain('Inbox: 5')
  })
})
