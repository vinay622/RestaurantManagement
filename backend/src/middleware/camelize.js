// The frontend sends snake_case JSON bodies. Convert incoming bodies
// to camelCase so controllers work in idiomatic JS; models serialize
// back to snake_case on the way out (see each model's toPublic()).

const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())

function convert(input) {
  if (Array.isArray(input)) return input.map(convert)
  if (input && typeof input === 'object' && !(input instanceof Date)) {
    return Object.fromEntries(Object.entries(input).map(([k, v]) => [toCamel(k), convert(v)]))
  }
  return input
}

function camelizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = convert(req.body)
  next()
}

module.exports = { camelizeBody }
