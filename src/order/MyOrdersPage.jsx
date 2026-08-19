import { useEffect, useState } from 'react'
import { Package, FileText } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { fetchMyOrders } from '../lib/orders.js'
import { supabase, supabaseReady } from '../lib/supabase.js'
import { Shell, Spinner, Empty, StatusBadge, StatusTimeline, inr } from './Shell.jsx'
import { playConfirm } from '../lib/sound.js'
import { downloadInvoice } from '../lib/invoice.js'
import { OrderSkeleton } from './Skeleton.jsx'
import { SignInGate } from './OrderPage.jsx'

export default function MyOrdersPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchMyOrders(user.id)
      .then((d) => active && setOrders(d))
      .finally(() => active && setLoading(false))

    // live status updates — the badge flips when the admin accepts
    const ch = supabase
      .channel('my-orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (p) =>
          setOrders((cur) =>
            cur.map((o) => {
              if (o.id !== p.new.id) return o
              // ring only when the status actually moves
              if (o.status !== p.new.status) playConfirm()
              return { ...o, ...p.new }
            }),
          ),
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(ch)
    }
  }, [user])

  if (!supabaseReady || authLoading)
    return (
      <Shell title="My Orders" back="/order">
        <Spinner />
      </Shell>
    )
  if (!user)
    return (
      <Shell title="My Orders" back="/order">
        <SignInGate />
      </Shell>
    )

  return (
    <Shell title="My Orders" back="/order">
      {loading ? (
        <OrderSkeleton />
      ) : orders.length === 0 ? (
        <Empty icon={Package} title="No orders yet">
          Your past orders will appear here once you place one.
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-card bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
                <span className="font-display text-sm font-semibold text-ink">
                  #{o.id.slice(0, 8)}
                </span>
                <StatusBadge status={o.status} label />
                <span className="ml-auto text-xs text-ink-soft">
                  {new Date(o.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              <ul className="mb-3 flex flex-col gap-1.5">
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {it.name}
                      {it.brand && (
                        <span className="text-ink-soft"> · {it.brand}</span>
                      )}
                    </span>
                    <span className="text-ink-soft">×{it.qty}</span>
                    <span className="w-20 text-right font-semibold">
                      {inr(it.price * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mb-3 flex items-center justify-between border-t border-hairline pt-3">
                <span className="min-w-0 flex-1 truncate pr-3 text-xs text-ink-soft">
                  {o.address}
                </span>
                <span className="font-display shrink-0 font-bold text-primary">
                  {inr(o.total)}
                </span>
              </div>

              <div className="border-t border-hairline pt-3">
                <StatusTimeline status={o.status} />
              </div>

              <button
                onClick={() =>
                  downloadInvoice(o, {
                    full_name: profile?.full_name,
                    email: profile?.email ?? user?.email,
                  })
                }
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-btn border border-hairline bg-white px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 active:scale-[.99]"
              >
                <FileText size={15} /> Download invoice
              </button>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}
