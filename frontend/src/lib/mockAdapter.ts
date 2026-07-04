// ============================================================
// In-memory mock backend.
// Lets the whole app run standalone with realistic behaviour —
// seeded tables, two demo accounts, and the SAME availability
// rule the real server enforces. State persists to localStorage
// so a demo survives reloads. Swapped out for real HTTP the
// moment VITE_API_URL is set (see api.ts).
// ============================================================

import type { Api } from './apiContract'
import { ApiError, TOKEN_KEY } from './http'
import { DINING_DURATION_MIN, isPast, overlaps, todayIso, isoPlusDays } from './time'
import type {
  AuthResponse,
  CreateReservationRequest,
  LoginRequest,
  RegisterRequest,
  Reservation,
  RestaurantTable,
  Role,
  TableAvailability,
  UpdateReservationRequest,
  User,
} from '../types'

interface StoredUser extends User {
  password: string
}

interface DB {
  users: StoredUser[]
  tables: RestaurantTable[]
  reservations: Reservation[]
}

const DB_KEY = 'ml.mockdb.v1'
export const DEMO_ADMIN_CODE = 'MAISON-ADMIN'
const uid = () => Math.random().toString(36).slice(2, 10)
const delay = <T>(v: T, ms = 260): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms))

function seed(): DB {
  const users: StoredUser[] = [
    { id: 'u-admin', name: 'Margaux Vane', email: 'admin@maison.test', password: 'password', role: 'admin', createdAt: new Date().toISOString() },
    { id: 'u-guest', name: 'Jules Renard', email: 'guest@maison.test', password: 'password', role: 'customer', createdAt: new Date().toISOString() },
  ]
  const tables: RestaurantTable[] = [
    { id: 't-1', label: 'T1', capacity: 2, location: 'Window banquette', active: true },
    { id: 't-2', label: 'T2', capacity: 2, location: 'Window banquette', active: true },
    { id: 't-3', label: 'T3', capacity: 4, location: 'Main floor', active: true },
    { id: 't-4', label: 'T4', capacity: 4, location: 'Main floor', active: true },
    { id: 't-5', label: 'T5', capacity: 6, location: 'The alcove', active: true },
    { id: 't-6', label: 'T6', capacity: 8, location: "Chef's table", active: true },
  ].map((t) => ({ ...t, createdAt: new Date().toISOString() }))

  // A couple of standing reservations for tomorrow so the timeline isn't empty.
  const reservations: Reservation[] = [
    {
      id: uid(), tableId: 't-3', userId: 'u-guest', date: isoPlusDays(1), time: '19:00',
      durationMinutes: DINING_DURATION_MIN, guests: 3, status: 'confirmed', notes: 'Anniversary',
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(), tableId: 't-5', userId: 'u-guest', date: isoPlusDays(1), time: '20:00',
      durationMinutes: DINING_DURATION_MIN, guests: 5, status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
  ]
  return { users, tables, reservations }
}

function load(): DB {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as DB
    } catch {
      /* fall through to reseed */
    }
  }
  const db = seed()
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  return db
}

function save(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

// --- fake JWT: encodes the user id so `me()` can resolve it ---
const makeToken = (userId: string) => `mock.${btoa(userId)}.${uid()}`
const readToken = (): string | null => {
  const t = localStorage.getItem(TOKEN_KEY)
  if (!t?.startsWith('mock.')) return null
  try {
    return atob(t.split('.')[1])
  } catch {
    return null
  }
}

function publicUser(u: StoredUser): User {
  const { password: _pw, ...rest } = u
  void _pw
  return rest
}

function hydrate(db: DB, r: Reservation): Reservation {
  const owner = db.users.find((u) => u.id === r.userId)
  return {
    ...r,
    table: db.tables.find((t) => t.id === r.tableId),
    user: owner && { id: owner.id, name: owner.name, email: owner.email },
  }
}

function requireAuth(db: DB): StoredUser {
  const id = readToken()
  const user = id ? db.users.find((u) => u.id === id) : undefined
  if (!user) throw new ApiError('Please sign in to continue.', { status: 401 })
  return user
}

function requireAuthAdmin(db: DB): StoredUser {
  const user = requireAuth(db)
  if (user.role !== 'admin') throw new ApiError('Administrator access required.', { status: 403 })
  return user
}

/** The core rule, shared by create + update + availability. */
function findConflict(
  db: DB,
  input: { tableId: string; date: string; time: string },
  ignoreId?: string,
): Reservation | undefined {
  return db.reservations.find(
    (r) =>
      r.id !== ignoreId &&
      r.status === 'confirmed' &&
      r.tableId === input.tableId &&
      r.date === input.date &&
      overlaps(r.time, input.time),
  )
}

function sortByWhen(a: Reservation, b: Reservation): number {
  return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
}

export const mockApi: Api = {
  async login(req: LoginRequest): Promise<AuthResponse> {
    const db = load()
    const user = db.users.find((u) => u.email.toLowerCase() === req.email.trim().toLowerCase())
    if (!user || user.password !== req.password) {
      throw new ApiError('Email or password is incorrect.', { status: 401 })
    }
    return delay({ token: makeToken(user.id), user: publicUser(user) })
  },

  async register(req: RegisterRequest): Promise<AuthResponse> {
    const db = load()
    if (db.users.some((u) => u.email.toLowerCase() === req.email.trim().toLowerCase())) {
      throw new ApiError('An account with this email already exists.', { status: 409, fields: { email: 'already registered' } })
    }
    // In demo mode the house access code is "MAISON-ADMIN". No code → guest;
    // a wrong code → rejected (mirrors the real backend).
    const code = req.accessCode?.trim()
    let role: Role = 'customer'
    if (code) {
      if (code === DEMO_ADMIN_CODE) {
        role = 'admin'
      } else {
        throw new ApiError('Invalid access code.', {
          status: 400,
          fields: { accessCode: 'invalid access code' },
        })
      }
    }
    const user: StoredUser = {
      id: uid(), name: req.name.trim(), email: req.email.trim(), password: req.password, role,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    save(db)
    return delay({ token: makeToken(user.id), user: publicUser(user) })
  },

  async me(): Promise<User> {
    const db = load()
    return delay(publicUser(requireAuth(db)), 120)
  },

  async listTables(): Promise<RestaurantTable[]> {
    const db = load()
    return delay([...db.tables].sort((a, b) => a.label.localeCompare(b.label)))
  },

  async createTable(req): Promise<RestaurantTable> {
    const db = load()
    requireAuthAdmin(db)
    const table: RestaurantTable = {
      id: uid(), label: req.label.trim(), capacity: req.capacity,
      location: req.location?.trim() || undefined, active: req.active ?? true,
      createdAt: new Date().toISOString(),
    }
    db.tables.push(table)
    save(db)
    return delay(table)
  },

  async updateTable(id, req): Promise<RestaurantTable> {
    const db = load()
    requireAuthAdmin(db)
    const table = db.tables.find((t) => t.id === id)
    if (!table) throw new ApiError('Table not found.', { status: 404 })
    Object.assign(table, {
      label: req.label?.trim() ?? table.label,
      capacity: req.capacity ?? table.capacity,
      location: req.location !== undefined ? req.location.trim() || undefined : table.location,
      active: req.active ?? table.active,
    })
    save(db)
    return delay(table)
  },

  async deleteTable(id): Promise<void> {
    const db = load()
    requireAuthAdmin(db)
    const hasUpcoming = db.reservations.some(
      (r) => r.tableId === id && r.status === 'confirmed' && !isPast(r.date, r.time),
    )
    if (hasUpcoming) {
      throw new ApiError('This table has upcoming reservations. Cancel or move them first.', { status: 409 })
    }
    db.tables = db.tables.filter((t) => t.id !== id)
    save(db)
    return delay(undefined)
  },

  async getAvailability({ date, guests, time }): Promise<TableAvailability[]> {
    const db = load()
    const result: TableAvailability[] = db.tables
      .filter((t) => t.active)
      .map((table) => {
        const bookedSlots = db.reservations
          .filter((r) => r.status === 'confirmed' && r.tableId === table.id && r.date === date)
          .map((r) => r.time)
        const fitsParty = table.capacity >= guests
        const slotFree = time ? !findConflict(db, { tableId: table.id, date, time }) : true
        return { table, bookedSlots, availableForRequest: fitsParty && slotFree }
      })
      .sort((a, b) => a.table.capacity - b.table.capacity || a.table.label.localeCompare(b.table.label))
    return delay(result)
  },

  async createReservation(req: CreateReservationRequest): Promise<Reservation> {
    const db = load()
    const user = requireAuth(db)
    const table = db.tables.find((t) => t.id === req.tableId)
    if (!table || !table.active) throw new ApiError('That table is not available.', { status: 404 })
    if (req.guests < 1) throw new ApiError('A reservation needs at least one guest.', { status: 400, fields: { guests: 'must be at least 1' } })
    if (req.guests > table.capacity) {
      throw new ApiError(`${table.label} seats ${table.capacity}. Please choose a larger table.`, { status: 422, fields: { guests: `exceeds capacity of ${table.capacity}` } })
    }
    if (isPast(req.date, req.time)) throw new ApiError('That seating is in the past.', { status: 422, fields: { time: 'already passed' } })
    if (findConflict(db, req)) {
      throw new ApiError(`${table.label} is already booked around ${req.time}. Try another time or table.`, { status: 409 })
    }
    const reservation: Reservation = {
      id: uid(), tableId: req.tableId, userId: user.id, date: req.date, time: req.time,
      durationMinutes: DINING_DURATION_MIN, guests: req.guests, status: 'confirmed',
      notes: req.notes?.trim() || undefined, createdAt: new Date().toISOString(),
    }
    db.reservations.push(reservation)
    save(db)
    return delay(hydrate(db, reservation))
  },

  async myReservations(): Promise<Reservation[]> {
    const db = load()
    const user = requireAuth(db)
    const mine = db.reservations
      .filter((r) => r.userId === user.id)
      .map((r) => hydrate(db, r))
      .sort(sortByWhen)
    return delay(mine)
  },

  async cancelReservation(id): Promise<Reservation> {
    const db = load()
    const user = requireAuth(db)
    const r = db.reservations.find((x) => x.id === id)
    if (!r) throw new ApiError('Reservation not found.', { status: 404 })
    if (r.userId !== user.id && user.role !== 'admin') throw new ApiError('You can only cancel your own reservations.', { status: 403 })
    r.status = 'cancelled'
    save(db)
    return delay(hydrate(db, r))
  },

  async allReservations(params): Promise<Reservation[]> {
    const db = load()
    requireAuthAdmin(db)
    let list = db.reservations.map((r) => hydrate(db, r))
    if (params?.date) list = list.filter((r) => r.date === params.date)
    if (params?.status) list = list.filter((r) => r.status === params.status)
    return delay(list.sort(sortByWhen))
  },

  async updateReservation(id, req: UpdateReservationRequest): Promise<Reservation> {
    const db = load()
    requireAuthAdmin(db)
    const r = db.reservations.find((x) => x.id === id)
    if (!r) throw new ApiError('Reservation not found.', { status: 404 })
    const next = {
      tableId: req.tableId ?? r.tableId,
      date: req.date ?? r.date,
      time: req.time ?? r.time,
      guests: req.guests ?? r.guests,
    }
    const table = db.tables.find((t) => t.id === next.tableId)
    if (!table) throw new ApiError('That table is not available.', { status: 404 })
    if (next.guests > table.capacity) {
      throw new ApiError(`${table.label} seats ${table.capacity}.`, { status: 422, fields: { guests: `exceeds capacity of ${table.capacity}` } })
    }
    const status = req.status ?? r.status
    if (status === 'confirmed' && findConflict(db, next, r.id)) {
      throw new ApiError(`${table.label} is already booked around ${next.time}.`, { status: 409 })
    }
    Object.assign(r, next, { status, notes: req.notes !== undefined ? req.notes.trim() || undefined : r.notes })
    save(db)
    return delay(hydrate(db, r))
  },
}

/** Utility for demos: wipe and reseed the mock DB. */
export function resetMockDb() {
  localStorage.removeItem(DB_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export const MOCK_TODAY = todayIso()
