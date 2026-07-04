// ============================================================
// Seating grid + overlap rule. This is the authoritative copy —
// the frontend mirrors it for previews, but the server decides.
// Dates are 'YYYY-MM-DD' strings and times 'HH:mm' strings in the
// restaurant's local clock; we never coerce them to Date objects
// for storage, which keeps bookings free of timezone drift.
// ============================================================

const SLOT_MINUTES = 30
const SERVICE_START = '17:00' // first seating
const SERVICE_END = '22:00' // last seating (start time)
const DINING_DURATION_MIN = 90 // how long a party holds the table

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Every bookable start time in the service. */
function serviceSlots() {
  const out = []
  for (let t = toMinutes(SERVICE_START); t <= toMinutes(SERVICE_END); t += SLOT_MINUTES) {
    out.push(fromMinutes(t))
  }
  return out
}

/** Two seatings on the same table clash when their dining windows overlap. */
function overlaps(aStart, bStart, duration = DINING_DURATION_MIN) {
  const a0 = toMinutes(aStart)
  const a1 = a0 + duration
  const b0 = toMinutes(bStart)
  const b1 = b0 + duration
  return a0 < b1 && b0 < a1
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

function isValidDate(date) {
  if (!DATE_RE.test(date)) return false
  const d = new Date(`${date}T00:00:00`)
  return !Number.isNaN(d.getTime())
}

/** A time is valid only if it lands on the grid within service hours. */
function isValidSlot(time) {
  if (!TIME_RE.test(time)) return false
  return serviceSlots().includes(time)
}

/** Has this date+time already passed (server-local clock)? */
function isPast(date, time) {
  return new Date(`${date}T${time}:00`).getTime() < Date.now()
}

module.exports = {
  SLOT_MINUTES,
  SERVICE_START,
  SERVICE_END,
  DINING_DURATION_MIN,
  toMinutes,
  fromMinutes,
  serviceSlots,
  overlaps,
  isValidDate,
  isValidSlot,
  isPast,
}
