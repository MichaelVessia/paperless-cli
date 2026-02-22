import type { NextAction } from './types.ts'

// Document actions
export const getDocument = (id: number): NextAction => ({
  command: `paperless-cli get ${id}`,
  description: 'View full document details',
})

export const downloadDocument = (id: number): NextAction => ({
  command: `paperless-cli download ${id}`,
  description: 'Download original file',
})

export const similarDocuments = (id: number): NextAction => ({
  command: `paperless-cli similar ${id}`,
  description: 'Find similar documents',
})

export const editDocument = (id: number): NextAction => ({
  command: `paperless-cli edit ${id}`,
  description: 'Edit document metadata',
  params: {
    title: { description: 'New title', required: false },
    correspondent: { description: 'Set correspondent', required: false },
    type: { description: 'Set document type', required: false },
  },
})

export const addTag = (id: number): NextAction => ({
  command: `paperless-cli add-tag ${id} <tag-name>`,
  description: 'Add a tag to this document',
  params: {
    'tag-name': { description: 'Tag to add', required: true },
  },
})

export const removeTag = (id: number, tagName: string): NextAction => ({
  command: `paperless-cli remove-tag ${id} ${tagName}`,
  description: `Remove tag "${tagName}" from this document`,
})

// Search/list actions
export const searchDocuments = (): NextAction => ({
  command: 'paperless-cli search <query>',
  description: 'Search documents by content',
  params: {
    query: { description: 'Search query', required: false },
  },
})

export const listDocuments = (): NextAction => ({
  command: 'paperless-cli list',
  description: 'List recent documents',
})

export const uploadDocument = (): NextAction => ({
  command: 'paperless-cli upload <file>',
  description: 'Upload a new document',
  params: {
    file: { description: 'Path to file', required: true },
  },
})

// Metadata listing actions
export const listTags = (): NextAction => ({
  command: 'paperless-cli tags',
  description: 'List all tags',
})

export const listCorrespondents = (): NextAction => ({
  command: 'paperless-cli correspondents',
  description: 'List all correspondents',
})

export const listTypes = (): NextAction => ({
  command: 'paperless-cli types',
  description: 'List all document types',
})

// Create metadata actions
export const createTag = (name?: string): NextAction => ({
  command: `paperless-cli create-tag ${name ?? '<name>'}`,
  description: name ? `Create tag "${name}"` : 'Create a new tag',
  params: name ? undefined : { name: { description: 'Tag name', required: true } },
})

export const createCorrespondent = (name?: string): NextAction => ({
  command: `paperless-cli create-correspondent ${name ?? '<name>'}`,
  description: name ? `Create correspondent "${name}"` : 'Create a new correspondent',
  params: name ? undefined : { name: { description: 'Correspondent name', required: true } },
})

export const createType = (name?: string): NextAction => ({
  command: `paperless-cli create-type ${name ?? '<name>'}`,
  description: name ? `Create document type "${name}"` : 'Create a new document type',
  params: name ? undefined : { name: { description: 'Document type name', required: true } },
})

// Stats
export const viewStats = (): NextAction => ({
  command: 'paperless-cli stats',
  description: 'View system statistics',
})
