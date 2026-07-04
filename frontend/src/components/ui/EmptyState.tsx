import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && (
        <div className="text-3xl opacity-70" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="text-lg text-cocoa">{title}</h3>
      {description && <p className="max-w-sm text-sm text-cocoa-dim">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
