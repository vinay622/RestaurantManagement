import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { USING_MOCK } from '../../lib/api'
import { Brand, Wordmark } from './Brand'

interface NavItem {
  to: string
  label: string
}

const customerNav: NavItem[] = [
  { to: '/book', label: 'Reserve a table' },
  { to: '/reservations', label: 'My reservations' },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'The book' },
  { to: '/admin/tables', label: 'Tables' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = isAdmin ? adminNav : customerNav

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      {/* Menu-cover header */}
      <header className="sticky top-0 z-40 border-b border-plum-line bg-ink/95 backdrop-blur">
        {isAdmin && (
          <div className="bg-brass/95 text-ink">
            <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.2em]">
              <span aria-hidden>✦</span> Host stand · administrator
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={user ? (isAdmin ? '/admin' : '/book') : '/'} className="flex items-center gap-2.5">
            <Brand />
            <Wordmark />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {user &&
              nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-plum-2 text-brass-soft'
                        : 'text-cream-dim hover:bg-plum hover:text-cream',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          {/* Account */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-sm leading-tight text-cream">{user.name}</p>
                  <p className="text-[0.6875rem] uppercase tracking-wider text-cream-dim">
                    {isAdmin ? 'Maître d’' : 'Guest'}
                  </p>
                </div>
                <span
                  className="grid h-9 w-9 place-items-center rounded-full bg-plum-2 text-xs font-bold text-brass-soft ring-1 ring-plum-line"
                  aria-hidden
                >
                  {initials}
                </span>
                <button
                  onClick={onLogout}
                  className="hidden rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm text-cream-dim hover:text-cream sm:block"
                >
                  Sign out
                </button>
                <button
                  className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-cream-dim hover:text-cream md:hidden"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                    <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 text-sm text-cream-dim hover:text-cream">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-[var(--radius-sm)] bg-brass px-3.5 py-1.5 text-sm font-medium text-ink hover:bg-brass-soft"
                >
                  Book a table
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav drawer */}
        {user && menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-plum-line px-4 py-3 md:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--radius-sm)] px-3 py-2 text-sm',
                    isActive ? 'bg-plum-2 text-brass-soft' : 'text-cream-dim hover:bg-plum',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={onLogout}
              className="mt-1 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-cream-dim hover:bg-plum"
            >
              Sign out
            </button>
          </nav>
        )}
      </header>

      {/* Linen page */}
      <main className="flex-1 bg-linen">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">{children}</div>
      </main>

      <footer className="border-t border-plum-line bg-ink px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-[0.6875rem] text-cream-dim sm:flex-row">
          <span>Maison Lumière · a single room, an evening, your table.</span>
          {USING_MOCK && (
            <span className="rounded-full border border-plum-line px-2 py-0.5 tabular">
              demo mode · data lives in your browser
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}
