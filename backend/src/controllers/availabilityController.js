const { asyncHandler } = require('../lib/asyncHandler')
const { ApiError } = require('../lib/errors')
const { isValidDate, isValidSlot } = require('../lib/time')
const { getAvailability } = require('../services/reservationService')

const availability = asyncHandler(async (req, res) => {
  const { date, guests, time } = req.query
  if (!date || !isValidDate(date)) throw ApiError.badRequest('A valid date is required.')
  const partySize = Number(guests) || 1
  if (time && !isValidSlot(time)) throw ApiError.badRequest('Invalid seating time.')

  const floor = await getAvailability({ date, guests: partySize, time: time || undefined })
  res.json(floor)
})

module.exports = { availability }
