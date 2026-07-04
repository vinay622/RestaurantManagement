import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'brass' | 'sage' | 'clay' | 'neutral' | 'plum'

const tones: Record<Tone, string> = {
  brass: 'text-brass-deep bg-[color-mix(in_oklab,var(--color-brass)_16%,transparent)] border-[color-mix(in_oklab,var(--color-brass)_40%,transparent)]',
  sage: 'text-sage-deep bg-[color-mix(in_oklab,var(--color-sage)_16%,transparent)] border-[color-mix(in_oklab,var(--color-sage)_40%,transparent)]',
  clay: 'text-clay-deep bg-[color-mix(in_oklab,var(--color-clay)_14%,transparent)] border-[color-mix(in_oklab,var(--color-clay)_40%,transparent)]',
  neutral: 'text-cocoa-dim bg-[color-mix(in_oklab,var(--color-cocoa)_8%,transparent)] border-linen-line',
  plum: 'text-cream-dim bg-plum-2 border-plum-line',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot = false,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wider',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}
