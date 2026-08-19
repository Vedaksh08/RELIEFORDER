import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ShieldAlert,
  Package,
  Boxes,
  IndianRupee,
  AlertTriangle,
  Users,
  ClipboardList,
  Boxes as BoxesIcon,
  MessageCircle,
  Search as SearchIcon,
  Megaphone,
} from 'lucide-react'
import { supabase, supabaseReady } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { Spinner, inr } from '../order/Shell.jsx'
import { SignInGate } from '../order/OrderPage.jsx'
import Inventory from './Inventory.jsx'
import OrderQueue from './OrderQueue.jsx'
import WhatsAppPanel from './WhatsAppPanel.jsx'
import AdsPanel from './AdsPanel.jsx'
import UsersPanel from './UsersPanel.jsx'
import { LOW_STOCK } from './Inventory.jsx'
import { BUSINESS } from '../data/siteData.js'
import { TileSkeleton } from '../order/Skeleton.jsx'
import SearchPanel from './SearchPanel.jsx'
import AdminGate, { gatePassed } from './AdminGate.jsx'

function Stat({ icon: Icon, label, value, tone = 'blue', onClick, active }) {
  const tones = {
    blue: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-600',
    violet: 'bg-violet-100 text-violet-700',
  }
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-card bg-white p-3 text-left shadow-sm transition sm:gap-3 sm:p-4 ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[.99]' : ''
      } ${active ? 'ring-2 ring-primary/40' : ''}`}
    >
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${tones[tone] ?? tones.blue}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-tight text-ink-soft sm:text-xs">
          {label}
        </p>
        <p className="font-display truncate text-base font-bold text-ink sm:text-lg">
          {value}
        </p>
      </div>
    </Tag>
  )
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const [tab, setTab] = useState('orders')
  const [stats, setStats] = useState(null)
  const [lowOnly, setLowOnly] = useState(false)
  const [passed, setPassed] = useState(gatePassed)

  const loadStats = useCallback(async () => {
    // Counts are done in the database, not by fetching rows: PostgREST caps
    // a select at 1000 rows, so counting client-side silently under-reported
    // as soon as the catalogue passed 1000 medicines.
    const countOf = (table, build) => {
      let q = supabase.from(table).select('id', { count: 'exact', head: true })
      return build ? build(q) : q
    }

    const [skus, low, users, orderRows] = await Promise.all([
      countOf('medicines', (q) => q.eq('is_active', true)),
      countOf('medicines', (q) => q.eq('is_active', true).lte('stock', LOW_STOCK)),
      countOf('profiles'),
      // Orders are fetched rather than counted per status: a shop has orders
      // in the hundreds, not the tens of thousands, so one small query gives
      // both the pending count and the revenue total without a second round
      // trip - and without depending on head-only count requests, which were
      // returning 0 here even though the rows were plainly visible.
      supabase.from('orders').select('status, total'),
    ])

    if (orderRows.error) {
      console.error('[admin] could not load orders for stats:', orderRows.error)
    }

    const orders = orderRows.data ?? []
    const earned = new Set(['accepted', 'dispatched', 'delivered'])

    setStats({
      pending: orders.filter((o) => o.status === 'placed').length,
      revenue: orders
        .filter((o) => earned.has(o.status))
        .reduce((n, o) => n + Number(o.total), 0),
      skus: skus.count ?? 0,
      low: low.count ?? 0,
      users: users.count ?? 0,
    })
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    loadStats()

    // Stats used to load once on mount, so accepting an order left "Pending"
    // showing the old number until the page was reloaded by hand.
    const ch = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadStats)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicines' },
        loadStats,
      )
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [isAdmin, loadStats])

  // front door: SYSTEM / SYSTEM
  if (!passed) return <AdminGate onPass={() => setPassed(true)} />

  if (!supabaseReady || loading) return <Spinner />

  if (!user)
    return (
      <div className="min-h-screen bg-[#e2f7f2] px-4 py-10">
        <SignInGate />
      </div>
    )

  if (!isAdmin)
    return (
      <div className="grid min-h-screen place-items-center bg-[#e2f7f2] px-4">
        <div className="max-w-md rounded-card bg-white p-8 text-center shadow-md">
          <ShieldAlert className="mx-auto mb-3 text-red-500" size={34} />
          <h2 className="font-display mb-2 text-lg font-semibold">Admin access only</h2>
          <p className="mb-5 text-sm text-ink-soft">
            This account is not an admin. Set <code className="rounded bg-black/5 px-1">is_admin = true</code>{' '}
            on your row in the <code className="rounded bg-black/5 px-1">profiles</code> table.
          </p>
          <Link
            to="/order"
            className="inline-block rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to shop
          </Link>
        </div>
      </div>
    )

  return (
    <div className="min-h-[100dvh] bg-[#e2f7f2]">
      <header
        className="sticky top-0 z-30 border-b border-hairline bg-white/85 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 overflow-hidden px-2 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link
            to="/order"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
            aria-label="Back to shop"
          >
            <ArrowLeft size={19} strokeWidth={2.3} />
          </Link>

          <span className="brand-mark shrink-0">RM</span>

          <span className="min-w-0 flex-1">
            <span className="font-display block truncate text-[15px] font-extrabold leading-tight text-primary sm:text-lg">
              {BUSINESS.fullName}
            </span>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Admin panel
            </span>
          </span>

          <span className="hidden min-w-0 shrink truncate text-xs text-ink-soft lg:block">
            {user.email}
          </span>
        </div>
      </header>

      <main
        className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        {!stats ? (
          <TileSkeleton />
        ) : (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          <Stat
            icon={Package}
            label="Pending orders"
            value={stats?.pending ?? '—'}
            tone="amber"
            onClick={() => {
              setLowOnly(false)
              setTab('orders')
            }}
          />
          <Stat
            icon={IndianRupee}
            label="Confirmed revenue"
            value={stats ? inr(stats.revenue) : '—'}
            tone="green"
          />
          <Stat
            icon={Boxes}
            label="Active medicines"
            value={stats?.skus ?? '—'}
            tone="blue"
            onClick={() => {
              setLowOnly(false)
              setTab('inventory')
            }}
          />
          <Stat
            icon={AlertTriangle}
            label="Low stock (≤10)"
            value={stats?.low ?? '—'}
            tone="red"
            active={lowOnly}
            onClick={() => {
              setLowOnly(true)
              setTab('inventory')
            }}
          />
          <Stat
            icon={Users}
            label="Signed-in users"
            value={stats?.users ?? '—'}
            tone="violet"
            onClick={() => {
              setLowOnly(false)
              setTab('users')
            }}
          />
        </div>
        )}

        <div className="tab-rail mb-4">
          {[
            ['orders', 'Orders', ClipboardList],
            ['inventory', 'Inventory', BoxesIcon],
            ['whatsapp', 'WhatsApp', MessageCircle],
            ['users', 'Users', Users],
            ['search', 'Search', SearchIcon],
            ['ads', 'Ads', Megaphone],
          ].map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => {
                setTab(k)
                if (k !== 'inventory') setLowOnly(false)
              }}
              className={`tab-chip ${tab === k ? 'is-on' : ''}`}
            >
              <Icon size={15} strokeWidth={2.3} />
              <span>{label}</span>
              {k === 'orders' && stats?.pending > 0 && (
                <span className={`tab-count ${tab === k ? 'on' : ''}`}>
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <OrderQueue
            onStockChanged={loadStats}
            onOrdersLoaded={(orders) => {
              const earned = new Set(['accepted', 'dispatched', 'delivered'])
              setStats((cur) => ({
                ...(cur ?? {}),
                pending: orders.filter((o) => o.status === 'placed').length,
                revenue: orders
                  .filter((o) => earned.has(o.status))
                  .reduce((n, o) => n + Number(o.total), 0),
              }))
            }}
          />
        )}
        {tab === 'inventory' && (
          <Inventory
            lowOnly={lowOnly}
            onClearLow={() => setLowOnly(false)}
            onStockSaved={loadStats}
          />
        )}
        {tab === 'whatsapp' && <WhatsAppPanel />}
        {tab === 'users' && <UsersPanel />}
        {tab === 'search' && <SearchPanel />}
        {tab === 'ads' && <AdsPanel />}
      </main>
    </div>
  )
}
