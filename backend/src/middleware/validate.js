const { ApiError } = require('../lib/errors')

/** Validate req.body against a zod schema; replace it with the
 *  parsed value. Zod issues become { field, message } details so the
 *  frontend can show per-field errors. */
function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || '(body)',
        message: i.message,
      }))
      return next(ApiError.badRequest('Please check the highlighted fields.', details))
    }
    req.body = result.data
    next()
  }
}

module.exports = { validate }
