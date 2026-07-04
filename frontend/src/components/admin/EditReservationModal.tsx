import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Field'
import { Textarea } from '../ui/Field'
import { api } from '../../lib/api'
import { ApiError } from '../../lib/http'
import { useToast } from '../ui/Toast'
import { serviceSlots, toDisplayTime, todayIso } from '../../lib/time'
import type { Reservation, ReservationStatus, RestaurantTable } from '../../types'

interface Props {
  reservation: Reservation | null
  tables: RestaurantTable[]
  onClose: () => void
  onSaved: () => void
}

export function EditReservationModal({ reservation, tables, onClose, onSaved }: Props) {
  const toast = useToast()
  const [tableId, setTableId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(2)
  const [status, setStatus] = useState<ReservationStatus>('confirmed')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!reservation) return
    setTableId(reservation.tableId)
    setDate(reservation.date)
    setTime(reservation.time)
    setGuests(reservation.guests)
    setStatus(reservation.status)
    setNotes(reservation.notes ?? '')
    setError('')
  }, [reservation])

  const table = tables.find((t) => t.id === tableId)
  const overCapacity = table ? guests > table.capacity : false

  const save = async () => {
    if (!reservation) return
    if (overCapacity) {
      setError(`Table ${table?.label} seats ${table?.capacity}.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.updateReservation(reservation.id, { tableId, date, time, guests, status, notes })
      toast.success('Reservation updated.')
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!reservation}
      onClose={onClose}
      eyebrow={`Reservation · ${reservation?.user?.name ?? ''}`}
      title="Edit booking"
      size="lg"
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={overCapacity}>
            Save changes
          </Button>
        </>
      }
    >
      {error && (
        <div
          className="mb-4 rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-clay)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-clay)_10%,var(--color-linen))] px-3.5 py-2.5 text-sm text-clay-deep"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Table" value={tableId} onChange={(e) => setTableId(e.target.value)}>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} · seats {t.capacity}
              {t.location ? ` · ${t.location}` : ''}
            </option>
          ))}
        </Select>
        <Select
          label="Guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          error={overCapacity ? `Exceeds capacity of ${table?.capacity}` : undefined}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} />
        <Select label="Time" value={time} onChange={(e) => setTime(e.target.value)}>
          {serviceSlots().map((s) => (
            <option key={s} value={s}>
              {toDisplayTime(s)}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReservationStatus)}
        >
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <div className="sm:col-span-2">
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={280}
          />
        </div>
      </div>
    </Modal>
  )
}
