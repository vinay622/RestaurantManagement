// Seed the restaurant: an admin account (from env) + a fixed set of
// tables. Safe to run repeatedly — it upserts rather than duplicating.
//
//   npm run seed

const { connectDb, disconnectDb } = require('./config/db')
const { env } = require('./config/env')
const User = require('./models/User')
const Table = require('./models/Table')

const TABLES = [
  { label: 'T1', capacity: 2, location: 'Window banquette' },
  { label: 'T2', capacity: 2, location: 'Window banquette' },
  { label: 'T3', capacity: 4, location: 'Main floor' },
  { label: 'T4', capacity: 4, location: 'Main floor' },
  { label: 'T5', capacity: 6, location: 'The alcove' },
  { label: 'T6', capacity: 8, location: "Chef's table" },
]

async function seed() {
  await connectDb()

  // Admin (upsert by email)
  const email = env.seed.adminEmail.toLowerCase()
  let admin = await User.findOne({ email })
  if (!admin) {
    admin = new User({ name: env.seed.adminName, email, role: 'admin' })
    await admin.setPassword(env.seed.adminPassword)
    await admin.save()
    console.log(`✔ Created admin: ${email}`)
  } else {
    admin.role = 'admin'
    await admin.save()
    console.log(`• Admin already exists: ${email} (ensured role=admin)`)
  }

  // Tables (upsert by label)
  for (const t of TABLES) {
    const existing = await Table.findOne({ label: t.label })
    if (existing) {
      console.log(`• Table ${t.label} already exists`)
      continue
    }
    await Table.create({ ...t, active: true })
    console.log(`✔ Created table ${t.label} (seats ${t.capacity})`)
  }

  console.log('\nSeed complete.')
  await disconnectDb()
}

seed().catch(async (err) => {
  console.error('Seed failed:', err)
  await disconnectDb().catch(() => {})
  process.exit(1)
})
