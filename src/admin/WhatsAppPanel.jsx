import { useCallback, useEffect, useState } from 'react'
import {
  Smartphone,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Send,
  CheckCircle2,
  AlertTriangle,
  Power,
} from 'lucide-react'
import {
  botConfigured,
  getBotStatus,
  saveBotSettings,
  botLogout,
  sendTest,
} from '../lib/botApi.js'
import { Spinner } from '../order/Shell.jsx'

const STATUS_OPTIONS = [
  ['placed', 'Order placed'],
  ['accepted', 'Confirmed'],
  ['dispatched', 'Out for delivery'],
  ['delivered', 'Delivered'],
  ['rejected', 'Rejected'],
]

export default function WhatsAppPanel() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [newNumber, setNewNumber] = useState('')
  const [testTo, setTestTo] = useState('')
  const [toast, setToast] = useState('')

  const refresh = useCallback(async () => {
    try {
      setStatus(await getBotStatus())
      setErr('')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!botConfigured) return setLoading(false)
    refresh()
    // poll while unlinked so the QR appears/refreshes without a manual reload
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [refresh])

  const patch = async (p) => {
    setBusy(true)
    try {
      const next = await saveBotSettings(p)
      setStatus((s) => ({ ...s, settings: next }))
      setToast('Saved')
      setTimeout(() => setToast(''), 1800)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!botConfigured)
    return (
      <div className="rounded-card bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="font-display font-semibold">WhatsApp bot not configured</h2>
        </div>
        <p className="mb-3 text-sm text-ink-soft">
          Set these in your <code className="rounded bg-black/5 px-1">.env</code>, then
          restart the dev server (or redeploy on Vercel):
        </p>
        <pre className="overflow-x-auto rounded-btn bg-black/[.04] p-3 text-xs">
{`VITE_BOT_URL=https://your-bot-host
VITE_BOT_SECRET=the-same-BOT_SECRET-as-the-bot`}
        </pre>
        <p className="mt-3 text-xs text-ink-soft">
          See <code className="rounded bg-black/5 px-1">whatsapp-bot/README.md</code> for
          how to run and host the service.
        </p>
      </div>
    )

  if (loading) return <Spinner label="Contacting the bot…" />

  const cfg = status?.settings ?? {}
  const linked = status?.ready

  return (
    <div className="flex flex-col gap-3">
      {err && (
        <div className="flex items-start gap-2 rounded-card bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Could not reach the bot</p>
            <p className="break-words text-xs opacity-80">{err}</p>
          </div>
        </div>
      )}

      {/* ---------- connection ---------- */}
      <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Smartphone size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-primary">Connection</h2>
          <button
            onClick={refresh}
            className="ml-auto grid size-8 place-items-center rounded-full text-ink-soft transition hover:bg-black/5"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {linked ? (
          <div className="flex flex-wrap items-center gap-3 rounded-btn bg-green-50 p-3">
            <CheckCircle2 size={20} className="shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-800">WhatsApp connected</p>
              <p className="truncate text-xs text-green-700">
                Sending as +{status.me} · {status.sentLastHour ?? 0} sent this hour
                {status.queued ? ` · ${status.queued} queued` : ''}
              </p>
            </div>
            <button
              onClick={async () => {
                if (!confirm('Unlink this number? You will need to scan again.')) return
                setBusy(true)
                try {
                  await botLogout()
                  await refresh()
                } catch (e) {
                  setErr(e.message)
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={14} /> Unlink
            </button>
          </div>
        ) : (
          <div className="text-center">
            {status?.qr ? (
              <>
                <img
                  src={status.qr}
                  alt="WhatsApp QR code"
                  className="mx-auto size-56 rounded-xl bg-white p-2 shadow-sm sm:size-64"
                />
                <p className="mt-3 text-sm font-medium text-ink">
                  Scan with the bot&apos;s phone
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-ink-soft">
                  WhatsApp → Settings → Linked devices → Link a device. This page
                  updates by itself once linked.
                </p>
              </>
            ) : (
              <div className="py-8">
                <div className="mx-auto mb-3 size-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                <p className="text-sm text-ink-soft">
                  Waiting for the bot to produce a QR code…
                </p>
              </div>
            )}
          </div>
        )}

        {status?.lastError && (
          <p className="mt-3 break-words rounded-btn bg-amber-50 p-2 text-xs text-amber-800">
            Last error: {status.lastError}
          </p>
        )}
      </div>

      {/* ---------- admin numbers ---------- */}
      <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display mb-1 font-semibold text-primary">Admin numbers</h2>
        <p className="mb-3 text-xs text-ink-soft">
          These numbers receive a WhatsApp message when a new order arrives. Receive
          only — replies are not read.
        </p>

        <div className="mb-3 flex flex-col gap-2">
          {(cfg.adminNumbers ?? []).length === 0 && (
            <p className="rounded-btn bg-black/[.03] p-3 text-sm text-ink-soft">
              No admin numbers yet.
            </p>
          )}
          {(cfg.adminNumbers ?? []).map((n) => (
            <div
              key={n}
              className="flex items-center gap-2 rounded-btn bg-black/[.03] px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{n}</span>
              <button
                onClick={() =>
                  patch({ adminNumbers: cfg.adminNumbers.filter((x) => x !== n) })
                }
                disabled={busy}
                className="grid size-8 shrink-0 place-items-center rounded-full text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                aria-label={`Remove ${n}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="10-digit mobile, e.g. 9373624688"
            inputMode="tel"
            className="min-w-0 flex-1 rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              const n = newNumber.trim()
              if (!n) return
              patch({ adminNumbers: [...(cfg.adminNumbers ?? []), n] })
              setNewNumber('')
            }}
            disabled={busy || !newNumber.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:bg-gray-300"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* ---------- customer updates ---------- */}
      <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display mb-1 font-semibold text-primary">
          Customer updates
        </h2>
        <p className="mb-3 text-xs text-ink-soft">
          Which status changes send the customer a WhatsApp message. Fewer messages
          means less chance of the number being flagged.
        </p>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(([key, label]) => {
            const on = (cfg.customerStatuses ?? []).includes(key)
            return (
              <button
                key={key}
                disabled={busy}
                onClick={() =>
                  patch({
                    customerStatuses: on
                      ? cfg.customerStatuses.filter((x) => x !== key)
                      : [...(cfg.customerStatuses ?? []), key],
                  })
                }
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  on ? 'bg-primary text-white' : 'bg-black/5 text-ink-soft'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ---------- master switch + test ---------- */}
      <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Power
            size={18}
            className={cfg.sendingEnabled ? 'text-green-600' : 'text-ink-soft'}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              WhatsApp sending is {cfg.sendingEnabled ? 'ON' : 'OFF'}
            </p>
            <p className="text-xs text-ink-soft">
              Turn off to stop all messages immediately without unlinking.
            </p>
          </div>
          <button
            onClick={() => patch({ sendingEnabled: !cfg.sendingEnabled })}
            disabled={busy}
            className={`shrink-0 rounded-btn px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              cfg.sendingEnabled
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-accent text-white hover:brightness-110'
            }`}
          >
            {cfg.sendingEnabled ? 'Turn off' : 'Turn on'}
          </button>
        </div>

        <div className="flex gap-2 border-t border-hairline pt-4">
          <input
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Send a test to this number"
            inputMode="tel"
            className="min-w-0 flex-1 rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={async () => {
              setBusy(true)
              try {
                await sendTest(
                  testTo.trim(),
                  'Test message from Relief Medical. If you can read this, the bot works.',
                )
                setToast('Test queued')
                setTimeout(() => setToast(''), 2500)
              } catch (e) {
                setErr(e.message)
              } finally {
                setBusy(false)
              }
            }}
            disabled={busy || !linked || !testTo.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-black/5 disabled:opacity-40"
          >
            <Send size={15} /> Test
          </button>
        </div>
      </div>

      {toast && (
        <p className="rounded-btn bg-green-50 p-2.5 text-center text-sm font-medium text-green-700">
          {toast}
        </p>
      )}
    </div>
  )
}
