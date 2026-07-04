import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute, GuestOnly } from './components/RouteGuards'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Book from './pages/customer/Book'
import MyReservations from './pages/customer/MyReservations'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTables from './pages/admin/Tables'
import NotFound from './pages/NotFound'

/** Any authenticated user, wrapped in the app chrome. */
function AppLayout({ requireAdmin = false }: { requireAdmin?: boolean }) {
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <AppShell>
        <Outlet />
      </AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />

      {/* Customer + admin share the booking + reservation views */}
      <Route element={<AppLayout />}>
        <Route path="/book" element={<Book />} />
        <Route path="/reservations" element={<MyReservations />} />
      </Route>

      {/* Admin-only wing */}
      <Route element={<AppLayout requireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tables" element={<AdminTables />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
