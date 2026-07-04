import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leadingIcon?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] ' +
  'transition-all duration-200 ease-[var(--ease-out)] select-none ' +
  'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-brass text-ink shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_18px_rgba(201,162,75,0.28)] ' +
    'hover:bg-brass-soft hover:-translate-y-px active:translate-y-0',
  secondary:
    'bg-transparent text-cocoa border border-linen-line hover:border-brass hover:text-brass-deep ' +
    'hover:bg-[color-mix(in_oklab,var(--color-brass)_8%,transparent)]',
  ghost: 'bg-transparent text-cream border border-plum-line hover:border-brass hover:text-brass-soft',
  danger:
    'bg-transparent text-clay-deep border border-[color-mix(in_oklab,var(--color-clay)_45%,transparent)] ' +
    'hover:bg-[color-mix(in_oklab,var(--color-clay)_12%,transparent)] hover:border-clay',
  quiet: 'bg-transparent text-cocoa-dim hover:text-cocoa hover:bg-[color-mix(in_oklab,var(--color-cocoa)_6%,transparent)]',
}

const sizes: Record<Size, string> = {
  sm: 'text-[0.8125rem] px-3 py-1.5 h-8',
  md: 'text-sm px-4 py-2 h-10',
  lg: 'text-[0.9375rem] px-6 py-2.5 h-12',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  )
}
