import { createPortal } from 'react-dom'
import { X, Phone, MapPin, ShieldCheck } from 'lucide-react'
import { inr } from './Shell.jsx'

export default function ConfirmOrderModal({
  items,
  total,
  mobile,
  address,
  note,
  busy,
  onConfirm,
  onCancel,
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm your order"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-lg sm:rounded-card"
      >
        <div className="flex items-center gap-2 border-b border-hairline px-5 py-4">
          <ShieldCheck size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-primary">Confirm your order</h2>
          <button
            onClick={onCancel}
            className="ml-auto grid size-8 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {items.length} item{items.length > 1 ? 's' : ''}
          </p>
          <ul className="mb-4 flex flex-col gap-2">
            {items.map((i) => (
              <li key={i.id} className="flex items-start gap-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{i.name}</span>
                  {i.brand && <span className="text-ink-soft"> · {i.brand}</span>}
                  <span className="block text-xs text-ink-soft">
                    {inr(i.price)} × {i.qty}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-btn bg-black/[.03] p-3 text-sm">
            <p className="mb-1.5 flex items-center gap-2">
              <Phone size={13} className="shrink-0 text-ink-soft" />
              <span className="font-medium">{mobile}</span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 shrink-0 text-ink-soft" />
              <span className="text-ink-soft">{address}</span>
            </p>
            {note && (
              <p className="mt-2 border-t border-hairline pt-2 text-xs text-ink-soft">
                Note: {note}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-hairline px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-ink-soft">Total payable</span>
            <span className="font-display text-xl font-bold text-primary">
              {inr(total)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="flex-1 rounded-btn bg-black/5 px-4 py-3 font-semibold text-ink transition hover:bg-black/10 disabled:opacity-50"
            >
              Go back
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex-[1.4] rounded-btn bg-primary px-4 py-3 font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[.98] disabled:opacity-60"
            >
              {busy ? 'Placing…' : 'Confirm order'}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-soft">
            Pay on delivery · stock confirmed when Relief Medical accepts
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
