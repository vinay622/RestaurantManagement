// ============================================================
// Time & seating grid.
// A single dinner service, cut into a 30-minute grid. A party
// holds its table for a fixed dining window; two reservations
// clash when their windows overlap on the same table.
// This mirrors the server's availability rule exactly so the
// UI can preview conflicts before a request is ever sent.
// ============================================================

export const SLOT_MINUTES = 30
export const SERVICE_START = '17:00' // first seating
export const SERVICE_END = '22:00' // last seating (start time)
export const DINING_DURATION_MIN = 90 // how long a party holds a table

/** "19:30" -> 1170 (minutes since midnight). */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** 1170 -> "19:30". */
export function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Every bookable start time in the service, e.g. 17:00 … 22:00. */
export function serviceSlots(): string[] {
  const out: string[] = []
  for (let t = toMinutes(SERVICE_START); t <= toMinutes(SERVICE_END); t += SLOT_MINUTES) {
    out.push(fromMinutes(t))
  }
  return out
}

/**
 * Do two seatings on the same table overlap?
 * Each occupies [start, start + duration).
 */
export function overlaps(
  aStart: string,
  bStart: string,
  duration = DINING_DURATION_MIN,
): boolean {
  const a0 = toMinutes(aStart)
  const a1 = a0 + duration
  const b0 = toMinutes(bStart)
  const b1 = b0 + duration
  return a0 < b1 && b0 < a1
}

/** Format "12:00" -> "12:00 PM" for display. */
export function toDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/** ISO date -> "Sat, Jul 4". */
export function toDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** ISO date -> "Saturday, July 4, 2026". */
export function toLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Today's date in local time as an ISO day string. */
export function todayIso(): string {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

/** ISO day N days from today. */
export function isoPlusDays(days: number): string {
  const d = new Date(`${todayIso()}T00:00:00`)
  d.setDate(d.getDate() + days)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

/** Has a given date+time already passed? */
export function isPast(date: string, time: string): boolean {
  const when = new Date(`${date}T${time}:00`)
  return when.getTime() < Date.now()
}
