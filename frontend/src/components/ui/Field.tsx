import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'

const controlBase =
  'w-full rounded-[var(--radius-sm)] border bg-linen text-cocoa placeholder:text-cocoa-dim/60 ' +
  'px-3.5 py-2.5 text-sm transition-colors duration-150 ' +
  'focus:outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-brass)_35%,transparent)] ' +
  'disabled:opacity-60'

function ringByError(error?: string) {
  return error
    ? 'border-[color-mix(in_oklab,var(--color-clay)_60%,transparent)] bg-[color-mix(in_oklab,var(--color-clay)_6%,var(--color-linen))]'
    : 'border-linen-line'
}

interface FieldShellProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, error, required, htmlFor, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-cocoa flex items-center gap-1">
          {label}
          {required && <span className="text-clay-deep">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-clay-deep flex items-center gap-1" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-cocoa-dim">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, required, className, id, ...rest }: InputProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <input
        id={fieldId}
        className={cn(controlBase, ringByError(error), className)}
        aria-invalid={!!error}
        required={required}
        {...rest}
      />
    </Field>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, required, className, id, ...rest }: TextareaProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        className={cn(controlBase, ringByError(error), 'resize-none min-h-20', className)}
        aria-invalid={!!error}
        required={required}
        {...rest}
      />
    </Field>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function Select({ label, hint, error, required, className, id, children, ...rest }: SelectProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <div className="relative">
        <select
          id={fieldId}
          className={cn(controlBase, ringByError(error), 'appearance-none pr-9 cursor-pointer', className)}
          aria-invalid={!!error}
          required={required}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cocoa-dim"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Field>
  )
}
