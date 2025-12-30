import { Data } from 'effect'

// Auth errors
export class InvalidToken extends Data.TaggedError('InvalidToken') {}
export class MissingCredentials extends Data.TaggedError('MissingCredentials') {}

// Not found errors
export class DocumentNotFound extends Data.TaggedError('DocumentNotFound')<{
  id: number
}> {}
export class TagNotFound extends Data.TaggedError('TagNotFound')<{
  name: string
}> {}
export class CorrespondentNotFound extends Data.TaggedError('CorrespondentNotFound')<{
  name: string
}> {}
export class DocumentTypeNotFound extends Data.TaggedError('DocumentTypeNotFound')<{
  name: string
}> {}

// Validation errors
export class InvalidDocumentId extends Data.TaggedError('InvalidDocumentId')<{
  value: string
}> {}
export class InvalidQuery extends Data.TaggedError('InvalidQuery')<{
  reason: string
}> {}
export class AmbiguousMatch extends Data.TaggedError('AmbiguousMatch')<{
  type: string
  matches: readonly string[]
}> {}

// Network errors
export class ConnectionFailed extends Data.TaggedError('ConnectionFailed')<{
  url: string
}> {}
export class Timeout extends Data.TaggedError('Timeout')<{
  url: string
}> {}
export class ServerError extends Data.TaggedError('ServerError')<{
  status: number
  message: string
}> {}

// Union types for convenience
export type AuthError = InvalidToken | MissingCredentials
export type NotFoundError = DocumentNotFound | TagNotFound | CorrespondentNotFound | DocumentTypeNotFound
export type ValidationError = InvalidDocumentId | InvalidQuery | AmbiguousMatch
export type NetworkError = ConnectionFailed | Timeout | ServerError
export type PaperlessError = AuthError | NotFoundError | ValidationError | NetworkError
