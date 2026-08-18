import { useEffect, useRef, useState } from 'react'
import { Check, X, Truck, PackageCheck, Phone, MapPin, Inbox, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import {
  fetchAllOrders,
  acceptOrder,
  rejectOrder,
  dispatchOrder,
  markDelivered,
} from '../lib/orders.js'
import { Spinner, Empty, StatusBadge, inr } from '../order/Shell.jsx'
import { playChime, playConfirm, playError, primeAudio } from '../lib/sound.js'

const TABS = ['placed', 'accepted', 'dispatched', 'delivered', 'rejected']

export default function OrderQueue({ onStockChanged }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('placed')
  const [busyId, setBusyId] = useState(null)
  const [err, setErr] = useState('')
  const [muted, setMuted] = useState(
    () => localStorage.getItem('relief_admin_muted') === '1',
  )
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const load = () =>
    fetchAllOrders()
      .then((d) => {
        setOrders(d)
        return d
      })
      .catch((e) => setErr(e.message ?? 'Could not load orders'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    // new orders appear without a refresh — and ring the bell
    const ch = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          if (!mutedRef.current) playChime()
          load()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        load,
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const act = async (id, fn) => {
    setErr('')
    setBusyId(id)
    try {
      const { error } = (await fn(id)) ?? {}
      if (error) throw error
      if (!muted) playConfirm()
      onStockChanged?.()
    } catch (e) {
      setErr(e.message ?? 'Action failed')
      if (!muted) playError()
    } finally {
      setBusyId(null)
      load()
    }
  }

  const toggleMute = () => {
    primeAudio()
    setMuted((m) => {
      localStorage.setItem('relief_admin_muted', m ? '0' : '1')
      return !m
    })
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

        <button
          onClick={toggleMute}
          title={muted ? 'Sound off' : 'Sound on'}
          aria-label={muted ? 'Unmute new-order sound' : 'Mute new-order sound'}
          className={`ml-auto grid size-9 shrink-0 place-items-center rounded-full transition ${
            muted ? 'bg-white text-ink-soft' : 'bg-accent/15 text-accent'
          }`}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
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

              <div className="mb-3 rounded-btn bg-black/[.03] p-3">
                <p className="mb-1.5 truncate text-sm font-semibold text-ink">
                  {o.profiles?.full_name ?? o.profiles?.email ?? 'Customer'}
                </p>
                <a
                  href={o.mobile ? `tel:${o.mobile}` : undefined}
                  className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  <Phone size={12} className="shrink-0" /> {o.mobile || '—'}
                </a>
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-soft">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{o.address || '—'}</span>
                </p>
              </div>
              {o.note && (
                <p className="mb-3 rounded-btn bg-amber-50 p-2 text-xs text-amber-800">
                  {o.note}
                </p>
              )}

              <ul className="mb-3 flex flex-col gap-1 border-t border-hairline pt-3">
                {(o.order_items ?? []).length === 0 && (
                  <li className="text-xs italic text-ink-soft">No line items found.</li>
                )}
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {it.qty}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{it.name}</span>
                      {it.brand && (
                        <span className="block truncate text-xs text-ink-soft">
                          {it.brand}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right font-semibold">
                      {inr(it.price * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-hairline pt-3">
                <span className="text-xs text-ink-soft">Total</span>
                <span className="font-display text-lg font-bold text-primary">
                  {inr(o.total)}
                </span>
              </div>

              {o.status === 'placed' && (
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, rejectOrder)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={15} /> Reject
                  </button>
                  <button
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, acceptOrder)}
                    className="flex flex-[1.5] items-center justify-center gap-1.5 rounded-btn bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    <Check size={15} />
                    {busyId === o.id ? 'Accepting…' : 'Accept order'}
                  </button>
                </div>
              )}

              {o.status === 'accepted' && (
                <button
                  disabled={busyId === o.id}
                  onClick={() => act(o.id, dispatchOrder)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-btn bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  <Truck size={15} />
                  {busyId === o.id ? 'Dispatching…' : 'Order dispatched'}
                </button>
              )}

              {o.status === 'dispatched' && (
                <button
                  disabled={busyId === o.id}
                  onClick={() => act(o.id, markDelivered)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-btn bg-green-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  <PackageCheck size={15} /> Mark delivered
                </button>
              )}

              {o.status === 'placed' && (
                <p className="mt-2 text-center text-[11px] text-ink-soft">
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
