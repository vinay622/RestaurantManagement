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

/** The single surface both the live backend and the mock implement. */
export interface Api {
  // Auth
  login(req: LoginRequest): Promise<AuthResponse>
  register(req: RegisterRequest): Promise<AuthResponse>
  me(): Promise<User>

  // Tables (admin manages; everyone can read for booking)
  listTables(): Promise<RestaurantTable[]>
  createTable(req: Omit<RestaurantTable, 'id' | 'createdAt' | 'active'> & { active?: boolean }): Promise<RestaurantTable>
  updateTable(id: string, req: Partial<Omit<RestaurantTable, 'id'>>): Promise<RestaurantTable>
  deleteTable(id: string): Promise<void>

  // Availability for a given evening + party size (+ optional slot)
  getAvailability(params: { date: string; guests: number; time?: string }): Promise<TableAvailability[]>

  // Customer reservations
  createReservation(req: CreateReservationRequest): Promise<Reservation>
  myReservations(): Promise<Reservation[]>
  cancelReservation(id: string): Promise<Reservation>

  // Admin reservations
  allReservations(params?: { date?: string; status?: string }): Promise<Reservation[]>
  updateReservation(id: string, req: UpdateReservationRequest): Promise<Reservation>
}
