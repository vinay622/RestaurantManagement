import { Link } from 'react-router-dom'
import { Brand } from '../components/layout/Brand'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-center">
      <div className="animate-rise">
        <Brand className="mx-auto h-12 w-12" />
        <p className="eyebrow mt-6 text-brass-soft">Not on the list</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-cream">
          This page isn’t in the book.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-cream-dim">
          The table you’re looking for may have been moved or never existed.
        </p>
        <Link
          to="/"
          className="mt-7 inline-block rounded-[var(--radius-sm)] bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-soft"
        >
          Back to the entrance
        </Link>
      </div>
    </div>
  )
}
