import { cn } from '../../lib/cn'

/** The house monogram — a lit taper inside a ring. Small, drawn, ours. */
export function Brand({ className, tone = 'brass' }: { className?: string; tone?: 'brass' | 'cream' }) {
  const stroke = tone === 'brass' ? 'var(--color-brass)' : 'var(--color-cream)'
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14.5" stroke={stroke} strokeWidth="1" opacity="0.55" />
      <rect x="14" y="14" width="4" height="10" rx="1" stroke={stroke} strokeWidth="1.4" />
      <path d="M16 14c0-2.2-1.6-3-1.6-5C14.4 7 16 6 16 6s1.6 1 1.6 3c0 2-1.6 2.8-1.6 5Z" fill={stroke} className="animate-flicker" />
      <line x1="11.5" y1="24" x2="20.5" y2="24" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ tone = 'cream' }: { tone?: 'brass' | 'cream' }) {
  return (
    <span className="flex items-baseline gap-2 leading-none">
      <span
        className="font-[family-name:var(--font-display)] text-[1.15rem] tracking-tight"
        style={{ color: tone === 'brass' ? 'var(--color-brass)' : 'var(--color-cream)' }}
      >
        Maison Lumière
      </span>
    </span>
  )
}
