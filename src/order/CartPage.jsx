import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Trash2, Plus, Minus, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { useCart } from '../lib/CartContext.jsx'
import { placeOrder, saveProfileDetails } from '../lib/orders.js'
import { supabaseReady } from '../lib/supabase.js'
import { Shell, Spinner, Empty, inr } from './Shell.jsx'
import { SignInGate } from './OrderPage.jsx'
import ConfirmOrderModal from './ConfirmOrderModal.jsx'
import { playChime, playError, primeAudio } from '../lib/sound.js'

export default function CartPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const { items, total, setQty, remove, clear } = useCart()
  const navigate = useNavigate()

  const [mobile, setMobile] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Pre-fill from the saved profile so repeat orders are one tap.
  useEffect(() => {
    if (profile) {
      setMobile((m) => m || profile.mobile || '')
      setAddress((a) => a || profile.address || '')
    }
  }, [profile])

  if (!supabaseReady || loading)
    return (
      <Shell title="Cart" back="/order">
        <Spinner />
      </Shell>
    )
  if (!user)
    return (
      <Shell title="Cart" back="/order">
        <SignInGate />
      </Shell>
    )

  if (done)
    return (
      <Shell title="Order placed" back="/order">
        <div className="mx-auto max-w-md rounded-card bg-white p-8 text-center shadow-md">
          <CheckCircle2 className="mx-auto mb-3 text-accent" size={44} />
          <h2 className="font-display mb-2 text-xl font-semibold text-primary">
            Order placed
          </h2>
          <p className="mb-6 text-sm text-ink-soft">
            Relief Medical will confirm your order shortly. You can track it under
            My Orders.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ to: '/orders' })}
              className="flex-1 rounded-btn bg-primary px-4 py-3 font-semibold text-white transition hover:brightness-110"
            >
              My Orders
            </button>
            <button
              onClick={() => navigate({ to: '/order' })}
              className="flex-1 rounded-btn bg-black/5 px-4 py-3 font-semibold text-ink transition hover:bg-black/10"
            >
              Keep shopping
            </button>
          </div>
        </div>
      </Shell>
    )

  const valid = items.length > 0 && /^[0-9]{10}$/.test(mobile.trim()) && address.trim().length > 8

  const submit = async () => {
    setErr('')
    setBusy(true)
    try {
      const placed = await placeOrder({
        userId: user.id,
        items,
        mobile: mobile.trim(),
        address: address.trim(),
        note: note.trim(),
      })

      // NOTE: the "order placed" WhatsApp is deliberately NOT sent from here.
      // This runs on the customer's device, which cannot reach the bot host
      // (VITE_BOT_URL is private to the shop). The admin panel picks the new
      // order up over realtime and sends both messages from there.
      // remember details for next time
      await saveProfileDetails(user.id, { mobile: mobile.trim(), address: address.trim() })
      refreshProfile()
      clear()
      setConfirming(false)
      setDone(true)
      playChime()
    } catch (e) {
      setErr(e.message ?? 'Could not place the order. Please try again.')
      setConfirming(false)
      playError()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Cart" back="/order">
      {items.length === 0 ? (
        <Empty icon={ShoppingCart} title="Your cart is empty">
          Browse the catalogue and add the medicines you need.
        </Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_360px] lg:gap-4">
          <div className="flex flex-col gap-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-2.5 rounded-card bg-white p-3 shadow-sm sm:gap-3 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate font-semibold">{i.name}</p>
                  {i.brand && <p className="truncate text-xs text-ink-soft">{i.brand}</p>}
                  <p className="mt-1 text-sm font-bold text-primary">{inr(i.price)}</p>
                </div>

                <div className="flex items-center gap-1 rounded-btn bg-primary/10 p-1">
                  <button
                    onClick={() => setQty(i.id, i.qty - 1)}
                    className="grid size-8 place-items-center rounded-lg bg-white text-primary shadow-sm active:scale-95"
                    aria-label="Decrease"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-primary">
                    {i.qty}
                  </span>
                  <button
                    disabled={i.qty >= i.stock}
                    onClick={() => setQty(i.id, i.qty + 1)}
                    className="grid size-8 place-items-center rounded-lg bg-white text-primary shadow-sm active:scale-95 disabled:opacity-40"
                    aria-label="Increase"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  onClick={() => remove(i.id)}
                  className="grid size-9 place-items-center rounded-full text-red-500 transition hover:bg-red-50"
                  aria-label={`Remove ${i.name}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-card bg-white p-4 shadow-md sm:p-5 lg:sticky lg:top-24">
            <h2 className="font-display mb-4 font-semibold text-primary">
              Delivery details
            </h2>

            <label className="mb-1 block text-xs font-semibold text-ink-soft">
              Mobile number
            </label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              inputMode="numeric"
              placeholder="10-digit mobile"
              className="mb-3 w-full rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <label className="mb-1 block text-xs font-semibold text-ink-soft">
              Delivery address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Flat / building, street, landmark, pincode"
              className="mb-3 w-full resize-none rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <label className="mb-1 block text-xs font-semibold text-ink-soft">
              Note (optional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything we should know?"
              className="mb-4 w-full rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <div className="mb-4 flex items-center justify-between border-t border-hairline pt-3">
              <span className="text-sm text-ink-soft">Total</span>
              <span className="font-display text-xl font-bold text-primary">
                {inr(total)}
              </span>
            </div>

            {err && (
              <p className="mb-3 rounded-btn bg-red-50 p-2.5 text-xs text-red-600">{err}</p>
            )}

            <button
              disabled={!valid || busy}
              onClick={() => {
                primeAudio() // unlock audio within this user gesture
                setConfirming(true)
              }}
              className="w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              Review &amp; place order
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-soft">
              Pay on delivery. Stock is confirmed when Relief Medical accepts.
            </p>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmOrderModal
          items={items}
          total={total}
          mobile={mobile.trim()}
          address={address.trim()}
          note={note.trim()}
          busy={busy}
          onConfirm={submit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </Shell>
  )
}
