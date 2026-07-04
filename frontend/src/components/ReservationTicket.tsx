import type { ReactNode } from 'react'
import { Badge } from './ui/Badge'
import { cn } from '../lib/cn'
import { isPast, toDisplayTime, toDisplayDate } from '../lib/time'
import type { Reservation } from '../types'

/** A reservation rendered like a torn ledger ticket. Reused by
 *  guest and admin lists; `showGuest` reveals who booked. */
export function ReservationTicket({
  reservation: r,
  showGuest = false,
  actions,
}: {
  reservation: Reservation
  showGuest?: boolean
  actions?: ReactNode
}) {
  const cancelled = r.status === 'cancelled'
  const past = isPast(r.date, r.time)
  const dimmed = cancelled || past

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[var(--radius-md)] border border-linen-line bg-linen p-4 sm:flex-row sm:items-center sm:gap-4',
        dimmed && 'opacity-70',
      )}
    >
      {/* The "stub": table + time, mono like a printed chit */}
      <div className="flex items-center gap-4 sm:w-52 sm:shrink-0">
        <div
          className={cn(
            'grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-sm)] text-center',
            cancelled
              ? 'bg-linen-2 text-cocoa-dim'
              : 'bg-ink text-brass-soft ring-1 ring-plum-line',
          )}
        >
          <span className="tabular text-sm font-bold leading-none">{r.table?.label ?? '—'}</span>
          <span className="mt-0.5 text-[0.5625rem] uppercase tracking-wider opacity-70">table</span>
        </div>
        <div>
          <p className="tabular text-base font-semibold text-cocoa">{toDisplayTime(r.time)}</p>
          <p className="tabular text-xs text-cocoa-dim">{toDisplayDate(r.date)}</p>
        </div>
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular text-sm text-cocoa">
            {r.guests} {r.guests === 1 ? 'guest' : 'guests'}
          </span>
          {r.table?.location && (
            <span className="text-xs text-cocoa-dim">· {r.table.location}</span>
          )}
          {cancelled ? (
            <Badge tone="clay" dot>
              Cancelled
            </Badge>
          ) : past ? (
            <Badge tone="neutral">Dined</Badge>
          ) : (
            <Badge tone="sage" dot>
              Confirmed
            </Badge>
          )}
        </div>
        {showGuest && r.user && (
          <p className="mt-1 truncate text-xs text-cocoa-dim">
            {r.user.name} · {r.user.email}
          </p>
        )}
        {r.notes && (
          <p className="mt-1 truncate text-xs italic text-cocoa-dim" title={r.notes}>
            “{r.notes}”
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  )
}
