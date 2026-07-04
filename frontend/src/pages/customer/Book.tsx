import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ApiError } from '../../lib/http'
import { useToast } from '../../components/ui/Toast'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { LoadingPanel } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { TableTimeline, TimelineLegend, TimelineRuler } from '../../components/AvailabilityTimeline'
import { isoPlusDays, toDisplayTime, toLongDate, todayIso } from '../../lib/time'
import type { TableAvailability } from '../../types'

interface Selection {
  tableId: string
  time: string
}

const MAX_PARTY = 12

export default function Book() {
  const toast = useToast()
  const [date, setDate] = useState(isoPlusDays(1))
  const [guests, setGuests] = useState(2)
  const [notes, setNotes] = useState('')

  const [board, setBoard] = useState<TableAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useMemo(
    () => async (d: string, g: number) => {
      setLoading(true)
      try {
        const rows = await api.getAvailability({ date: d, guests: g })
        setBoard(rows)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Could not load availability.')
        setBoard([])
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    setSelection(null)
    load(date, guests)
  }, [date, guests, load])

  const selectedTable = board.find((b) => b.table.id === selection?.tableId)?.table
  const fittingTables = board.filter((b) => b.table.capacity >= guests).length

  const confirm = async () => {
    if (!selection) return
    setSubmitting(true)
    try {
      await api.createReservation({ tableId: selection.tableId, date, time: selection.time, guests, notes })
      toast.success(`Table ${selectedTable?.label} is yours — ${toDisplayTime(selection.time)}.`)
      setSelection(null)
      setNotes('')
      await load(date, guests) // reflect the new booking on the board
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not complete the reservation.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
      {/* Controls */}
      <Card className="p-5 lg:sticky lg:top-24">
        <p className="eyebrow text-brass-deep">Reserve a table</p>
        <h1 className="mt-1.5 text-2xl text-cocoa">Plan your evening</h1>
        <p className="mt-1 text-sm text-cocoa-dim">
          Choose a date and party size, then pick an open time on any table.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            min={todayIso()}
            max={isoPlusDays(60)}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select label="Guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
            {Array.from({ length: MAX_PARTY }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </Select>

          <div className="rounded-[var(--radius-sm)] border border-linen-line bg-linen-2 px-3.5 py-3">
            {selection ? (
              <div className="animate-fade">
                <p className="eyebrow text-brass-deep">Your selection</p>
                <p className="mt-1.5 text-sm text-cocoa">
                  <span className="font-semibold">Table {selectedTable?.label}</span>
                  {selectedTable?.location ? ` · ${selectedTable.location}` : ''}
                </p>
                <p className="tabular mt-0.5 text-sm text-cocoa-dim">
                  {toLongDate(date)} · {toDisplayTime(selection.time)} · {guests}{' '}
                  {guests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-cocoa-dim">
                No time chosen yet. Tap an open slot on the board →
              </p>
            )}
          </div>

          <Textarea
            label="Notes for the host"
            hint="Allergies, a celebration, a seating wish — optional."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={280}
            placeholder="Anniversary dinner; a quiet corner if possible."
          />

          <Button size="lg" onClick={confirm} disabled={!selection} loading={submitting} className="w-full">
            {selection ? 'Confirm reservation' : 'Pick a time to continue'}
          </Button>
          <p className="text-center text-xs text-cocoa-dim">
            Looking for your existing bookings?{' '}
            <Link to="/reservations" className="text-brass-deep underline-offset-2 hover:underline">
              My reservations
            </Link>
          </p>
        </div>
      </Card>

      {/* Availability board */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linen-line px-5 py-4">
          <div>
            <p className="eyebrow text-brass-deep">The floor · {toLongDate(date)}</p>
            <h2 className="mt-0.5 text-lg text-cocoa">
              {loading ? 'Reading the book…' : `${fittingTables} tables can seat ${guests}`}
            </h2>
          </div>
          <TimelineLegend />
        </div>

        {loading ? (
          <LoadingPanel label="Checking every table for openings…" />
        ) : board.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No tables to show"
            description="The house hasn’t set any tables for this evening yet."
          />
        ) : (
          <div className="px-2 py-3">
            <TimelineRuler />
            <div className="mt-1 flex flex-col divide-y divide-linen-line/70">
              {board.map((row) => (
                <TableTimeline
                  key={row.table.id}
                  table={row.table}
                  bookedSlots={row.bookedSlots}
                  guests={guests}
                  date={date}
                  selectedTime={selection?.tableId === row.table.id ? selection.time : undefined}
                  onPick={(time) => setSelection({ tableId: row.table.id, time })}
                />
              ))}
            </div>
            <p className="px-3 pt-3 text-xs text-cocoa-dim">
              Tables too small for {guests} {guests === 1 ? 'guest' : 'guests'} are dimmed. Each seating
              holds a table for about 90 minutes.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
