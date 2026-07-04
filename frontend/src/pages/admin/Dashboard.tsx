import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ApiError } from '../../lib/http'
import { useToast } from '../../components/ui/Toast'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { LoadingPanel } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ReservationTicket } from '../../components/ReservationTicket'
import { TableTimeline, TimelineLegend, TimelineRuler } from '../../components/AvailabilityTimeline'
import { EditReservationModal } from '../../components/admin/EditReservationModal'
import { isoPlusDays, toDisplayTime, toLongDate, todayIso } from '../../lib/time'
import type { Reservation, RestaurantTable, TableAvailability } from '../../types'

type Scope = 'date' | 'all'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-linen-line bg-linen px-4 py-3">
      <p className="eyebrow text-cocoa-dim">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold text-cocoa">{value}</p>
      {sub && <p className="text-xs text-cocoa-dim">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const toast = useToast()
  const [scope, setScope] = useState<Scope>('date')
  const [date, setDate] = useState(isoPlusDays(1))
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all')

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [board, setBoard] = useState<TableAvailability[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState<Reservation | null>(null)
  const [toCancel, setToCancel] = useState<Reservation | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.listTables().then(setTables).catch(() => setTables([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: { date?: string; status?: string } = {}
      if (scope === 'date') params.date = date
      if (statusFilter !== 'all') params.status = statusFilter
      const [rows, floor] = await Promise.all([
        api.allReservations(params),
        scope === 'date' ? api.getAvailability({ date, guests: 1 }) : Promise.resolve([]),
      ])
      setReservations(rows)
      setBoard(floor)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load the book.')
      setReservations([])
      setBoard([])
    } finally {
      setLoading(false)
    }
  }, [scope, date, statusFilter, toast])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async () => {
    if (!toCancel) return
    setCancelling(true)
    try {
      await api.cancelReservation(toCancel.id)
      toast.success('Reservation cancelled.')
      setToCancel(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not cancel.')
    } finally {
      setCancelling(false)
    }
  }

  const confirmed = reservations.filter((r) => r.status === 'confirmed')
  const covers = confirmed.reduce((sum, r) => sum + r.guests, 0)
  const tablesSeated = new Set(confirmed.map((r) => r.tableId)).size

  return (
    <div className="flex flex-col gap-6">
      {/* Header + controls */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brass-deep">Host stand</p>
          <h1 className="mt-1.5 text-3xl text-cocoa">The reservation book</h1>
          <p className="mt-1 text-sm text-cocoa-dim">
            {scope === 'date' ? toLongDate(date) : 'Every reservation, all dates'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="inline-flex rounded-[var(--radius-sm)] border border-linen-line bg-linen p-0.5">
            <button
              onClick={() => setScope('date')}
              className={`rounded-[6px] px-3 py-1.5 text-sm transition-colors ${
                scope === 'date' ? 'bg-ink text-brass-soft' : 'text-cocoa-dim hover:text-cocoa'
              }`}
            >
              By date
            </button>
            <button
              onClick={() => setScope('all')}
              className={`rounded-[6px] px-3 py-1.5 text-sm transition-colors ${
                scope === 'all' ? 'bg-ink text-brass-soft' : 'text-cocoa-dim hover:text-cocoa'
              }`}
            >
              All
            </button>
          </div>
          {scope === 'date' && (
            <Input
              aria-label="Date"
              type="date"
              value={date}
              min={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 py-1.5"
            />
          )}
          <Select
            aria-label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-9 py-1.5"
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reservations" value={confirmed.length} sub={`${reservations.length} incl. cancelled`} />
        <Stat label="Covers" value={covers} sub="guests seated" />
        <Stat label="Tables in use" value={tablesSeated} sub={`of ${tables.length}`} />
        <Stat
          label={scope === 'date' ? 'Service' : 'Scope'}
          value={scope === 'date' ? 'Dinner' : 'All'}
          sub={scope === 'date' ? '5:00 – 10:00 PM' : 'every evening'}
        />
      </div>

      {/* Floor overview (by-date only) */}
      {scope === 'date' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linen-line px-5 py-4">
            <div>
              <p className="eyebrow text-brass-deep">Floor overview</p>
              <h2 className="mt-0.5 text-lg text-cocoa">Who’s holding what</h2>
            </div>
            <TimelineLegend />
          </div>
          {loading ? (
            <LoadingPanel label="Laying out the floor…" />
          ) : board.length === 0 ? (
            <EmptyState icon="🍽️" title="No active tables" description="Add tables from the Tables page." />
          ) : (
            <div className="px-2 py-3">
              <TimelineRuler />
              <div className="mt-1 flex flex-col divide-y divide-linen-line/70">
                {board.map((row) => (
                  <TableTimeline key={row.table.id} table={row.table} bookedSlots={row.bookedSlots} date={date} />
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reservation list */}
      <div>
        <h2 className="eyebrow mb-3 text-cocoa-dim">
          {scope === 'date' ? 'Bookings this date' : 'All bookings'} · {reservations.length}
        </h2>
        {loading ? (
          <Card>
            <LoadingPanel label="Turning the pages…" />
          </Card>
        ) : reservations.length === 0 ? (
          <Card>
            <EmptyState
              icon="📖"
              title="Nothing booked"
              description={
                scope === 'date'
                  ? 'No reservations for this date yet.'
                  : 'The book is empty for the current filter.'
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {reservations.map((r) => (
              <ReservationTicket
                key={r.id}
                reservation={r}
                showGuest
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(r)}>
                      Edit
                    </Button>
                    {r.status === 'confirmed' && (
                      <Button variant="danger" size="sm" onClick={() => setToCancel(r)}>
                        Cancel
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      <EditReservationModal
        reservation={editing}
        tables={tables}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />

      <Modal
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        eyebrow="Cancel reservation"
        title="Release this table?"
        footer={
          <>
            <Button variant="quiet" onClick={() => setToCancel(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={cancel} loading={cancelling}>
              Yes, cancel
            </Button>
          </>
        }
      >
        {toCancel && (
          <p className="text-sm text-cocoa-dim">
            {toCancel.user?.name}’s table{' '}
            <span className="font-semibold text-cocoa">{toCancel.table?.label}</span> at{' '}
            <span className="tabular">{toDisplayTime(toCancel.time)}</span> will be released.
          </p>
        )}
      </Modal>
    </div>
  )
}
