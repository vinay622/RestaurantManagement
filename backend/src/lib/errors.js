/** A typed, HTTP-aware error. The error handler renders it as
 *  { error: { code, message, status, details } } — the exact shape
 *  the frontend reads (response.data.error.message). */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details // optional [{ field, message }]
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }
  static unauthorized(message = 'Please sign in to continue.') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'You do not have access to this.') {
    return new ApiError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Not found.') {
    return new ApiError(404, 'NOT_FOUND', message)
  }
  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details)
  }
  static unprocessable(message, details) {
    return new ApiError(422, 'UNPROCESSABLE', message, details)
  }
}

module.exports = { ApiError }
