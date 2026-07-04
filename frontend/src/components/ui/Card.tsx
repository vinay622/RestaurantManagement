import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift for interactive cards. */
  interactive?: boolean
}

/** A warm linen "page" panel. The primary content surface. */
export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-linen-line bg-linen shadow-[var(--shadow-page)]',
        interactive &&
          'transition-all duration-200 ease-[var(--ease-out)] hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    />
  )
}
