import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Minus, LogIn, AlertTriangle } from 'lucide-react'
import { supabase, supabaseReady, signInWithGoogle } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { useCart } from '../lib/CartContext.jsx'
import { Shell, Spinner, Empty, inr } from './Shell.jsx'
import CartBar from './CartBar.jsx'
import { ProductSkeleton } from './Skeleton.jsx'

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

const PAGE_SIZE = 60

export default function OrderPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, add, setQty } = useCart()
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [cat, setCat] = useState('All')
  const [categories, setCategories] = useState(['All'])

  // typing stays smooth because we only hit the database once you pause
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  // categories come from a tiny dedicated query, not from the page of rows
  // currently on screen, so the filter list is complete from the start
  useEffect(() => {
    if (!supabaseReady) return
    supabase
      .from('medicines')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)
      .then(({ data }) => {
        // "medicine" and "Medicine" are the same shelf to a customer, so the
        // chips are de-duplicated case-insensitively and shown in Title Case.
        const seen = new Map()
        for (const r of data ?? []) {
          const raw = (r.category ?? '').trim()
          if (!raw) continue
          const key = raw.toLowerCase()
          if (!seen.has(key)) {
            seen.set(key, raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase())
          }
        }
        setCategories([
          'All',
          ...[...seen.values()].sort((a, b) => a.localeCompare(b)),
        ])
      })
  }, [])

  const buildQuery = useCallback(() => {
    let query = supabase
      .from('medicines')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
    // ilike, because the chip label is normalised but the stored values
    // still vary in case
    if (cat !== 'All') query = query.ilike('category', cat)
    if (debouncedQ) {
      // match either the medicine or its brand
      const safe = debouncedQ.replace(/[%,()]/g, ' ')
      query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`)
    }
    // in-stock items first so customers see what they can actually buy
    return query.order('stock', { ascending: false }).order('name')
  }, [cat, debouncedQ])

  // first page whenever the search or category changes
  useEffect(() => {
    if (!supabaseReady) return setLoading(false)
    let active = true
    setLoading(true)
    setPage(0)
    buildQuery()
      .range(0, PAGE_SIZE - 1)
      .then(({ data, count }) => {
        if (!active) return
        setMeds(data ?? [])
        setTotal(count ?? 0)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [buildQuery])

  const loadMore = async () => {
    setLoadingMore(true)
    const next = page + 1
    const { data } = await buildQuery().range(
      next * PAGE_SIZE,
      next * PAGE_SIZE + PAGE_SIZE - 1,
    )
    setMeds((cur) => [...cur, ...(data ?? [])])
    setPage(next)
    setLoadingMore(false)
  }

  const shown = meds

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
      <div className="mb-4 flex w-full max-w-full flex-col gap-3">
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

      {!loading && total > 0 && (
        <p className="mb-2.5 text-xs text-ink-soft">
          {total.toLocaleString('en-IN')} medicine{total === 1 ? '' : 's'}
          {debouncedQ && ` matching “${debouncedQ}”`}
          {cat !== 'All' && ` in ${cat}`}
        </p>
      )}

      {loading ? (
        <ProductSkeleton />
      ) : shown.length === 0 ? (
        <Empty icon={Search} title="No medicines found">
          {debouncedQ || cat !== 'All'
            ? 'Try a different search or category.'
            : 'The catalogue is empty. Add medicines from the admin panel.'}
        </Empty>
      ) : (
        <div className="grid gap-2.5 min-[620px]:grid-cols-2 sm:gap-3">
          {shown.map((m) => {
            const item = items.find((i) => i.id === m.id)
            const low = m.stock > 0 && m.stock <= 10
            const out = m.stock <= 0
            return (
              <div
                key={m.id}
                className={`flex w-full items-center gap-2.5 overflow-hidden rounded-card bg-white p-2.5 shadow-sm transition hover:shadow-md sm:gap-3 sm:p-3.5 ${
                  out ? 'opacity-60' : ''
                }`}
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-50 via-cyan-50 to-emerald-50 font-display text-sm font-bold text-primary sm:size-11 sm:text-base">
                  {m.name.charAt(0).toUpperCase()}
                </div>

                {/* min-w-0 lets this column shrink so the control on the right
                    always keeps its space instead of being pushed off-screen */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-snug text-ink sm:text-sm">
                    {m.name}
                  </p>
                  {m.brand && (
                    <p className="truncate text-[11px] text-ink-soft">{m.brand}</p>
                  )}
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="font-display text-sm font-extrabold text-ink sm:text-[15px]">
                      {inr(m.price)}
                    </span>
                    <span
                      className={`pill ${out ? 'pill-out' : low ? 'pill-low' : 'pill-ok'}`}
                    >
                      {out ? 'Out' : low ? `Only ${m.stock} left` : 'In stock'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <QtyStepper item={item} med={m} add={add} setQty={setQty} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && meds.length < total && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto mt-4 block rounded-btn bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:shadow-md active:scale-[.98] disabled:opacity-60"
        >
          {loadingMore
            ? 'Loading…'
            : `Show more (${(total - meds.length).toLocaleString('en-IN')} left)`}
        </button>
      )}

      <CartBar />
    </Shell>
  )
}
