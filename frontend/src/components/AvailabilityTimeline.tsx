// ============================================================
// The signature element: a table's evening as a band of slots.
// Reads left-to-right like a reservation ledger row. Brass cells
// are held; a party holds its table for the dining window, so the
// "tail" slots after a booking's start are shaded too. Free cells
// are pickable when a slot handler is provided.
// ============================================================

import { cn } from '../lib/cn'
import { DINING_DURATION_MIN, isPast, overlaps, serviceSlots, SLOT_MINUTES, toDisplayTime, toMinutes } from '../lib/time'
import type { RestaurantTable } from '../types'

type SlotKind = 'start' | 'tail' | 'free' | 'past'

function classify(slot: string, bookedSlots: string[], date?: string): SlotKind {
  if (bookedSlots.includes(slot)) return 'start'
  // Covered by the dining window of an earlier booking?
  if (bookedSlots.some((s) => overlaps(s, slot))) return 'tail'
  if (date && isPast(date, slot)) return 'past'
  return 'free'
}

/** How many grid cells a dining window spans, for the header rule. */
const SPAN = Math.round(DINING_DURATION_MIN / SLOT_MINUTES)

interface TableTimelineProps {
  table: RestaurantTable
  bookedSlots: string[]
  guests?: number
  selectedTime?: string
  onPick?: (time: string) => void
  /** Dim the whole row when the table can't seat the party. */
  disabled?: boolean
  /** When set, slots already past on this date render inert. */
  date?: string
}

export function TableTimeline({
  table,
  bookedSlots,
  guests,
  selectedTime,
  onPick,
  disabled,
  date,
}: TableTimelineProps) {
  const slots = serviceSlots()
  const tooSmall = guests !== undefined && table.capacity < guests
  const rowDisabled = disabled || tooSmall

  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors',
        rowDisabled ? 'opacity-45' : 'hover:bg-[color-mix(in_oklab,var(--color-brass)_5%,transparent)]',
      )}
    >
      {/* Table identity */}
      <div className="flex w-full items-center justify-between gap-3 sm:w-40 sm:shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="tabular text-sm font-bold text-cocoa">{table.label}</span>
          <span className="text-xs text-cocoa-dim">{table.location}</span>
        </div>
        <span className="tabular text-[0.6875rem] text-cocoa-dim whitespace-nowrap">
          {table.capacity} seats
        </span>
      </div>

      {/* The band */}
      <div
        className="flex flex-1 gap-1 overflow-x-auto pb-1 sm:overflow-visible"
        role="group"
        aria-label={`Availability for ${table.label}`}
      >
        {slots.map((slot) => {
          const kind = classify(slot, bookedSlots, date)
          const selected = selectedTime === slot
          const pickable = kind === 'free' && !rowDisabled && !!onPick
          const label = `${table.label} at ${toDisplayTime(slot)} — ${
            kind === 'free' ? 'available' : kind === 'past' ? 'past' : 'booked'
          }`

          const cell = (
            <span
              className={cn(
                'flex h-8 min-w-8 flex-1 items-center justify-center rounded-[var(--radius-xs)] text-[0.625rem] font-medium tabular transition-all duration-150',
                kind === 'start' &&
                  'bg-brass text-ink shadow-[inset_0_0_0_1px_var(--color-brass-deep)]',
                kind === 'tail' &&
                  'bg-[color-mix(in_oklab,var(--color-brass)_30%,var(--color-linen-2))] text-brass-deep',
                kind === 'free' &&
                  'bg-[color-mix(in_oklab,var(--color-sage)_10%,var(--color-linen-2))] text-cocoa-dim',
                kind === 'past' && 'bg-transparent text-cocoa-dim/40 line-through',
                selected && 'ring-2 ring-brass ring-offset-1 ring-offset-linen scale-105 z-10',
                pickable && 'cursor-pointer hover:bg-sage hover:text-linen',
              )}
            >
              {slot.slice(0, 5)}
            </span>
          )

          return pickable ? (
            <button
              key={slot}
              type="button"
              onClick={() => onPick!(slot)}
              className="flex flex-1 min-w-8"
              aria-pressed={selected}
              aria-label={label}
              title={label}
            >
              {cell}
            </button>
          ) : (
            <span key={slot} className="flex flex-1 min-w-8" title={label} aria-label={label}>
              {cell}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** A time ruler aligned to the band; mirrors the row's label gutter. */
export function TimelineRuler() {
  const slots = serviceSlots()
  return (
    <div className="hidden items-center gap-4 px-3 sm:flex">
      <div className="w-40 shrink-0" />
      <div className="flex flex-1 gap-1">
        {slots.map((s, i) => (
          <span
            key={s}
            className={cn('tabular flex-1 text-center text-[0.5625rem] text-cocoa-dim', i % 2 !== 0 && 'opacity-0')}
          >
            {s.slice(0, 5)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function TimelineLegend() {
  const item = (cls: string, label: string) => (
    <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-cocoa-dim">
      <span className={cn('h-3 w-4 rounded-[3px]', cls)} aria-hidden />
      {label}
    </span>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {item('bg-[color-mix(in_oklab,var(--color-sage)_10%,var(--color-linen-2))] ring-1 ring-linen-line', 'Open')}
      {item('bg-brass', 'Seated')}
      {item('bg-[color-mix(in_oklab,var(--color-brass)_30%,var(--color-linen-2))]', 'Holding table')}
      <span className="text-[0.6875rem] text-cocoa-dim">· each seating holds the table ~{DINING_DURATION_MIN} min</span>
    </div>
  )
}

/** Guard used by callers to know how far a booking's tail reaches. */
export function tailReaches(startTime: string): number {
  return toMinutes(startTime) + SPAN * SLOT_MINUTES
}
