const { asyncHandler } = require('../lib/asyncHandler')
const { ApiError } = require('../lib/errors')
const { signToken } = require('../lib/token')
const { env } = require('../config/env')
const User = require('../models/User')

const register = asyncHandler(async (req, res) => {
  const { name, email, password, accessCode } = req.body

  const existing = await User.findOne({ email })
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.', [
      { field: 'email', message: 'already registered' },
    ])
  }

  // No code → a normal customer. A code that matches the house code →
  // admin. A code that's provided but wrong → rejected, so staff get
  // clear feedback instead of a silent guest account.
  let role = 'customer'
  if (accessCode) {
    if (env.adminSignupCode && accessCode === env.adminSignupCode) {
      role = 'admin'
    } else {
      throw ApiError.badRequest('Invalid access code.', [
        { field: 'accessCode', message: 'invalid access code' },
      ])
    }
  }

  const user = new User({ name, email, role })
  await user.setPassword(password)
  await user.save()

  res.status(201).json({ token: signToken(user._id), user: user.toPublic() })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect.')
  }
  res.json({ token: signToken(user._id), user: user.toPublic() })
})

const me = asyncHandler(async (req, res) => {
  res.json(req.user.toPublic())
})

module.exports = { register, login, me }
