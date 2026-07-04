const express = require('express')
const cors = require('cors')

const { env } = require('./config/env')
const { camelizeBody } = require('./middleware/camelize')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')
const routes = require('./routes')

function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin/curl (no origin) and any configured frontend.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true)
        return cb(null, false)
      },
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(camelizeBody)

  // Health check — used by Render and uptime probes.
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'maison-lumiere-api' }))

  app.use('/api/v1', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
