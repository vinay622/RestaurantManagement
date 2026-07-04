const mongoose = require('mongoose')
const { env } = require('./env')

mongoose.set('strictQuery', true)

async function connectDb(uri = env.mongoUri) {
  if (!uri) throw new Error('No MongoDB URI provided')
  await mongoose.connect(uri)
  return mongoose.connection
}

async function disconnectDb() {
  await mongoose.disconnect()
}

module.exports = { connectDb, disconnectDb }
