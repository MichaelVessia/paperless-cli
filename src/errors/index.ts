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

// Validation errors
export class AmbiguousMatch extends Data.TaggedError('AmbiguousMatch')<{
  type: string
  matches: readonly string[]
}> {}

// Network errors
export class ConnectionFailed extends Data.TaggedError('ConnectionFailed')<{
  url: string
}> {}
export class ServerError extends Data.TaggedError('ServerError')<{
  status: number
  message: string
}> {}
