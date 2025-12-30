import type { Correspondent, Document, DocumentType, Tag } from '../schema/index.ts'
import type { Statistics } from '../client/PaperlessClient.ts'

// Truncate text with ellipsis
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Format a single document for list/search output
export const formatDocumentListItem = (
  doc: Document,
  options: {
    tags?: readonly Tag[]
    correspondents?: readonly Correspondent[]
    documentTypes?: readonly DocumentType[]
    showPreview?: boolean
    previewLength?: number
  } = {},
): string => {
  const lines: string[] = []

  // Title line
  lines.push(`[${doc.id}] ${doc.title}`)

  // Correspondent
  if (doc.correspondent && options.correspondents) {
    const correspondent = options.correspondents.find((c) => c.id === doc.correspondent)
    if (correspondent) {
      lines.push(`       Correspondent: ${correspondent.name}`)
    }
  }

  // Tags
  if (doc.tags.length > 0 && options.tags) {
    const tagNames = doc.tags.map((tagId) => options.tags!.find((t) => t.id === tagId)?.name).filter(Boolean)
    if (tagNames.length > 0) {
      lines.push(`       Tags: ${tagNames.join(', ')}`)
    }
  }

  // Document type
  if (doc.document_type && options.documentTypes) {
    const docType = options.documentTypes.find((dt) => dt.id === doc.document_type)
    if (docType) {
      lines.push(`       Type: ${docType.name}`)
    }
  }

  // Created date
  lines.push(`       Created: ${doc.created_date}`)

  // Preview
  if (options.showPreview && doc.content) {
    const preview = truncate(doc.content.replace(/\s+/g, ' ').trim(), options.previewLength ?? 100)
    lines.push(`       Preview: ${preview}`)
  }

  return lines.join('\n')
}

// Format document list output
export const formatDocumentList = (
  docs: readonly Document[],
  options: {
    tags?: readonly Tag[]
    correspondents?: readonly Correspondent[]
    documentTypes?: readonly DocumentType[]
    showPreview?: boolean
    previewLength?: number
  } = {},
): string => {
  if (docs.length === 0) return ''
  return docs.map((doc) => formatDocumentListItem(doc, options)).join('\n\n')
}

// Format full document details
export const formatDocumentFull = (
  doc: Document,
  options: {
    tags?: readonly Tag[]
    correspondents?: readonly Correspondent[]
    documentTypes?: readonly DocumentType[]
    maxContentLength?: number
    baseUrl?: string
  } = {},
): string => {
  const lines: string[] = []

  lines.push(`Document #${doc.id}`)
  lines.push(`Title: ${doc.title}`)
  lines.push('')

  // Metadata section
  if (doc.correspondent && options.correspondents) {
    const correspondent = options.correspondents.find((c) => c.id === doc.correspondent)
    if (correspondent) {
      lines.push(`Correspondent: ${correspondent.name}`)
    }
  }

  if (doc.document_type && options.documentTypes) {
    const docType = options.documentTypes.find((dt) => dt.id === doc.document_type)
    if (docType) {
      lines.push(`Type: ${docType.name}`)
    }
  }

  if (doc.tags.length > 0 && options.tags) {
    const tagNames = doc.tags.map((tagId) => options.tags!.find((t) => t.id === tagId)?.name).filter(Boolean)
    if (tagNames.length > 0) {
      lines.push(`Tags: ${tagNames.join(', ')}`)
    }
  }

  lines.push(`Created: ${doc.created_date}`)
  lines.push(`Added: ${doc.added.split('T')[0]}`)
  lines.push(`Modified: ${doc.modified.split('T')[0]}`)

  if (doc.archive_serial_number) {
    lines.push(`Archive Serial: ${doc.archive_serial_number}`)
  }

  lines.push(`Original filename: ${doc.original_file_name}`)

  // Download URL
  if (options.baseUrl) {
    lines.push(`Download: ${options.baseUrl}/api/documents/${doc.id}/download/`)
  }

  // Content
  if (doc.content) {
    lines.push('')
    lines.push('--- Content ---')
    const maxLength = options.maxContentLength ?? 50000
    if (doc.content.length > maxLength) {
      lines.push(truncate(doc.content, maxLength))
    } else {
      lines.push(doc.content)
    }
  }

  return lines.join('\n')
}

// Format tags list
export const formatTagList = (tags: readonly Tag[]): string => {
  if (tags.length === 0) return 'No tags found.'

  const lines: string[] = [`Tags (${tags.length} total):`, '']

  for (const tag of tags) {
    const inboxMarker = tag.is_inbox_tag ? ' [inbox]' : ''
    lines.push(`${tag.name}${inboxMarker} (${tag.document_count} documents)`)
  }

  return lines.join('\n')
}

// Format correspondents list
export const formatCorrespondentList = (correspondents: readonly Correspondent[]): string => {
  if (correspondents.length === 0) return 'No correspondents found.'

  const lines: string[] = [`Correspondents (${correspondents.length} total):`, '']

  for (const c of correspondents) {
    lines.push(`${c.name} (${c.document_count} documents)`)
  }

  return lines.join('\n')
}

// Format document types list
export const formatDocumentTypeList = (types: readonly DocumentType[]): string => {
  if (types.length === 0) return 'No document types found.'

  const lines: string[] = [`Document Types (${types.length} total):`, '']

  for (const dt of types) {
    lines.push(`${dt.name} (${dt.document_count} documents)`)
  }

  return lines.join('\n')
}

// Format statistics
export const formatStatistics = (stats: Statistics, version?: string): string => {
  const lines: string[] = []

  if (version) {
    lines.push(`Paperless-ngx ${version}`)
    lines.push('')
  }

  lines.push(`Documents: ${stats.documents_total.toLocaleString()}`)
  lines.push(`Inbox: ${stats.documents_inbox.toLocaleString()}`)
  lines.push(`Characters indexed: ${stats.character_count.toLocaleString()}`)

  if (stats.document_file_type_counts.length > 0) {
    lines.push('')
    lines.push('File types:')
    for (const ft of stats.document_file_type_counts) {
      lines.push(`  ${ft.mime_type}: ${ft.mime_type_count}`)
    }
  }

  return lines.join('\n')
}

// Format success message
export const formatSuccess = (message: string): string => `✓ ${message}`

// Format error message
export const formatError = (message: string): string => `✗ ${message}`
