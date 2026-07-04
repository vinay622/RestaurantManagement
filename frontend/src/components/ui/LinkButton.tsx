import { Link, type LinkProps } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] ' +
  'transition-all duration-200 ease-[var(--ease-out)] select-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-brass text-ink shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_18px_rgba(201,162,75,0.28)] hover:bg-brass-soft hover:-translate-y-px',
  secondary:
    'bg-transparent text-cocoa border border-linen-line hover:border-brass hover:text-brass-deep',
  ghost: 'bg-transparent text-cream border border-plum-line hover:border-brass hover:text-brass-soft',
}

const sizes: Record<Size, string> = {
  sm: 'text-[0.8125rem] px-3 py-1.5 h-8',
  md: 'text-sm px-4 py-2 h-10',
  lg: 'text-[0.9375rem] px-6 py-2.5 h-12',
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
}

/** A router Link that looks like a Button — for navigation, not actions. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {leadingIcon}
      {children}
    </Link>
  )
}
