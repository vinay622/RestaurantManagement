import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingPanel } from './ui/Spinner'

/** Requires any signed-in user. Optionally requires the admin role. */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: ReactNode
  requireAdmin?: boolean
}) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoadingPanel label="Checking your reservation book…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireAdmin && !isAdmin) {
    // A guest who wanders into the admin wing is sent to their own view.
    return <Navigate to="/reservations" replace />
  }

  return <>{children}</>
}

/** For login/register: bounce already-authenticated users to their home.
 *  Guests land on the booking page — the same target Login navigates to —
 *  so the two never race to different routes. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={isAdmin ? '/admin' : '/book'} replace />
  return <>{children}</>
}
