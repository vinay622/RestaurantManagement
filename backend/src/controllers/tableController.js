const { asyncHandler } = require('../lib/asyncHandler')
const { ApiError } = require('../lib/errors')
const { isPast } = require('../lib/time')
const Table = require('../models/Table')
const Reservation = require('../models/Reservation')

const list = asyncHandler(async (_req, res) => {
  const tables = await Table.find().sort({ label: 1 })
  res.json(tables.map((t) => t.toPublic()))
})

const create = asyncHandler(async (req, res) => {
  const { label, capacity, location, active } = req.body
  const table = await Table.create({ label, capacity, location: location || '', active: active ?? true })
  res.status(201).json(table.toPublic())
})

const update = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.query.id).catch(() => null)
  if (!table) throw ApiError.notFound('Table not found.')

  const { label, capacity, location, active } = req.body
  if (label !== undefined) table.label = label
  if (capacity !== undefined) table.capacity = capacity
  if (location !== undefined) table.location = location
  if (active !== undefined) table.active = active
  await table.save()

  res.json(table.toPublic())
})

const remove = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.query.id).catch(() => null)
  if (!table) throw ApiError.notFound('Table not found.')

  const upcoming = await Reservation.find({ tableId: table._id, status: 'confirmed' })
  if (upcoming.some((r) => !isPast(r.date, r.time))) {
    throw ApiError.conflict('This table has upcoming reservations. Cancel or move them first.')
  }

  await table.deleteOne()
  res.json({ ok: true })
})

module.exports = { list, create, update, remove }
