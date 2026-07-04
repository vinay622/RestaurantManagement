import { cn } from '../../lib/cn'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin', className)}
    />
  )
}

/** Full-panel loading state with a candle-flicker mark. */
export function LoadingPanel({ label = 'Setting the table…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-cocoa-dim">
      <span className="text-2xl animate-flicker" aria-hidden>
        🕯️
      </span>
      <p className="text-sm">{label}</p>
    </div>
  )
}
