import { useMemo } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

export const RANGES = [
  ['all', 'All time'],
  ['today', 'Today'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['custom', 'Custom'],
]

/** Start of day, so "today" means the whole calendar day and not last 24h. */
function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function rangeStart(range) {
  const now = new Date()
  switch (range) {
    case 'today':
      return startOfToday()
    case '7d':
      return new Date(now.getTime() - 7 * 864e5)
    case '30d':
      return new Date(now.getTime() - 30 * 864e5)
    default:
      return null
  }
}

/** Applies every active filter to a list of orders. */
export function applyFilters(orders, f) {
  const term = f.q.trim().toLowerCase()

  return orders.filter((o) => {
    // ---- duration ----
    if (f.range === 'custom') {
      if (f.from && new Date(o.created_at) < new Date(`${f.from}T00:00:00`)) return false
      if (f.to && new Date(o.created_at) > new Date(`${f.to}T23:59:59`)) return false
    } else {
      const start = rangeStart(f.range)
      if (start && new Date(o.created_at) < start) return false
    }

    // ---- user ----
    if (f.userId && o.user_id !== f.userId) return false

    // ---- medicine ----
    if (f.medicine) {
      const hit = (o.order_items ?? []).some((i) => i.name === f.medicine)
      if (!hit) return false
    }

    // ---- free text: order id, customer, mobile, address, any item ----
    if (term) {
      const hay = [
        o.id,
        o.mobile,
        o.address,
        o.note,
        o.profiles?.full_name,
        o.profiles?.email,
        ...(o.order_items ?? []).flatMap((i) => [i.name, i.brand]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(term)) return false
    }

    return true
  })
}

export const EMPTY_FILTERS = {
  q: '',
  range: 'all',
  from: '',
  to: '',
  userId: '',
  medicine: '',
}

export const isFiltered = (f) =>
  Boolean(f.q || f.range !== 'all' || f.userId || f.medicine)

export default function OrderFilters({ orders, filters, setFilters, resultCount }) {
  // Options come from the orders themselves, so the dropdowns only ever
  // offer values that can actually match something.
  const users = useMemo(() => {
    const m = new Map()
    for (const o of orders) {
      if (!o.user_id || m.has(o.user_id)) continue
      m.set(o.user_id, o.profiles?.full_name ?? o.profiles?.email ?? o.mobile ?? 'Customer')
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [orders])

  const medicines = useMemo(() => {
    const set = new Set()
    for (const o of orders) for (const i of o.order_items ?? []) set.add(i.name)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [orders])

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const active = isFiltered(filters)

  return (
    <div className="mb-4 rounded-card bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <SlidersHorizontal size={15} className="text-primary" />
        <span className="text-sm font-semibold text-primary">Filters</span>
        {active && (
          <>
            <span className="text-xs text-ink-soft">
              {resultCount} match{resultCount === 1 ? '' : 'es'}
            </span>
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-ink transition hover:bg-black/10"
            >
              <X size={12} /> Clear
            </button>
          </>
        )}
      </div>

      <div className="relative mb-2.5">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <input
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Search order id, customer, mobile, address or medicine…"
          className="w-full rounded-btn border border-hairline py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={filters.range}
          onChange={(e) => set({ range: e.target.value })}
          className="rounded-btn border border-hairline bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          {RANGES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.userId}
          onChange={(e) => set({ userId: e.target.value })}
          className="rounded-btn border border-hairline bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All customers</option>
          {users.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={filters.medicine}
          onChange={(e) => set({ medicine: e.target.value })}
          className="rounded-btn border border-hairline bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">All medicines</option>
          {medicines.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {filters.range === 'custom' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-ink-soft">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => set({ from: e.target.value })}
              className="mt-1 w-full rounded-btn border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="text-xs font-semibold text-ink-soft">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => set({ to: e.target.value })}
              className="mt-1 w-full rounded-btn border border-hairline px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
      )}
    </div>
  )
}
