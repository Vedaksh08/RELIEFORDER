import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Minus, LogIn, AlertTriangle } from 'lucide-react'
import { supabase, supabaseReady, signInWithGoogle } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useCart } from '../lib/CartContext.jsx'
import { Shell, Spinner, Empty, inr } from './Shell.jsx'

function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg rounded-card bg-white p-6 text-center shadow-md">
      <AlertTriangle className="mx-auto mb-3 text-amber-500" size={28} />
      <h2 className="font-display mb-2 text-lg font-semibold">Setup needed</h2>
      <p className="text-sm text-ink-soft">
        Add <code className="rounded bg-black/5 px-1">VITE_SUPABASE_URL</code> and{' '}
        <code className="rounded bg-black/5 px-1">VITE_SUPABASE_ANON_KEY</code> to your{' '}
        <code className="rounded bg-black/5 px-1">.env</code> file, then restart the dev
        server.
      </p>
    </div>
  )
}

export function SignInGate() {
  return (
    <div className="mx-auto max-w-md rounded-card bg-white p-8 text-center shadow-md">
      <h2 className="font-display mb-2 text-xl font-semibold text-primary">
        Sign in to order
      </h2>
      <p className="mb-6 text-sm text-ink-soft">
        Use your Google account to place an order and track it.
      </p>
      <button
        onClick={signInWithGoogle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[.98]"
      >
        <LogIn size={18} />
        Continue with Google
      </button>
    </div>
  )
}

function QtyStepper({ item, med, add, setQty }) {
  if (!item) {
    return (
      <button
        disabled={med.stock <= 0}
        onClick={() => add(med, 1)}
        className="rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {med.stock > 0 ? 'Add' : 'Out of stock'}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1 rounded-btn bg-primary/10 p-1">
      <button
        onClick={() => setQty(med.id, item.qty - 1)}
        className="grid size-8 place-items-center rounded-lg bg-white text-primary shadow-sm active:scale-95"
        aria-label="Decrease"
      >
        <Minus size={15} />
      </button>
      <span className="w-7 text-center text-sm font-bold text-primary">{item.qty}</span>
      <button
        disabled={item.qty >= med.stock}
        onClick={() => setQty(med.id, item.qty + 1)}
        className="grid size-8 place-items-center rounded-lg bg-white text-primary shadow-sm active:scale-95 disabled:opacity-40"
        aria-label="Increase"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}

export default function OrderPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, add, setQty } = useCart()
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')

  useEffect(() => {
    if (!supabaseReady) return setLoading(false)
    supabase
      .from('medicines')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setMeds(data ?? [])
        setLoading(false)
      })
  }, [])

  const categories = useMemo(
    () => ['All', ...new Set(meds.map((m) => m.category).filter(Boolean))],
    [meds],
  )

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return meds.filter(
      (m) =>
        (cat === 'All' || m.category === cat) &&
        (!term ||
          m.name.toLowerCase().includes(term) ||
          (m.brand ?? '').toLowerCase().includes(term)),
    )
  }, [meds, q, cat])

  if (!supabaseReady)
    return (
      <Shell title="Order Medicines">
        <SetupNotice />
      </Shell>
    )
  if (authLoading)
    return (
      <Shell title="Order Medicines">
        <Spinner />
      </Shell>
    )
  if (!user)
    return (
      <Shell title="Order Medicines">
        <SignInGate />
      </Shell>
    )

  return (
    <Shell title="Order Medicines">
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicine or brand…"
            className="w-full rounded-btn border border-hairline bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
          />
        </div>

        {categories.length > 1 && (
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  cat === c
                    ? 'bg-primary text-white'
                    : 'bg-white text-ink-soft hover:bg-white/70'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading medicines…" />
      ) : shown.length === 0 ? (
        <Empty icon={Search} title="No medicines found">
          {meds.length === 0
            ? 'The catalogue is empty. Add medicines from the admin panel.'
            : 'Try a different search or category.'}
        </Empty>
      ) : (
        <div className="grid gap-2.5 min-[560px]:grid-cols-2 sm:gap-3">
          {shown.map((m) => {
            const item = items.find((i) => i.id === m.id)
            const low = m.stock > 0 && m.stock <= 10
            return (
              <div
                key={m.id}
                className="flex items-center gap-2.5 rounded-card bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-3 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate font-semibold text-ink">{m.name}</p>
                  {m.brand && <p className="truncate text-xs text-ink-soft">{m.brand}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-primary">
                      {inr(m.price)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        m.stock <= 0
                          ? 'bg-red-100 text-red-600'
                          : low
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {m.stock <= 0 ? 'Out of stock' : `${m.stock} in stock`}
                    </span>
                  </div>
                </div>
                <QtyStepper item={item} med={m} add={add} setQty={setQty} />
              </div>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
