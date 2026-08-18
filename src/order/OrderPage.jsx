import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Minus, LogIn, AlertTriangle } from 'lucide-react'
import { supabase, supabaseReady, signInWithGoogle } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useCart } from '../lib/CartContext.jsx'
import { Shell, Spinner, Empty, inr } from './Shell.jsx'
import CartBar from './CartBar.jsx'

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
        className="btn-add"
        aria-label={`Add ${med.name} to cart`}
      >
        {med.stock > 0 ? 'ADD' : 'Out'}
      </button>
    )
  }
  const atMax = item.qty >= med.stock
  return (
    <div className="stepper">
      <button
        onClick={() => setQty(med.id, item.qty - 1)}
        aria-label={`Reduce ${med.name}`}
      >
        <Minus size={14} strokeWidth={3} />
      </button>
      <span>{item.qty}</span>
      <button
        disabled={atMax}
        onClick={() => setQty(med.id, item.qty + 1)}
        aria-label={atMax ? 'No more stock' : `Add another ${med.name}`}
        title={atMax ? 'That is all the stock we have' : undefined}
      >
        <Plus size={14} strokeWidth={3} />
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
    <Shell title="Order Medicines" padForCartBar>
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
        <div className="grid grid-cols-2 gap-2.5 min-[520px]:grid-cols-3 lg:grid-cols-4 lg:gap-3">
          {shown.map((m) => {
            const item = items.find((i) => i.id === m.id)
            const low = m.stock > 0 && m.stock <= 10
            const out = m.stock <= 0
            return (
              <div key={m.id} className={`prod-card ${out ? 'is-out' : ''}`}>
                <div className="prod-thumb">{m.name.charAt(0).toUpperCase()}</div>

                <div className="flex flex-1 flex-col p-2.5">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                    {m.name}
                  </p>
                  {m.brand && (
                    <p className="mt-0.5 truncate text-[11px] text-ink-soft">{m.brand}</p>
                  )}

                  <span
                    className={`pill mt-1.5 w-fit ${
                      out ? 'pill-out' : low ? 'pill-low' : 'pill-ok'
                    }`}
                  >
                    {out ? 'Out of stock' : low ? `Only ${m.stock} left` : 'In stock'}
                  </span>

                  <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
                    <span className="font-display text-[15px] font-extrabold text-ink">
                      {inr(m.price)}
                    </span>
                    <QtyStepper item={item} med={m} add={add} setQty={setQty} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CartBar />
    </Shell>
  )
}
