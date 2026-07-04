const { ApiError } = require('../lib/errors')
const { env } = require('../config/env')

function notFoundHandler(_req, _res, next) {
  next(ApiError.notFound('Route not found.'))
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let apiError = err

  // Normalise common non-ApiError failures into the same envelope.
  if (!(err instanceof ApiError)) {
    if (err && err.name === 'ValidationError') {
      apiError = ApiError.badRequest('Validation failed.')
    } else if (err && err.code === 11000) {
      // Mongo duplicate key — e.g. the reservation slot unique index.
      apiError = ApiError.conflict('That slot was just taken. Please choose another.')
    } else if (err && err.name === 'CastError') {
      apiError = ApiError.badRequest('Malformed identifier.')
    } else {
      if (!env.isTest) console.error('Unhandled error:', err)
      apiError = new ApiError(500, 'INTERNAL', 'Something went wrong on our end.')
    }
  }

  res.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      status: apiError.status,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  })
}

module.exports = { notFoundHandler, errorHandler }
