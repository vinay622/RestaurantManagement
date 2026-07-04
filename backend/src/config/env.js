require('dotenv').config()

/** Read an env var, falling back to a default; throw if required and missing. */
function get(key, { required = false, fallback } = {}) {
  const value = process.env[key] ?? fallback
  if (required && (value === undefined || value === '')) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const isTest = process.env.NODE_ENV === 'test'

const env = {
  nodeEnv: get('NODE_ENV', { fallback: 'development' }),
  isTest,
  port: Number(get('PORT', { fallback: '4000' })),
  mongoUri: get('MONGODB_URI', { required: !isTest, fallback: isTest ? '' : undefined }),
  // A default secret is allowed ONLY in test; prod/dev must set a real one.
  jwtSecret: get('JWT_SECRET', { required: !isTest, fallback: isTest ? 'test-secret' : undefined }),
  jwtExpiresIn: get('JWT_EXPIRES_IN', { fallback: '7d' }),
  adminSignupCode: get('ADMIN_SIGNUP_CODE', { fallback: '' }),
  corsOrigins: get('CORS_ORIGINS', { fallback: 'http://localhost:5173' })
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  seed: {
    adminName: get('SEED_ADMIN_NAME', { fallback: 'Administrator' }),
    adminEmail: get('SEED_ADMIN_EMAIL', { fallback: 'admin@maison.test' }),
    adminPassword: get('SEED_ADMIN_PASSWORD', { fallback: 'password' }),
  },
}

module.exports = { env }
