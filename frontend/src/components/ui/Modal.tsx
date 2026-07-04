import { useEffect, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, eyebrow, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm animate-fade"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        className={cn(
          'relative w-full rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] border border-linen-line',
          'bg-linen shadow-[var(--shadow-lift)] animate-rise',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            {eyebrow && <p className="eyebrow text-brass-deep mb-1">{eyebrow}</p>}
            {title && <h2 className="text-xl text-cocoa">{title}</h2>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-cocoa-dim hover:bg-[color-mix(in_oklab,var(--color-cocoa)_8%,transparent)] hover:text-cocoa transition-colors"
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-linen-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
