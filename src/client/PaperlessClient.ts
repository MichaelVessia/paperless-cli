import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform'
import { Context, Effect, Layer, Schedule, Schema } from 'effect'
import { ConnectionFailed, DocumentNotFound, InvalidToken, MissingCredentials, ServerError } from '../errors/index.ts'
import {
  Correspondent,
  CorrespondentList,
  CreateCorrespondentInput,
  CreateDocumentTypeInput,
  CreateTagInput,
  Document,
  DocumentList,
  DocumentType,
  DocumentTypeList,
  EditDocumentInput,
  Tag,
  TagList,
} from '../schema/index.ts'

// Config
export class PaperlessConfig extends Context.Tag('PaperlessConfig')<
  PaperlessConfig,
  {
    readonly url: string
    readonly token: string
  }
>() {}

// Statistics response
export const Statistics = Schema.Struct({
  documents_total: Schema.Number,
  documents_inbox: Schema.Number,
  inbox_tag: Schema.NullOr(Schema.Number),
  document_file_type_counts: Schema.Array(
    Schema.Struct({
      mime_type: Schema.String,
      mime_type_count: Schema.Number,
    }),
  ),
  character_count: Schema.Number,
})
export type Statistics = typeof Statistics.Type

export type PaperlessClientError = InvalidToken | MissingCredentials | ConnectionFailed | ServerError

// Service interface
export class PaperlessClient extends Context.Tag('PaperlessClient')<
  PaperlessClient,
  {
    // Documents
    readonly searchDocuments: (params: {
      query?: string
      tags?: readonly number[]
      correspondent?: number
      documentType?: number
      createdAfter?: string
      createdBefore?: string
      ordering?: string
      limit?: number
      page?: number
    }) => Effect.Effect<typeof DocumentList.Type, PaperlessClientError>

    readonly getDocument: (id: number) => Effect.Effect<Document, PaperlessClientError | DocumentNotFound>

    readonly editDocument: (
      id: number,
      input: typeof EditDocumentInput.Type,
    ) => Effect.Effect<Document, PaperlessClientError | DocumentNotFound>

    readonly getSimilarDocuments: (
      id: number,
      limit?: number,
    ) => Effect.Effect<typeof DocumentList.Type, PaperlessClientError>

    // Tags
    readonly listTags: () => Effect.Effect<typeof TagList.Type, PaperlessClientError>

    readonly findTagByName: (name: string) => Effect.Effect<Tag | null, PaperlessClientError>

    readonly createTag: (input: typeof CreateTagInput.Type) => Effect.Effect<Tag, PaperlessClientError>

    // Correspondents
    readonly listCorrespondents: () => Effect.Effect<typeof CorrespondentList.Type, PaperlessClientError>

    readonly findCorrespondentByName: (name: string) => Effect.Effect<Correspondent | null, PaperlessClientError>

    readonly createCorrespondent: (
      input: typeof CreateCorrespondentInput.Type,
    ) => Effect.Effect<Correspondent, PaperlessClientError>

    // Document Types
    readonly listDocumentTypes: () => Effect.Effect<typeof DocumentTypeList.Type, PaperlessClientError>

    readonly findDocumentTypeByName: (name: string) => Effect.Effect<DocumentType | null, PaperlessClientError>

    readonly createDocumentType: (
      input: typeof CreateDocumentTypeInput.Type,
    ) => Effect.Effect<DocumentType, PaperlessClientError>

    // Stats
    readonly getStatistics: () => Effect.Effect<typeof Statistics.Type, PaperlessClientError>

    // Download
    readonly downloadDocument: (
      id: number,
    ) => Effect.Effect<{ content: Uint8Array; filename: string }, PaperlessClientError | DocumentNotFound>
  }
>() {}

// Retry schedule: 3 attempts with exponential backoff (1s, 2s, 4s)
const retrySchedule = Schedule.exponential('1 second').pipe(Schedule.compose(Schedule.recurs(3)))

// Implementation
export const PaperlessClientLive = Layer.effect(
  PaperlessClient,
  Effect.gen(function* () {
    const config = yield* PaperlessConfig
    const httpClient = yield* HttpClient.HttpClient

    const baseClient = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(HttpClientRequest.prependUrl(config.url.replace(/\/$/, ''))),
      HttpClient.mapRequest(HttpClientRequest.setHeader('Authorization', `Token ${config.token}`)),
      HttpClient.retry(retrySchedule),
    )

    const request = <A, I>(
      req: HttpClientRequest.HttpClientRequest,
      schema: Schema.Schema<A, I>,
    ): Effect.Effect<A, PaperlessClientError> =>
      baseClient.execute(req).pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
        Effect.catchTags({
          RequestError: (e) => Effect.fail(new ConnectionFailed({ url: e.request.url })),
          ResponseError: (e) => {
            if (e.response.status === 401) {
              return Effect.fail(new InvalidToken())
            }
            return Effect.fail(
              new ServerError({
                status: e.response.status,
                message: e.reason,
              }),
            )
          },
          ParseError: (e) =>
            Effect.fail(
              new ServerError({
                status: 0,
                message: `Parse error: ${e.message}`,
              }),
            ),
        }),
      )

    const requestRaw = (
      req: HttpClientRequest.HttpClientRequest,
    ): Effect.Effect<HttpClientResponse.HttpClientResponse, PaperlessClientError> =>
      baseClient.execute(req).pipe(
        Effect.mapError((e): PaperlessClientError => {
          if (e._tag === 'RequestError') {
            return new ConnectionFailed({ url: e.request.url })
          }
          // ResponseError
          if (e.response.status === 401) {
            return new InvalidToken()
          }
          return new ServerError({
            status: e.response.status,
            message: e.reason,
          })
        }),
      )

    return {
      searchDocuments: (params) => {
        const searchParams = new URLSearchParams()
        if (params.query) searchParams.set('query', params.query)
        if (params.tags) {
          for (const tag of params.tags) {
            searchParams.append('tags__id__in', String(tag))
          }
        }
        if (params.correspondent) searchParams.set('correspondent__id', String(params.correspondent))
        if (params.documentType) searchParams.set('document_type__id', String(params.documentType))
        if (params.createdAfter) searchParams.set('created__date__gt', params.createdAfter)
        if (params.createdBefore) searchParams.set('created__date__lt', params.createdBefore)
        if (params.ordering) searchParams.set('ordering', params.ordering)
        if (params.limit) searchParams.set('page_size', String(params.limit))
        if (params.page) searchParams.set('page', String(params.page))

        return request(HttpClientRequest.get(`/api/documents/?${searchParams.toString()}`), DocumentList)
      },

      getDocument: (id) =>
        request(HttpClientRequest.get(`/api/documents/${id}/`), Document).pipe(
          Effect.catchIf(
            (e): e is ServerError => e._tag === 'ServerError' && e.status === 404,
            () => Effect.fail(new DocumentNotFound({ id })),
          ),
        ),

      editDocument: (id, input) =>
        request(
          HttpClientRequest.patch(`/api/documents/${id}/`).pipe(HttpClientRequest.bodyUnsafeJson(input)),
          Document,
        ).pipe(
          Effect.catchIf(
            (e): e is ServerError => e._tag === 'ServerError' && e.status === 404,
            () => Effect.fail(new DocumentNotFound({ id })),
          ),
        ),

      getSimilarDocuments: (id, limit = 5) =>
        request(HttpClientRequest.get(`/api/documents/?more_like_id=${id}&page_size=${limit}`), DocumentList),

      listTags: () => request(HttpClientRequest.get('/api/tags/'), TagList),

      findTagByName: (name) =>
        request(HttpClientRequest.get(`/api/tags/?name__iexact=${encodeURIComponent(name)}`), TagList).pipe(
          Effect.map((list) => (list.results.length > 0 ? list.results[0]! : null)),
        ),

      createTag: (input) =>
        request(HttpClientRequest.post('/api/tags/').pipe(HttpClientRequest.bodyUnsafeJson(input)), Tag),

      listCorrespondents: () => request(HttpClientRequest.get('/api/correspondents/'), CorrespondentList),

      findCorrespondentByName: (name) =>
        request(
          HttpClientRequest.get(`/api/correspondents/?name__iexact=${encodeURIComponent(name)}`),
          CorrespondentList,
        ).pipe(Effect.map((list) => (list.results.length > 0 ? list.results[0]! : null))),

      createCorrespondent: (input) =>
        request(
          HttpClientRequest.post('/api/correspondents/').pipe(HttpClientRequest.bodyUnsafeJson(input)),
          Correspondent,
        ),

      listDocumentTypes: () => request(HttpClientRequest.get('/api/document_types/'), DocumentTypeList),

      findDocumentTypeByName: (name) =>
        request(
          HttpClientRequest.get(`/api/document_types/?name__iexact=${encodeURIComponent(name)}`),
          DocumentTypeList,
        ).pipe(Effect.map((list) => (list.results.length > 0 ? list.results[0]! : null))),

      createDocumentType: (input) =>
        request(
          HttpClientRequest.post('/api/document_types/').pipe(HttpClientRequest.bodyUnsafeJson(input)),
          DocumentType,
        ),

      getStatistics: () => request(HttpClientRequest.get('/api/statistics/'), Statistics),

      downloadDocument: (id) =>
        requestRaw(HttpClientRequest.get(`/api/documents/${id}/download/`)).pipe(
          Effect.flatMap((response) =>
            Effect.gen(function* () {
              const contentDisposition = response.headers['content-disposition']
              let filename = `document-${id}`
              if (contentDisposition) {
                const match = /filename="?([^";\n]+)"?/.exec(contentDisposition)
                if (match?.[1]) {
                  filename = match[1]
                }
              }
              const buf = yield* response.arrayBuffer
              const content = new Uint8Array(buf)
              return { content, filename }
            }).pipe(
              Effect.mapError(
                (e): PaperlessClientError =>
                  new ServerError({
                    status: 0,
                    message: `Download error: ${String(e)}`,
                  }),
              ),
            ),
          ),
          Effect.catchIf(
            (e): e is ServerError => e._tag === 'ServerError' && e.status === 404,
            () => Effect.fail(new DocumentNotFound({ id })),
          ),
        ),
    }
  }),
)

// Config from environment
export const PaperlessConfigFromEnv = Layer.effect(
  PaperlessConfig,
  Effect.gen(function* () {
    const url = process.env['PAPERLESS_URL']
    const token = process.env['PAPERLESS_TOKEN']

    if (!url || !token) {
      return yield* Effect.fail(new MissingCredentials())
    }

    return { url, token }
  }),
)
