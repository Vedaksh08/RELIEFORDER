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
import SearchPanel from './SearchPanel.jsx'
import AdminGate, { gatePassed } from './AdminGate.jsx'

function Stat({ icon: Icon, label, value, tone = 'primary', onClick, active }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-600',
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
        className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${tones[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-tight text-ink-soft sm:text-xs">{label}</p>
        <p className="font-display truncate text-base font-bold text-ink sm:text-lg">{value}</p>
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

    const [skus, low, pending, users, revenueRows] = await Promise.all([
      countOf('medicines', (q) => q.eq('is_active', true)),
      countOf('medicines', (q) => q.eq('is_active', true).lte('stock', LOW_STOCK)),
      countOf('orders', (q) => q.eq('status', 'placed')),
      countOf('profiles'),
      // Revenue needs the actual totals, but only for orders that count -
      // far fewer rows than the whole table.
      supabase
        .from('orders')
        .select('total')
        .in('status', ['accepted', 'dispatched', 'delivered']),
    ])

    setStats({
      pending: pending.count ?? 0,
      revenue: (revenueRows.data ?? []).reduce((n, o) => n + Number(o.total), 0),
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
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link
            to="/order"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
            aria-label="Back to shop"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display text-lg font-semibold text-primary">Admin Panel</h1>
          <span className="ml-auto hidden truncate text-xs text-ink-soft sm:block">
            {user.email}
          </span>
        </div>
      </header>

      <main
        className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
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
            onClick={() => {
              setLowOnly(false)
              setTab('users')
            }}
          />
        </div>

        <div className="mb-4 flex gap-2">
          {[
            ['orders', 'Orders'],
            ['inventory', 'Inventory'],
            ['whatsapp', 'WhatsApp'],
            ['users', 'Users'],
            ['search', 'Search'],
            ['ads', 'Ads'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => {
                setTab(k)
                if (k !== 'inventory') setLowOnly(false)
              }}
              className={`rounded-btn px-4 py-2 text-sm font-semibold transition ${
                tab === k ? 'bg-primary text-white shadow-sm' : 'bg-white text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'orders' && <OrderQueue onStockChanged={loadStats} />}
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
