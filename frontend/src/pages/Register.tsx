import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthScaffold } from './AuthScaffold'
import { Input } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { ApiError } from '../lib/http'
import { USING_MOCK } from '../lib/api'
import { DEMO_ADMIN_CODE } from '../lib/mockAdapter'

interface Errors {
  name?: string
  email?: string
  password?: string
  accessCode?: string
}

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const validate = (): boolean => {
    const next: Errors = {}
    if (name.trim().length < 2) next.name = 'Please tell us your name.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 6) next.password = 'At least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setBusy(true)
    try {
      const user = await register({ name, email, password, accessCode: accessCode.trim() || undefined })
      toast.success(`Your account is ready, ${user.name.split(' ')[0]}.`)
      navigate(user.role === 'admin' ? '/admin' : '/book', { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create your account.'
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields)
        // Keep the code field open so its inline error is visible.
        if (err.fields.accessCode) setShowCode(true)
      }
      setFormError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthScaffold eyebrow="First time here" title="Create your account">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {formError && (
          <div
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-clay)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-clay)_10%,var(--color-linen))] px-3.5 py-2.5 text-sm text-clay-deep"
            role="alert"
          >
            {formError}
          </div>
        )}
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Jules Renard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        {showCode ? (
          <Input
            label="Access code"
            hint={
              USING_MOCK
                ? `Staff only. Demo code: ${DEMO_ADMIN_CODE}`
                : 'Staff only — leave blank if you’re a guest.'
            }
            autoComplete="off"
            placeholder="MAISON-••••••"
            value={accessCode}
            error={errors.accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value)
              if (errors.accessCode) setErrors((p) => ({ ...p, accessCode: undefined }))
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowCode(true)}
            className="self-start text-xs text-cocoa-dim underline-offset-2 hover:text-brass-deep hover:underline"
          >
            Have a staff access code?
          </button>
        )}

        <Button type="submit" size="lg" loading={busy} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-sm text-cocoa-dim">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brass-deep underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-xs text-cocoa-dim">
        New accounts join as guests. Administrator access is granted by the house.
      </p>
    </AuthScaffold>
  )
}
