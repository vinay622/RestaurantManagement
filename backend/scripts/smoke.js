// Boot the real app against an in-memory MongoDB and exercise the
// full contract with fetch. Not a formal test suite — a confidence
// smoke that the wiring, RBAC, and conflict rules actually work.

const { MongoMemoryServer } = require('mongodb-memory-server')

async function main() {
  const mongo = await MongoMemoryServer.create()
  // Config reads env at require-time, so set everything first.
  process.env.NODE_ENV = 'development'
  process.env.MONGODB_URI = mongo.getUri()
  process.env.JWT_SECRET = 'smoke-secret'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.ADMIN_SIGNUP_CODE = 'MAISON-ADMIN'
  process.env.CORS_ORIGINS = 'http://localhost:5173'
  process.env.PORT = '4599'

  const { createApp } = require('../src/app')
  const { connectDb, disconnectDb } = require('../src/config/db')
  const Table = require('../src/models/Table')

  await connectDb()
  await Table.create([
    { label: 'T1', capacity: 2, location: 'Window', active: true },
    { label: 'T3', capacity: 4, location: 'Floor', active: true },
  ])

  const app = createApp()
  const server = app.listen(4599)
  const base = 'http://127.0.0.1:4599/api/v1'

  let passed = 0
  let failed = 0
  const check = (name, cond, extra) => {
    if (cond) {
      passed++
      console.log(`  ✔ ${name}`)
    } else {
      failed++
      console.log(`  �’ ${name}`, extra ?? '')
    }
  }
  const api = async (method, path, { token, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    let data = null
    try {
      data = await res.json()
    } catch {
      /* no body */
    }
    return { status: res.status, data }
  }

  // tomorrow's date
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const date = d.toISOString().slice(0, 10)

  try {
    console.log('AUTH')
    let r = await api('POST', '/auth/register', { body: { name: 'Jules Renard', email: 'jules@test.com', password: 'secret1' } })
    check('register guest → 201 + token', r.status === 201 && !!r.data.token && r.data.user.role === 'customer', r)
    const guestToken = r.data.token

    r = await api('POST', '/auth/register', { body: { name: 'Margaux', email: 'admin@test.com', password: 'secret1', access_code: 'MAISON-ADMIN' } })
    check('register with access code → admin', r.status === 201 && r.data.user.role === 'admin', r)
    const adminToken = r.data.token

    r = await api('POST', '/auth/login', { body: { email: 'jules@test.com', password: 'wrong' } })
    check('login wrong password → 401', r.status === 401, r)

    r = await api('GET', '/auth/me', { token: guestToken })
    check('me → guest identity', r.status === 200 && r.data.email === 'jules@test.com', r)

    r = await api('GET', '/auth/me')
    check('me without token → 401', r.status === 401, r)

    console.log('TABLES / RBAC')
    r = await api('GET', '/tables', { token: guestToken })
    check('list tables (auth) → 200, 2 tables', r.status === 200 && r.data.length === 2, r)
    const t2 = r.data.find((t) => t.capacity === 2)
    const t4 = r.data.find((t) => t.capacity === 4)

    r = await api('POST', '/tables', { token: guestToken, body: { label: 'T9', capacity: 2 } })
    check('guest create table → 403', r.status === 403, r)

    r = await api('POST', '/tables', { token: adminToken, body: { label: 'T9', capacity: 10, location: 'Patio' } })
    check('admin create table → 201', r.status === 201 && r.data.label === 'T9', r)

    console.log('AVAILABILITY + RESERVATIONS')
    r = await api('GET', `/availability?date=${date}&guests=2`, { token: guestToken })
    check('availability → array with booked_slots', r.status === 200 && Array.isArray(r.data) && 'booked_slots' in r.data[0], r)

    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t2.id, date, time: '19:00', guests: 2 } })
    check('create reservation → 201 confirmed', r.status === 201 && r.data.status === 'confirmed', r)
    const resId = r.data.id

    // overlap: 19:30 overlaps [19:00,20:30)
    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t2.id, date, time: '19:30', guests: 2 } })
    check('overlapping seating → 409', r.status === 409, r)

    // exact same slot again (unique index / conflict)
    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t2.id, date, time: '19:00', guests: 2 } })
    check('identical slot → 409', r.status === 409, r)

    // non-overlapping later slot on same table is OK (20:30 = end of window)
    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t2.id, date, time: '20:30', guests: 2 } })
    check('adjacent non-overlapping seating → 201', r.status === 201, r)

    // over capacity
    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t2.id, date, time: '17:00', guests: 4 } })
    check('party exceeds capacity → 422', r.status === 422, r)

    // invalid slot (off grid) → 400 validation
    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t4.id, date, time: '19:07', guests: 2 } })
    check('off-grid time → 400', r.status === 400, r)

    r = await api('GET', '/reservations/mine', { token: guestToken })
    check('my reservations → 2 confirmed', r.status === 200 && r.data.filter((x) => x.status === 'confirmed').length === 2, r)

    console.log('ADMIN')
    r = await api('GET', '/admin/reservations', { token: guestToken })
    check('guest hits admin list → 403', r.status === 403, r)

    r = await api('GET', `/admin/reservations?date=${date}`, { token: adminToken })
    check('admin list by date → array', r.status === 200 && Array.isArray(r.data) && r.data[0].user, r)

    r = await api('POST', `/admin/reservations/update?id=${resId}`, { token: adminToken, body: { guests: 2, time: '18:00' } })
    check('admin moves reservation → 200 at new time', r.status === 200 && r.data.time === '18:00', r)

    console.log('CANCELLATION')
    r = await api('POST', `/reservations/cancel?id=${resId}`, { token: guestToken })
    check('owner cancels → cancelled', r.status === 200 && r.data.status === 'cancelled', r)

    // cancelling frees the slot: re-book 18:00 now succeeds
    r = await api('POST', '/reservations', { token: guestToken, body: { table_id: t2.id, date, time: '18:00', guests: 2 } })
    check('re-book freed slot → 201', r.status === 201, r)
  } finally {
    server.close()
    await disconnectDb()
    await mongo.stop()
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
