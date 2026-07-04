// ============================================================
// Domain types — shared across the whole client.
// Field names are camelCase; the API client converts to/from
// snake_case at the wire boundary.
// ============================================================

export type Role = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface RestaurantTable {
  id: string
  /** Human label shown to guests, e.g. "T4" or "Window 2". */
  label: string
  /** Seats the table can hold. */
  capacity: number
  /** A short note the host stand keeps: "by the window", "banquette". */
  location?: string
  active: boolean
  createdAt?: string
}

export type ReservationStatus = 'confirmed' | 'cancelled'

export interface Reservation {
  id: string
  tableId: string
  userId: string
  /** ISO date, no time, e.g. "2026-07-04". */
  date: string
  /** 24h start time on the grid, e.g. "19:30". */
  time: string
  /** Minutes the party holds the table. */
  durationMinutes: number
  guests: number
  status: ReservationStatus
  notes?: string
  createdAt: string
  // Convenience fields the API may hydrate for display.
  table?: RestaurantTable
  user?: Pick<User, 'id' | 'name' | 'email'>
}

// ---- Request shapes ----------------------------------------

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  /** Optional: the house access code grants the admin role. */
  accessCode?: string
}

export interface CreateReservationRequest {
  tableId: string
  date: string
  time: string
  guests: number
  notes?: string
}

export interface UpdateReservationRequest {
  tableId?: string
  date?: string
  time?: string
  guests?: number
  notes?: string
  status?: ReservationStatus
}

/** One table's standing on a given evening, used by the timeline. */
export interface TableAvailability {
  table: RestaurantTable
  /** Slots (start times) already taken by confirmed reservations. */
  bookedSlots: string[]
  /** Whether this table can seat the requested party at the chosen slot. */
  availableForRequest: boolean
}
