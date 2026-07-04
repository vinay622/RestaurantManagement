const { asyncHandler } = require('../lib/asyncHandler')
const { ApiError } = require('../lib/errors')
const { verifyToken } = require('../lib/token')
const User = require('../models/User')

/** Resolve the bearer token to a user and attach it as req.user. */
const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw ApiError.unauthorized()

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.')
  }

  const user = await User.findById(payload.sub)
  if (!user) throw ApiError.unauthorized('Account no longer exists.')

  req.user = user
  next()
})

/** Must run after requireAuth. Gate a route to administrators. */
function requireAdmin(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized())
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Administrator access required.'))
  next()
}

module.exports = { requireAuth, requireAdmin }
