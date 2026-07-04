import { Link } from 'react-router-dom'
import { Brand } from '../components/layout/Brand'
import { serviceSlots, toDisplayTime } from '../lib/time'

// A few pre-filled "evenings" so the hero shows a room breathing, not an empty grid.
const demoRows = [
  { label: 'T1', seats: 2, booked: [2, 3, 8, 9] },
  { label: 'T3', seats: 4, booked: [0, 1, 5, 6, 7] },
  { label: 'T5', seats: 6, booked: [4, 5, 10] },
  { label: 'T6', seats: 8, booked: [6, 7, 8] },
]

export default function Landing() {
  const slots = serviceSlots()

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Brand />
          <span className="font-[family-name:var(--font-display)] text-lg text-cream">Maison Lumière</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="px-3 py-1.5 text-sm text-cream-dim hover:text-cream">
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-[var(--radius-sm)] bg-brass px-3.5 py-1.5 text-sm font-medium text-ink hover:bg-brass-soft"
          >
            Book a table
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(50% 45% at 20% 10%, color-mix(in oklab, var(--color-brass) 18%, transparent), transparent), radial-gradient(45% 40% at 95% 30%, color-mix(in oklab, var(--color-clay) 14%, transparent), transparent)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-20">
          <div className="animate-rise">
            <p className="eyebrow text-brass-soft">The reservation book · one restaurant</p>
            <h1 className="mt-4 text-balance font-[family-name:var(--font-display)] text-5xl leading-[1.02] text-cream sm:text-6xl">
              Every table,
              <br />
              <span className="italic text-brass-soft">every seating,</span>
              <br />
              in one honest ledger.
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-cream-dim">
              Guests reserve a table for a date and time. The house sees the whole floor at a glance.
              Nothing gets booked twice — the book won’t allow it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-[var(--radius-sm)] bg-brass px-5 py-3 text-sm font-medium text-ink shadow-[0_8px_24px_rgba(201,162,75,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-brass-soft"
              >
                Reserve your table
              </Link>
              <Link
                to="/login"
                className="rounded-[var(--radius-sm)] border border-plum-line px-5 py-3 text-sm text-cream hover:border-brass hover:text-brass-soft"
              >
                I have an account
              </Link>
            </div>
          </div>

          {/* Signature: a live-feeling reservation board */}
          <div className="animate-fade rounded-[var(--radius-lg)] border border-plum-line bg-plum/60 p-5 shadow-[var(--shadow-lift)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow text-brass-soft">Tonight · dinner service</p>
              <span className="tabular text-[0.6875rem] text-cream-dim">
                {toDisplayTime(slots[0])} – {toDisplayTime(slots[slots.length - 1])}
              </span>
            </div>

            {/* time ruler */}
            <div className="mb-2 flex gap-1 pl-14">
              {slots.map((s, i) => (
                <span
                  key={s}
                  className="tabular flex-1 text-center text-[0.5rem] text-cream-dim"
                  style={{ opacity: i % 2 ? 0.5 : 1 }}
                >
                  {i % 2 === 0 ? s.slice(0, 5) : ''}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              {demoRows.map((row, ri) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="flex w-11 shrink-0 items-baseline gap-1">
                    <span className="tabular text-xs font-bold text-cream">{row.label}</span>
                    <span className="text-[0.5rem] text-cream-dim">{row.seats}p</span>
                  </div>
                  <div className="flex flex-1 gap-1">
                    {slots.map((s, i) => {
                      const booked = row.booked.includes(i)
                      return (
                        <span
                          key={s}
                          className="h-6 flex-1 rounded-[3px] transition-colors"
                          style={{
                            background: booked
                              ? 'var(--color-brass)'
                              : 'color-mix(in oklab, var(--color-cream) 8%, transparent)',
                            animation: booked ? `fade 0.5s ${ri * 0.08 + i * 0.02}s both` : undefined,
                          }}
                          aria-hidden
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-plum-line pt-3 text-[0.6875rem] text-cream-dim">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-[3px] bg-brass" aria-hidden /> Seated
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-3 w-4 rounded-[3px]"
                  style={{ background: 'color-mix(in oklab, var(--color-cream) 8%, transparent)' }}
                  aria-hidden
                />{' '}
                Open
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Three plain truths */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-plum-line bg-plum-line sm:grid-cols-3">
          {[
            { k: 'For guests', t: 'Book in three taps', d: 'Pick a date, a party size, a time. See exactly which tables are open before you commit.' },
            { k: 'For the house', t: 'The whole floor, one screen', d: 'Every reservation for any date, with the power to move or cancel any booking.' },
            { k: 'Always', t: 'No double bookings', d: 'The book checks every table for overlaps and capacity. A held table cannot be held twice.' },
          ].map((c) => (
            <div key={c.t} className="bg-ink p-6">
              <p className="eyebrow text-brass-soft">{c.k}</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl text-cream">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-dim">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-plum-line px-4 py-6">
        <p className="mx-auto max-w-6xl text-[0.6875rem] text-cream-dim">
          Maison Lumière · a single room, an evening, your table.
        </p>
      </footer>
    </div>
  )
}
