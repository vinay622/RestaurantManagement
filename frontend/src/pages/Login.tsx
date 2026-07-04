import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthScaffold } from './AuthScaffold'
import { Input } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { USING_MOCK } from '../lib/api'
import { ApiError } from '../lib/http'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login({ email, password })
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`)
      const dest = location.state?.from ?? (user.role === 'admin' ? '/admin' : '/book')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign you in.')
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (kind: 'admin' | 'guest') => {
    setEmail(kind === 'admin' ? 'admin@maison.test' : 'guest@maison.test')
    setPassword('password')
    setError('')
  }

  return (
    <AuthScaffold eyebrow="Welcome back" title="Sign in">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div
            className="rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--color-clay)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-clay)_10%,var(--color-linen))] px-3.5 py-2.5 text-sm text-clay-deep"
            role="alert"
          >
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={busy} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-sm text-cocoa-dim">
        New here?{' '}
        <Link to="/register" className="font-medium text-brass-deep underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>

      {USING_MOCK && (
        <div className="mt-8 rounded-[var(--radius-md)] border border-linen-line bg-linen-2 p-4">
          <p className="eyebrow text-cocoa-dim">Demo accounts</p>
          <div className="mt-2.5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fillDemo('guest')}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-linen-line bg-linen px-3 py-2 text-left text-sm hover:border-brass"
            >
              <span>
                <span className="font-medium text-cocoa">Guest</span>
                <span className="tabular ml-2 text-xs text-cocoa-dim">guest@maison.test</span>
              </span>
              <span className="text-xs text-brass-deep">Use →</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-linen-line bg-linen px-3 py-2 text-left text-sm hover:border-brass"
            >
              <span>
                <span className="font-medium text-cocoa">Maître d’ (admin)</span>
                <span className="tabular ml-2 text-xs text-cocoa-dim">admin@maison.test</span>
              </span>
              <span className="text-xs text-brass-deep">Use →</span>
            </button>
            <p className="tabular text-[0.6875rem] text-cocoa-dim">password · “password”</p>
          </div>
        </div>
      )}
    </AuthScaffold>
  )
}
