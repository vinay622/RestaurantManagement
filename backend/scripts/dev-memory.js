// Run the real API against a throwaway in-memory MongoDB, seeded with
// an admin + tables + a demo guest. For local integration testing when
// you don't want to stand up a full Mongo. Listens on PORT (default 4000).

const { MongoMemoryServer } = require('mongodb-memory-server')

async function main() {
  const mongo = await MongoMemoryServer.create()
  process.env.NODE_ENV = 'development'
  process.env.MONGODB_URI = mongo.getUri()
  process.env.JWT_SECRET = 'dev-memory-secret'
  process.env.JWT_EXPIRES_IN = '7d'
  process.env.ADMIN_SIGNUP_CODE = 'MAISON-ADMIN'
  process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:5174'
  process.env.PORT = process.env.PORT || '4000'

  const { createApp } = require('../src/app')
  const { connectDb } = require('../src/config/db')
  const User = require('../src/models/User')
  const Table = require('../src/models/Table')

  await connectDb()

  const admin = new User({ name: 'Margaux Vane', email: 'admin@maison.test', role: 'admin' })
  await admin.setPassword('password')
  await admin.save()
  const guest = new User({ name: 'Jules Renard', email: 'guest@maison.test', role: 'customer' })
  await guest.setPassword('password')
  await guest.save()
  await Table.create([
    { label: 'T1', capacity: 2, location: 'Window banquette', active: true },
    { label: 'T2', capacity: 2, location: 'Window banquette', active: true },
    { label: 'T3', capacity: 4, location: 'Main floor', active: true },
    { label: 'T5', capacity: 6, location: 'The alcove', active: true },
  ])

  const app = createApp()
  app.listen(Number(process.env.PORT), () => {
    console.log(`dev-memory API on :${process.env.PORT} (admin@maison.test / guest@maison.test, pw: password)`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
