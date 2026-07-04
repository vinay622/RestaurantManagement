// ============================================================
// The reservation rules live here, in one place, so create,
// admin-update, and availability all agree:
//   1. the table must exist and be active
//   2. the party must fit the table's capacity
//   3. the seating must be a valid, non-past slot
//   4. no overlapping confirmed seating on the same table+date
// ============================================================

const { ApiError } = require('../lib/errors')
const { DINING_DURATION_MIN, overlaps, isPast } = require('../lib/time')
const Table = require('../models/Table')
const Reservation = require('../models/Reservation')

/**
 * Find a confirmed reservation on the same table + date whose dining
 * window overlaps the requested time. Excludes `ignoreId` (for updates).
 */
async function findConflict({ tableId, date, time, ignoreId }) {
  const sameDay = await Reservation.find({ tableId, date, status: 'confirmed' })
  return sameDay.find((r) => String(r._id) !== String(ignoreId) && overlaps(r.time, time))
}

/**
 * Validate a would-be seating and return the target table.
 * Throws an ApiError with the right status for each failure mode.
 */
async function assertBookable({ tableId, date, time, guests, ignoreId, allowPast = false }) {
  const table = await Table.findById(tableId).catch(() => null)
  if (!table || !table.active) throw ApiError.notFound('That table is not available.')

  if (guests > table.capacity) {
    throw ApiError.unprocessable(
      `${table.label} seats ${table.capacity}. Please choose a larger table.`,
      [{ field: 'guests', message: `exceeds capacity of ${table.capacity}` }],
    )
  }

  if (!allowPast && isPast(date, time)) {
    throw ApiError.unprocessable('That seating is in the past.', [
      { field: 'time', message: 'already passed' },
    ])
  }

  const conflict = await findConflict({ tableId, date, time, ignoreId })
  if (conflict) {
    throw ApiError.conflict(
      `${table.label} is already booked around ${time}. Try another time or table.`,
    )
  }

  return table
}

/**
 * The floor for a date: every active table, the slots it already holds,
 * and whether it can take the requested party (+ optional slot).
 */
async function getAvailability({ date, guests, time }) {
  const tables = await Table.find({ active: true }).sort({ capacity: 1, label: 1 })
  const dayReservations = await Reservation.find({ date, status: 'confirmed' })

  return tables.map((table) => {
    const forTable = dayReservations.filter((r) => String(r.tableId) === String(table._id))
    const bookedSlots = forTable.map((r) => r.time)
    const fitsParty = table.capacity >= guests
    const slotFree = time ? !forTable.some((r) => overlaps(r.time, time)) : true
    return {
      table: table.toPublic(),
      booked_slots: bookedSlots,
      available_for_request: fitsParty && slotFree,
    }
  })
}

module.exports = { findConflict, assertBookable, getAvailability, DINING_DURATION_MIN }
