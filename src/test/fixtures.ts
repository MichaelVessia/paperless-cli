import type { Correspondent, Document, DocumentType, Tag } from '../schema/index.ts'

// Sample tags
export const sampleTags: readonly Tag[] = [
  {
    id: 1,
    name: 'inbox',
    slug: 'inbox',
    colour: 1,
    text_color: '#ffffff',
    match: '',
    matching_algorithm: 1,
    is_inbox_tag: true,
    is_insensitive: true,
    document_count: 5,
  },
  {
    id: 2,
    name: 'tax',
    slug: 'tax',
    colour: 2,
    text_color: '#ffffff',
    match: '',
    matching_algorithm: 1,
    is_inbox_tag: false,
    is_insensitive: true,
    document_count: 12,
  },
  {
    id: 3,
    name: 'medical',
    slug: 'medical',
    colour: 3,
    text_color: '#ffffff',
    match: '',
    matching_algorithm: 1,
    is_inbox_tag: false,
    is_insensitive: true,
    document_count: 8,
  },
  {
    id: 4,
    name: 'receipt',
    slug: 'receipt',
    colour: 4,
    text_color: '#ffffff',
    match: 'receipt',
    matching_algorithm: 1,
    is_inbox_tag: false,
    is_insensitive: true,
    document_count: 45,
  },
  {
    id: 5,
    name: 'reviewed',
    slug: 'reviewed',
    colour: 5,
    text_color: '#000000',
    match: '',
    matching_algorithm: 0,
    is_inbox_tag: false,
    is_insensitive: true,
    document_count: 100,
  },
] as const

// Sample correspondents
export const sampleCorrespondents: readonly Correspondent[] = [
  {
    id: 1,
    name: 'Amazon',
    slug: 'amazon',
    match: 'amazon',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 25,
  },
  {
    id: 2,
    name: 'Comcast',
    slug: 'comcast',
    match: 'comcast',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 15,
  },
  {
    id: 3,
    name: 'Internal Revenue Service',
    slug: 'internal-revenue-service',
    match: 'irs',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 10,
  },
  {
    id: 4,
    name: 'Blue Cross Blue Shield',
    slug: 'blue-cross-blue-shield',
    match: 'bcbs',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 8,
  },
] as const

// Sample document types
export const sampleDocumentTypes: readonly DocumentType[] = [
  {
    id: 1,
    name: 'Invoice',
    slug: 'invoice',
    match: 'invoice',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 30,
  },
  {
    id: 2,
    name: 'Receipt',
    slug: 'receipt',
    match: 'receipt',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 45,
  },
  {
    id: 3,
    name: 'Statement',
    slug: 'statement',
    match: 'statement',
    matching_algorithm: 1,
    is_insensitive: true,
    document_count: 20,
  },
  {
    id: 4,
    name: 'Tax Form',
    slug: 'tax-form',
    match: 'w-2|1099|1040',
    matching_algorithm: 4, // regex
    is_insensitive: true,
    document_count: 12,
  },
] as const

// Sample documents
export const sampleDocuments: readonly Document[] = [
  {
    id: 1,
    title: 'Amazon Order Confirmation',
    content:
      'Thank you for your order. Your Amazon order #123-456-789 has been confirmed. Items: Wireless Mouse $29.99. Shipping: Free Prime delivery.',
    correspondent: 1, // Amazon
    document_type: 2, // Receipt
    tags: [4], // receipt
    created: '2024-01-15T10:30:00Z',
    created_date: '2024-01-15',
    modified: '2024-01-15T10:30:00Z',
    added: '2024-01-15T10:35:00Z',
    archive_serial_number: null,
    original_file_name: 'amazon-order-123456789.pdf',
    archived_file_name: null,
  },
  {
    id: 2,
    title: '2023 W-2 Form',
    content:
      'Wage and Tax Statement for tax year 2023. Employee: John Doe. Employer: Acme Corp. Wages: $85,000. Federal tax withheld: $15,000.',
    correspondent: 3, // IRS
    document_type: 4, // Tax Form
    tags: [2], // tax
    created: '2024-01-20T14:00:00Z',
    created_date: '2024-01-20',
    modified: '2024-01-20T14:00:00Z',
    added: '2024-01-20T14:05:00Z',
    archive_serial_number: 1001,
    original_file_name: 'w2-2023.pdf',
    archived_file_name: '2024-01-20-w2-2023.pdf',
  },
  {
    id: 3,
    title: 'Comcast Monthly Bill',
    content:
      'Monthly statement for account #98765. Service period: January 2024. Internet: $79.99. Total due: $79.99. Due date: February 15, 2024.',
    correspondent: 2, // Comcast
    document_type: 1, // Invoice
    tags: [1], // inbox
    created: '2024-02-01T08:00:00Z',
    created_date: '2024-02-01',
    modified: '2024-02-01T08:00:00Z',
    added: '2024-02-01T08:10:00Z',
    archive_serial_number: null,
    original_file_name: 'comcast-bill-jan-2024.pdf',
    archived_file_name: null,
  },
  {
    id: 4,
    title: 'Medical Insurance Claim',
    content:
      'Explanation of Benefits. Claim #EOB-2024-001. Patient: John Doe. Provider: City Medical Center. Service date: January 10, 2024. Billed: $500. Insurance paid: $400. Your responsibility: $100.',
    correspondent: 4, // BCBS
    document_type: 3, // Statement
    tags: [3], // medical
    created: '2024-01-25T11:00:00Z',
    created_date: '2024-01-25',
    modified: '2024-01-25T11:00:00Z',
    added: '2024-01-25T11:15:00Z',
    archive_serial_number: null,
    original_file_name: 'eob-2024-001.pdf',
    archived_file_name: null,
  },
  {
    id: 5,
    title: 'Amazon Gift Card Purchase',
    content:
      'Digital gift card purchase. Amount: $50.00. Recipient: jane@example.com. Message: Happy Birthday! Order #GC-2024-001.',
    correspondent: 1, // Amazon
    document_type: 2, // Receipt
    tags: [4, 5], // receipt, reviewed
    created: '2024-02-10T16:00:00Z',
    created_date: '2024-02-10',
    modified: '2024-02-11T09:00:00Z',
    added: '2024-02-10T16:05:00Z',
    archive_serial_number: null,
    original_file_name: 'amazon-giftcard-gc2024001.pdf',
    archived_file_name: null,
  },
] as const

// Helper to find fixtures by ID
export const findTagById = (id: number): Tag | undefined => sampleTags.find((t) => t.id === id)

export const findTagByName = (name: string): Tag | undefined =>
  sampleTags.find((t) => t.name.toLowerCase() === name.toLowerCase())

export const findCorrespondentById = (id: number): Correspondent | undefined =>
  sampleCorrespondents.find((c) => c.id === id)

export const findCorrespondentByName = (name: string): Correspondent | undefined =>
  sampleCorrespondents.find((c) => c.name.toLowerCase() === name.toLowerCase())

export const findDocumentTypeById = (id: number): DocumentType | undefined =>
  sampleDocumentTypes.find((dt) => dt.id === id)

export const findDocumentTypeByName = (name: string): DocumentType | undefined =>
  sampleDocumentTypes.find((dt) => dt.name.toLowerCase() === name.toLowerCase())

export const findDocumentById = (id: number): Document | undefined => sampleDocuments.find((d) => d.id === id)

// Statistics fixture
export const sampleStatistics = {
  documents_total: 156,
  documents_inbox: 5,
  inbox_tag: 1,
  document_file_type_counts: [
    { mime_type: 'application/pdf', mime_type_count: 120 },
    { mime_type: 'image/png', mime_type_count: 25 },
    { mime_type: 'image/jpeg', mime_type_count: 11 },
  ],
  character_count: 1250000,
} as const
