import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ToastTone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: 'border-l-sage text-cocoa',
  error: 'border-l-clay text-cocoa',
  info: 'border-l-brass text-cocoa',
}

const toneMark: Record<ToastTone, string> = {
  success: '✓',
  error: '!',
  info: '·',
}

const toneMarkColor: Record<ToastTone, string> = {
  success: 'bg-sage text-linen',
  error: 'bg-clay text-linen',
  info: 'bg-brass text-ink',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, tone, message }])
      setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex items-start gap-3 rounded-[var(--radius-sm)] border border-linen-line border-l-[3px] bg-linen px-3.5 py-3 shadow-[var(--shadow-lift)] animate-rise',
              toneStyles[t.tone],
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                toneMarkColor[t.tone],
              )}
              aria-hidden
            >
              {toneMark[t.tone]}
            </span>
            <p className="text-sm leading-snug">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="ml-auto -mr-1 rounded p-0.5 text-cocoa-dim hover:text-cocoa"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
