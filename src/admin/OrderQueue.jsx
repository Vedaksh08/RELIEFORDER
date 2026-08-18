import { useEffect, useState } from 'react'
import { Check, X, Truck, Phone, MapPin, Inbox } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fetchAllOrders, acceptOrder, rejectOrder, markDelivered } from '../lib/orders.js'
import { Spinner, Empty, StatusBadge, inr } from '../order/Shell.jsx'

const TABS = ['placed', 'accepted', 'delivered', 'rejected']

export default function OrderQueue({ onStockChanged }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('placed')
  const [busyId, setBusyId] = useState(null)
  const [err, setErr] = useState('')

  const load = () =>
    fetchAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    // new orders appear without a refresh
    const ch = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const act = async (id, fn) => {
    setErr('')
    setBusyId(id)
    const { error } = (await fn(id)) ?? {}
    if (error) setErr(error.message)
    else onStockChanged?.()
    setBusyId(null)
    load()
  }

  const shown = orders.filter((o) => o.status === tab)

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const n = orders.filter((o) => o.status === t).length
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                tab === t ? 'bg-primary text-white' : 'bg-white text-ink-soft hover:bg-white/70'
              }`}
            >
              {t}
              {n > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-xs ${tab === t ? 'bg-white/25' : 'bg-black/10'}`}
                >
                  {n}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {err && (
        <p className="mb-3 rounded-btn bg-red-50 p-3 text-sm text-red-600">{err}</p>
      )}

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : shown.length === 0 ? (
        <Empty icon={Inbox} title={`No ${tab} orders`}>
          {tab === 'placed' ? 'New orders will appear here the moment they are placed.' : null}
        </Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((o) => (
            <div key={o.id} className="rounded-card bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
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

              <p className="mb-1 text-sm font-medium">
                {o.profiles?.full_name ?? o.profiles?.email ?? 'Customer'}
              </p>
              <p className="mb-1 flex items-center gap-1.5 text-xs text-ink-soft">
                <Phone size={12} /> {o.mobile || '—'}
              </p>
              <p className="mb-3 flex items-start gap-1.5 text-xs text-ink-soft">
                <MapPin size={12} className="mt-0.5 shrink-0" /> {o.address || '—'}
              </p>
              {o.note && (
                <p className="mb-3 rounded-btn bg-amber-50 p-2 text-xs text-amber-800">
                  {o.note}
                </p>
              )}

              <ul className="mb-3 flex flex-col gap-1 border-t border-hairline pt-3">
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {it.name}
                      {it.brand && <span className="text-ink-soft"> · {it.brand}</span>}
                    </span>
                    <span className="font-semibold text-primary">×{it.qty}</span>
                    <span className="w-20 text-right">{inr(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-hairline pt-3">
                <span className="font-display font-bold text-primary">{inr(o.total)}</span>

                <div className="flex gap-2">
                  {o.status === 'placed' && (
                    <>
                      <button
                        disabled={busyId === o.id}
                        onClick={() => act(o.id, rejectOrder)}
                        className="inline-flex items-center gap-1 rounded-btn bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={15} /> Reject
                      </button>
                      <button
                        disabled={busyId === o.id}
                        onClick={() => act(o.id, acceptOrder)}
                        className="inline-flex items-center gap-1 rounded-btn bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        <Check size={15} />
                        {busyId === o.id ? 'Accepting…' : 'Accept'}
                      </button>
                    </>
                  )}
                  {o.status === 'accepted' && (
                    <button
                      disabled={busyId === o.id}
                      onClick={() => act(o.id, markDelivered)}
                      className="inline-flex items-center gap-1 rounded-btn bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      <Truck size={15} /> Mark delivered
                    </button>
                  )}
                </div>
              </div>

              {o.status === 'placed' && (
                <p className="mt-2 text-[11px] text-ink-soft">
                  Accepting deducts these quantities from stock automatically.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
