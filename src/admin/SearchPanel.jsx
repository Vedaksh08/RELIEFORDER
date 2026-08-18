import { useEffect, useMemo, useState } from 'react'
import {
  Search as SearchIcon,
  Phone,
  MapPin,
  Inbox,
  IndianRupee,
  ShoppingBag,
  Users as UsersIcon,
  Download,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fetchAllOrders } from '../lib/orders.js'
import { Spinner, Empty, StatusBadge, inr } from '../order/Shell.jsx'
import OrderFilters, {
  applyFilters,
  EMPTY_FILTERS,
  isFiltered,
} from './OrderFilters.jsx'

const STATUSES = ['placed', 'accepted', 'dispatched', 'delivered', 'rejected']
const EARNED = new Set(['accepted', 'dispatched', 'delivered'])

export default function SearchPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [statuses, setStatuses] = useState([]) // empty = every status

  useEffect(() => {
    let active = true
    fetchAllOrders()
      .then((d) => active && setOrders(d))
      .catch((e) => active && setErr(e.message))
      .finally(() => active && setLoading(false))

    const ch = supabase
      .channel('search-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () =>
        fetchAllOrders().then(setOrders).catch(() => {}),
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(ch)
    }
  }, [])

  const results = useMemo(() => {
    const base = applyFilters(orders, filters)
    return statuses.length ? base.filter((o) => statuses.includes(o.status)) : base
  }, [orders, filters, statuses])

  // Totals describe the current result set, not the whole database — that is
  // the point of a search tab: "how much did this customer spend on Dolo in
  // March" should be answerable at a glance.
  const summary = useMemo(() => {
    const earned = results.filter((o) => EARNED.has(o.status))
    const units = results.reduce(
      (n, o) => n + (o.order_items ?? []).reduce((m, i) => m + i.qty, 0),
      0,
    )
    return {
      count: results.length,
      revenue: earned.reduce((n, o) => n + Number(o.total), 0),
      customers: new Set(results.map((o) => o.user_id)).size,
      units,
    }
  }, [results])

  const exportCSV = () => {
    const rows = [
      ['Order', 'Date', 'Status', 'Customer', 'Mobile', 'Item', 'Brand', 'Qty', 'Line total', 'Order total'],
    ]
    for (const o of results) {
      const who = o.profiles?.full_name ?? o.profiles?.email ?? ''
      const when = new Date(o.created_at).toLocaleString('en-IN')
      if (!o.order_items?.length) {
        rows.push([o.id.slice(0, 8), when, o.status, who, o.mobile ?? '', '', '', '', '', o.total])
      }
      for (const i of o.order_items ?? []) {
        rows.push([
          o.id.slice(0, 8),
          when,
          o.status,
          who,
          o.mobile ?? '',
          i.name,
          i.brand ?? '',
          i.qty,
          (i.price * i.qty).toFixed(2),
          o.total,
        ])
      }
    }
    const esc = (v) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `relief-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) return <Spinner label="Loading orders…" />

  const anyFilter = isFiltered(filters) || statuses.length > 0

  return (
    <div>
      {err && (
        <p className="mb-3 rounded-btn bg-red-50 p-3 text-sm text-red-600">{err}</p>
      )}

      <OrderFilters
        orders={orders}
        filters={filters}
        setFilters={setFilters}
        resultCount={results.length}
      />

      {/* status is its own row here — in a search tab you often want several
          at once, unlike the order queue where you work one status at a time */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatuses([])}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            statuses.length === 0
              ? 'bg-primary text-white'
              : 'bg-white text-ink-soft hover:bg-white/70'
          }`}
        >
          Any status
        </button>
        {STATUSES.map((st) => {
          const on = statuses.includes(st)
          return (
            <button
              key={st}
              onClick={() =>
                setStatuses((cur) =>
                  on ? cur.filter((x) => x !== st) : [...cur, st],
                )
              }
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                on ? 'bg-primary text-white' : 'bg-white text-ink-soft hover:bg-white/70'
              }`}
            >
              {st}
            </button>
          )
        })}
      </div>

      {/* summary of whatever is currently matched */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <Tile icon={Inbox} label="Orders" value={summary.count} />
        <Tile icon={IndianRupee} label="Revenue" value={inr(summary.revenue)} tone="green" />
        <Tile icon={UsersIcon} label="Customers" value={summary.customers} />
        <Tile icon={ShoppingBag} label="Units" value={summary.units} tone="amber" />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm text-ink-soft">
          {results.length} order{results.length === 1 ? '' : 's'}
          {anyFilter ? ' matching' : ' in total'}
        </p>
        {results.length > 0 && (
          <button
            onClick={exportCSV}
            className="ml-auto inline-flex items-center gap-1.5 rounded-btn bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-black/5"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <Empty icon={SearchIcon} title="No orders match">
          {anyFilter
            ? 'Try widening the date range or clearing a filter.'
            : 'No orders have been placed yet.'}
        </Empty>
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {results.map((o) => (
            <div key={o.id} className="rounded-card bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-hairline pb-2">
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

              <p className="truncate text-sm font-medium">
                {o.profiles?.full_name ?? o.profiles?.email ?? 'Customer'}
              </p>
              <div className="mb-2 flex flex-wrap gap-x-3 text-xs text-ink-soft">
                {o.mobile && (
                  <a href={`tel:${o.mobile}`} className="flex items-center gap-1 text-primary">
                    <Phone size={11} /> {o.mobile}
                  </a>
                )}
                {o.address && (
                  <span className="flex min-w-0 items-start gap-1">
                    <MapPin size={11} className="mt-0.5 shrink-0" />
                    <span className="truncate">{o.address}</span>
                  </span>
                )}
              </div>

              <ul className="mb-2 flex flex-col gap-1">
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 text-sm">
                    <span className="grid size-5 shrink-0 place-items-center rounded bg-primary/10 text-[11px] font-bold text-primary">
                      {it.qty}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {it.name}
                      {it.brand && <span className="text-ink-soft"> · {it.brand}</span>}
                    </span>
                    <span className="shrink-0 text-xs font-semibold">
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
  )
}

function Tile({ icon: Icon, label, value, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <div className="flex items-center gap-2.5 rounded-card bg-white p-3 shadow-sm">
      <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-tight text-ink-soft">{label}</p>
        <p className="font-display truncate text-base font-bold text-ink">{value}</p>
      </div>
    </div>
  )
}
