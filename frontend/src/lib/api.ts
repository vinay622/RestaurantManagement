// ============================================================
// The API the app talks to.
// If VITE_API_URL is set at build time we hit the real backend;
// otherwise we fall back to the in-memory mock so the frontend
// is fully usable on its own. The rest of the app only ever
// imports `api` — it never knows which is behind it.
// ============================================================

import type { Api } from './apiContract'
import { http } from './http'
import { mockApi } from './mockAdapter'
import type {
  AuthResponse,
  CreateReservationRequest,
  LoginRequest,
  RegisterRequest,
  Reservation,
  RestaurantTable,
  TableAvailability,
  UpdateReservationRequest,
  User,
} from '../types'

export const USING_MOCK = !import.meta.env.VITE_API_URL

const liveApi: Api = {
  login: (req: LoginRequest) => http.post<AuthResponse>('/auth/login', req).then((r) => r.data),
  register: (req: RegisterRequest) => http.post<AuthResponse>('/auth/register', req).then((r) => r.data),
  me: () => http.get<User>('/auth/me').then((r) => r.data),

  listTables: () => http.get<RestaurantTable[]>('/tables').then((r) => r.data),
  createTable: (req) => http.post<RestaurantTable>('/tables', req).then((r) => r.data),
  updateTable: (id, req) => http.post<RestaurantTable>(`/tables/update?id=${id}`, req).then((r) => r.data),
  deleteTable: (id) => http.post(`/tables/delete?id=${id}`).then(() => undefined),

  getAvailability: ({ date, guests, time }) =>
    http
      .get<TableAvailability[]>('/availability', { params: { date, guests, time } })
      .then((r) => r.data),

  createReservation: (req: CreateReservationRequest) =>
    http.post<Reservation>('/reservations', req).then((r) => r.data),
  myReservations: () => http.get<Reservation[]>('/reservations/mine').then((r) => r.data),
  cancelReservation: (id) => http.post<Reservation>(`/reservations/cancel?id=${id}`).then((r) => r.data),

  allReservations: (params) =>
    http.get<Reservation[]>('/admin/reservations', { params }).then((r) => r.data),
  updateReservation: (id, req: UpdateReservationRequest) =>
    http.post<Reservation>(`/admin/reservations/update?id=${id}`, req).then((r) => r.data),
}

export const api: Api = USING_MOCK ? mockApi : liveApi
