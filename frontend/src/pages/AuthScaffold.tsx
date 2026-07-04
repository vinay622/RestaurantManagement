import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/layout/Brand'
import { serviceSlots } from '../lib/time'

/** Shared two-panel frame for sign in / register.
 *  Left: dark "menu cover" atmosphere. Right: warm linen form. */
export function AuthScaffold({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-ink lg:grid-cols-[1.05fr_1fr]">
      {/* Atmosphere panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 50% at 25% 15%, color-mix(in oklab, var(--color-brass) 22%, transparent), transparent), radial-gradient(50% 40% at 90% 90%, color-mix(in oklab, var(--color-clay) 16%, transparent), transparent)',
          }}
          aria-hidden
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <Brand />
          <span className="font-[family-name:var(--font-display)] text-lg text-cream">Maison Lumière</span>
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow text-brass-soft">The reservation book</p>
          <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl leading-[1.05] text-cream xl:text-5xl">
            One room. A dozen tables.
            <span className="italic text-brass-soft"> Your evening, held.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-dim">
            Reserve a table for a specific date and time, and we hold it for you — no double bookings,
            no crossed wires at the host stand.
          </p>

          {/* A hint of the signature timeline */}
          <div className="mt-8 flex gap-1" aria-hidden>
            {serviceSlots().map((s, i) => (
              <span
                key={s}
                className="h-7 flex-1 rounded-[3px]"
                style={{
                  background:
                    i % 4 === 1 || i % 4 === 2
                      ? 'var(--color-brass)'
                      : 'color-mix(in oklab, var(--color-cream) 10%, transparent)',
                }}
              />
            ))}
          </div>
        </div>

        <p className="relative text-[0.6875rem] text-cream-dim">
          Est. this evening · reservations open nightly
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col items-center justify-center bg-linen p-6 sm:p-10">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Brand />
            <span className="font-[family-name:var(--font-display)] text-lg text-cocoa">Maison Lumière</span>
          </div>
          <p className="eyebrow text-brass-deep">{eyebrow}</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-cocoa">{title}</h2>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </div>
  )
}
