import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ApiError } from '../../lib/http'
import { useToast } from '../../components/ui/Toast'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LinkButton } from '../../components/ui/LinkButton'
import { Modal } from '../../components/ui/Modal'
import { LoadingPanel } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ReservationTicket } from '../../components/ReservationTicket'
import { isPast, toDisplayTime } from '../../lib/time'
import type { Reservation } from '../../types'

export default function MyReservations() {
  const toast = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [toCancel, setToCancel] = useState<Reservation | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const rows = await api.myReservations()
      setReservations(rows)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load your reservations.')
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cancel = async () => {
    if (!toCancel) return
    setCancelling(true)
    try {
      await api.cancelReservation(toCancel.id)
      toast.success('Reservation cancelled. We hope to see you another evening.')
      setToCancel(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not cancel the reservation.')
    } finally {
      setCancelling(false)
    }
  }

  const upcoming = reservations.filter((r) => r.status === 'confirmed' && !isPast(r.date, r.time))
  const history = reservations.filter((r) => r.status !== 'confirmed' || isPast(r.date, r.time))

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brass-deep">Your table history</p>
          <h1 className="mt-1.5 text-3xl text-cocoa">My reservations</h1>
        </div>
        <LinkButton to="/book" variant="secondary" leadingIcon={<span aria-hidden>＋</span>}>
          Reserve another
        </LinkButton>
      </div>

      {loading ? (
        <Card>
          <LoadingPanel label="Opening your page in the book…" />
        </Card>
      ) : reservations.length === 0 ? (
        <Card>
          <EmptyState
            icon="🕯️"
            title="No reservations yet"
            description="When you book a table, it will appear here — with everything you need to plan the evening."
            action={<LinkButton to="/book">Reserve a table</LinkButton>}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="eyebrow mb-3 text-cocoa-dim">Upcoming · {upcoming.length}</h2>
            {upcoming.length === 0 ? (
              <Card className="p-6 text-center text-sm text-cocoa-dim">
                Nothing on the calendar.{' '}
                <Link to="/book" className="text-brass-deep underline-offset-2 hover:underline">
                  Book your next evening →
                </Link>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((r) => (
                  <ReservationTicket
                    key={r.id}
                    reservation={r}
                    actions={
                      <Button variant="danger" size="sm" onClick={() => setToCancel(r)}>
                        Cancel
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="eyebrow mb-3 text-cocoa-dim">Past & cancelled · {history.length}</h2>
              <div className="flex flex-col gap-3">
                {history.map((r) => (
                  <ReservationTicket key={r.id} reservation={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
            Table <span className="font-semibold text-cocoa">{toCancel.table?.label}</span> on{' '}
            <span className="tabular">{toCancel.date}</span> at{' '}
            <span className="tabular">{toDisplayTime(toCancel.time)}</span> will be released back to the
            floor. This can’t be undone.
          </p>
        )}
      </Modal>
    </div>
  )
}
