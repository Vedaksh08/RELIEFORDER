import { Link, useNavigate } from '@tanstack/react-router'
import { ShoppingCart, ArrowLeft, LogOut, Package, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { useCart } from '../lib/CartContext.jsx'
import { signOut } from '../lib/supabase.js'

export function Shell({ title, children, back = '/' }) {
  const { user, isAdmin } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#e2f7f2]">
      <header className="sticky top-0 z-30 border-b border-hairline bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            to={back}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>

          <h1 className="font-display truncate text-lg font-semibold text-primary">
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-1">
            {isAdmin && (
              <Link
                to="/admin"
                className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
                aria-label="Admin panel"
              >
                <LayoutDashboard size={18} />
              </Link>
            )}
            {user && (
              <Link
                to="/orders"
                className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
                aria-label="My orders"
              >
                <Package size={18} />
              </Link>
            )}
            <Link
              to="/cart"
              className="relative grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            {user && (
              <button
                onClick={async () => {
                  await signOut()
                  navigate({ to: '/order' })
                }}
                className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="grid place-items-center gap-3 py-20 text-ink-soft">
      <div className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function Empty({ icon: Icon = Package, title, children }) {
  return (
    <div className="grid place-items-center gap-3 rounded-card bg-white/70 py-16 text-center">
      <Icon size={32} className="text-ink-soft/50" />
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-sm text-ink-soft">{children}</p>}
    </div>
  )
}

const STATUS = {
  placed: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  delivered: 'bg-green-100 text-green-700',
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  )
}

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)
