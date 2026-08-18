import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Phone,
  MapPin,
  ArrowLeft,
  ShoppingBag,
  IndianRupee,
  Shield,
  CalendarDays,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { Spinner, Empty, StatusBadge, inr } from '../order/Shell.jsx'

const EARNED = new Set(['accepted', 'dispatched', 'delivered'])

/**
 * Groups a customer's orders by calendar month, newest first, totalling what
 * they spent and which medicines they took.
 *
 * Only accepted/dispatched/delivered orders count towards money and
 * medicines: a rejected order was never supplied, and a pending one is not
 * confirmed yet. Their value is reported separately so the number is never
 * silently short.
 */
function monthlyBreakdown(orders) {
  const buckets = new Map()

  for (const o of orders) {
    const d = new Date(o.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        orderCount: 0,
        spent: 0,
        notCounted: 0,
        units: 0,
        items: new Map(),
      })
    }

    const b = buckets.get(key)
    b.orderCount += 1

    if (!EARNED.has(o.status)) {
      b.notCounted += Number(o.total)
      continue
    }

    b.spent += Number(o.total)
    for (const i of o.order_items ?? []) {
      const k = `${i.name}|${i.brand ?? ''}`
      const cur = b.items.get(k) ?? { name: i.name, brand: i.brand, qty: 0, total: 0 }
      cur.qty += i.qty
      cur.total += Number(i.price) * i.qty
      b.items.set(k, cur)
    }
    b.units += (o.order_items ?? []).reduce((n, i) => n + i.qty, 0)
  }

  return [...buckets.values()]
    .map((b) => ({
      ...b,
      // most-bought first, so the top of the list is the useful part
      medicines: [...b.items.values()].sort((x, y) => y.qty - x.qty),
    }))
    .sort((a, b) => b.key.localeCompare(a.key))
}

export default function UsersPanel() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('monthly') // 'monthly' | 'orders'
  const [openMonth, setOpenMonth] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      // Two queries rather than an embed: it keeps working regardless of
      // whether the orders->profiles FK is in place on this database.
      const [{ data: people }, { data: orders }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false }),
      ])
      if (!active) return

      const byUser = new Map()
      for (const o of orders ?? []) {
        if (!byUser.has(o.user_id)) byUser.set(o.user_id, [])
        byUser.get(o.user_id).push(o)
      }

      setRows(
        (people ?? []).map((p) => {
          const mine = byUser.get(p.id) ?? []
          return {
            ...p,
            orders: mine,
            orderCount: mine.length,
            spent: mine
              .filter((o) => EARNED.has(o.status))
              .reduce((n, o) => n + Number(o.total), 0),
            lastOrderAt: mine[0]?.created_at ?? null,
          }
        }),
      )
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter(
      (u) =>
        (u.full_name ?? '').toLowerCase().includes(t) ||
        (u.email ?? '').toLowerCase().includes(t) ||
        (u.mobile ?? '').includes(t),
    )
  }, [rows, q])

  if (loading) return <Spinner label="Loading users…" />

  // ---------- one user's full history ----------
  if (selected) {
    const u = rows.find((r) => r.id === selected) ?? selected
    const months = monthlyBreakdown(u.orders)
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex w-fit items-center gap-1.5 rounded-btn bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-black/5"
        >
          <ArrowLeft size={15} /> All users
        </button>

        <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
              {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display flex items-center gap-2 text-lg font-semibold text-ink">
                <span className="truncate">{u.full_name ?? 'Unnamed'}</span>
                {u.is_admin && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Shield size={11} /> Admin
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-ink-soft">{u.email}</p>
              {u.mobile && (
                <a
                  href={`tel:${u.mobile}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                >
                  <Phone size={13} /> {u.mobile}
                </a>
              )}
              {u.address && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-ink-soft">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{u.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-4">
            <div>
              <p className="text-[11px] text-ink-soft">Orders</p>
              <p className="font-display text-lg font-bold text-ink">{u.orderCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-soft">Spent</p>
              <p className="font-display text-lg font-bold text-ink">{inr(u.spent)}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-soft">Joined</p>
              <p className="font-display text-sm font-bold text-ink">
                {new Date(u.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="font-display font-semibold text-primary">
              {view === 'monthly' ? 'Month by month' : 'Order history'}
            </h3>
            <div className="ml-auto flex gap-1 rounded-full bg-black/5 p-1">
              {[
                ['monthly', 'Monthly'],
                ['orders', 'All orders'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    view === k ? 'bg-white text-primary shadow-sm' : 'text-ink-soft'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {u.orders.length === 0 ? (
            <Empty icon={ShoppingBag} title="No orders yet" />
          ) : view === 'monthly' ? (
            <div className="flex flex-col gap-2.5">
              {months.map((m) => {
                const open = openMonth === m.key
                return (
                  <div
                    key={m.key}
                    className="overflow-hidden rounded-card border border-hairline"
                  >
                    <button
                      onClick={() => setOpenMonth(open ? null : m.key)}
                      className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-black/[.02]"
                    >
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{m.label}</p>
                        <p className="text-xs text-ink-soft">
                          {m.orderCount} order{m.orderCount === 1 ? '' : 's'} ·{' '}
                          {m.units} item{m.units === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display font-bold text-primary">
                          {inr(m.spent)}
                        </p>
                        <p className="text-[11px] text-ink-soft">spent</p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-ink-soft transition ${open ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {open && (
                      <div className="border-t border-hairline bg-black/[.015] p-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                          Medicines taken
                        </p>
                        <ul className="mb-3 flex flex-col gap-1.5">
                          {m.medicines.map((med) => (
                            <li
                              key={med.name + (med.brand ?? '')}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                {med.qty}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {med.name}
                                </span>
                                {med.brand && (
                                  <span className="block truncate text-xs text-ink-soft">
                                    {med.brand}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 font-semibold">
                                {inr(med.total)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {m.notCounted > 0 && (
                          <p className="mb-2 rounded-btn bg-amber-50 p-2 text-[11px] text-amber-800">
                            {inr(m.notCounted)} from rejected or still-pending orders
                            is not included in the spent total.
                          </p>
                        )}

                        <div className="flex items-center justify-between border-t border-hairline pt-2 text-sm">
                          <span className="text-ink-soft">Total spent</span>
                          <span className="font-display font-bold text-primary">
                            {inr(m.spent)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {u.orders.map((o) => (
                <div key={o.id} className="rounded-card border border-hairline p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">
                      #{o.id.slice(0, 8)}
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="ml-auto text-xs text-ink-soft">
                      {new Date(o.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <ul className="mb-2 flex flex-col gap-1">
                    {o.order_items?.map((it) => (
                      <li key={it.id} className="flex items-center gap-2 text-sm">
                        <span className="grid size-5 shrink-0 place-items-center rounded bg-primary/10 text-[11px] font-bold text-primary">
                          {it.qty}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {it.name}
                          {it.brand && (
                            <span className="text-ink-soft"> · {it.brand}</span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold">
                          {inr(it.price * it.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-hairline pt-2">
                    <span className="text-xs text-ink-soft">Total</span>
                    <span className="font-display font-bold text-primary">
                      {inr(o.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---------- list ----------
  return (
    <div>
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or mobile…"
          className="w-full rounded-btn border border-hairline bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {shown.length === 0 ? (
        <Empty title="No users found">
          {rows.length === 0
            ? 'Nobody has signed in yet.'
            : 'Try a different search term.'}
        </Empty>
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {shown.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelected(u.id)
                setView('monthly')
                setOpenMonth(null)
              }}
              className="flex items-center gap-3 rounded-card bg-white p-3 text-left shadow-sm transition hover:shadow-md active:scale-[.99] sm:p-4"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
                {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-semibold text-ink">
                  <span className="truncate">{u.full_name ?? 'Unnamed'}</span>
                  {u.is_admin && (
                    <Shield size={12} className="shrink-0 text-primary" />
                  )}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {u.mobile || u.email}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  {u.orderCount} order{u.orderCount === 1 ? '' : 's'}
                  {u.lastOrderAt &&
                    ` · last ${new Date(u.lastOrderAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display font-bold text-primary">{inr(u.spent)}</p>
                <p className="flex items-center justify-end gap-0.5 text-[11px] text-ink-soft">
                  <IndianRupee size={10} /> spent
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
