import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ApiError } from '../../lib/http'
import { useToast } from '../../components/ui/Toast'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { LoadingPanel } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import type { RestaurantTable } from '../../types'

interface FormState {
  label: string
  capacity: number
  location: string
  active: boolean
}

const blank: FormState = { label: '', capacity: 2, location: '', active: true }

export default function AdminTables() {
  const toast = useToast()
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState<RestaurantTable | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<RestaurantTable | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setTables(await api.listTables())
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load tables.')
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setForm(blank)
    setErrors({})
    setCreating(true)
  }

  const openEdit = (t: RestaurantTable) => {
    setForm({ label: t.label, capacity: t.capacity, location: t.location ?? '', active: t.active })
    setErrors({})
    setEditing(t)
  }

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.label.trim()) next.label = 'Give the table a label.'
    if (form.capacity < 1 || form.capacity > 20) next.capacity = 'Between 1 and 20 seats.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await api.updateTable(editing.id, form)
        toast.success(`Table ${form.label} updated.`)
      } else {
        await api.createTable(form)
        toast.success(`Table ${form.label} added to the floor.`)
      }
      close()
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the table.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (t: RestaurantTable) => {
    try {
      await api.updateTable(t.id, { active: !t.active })
      setTables((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update the table.')
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteTable(toDelete.id)
      toast.success(`Table ${toDelete.label} removed.`)
      setToDelete(null)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove the table.')
    } finally {
      setDeleting(false)
    }
  }

  const totalSeats = tables.filter((t) => t.active).reduce((s, t) => s + t.capacity, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-brass-deep">Host stand · setup</p>
          <h1 className="mt-1.5 text-3xl text-cocoa">Tables</h1>
          <p className="mt-1 text-sm text-cocoa-dim">
            {tables.length} tables · {totalSeats} seats when the room is full.
          </p>
        </div>
        <Button onClick={openCreate} leadingIcon={<span aria-hidden>＋</span>}>
          Add a table
        </Button>
      </div>

      {loading ? (
        <Card>
          <LoadingPanel label="Counting the chairs…" />
        </Card>
      ) : tables.length === 0 ? (
        <Card>
          <EmptyState
            icon="🪑"
            title="No tables yet"
            description="Add your first table to start taking reservations."
            action={<Button onClick={openCreate}>Add a table</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <Card key={t.id} interactive className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-sm)] bg-ink text-brass-soft ring-1 ring-plum-line">
                    <span className="tabular text-sm font-bold">{t.label}</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-cocoa">{t.location || 'Main floor'}</p>
                    <p className="tabular text-xs text-cocoa-dim">Seats {t.capacity}</p>
                  </div>
                </div>
                {t.active ? (
                  <Badge tone="sage" dot>
                    Active
                  </Badge>
                ) : (
                  <Badge tone="neutral">Off floor</Badge>
                )}
              </div>
              <div className="mt-auto flex items-center gap-2 border-t border-linen-line pt-3">
                <Button variant="secondary" size="sm" onClick={() => openEdit(t)}>
                  Edit
                </Button>
                <Button variant="quiet" size="sm" onClick={() => toggleActive(t)}>
                  {t.active ? 'Take off floor' : 'Put on floor'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setToDelete(t)}
                  aria-label={`Delete table ${t.label}`}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={creating || !!editing}
        onClose={close}
        eyebrow={editing ? 'Edit table' : 'New table'}
        title={editing ? `Table ${editing.label}` : 'Add a table'}
        footer={
          <>
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? 'Save changes' : 'Add table'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Label"
            placeholder="T7"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            error={errors.label}
            required
          />
          <Input
            label="Capacity"
            type="number"
            min={1}
            max={20}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            error={errors.capacity}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Location"
              hint="Where it sits — the host uses this to seat guests."
              placeholder="Window banquette"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2.5 text-sm text-cocoa">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-brass)]"
            />
            Available for reservations
          </label>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        eyebrow="Remove table"
        title={`Delete table ${toDelete?.label ?? ''}?`}
        footer={
          <>
            <Button variant="quiet" onClick={() => setToDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={remove} loading={deleting}>
              Delete table
            </Button>
          </>
        }
      >
        <p className="text-sm text-cocoa-dim">
          This removes the table from the floor. Tables with upcoming reservations can’t be deleted —
          cancel or move those bookings first.
        </p>
      </Modal>
    </div>
  )
}
