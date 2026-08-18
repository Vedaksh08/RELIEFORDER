import { useEffect, useRef, useState } from 'react'
import {
  Check,
  X,
  Truck,
  PackageCheck,
  Phone,
  MapPin,
  Inbox,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import {
  fetchAllOrders,
  acceptOrder,
  rejectOrder,
  dispatchOrder,
  markDelivered,
} from '../lib/orders.js'
import { Spinner, Empty, StatusBadge, inr } from '../order/Shell.jsx'
import { applyFilters, EMPTY_FILTERS } from './OrderFilters.jsx'
import { playChime, playConfirm, playError, primeAudio } from '../lib/sound.js'
import { notifyOrder } from '../lib/botApi.js'
import {
  notify,
  alertsEnabled,
  setAlertsEnabled,
  requestPermission,
  permission,
  notificationsSupported,
} from '../lib/notify.js'

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

  const [q, setQ] = useState('')
  const [alerts, setAlerts] = useState(alertsEnabled)
  const [alertMsg, setAlertMsg] = useState('')
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts

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
        async (payload) => {
          if (!mutedRef.current) playChime()
          const o = payload.new

          if (alertsRef.current) {
            notify('New order received', {
              body: `${o.mobile ?? 'Customer'} · ₹${Number(o.total).toFixed(2)}`,
              tag: `order-${o.id}`,
              onClick: () => setTab('placed'),
            })
          }

          // WhatsApp for a new order is sent from here, not from the
          // customer's browser: only the admin device can reach the bot.
          // The line items arrive in a separate insert, so read them back
          // rather than trusting the orders-row payload alone.
          try {
            const { data: full } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', o.id)
              .maybeSingle()

            const { data: who } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', o.user_id)
              .maybeSingle()

            notifyOrder('placed', {
              ...(full ?? o),
              customer_name: who?.full_name ?? who?.email ?? null,
            })
          } catch (e) {
            console.warn('[bot] could not send new-order WhatsApp:', e.message)
          }

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

  const act = async (id, fn, nextStatus) => {
    setErr('')
    setBusyId(id)
    try {
      const { error } = (await fn(id)) ?? {}
      if (error) throw error
      if (!muted) playConfirm()
      onStockChanged?.()

      // WhatsApp is best-effort: never let it block or fail the status change
      if (nextStatus) {
        const o = orders.find((x) => x.id === id)
        if (o) {
          notifyOrder(nextStatus, {
            ...o,
            customer_name: o.profiles?.full_name ?? o.profiles?.email ?? null,
          })
        }
      }
    } catch (e) {
      setErr(e.message ?? 'Action failed')
      if (!muted) playError()
    } finally {
      setBusyId(null)
      load()
    }
  }

  const toggleAlerts = async () => {
    primeAudio()
    if (alerts) {
      setAlertsEnabled(false)
      setAlerts(false)
      setAlertMsg('')
      return
    }

    if (!notificationsSupported()) {
      setAlertMsg('This browser does not support notifications.')
      return
    }

    // must run inside this click for the browser to show the prompt
    const res = await requestPermission()
    if (res === 'granted') {
      setAlertsEnabled(true)
      setAlerts(true)
      setAlertMsg('')
      notify('Alerts are on', {
        body: 'You will be notified here when a new order arrives.',
        tag: 'alerts-on',
      })
    } else if (res === 'denied') {
      setAlertMsg(
        'Notifications are blocked for this site. Enable them in your browser’s site settings, then try again.',
      )
    } else {
      setAlertMsg('Notification permission was dismissed.')
    }
  }

  const toggleMute = () => {
    primeAudio()
    setMuted((m) => {
      localStorage.setItem('relief_admin_muted', m ? '0' : '1')
      return !m
    })
  }

  // A quick name/mobile/id lookup for working the queue. The full duration
  // + customer + medicine filtering lives in the Search tab.
  const filtered = applyFilters(orders, { ...EMPTY_FILTERS, q })
  const shown = filtered.filter((o) => o.status === tab)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 pb-1">
        {TABS.map((t) => {
          const n = filtered.filter((o) => o.status === t).length
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

        <div className="relative ml-auto w-full min-w-40 sm:w-56">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find order or customer…"
            className="h-9 w-full rounded-full border border-hairline bg-white pl-8 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={toggleAlerts}
            title={alerts ? 'Alerts on' : 'Turn on alerts'}
            aria-pressed={alerts}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
              alerts ? 'bg-primary text-white' : 'bg-white text-ink-soft hover:bg-white/70'
            }`}
          >
            {alerts ? <Bell size={14} /> : <BellOff size={14} />}
            <span className="hidden sm:inline">
              {alerts ? 'Alerts on' : 'Turn on alerts'}
            </span>
          </button>

          <button
            onClick={toggleMute}
            title={muted ? 'Sound off' : 'Sound on'}
            aria-label={muted ? 'Unmute new-order sound' : 'Mute new-order sound'}
            className={`grid size-9 shrink-0 place-items-center rounded-full transition ${
              muted ? 'bg-white text-ink-soft' : 'bg-accent/15 text-accent'
            }`}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {alertMsg && (
        <p className="mb-3 rounded-btn bg-amber-50 p-3 text-xs text-amber-800">{alertMsg}</p>
      )}

      {err && (
        <p className="mb-3 rounded-btn bg-red-50 p-3 text-sm text-red-600">{err}</p>
      )}

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : shown.length === 0 ? (
        <Empty icon={Inbox} title={`No ${tab} orders`}>
          {q.trim()
            ? 'No orders match that search.'
            : tab === 'placed'
              ? 'New orders will appear here the moment they are placed.'
              : null}
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
                    onClick={() => act(o.id, rejectOrder, 'rejected')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X size={15} /> Reject
                  </button>
                  <button
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, acceptOrder, 'accepted')}
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
                  onClick={() => act(o.id, dispatchOrder, 'dispatched')}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-btn bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  <Truck size={15} />
                  {busyId === o.id ? 'Dispatching…' : 'Order dispatched'}
                </button>
              )}

              {o.status === 'dispatched' && (
                <button
                  disabled={busyId === o.id}
                  onClick={() => act(o.id, markDelivered, 'delivered')}
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
