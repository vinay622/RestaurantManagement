const { asyncHandler } = require('../lib/asyncHandler')
const { ApiError } = require('../lib/errors')
const { assertBookable } = require('../services/reservationService')
const { hydrate } = require('./reservationController')
const Reservation = require('../models/Reservation')

/** Admin: all reservations, optionally filtered by date and/or status. */
const list = asyncHandler(async (req, res) => {
  const { date, status } = req.query
  const filter = {}
  if (date) filter.date = date
  if (status) filter.status = status

  const reservations = await Reservation.find(filter).sort({ date: 1, time: 1 })
  res.json(await hydrate(reservations))
})

/** Admin: move, resize, or cancel any reservation. Re-checks the
 *  availability rule when the booking stays confirmed. */
const update = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.query.id).catch(() => null)
  if (!reservation) throw ApiError.notFound('Reservation not found.')

  const next = {
    tableId: req.body.tableId ?? String(reservation.tableId),
    date: req.body.date ?? reservation.date,
    time: req.body.time ?? reservation.time,
    guests: req.body.guests ?? reservation.guests,
  }
  const status = req.body.status ?? reservation.status

  // Only enforce table/capacity/overlap when the seating remains active.
  if (status === 'confirmed') {
    await assertBookable({ ...next, ignoreId: reservation._id, allowPast: true })
  }

  reservation.tableId = next.tableId
  reservation.date = next.date
  reservation.time = next.time
  reservation.guests = next.guests
  reservation.status = status
  if (req.body.notes !== undefined) reservation.notes = req.body.notes || ''
  await reservation.save()

  const [hydrated] = await hydrate([reservation])
  res.json(hydrated)
})

module.exports = { list, update }
