const { asyncHandler } = require('../lib/asyncHandler')
const { ApiError } = require('../lib/errors')
const { assertBookable, DINING_DURATION_MIN } = require('../services/reservationService')
const Reservation = require('../models/Reservation')
const Table = require('../models/Table')
const User = require('../models/User')

/** Attach the table + user docs to a set of reservations for serialization. */
async function hydrate(reservations) {
  const tableIds = [...new Set(reservations.map((r) => String(r.tableId)))]
  const userIds = [...new Set(reservations.map((r) => String(r.userId)))]
  const [tables, users] = await Promise.all([
    Table.find({ _id: { $in: tableIds } }),
    User.find({ _id: { $in: userIds } }),
  ])
  const tableById = new Map(tables.map((t) => [String(t._id), t]))
  const userById = new Map(users.map((u) => [String(u._id), u]))
  return reservations.map((r) =>
    r.toPublic({ table: tableById.get(String(r.tableId)), user: userById.get(String(r.userId)) }),
  )
}

const create = asyncHandler(async (req, res) => {
  const { tableId, date, time, guests, notes } = req.body
  const table = await assertBookable({ tableId, date, time, guests })

  const reservation = await Reservation.create({
    tableId,
    userId: req.user._id,
    date,
    time,
    durationMinutes: DINING_DURATION_MIN,
    guests,
    status: 'confirmed',
    notes: notes || '',
  })

  res.status(201).json(reservation.toPublic({ table, user: req.user }))
})

const mine = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ userId: req.user._id }).sort({ date: 1, time: 1 })
  res.json(await hydrate(reservations))
})

const cancel = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.query.id).catch(() => null)
  if (!reservation) throw ApiError.notFound('Reservation not found.')

  const isOwner = String(reservation.userId) === String(req.user._id)
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only cancel your own reservations.')
  }

  reservation.status = 'cancelled'
  await reservation.save()

  const [hydrated] = await hydrate([reservation])
  res.json(hydrated)
})

module.exports = { create, mine, cancel, hydrate }
