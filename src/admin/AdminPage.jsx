import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ShieldAlert, Package, Boxes, IndianRupee, AlertTriangle } from 'lucide-react'
import { supabase, supabaseReady } from '../lib/supabase.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { Spinner, inr } from '../order/Shell.jsx'
import { SignInGate } from '../order/OrderPage.jsx'
import Inventory from './Inventory.jsx'
import OrderQueue from './OrderQueue.jsx'
import AdminGate, { gatePassed } from './AdminGate.jsx'

function Stat({ icon: Icon, label, value, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-600',
  }
  return (
    <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-sm">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-soft">{label}</p>
        <p className="font-display truncate text-lg font-bold text-ink">{value}</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const [tab, setTab] = useState('orders')
  const [stats, setStats] = useState(null)
  const [passed, setPassed] = useState(gatePassed)

  const loadStats = useCallback(async () => {
    const [{ data: meds }, { data: ords }] = await Promise.all([
      supabase.from('medicines').select('price, stock, is_active'),
      supabase.from('orders').select('status, total'),
    ])
    const active = (meds ?? []).filter((m) => m.is_active)
    setStats({
      pending: (ords ?? []).filter((o) => o.status === 'placed').length,
      revenue: (ords ?? [])
        .filter((o) => o.status === 'accepted' || o.status === 'delivered')
        .reduce((n, o) => n + Number(o.total), 0),
      skus: active.length,
      low: active.filter((m) => m.stock <= 10).length,
    })
  }, [])

  useEffect(() => {
    if (isAdmin) loadStats()
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
    <div className="min-h-screen bg-[#e2f7f2]">
      <header className="sticky top-0 z-30 border-b border-hairline bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
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

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Package}
            label="Pending orders"
            value={stats?.pending ?? '—'}
            tone="amber"
          />
          <Stat
            icon={IndianRupee}
            label="Confirmed revenue"
            value={stats ? inr(stats.revenue) : '—'}
            tone="green"
          />
          <Stat icon={Boxes} label="Active medicines" value={stats?.skus ?? '—'} />
          <Stat
            icon={AlertTriangle}
            label="Low stock (≤10)"
            value={stats?.low ?? '—'}
            tone="red"
          />
        </div>

        <div className="mb-4 flex gap-2">
          {[
            ['orders', 'Orders'],
            ['inventory', 'Inventory'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-btn px-4 py-2 text-sm font-semibold transition ${
                tab === k ? 'bg-primary text-white shadow-sm' : 'bg-white text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'orders' ? <OrderQueue onStockChanged={loadStats} /> : <Inventory />}
      </main>
    </div>
  )
}
