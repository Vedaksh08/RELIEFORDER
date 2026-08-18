import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Minus,
  Trash2,
  Upload,
  Download,
  Search,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { inr, Spinner, Empty } from '../order/Shell.jsx'
import { toCSV, parseCSV, diffImport } from './csv.js'

const BLANK = { name: '', brand: '', category: '', price: '', stock: '' }

// Matches the dashboard's "Low stock" tile.
export const LOW_STOCK = 10

export default function Inventory({ lowOnly = false, onClearLow, onStockSaved }) {
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState(null) // inline edit buffer
  const [adding, setAdding] = useState(null)
  const [preview, setPreview] = useState(null) // CSV import preview
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    const { data } = await supabase.from('medicines').select('*').order('name')
    setMeds(data ?? [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return meds.filter((m) => {
      if (lowOnly && !(m.is_active && m.stock <= LOW_STOCK)) return false
      return (
        !t ||
        m.name.toLowerCase().includes(t) ||
        (m.brand ?? '').toLowerCase().includes(t)
      )
    })
  }, [meds, q, lowOnly])

  const saveEdit = async () => {
    const { id, ...patch } = draft
    setBusy(true)
    await supabase
      .from('medicines')
      .update({
        name: patch.name,
        brand: patch.brand || null,
        category: patch.category || null,
        price: Number(patch.price) || 0,
        stock: parseInt(patch.stock, 10) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setDraft(null)
    setBusy(false)
    load()
  }

  const addNew = async () => {
    setBusy(true)
    await supabase.from('medicines').insert({
      name: adding.name,
      brand: adding.brand || null,
      category: adding.category || null,
      price: Number(adding.price) || 0,
      stock: parseInt(adding.stock, 10) || 0,
    })
    setAdding(null)
    setBusy(false)
    load()
  }

  // Restocking is the common case, so it gets a one-tap path that does not
  // require entering the full inline editor.
  const bumpStock = async (m, delta) => {
    const next = Math.max(0, (m.stock ?? 0) + delta)
    setMeds((cur) => cur.map((x) => (x.id === m.id ? { ...x, stock: next } : x)))
    const { error } = await supabase
      .from('medicines')
      .update({ stock: next, updated_at: new Date().toISOString() })
      .eq('id', m.id)
    if (error) load() // reconcile if the write failed
    else onStockSaved?.()
  }

  const setStockTo = async (m, value) => {
    const next = Math.max(0, parseInt(value, 10) || 0)
    setMeds((cur) => cur.map((x) => (x.id === m.id ? { ...x, stock: next } : x)))
    const { error } = await supabase
      .from('medicines')
      .update({ stock: next, updated_at: new Date().toISOString() })
      .eq('id', m.id)
    if (error) load()
    else onStockSaved?.()
  }

  const del = async (m) => {
    if (!confirm(`Remove "${m.name}" from the catalogue?`)) return
    // deactivate rather than hard-delete: past order_items reference this row
    await supabase.from('medicines').update({ is_active: false }).eq('id', m.id)
    load()
  }

  const exportCSV = () => {
    const blob = new Blob([toCSV(meds)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `relief-medicines-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    setPreview(diffImport(parseCSV(text), meds))
    e.target.value = '' // allow re-picking the same file
  }

  const applyImport = async () => {
    setBusy(true)
    const { creates, updates } = preview
    if (creates.length) await supabase.from('medicines').insert(creates)
    for (const u of updates) {
      const { id, before, ...patch } = u
      await supabase.from('medicines').update(patch).eq('id', id)
    }
    setPreview(null)
    setBusy(false)
    load()
  }

  if (loading) return <Spinner label="Loading inventory…" />

  return (
    <div>
      {lowOnly && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-card border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <p className="min-w-0 flex-1 text-sm font-medium text-amber-900">
            Showing {shown.length} medicine{shown.length === 1 ? '' : 's'} at or below{' '}
            {LOW_STOCK} in stock. Adjust the counts below.
          </p>
          <button
            onClick={onClearLow}
            className="shrink-0 rounded-btn bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-black/5"
          >
            Show all
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search inventory…"
            className="w-full rounded-btn border border-hairline bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setAdding({ ...BLANK })}
          className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus size={16} /> Add
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-btn bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-black/5"
        >
          <Upload size={16} /> Import
        </button>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-btn bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-black/5"
        >
          <Download size={16} /> Export
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="hidden"
        />
      </div>

      {preview && <ImportPreview preview={preview} busy={busy} onCancel={() => setPreview(null)} onApply={applyImport} />}

      {adding && (
        <div className="mb-3 rounded-card bg-white p-4 shadow-md">
          <p className="font-display mb-3 font-semibold text-primary">New medicine</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {['name', 'brand', 'category', 'price', 'stock'].map((f) => (
              <input
                key={f}
                value={adding[f]}
                onChange={(e) => setAdding({ ...adding, [f]: e.target.value })}
                placeholder={f[0].toUpperCase() + f.slice(1)}
                type={f === 'price' || f === 'stock' ? 'number' : 'text'}
                className={`rounded-btn border border-hairline px-3 py-2 text-sm outline-none focus:border-primary ${
                  f === 'name' ? 'col-span-2 sm:col-span-1' : ''
                }`}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={!adding.name || busy}
              onClick={addNew}
              className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
            >
              Save
            </button>
            <button
              onClick={() => setAdding(null)}
              className="rounded-btn bg-black/5 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <Empty title={lowOnly ? 'Nothing is running low' : 'No medicines yet'}>
          {lowOnly
            ? `Every active medicine has more than ${LOW_STOCK} in stock.`
            : 'Add one above, or import a CSV with columns: name, brand, category, price, stock.'}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-card bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="p-3">Medicine</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => {
                const editing = draft?.id === m.id
                const cell = (f, type = 'text') =>
                  editing ? (
                    <input
                      value={draft[f] ?? ''}
                      type={type}
                      onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
                      className="w-full rounded border border-primary/40 px-2 py-1 text-sm outline-none"
                    />
                  ) : null

                return (
                  <tr
                    key={m.id}
                    className={`border-b border-hairline/60 last:border-0 ${m.is_active ? '' : 'opacity-40'}`}
                  >
                    <td className="p-3 font-medium">{cell('name') ?? m.name}</td>
                    <td className="p-3 text-ink-soft">{cell('brand') ?? (m.brand || '—')}</td>
                    <td className="p-3 text-ink-soft">
                      {cell('category') ?? (m.category || '—')}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {cell('price', 'number') ?? inr(m.price)}
                    </td>
                    <td className="p-3">
                      {editing ? (
                        <div className="text-right">{cell('stock', 'number')}</div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => bumpStock(m, -1)}
                            disabled={m.stock <= 0}
                            className="grid size-7 place-items-center rounded-lg bg-black/5 text-ink transition hover:bg-black/10 active:scale-95 disabled:opacity-35"
                            aria-label={`Reduce stock of ${m.name}`}
                          >
                            <Minus size={13} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            defaultValue={m.stock}
                            key={`${m.id}-${m.stock}`}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              if (Number(e.target.value) !== m.stock)
                                setStockTo(m, e.target.value)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                            }}
                            className={`w-14 rounded-lg px-2 py-1 text-center text-xs font-bold outline-none transition focus:ring-2 focus:ring-primary/40 ${
                              m.stock <= 0
                                ? 'bg-red-100 text-red-600'
                                : m.stock <= LOW_STOCK
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                            aria-label={`Stock for ${m.name}`}
                          />

                          <button
                            onClick={() => bumpStock(m, 1)}
                            className="grid size-7 place-items-center rounded-lg bg-black/5 text-ink transition hover:bg-black/10 active:scale-95"
                            aria-label={`Increase stock of ${m.name}`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {editing ? (
                          <>
                            <button
                              disabled={busy}
                              onClick={saveEdit}
                              className="grid size-8 place-items-center rounded-full bg-accent/15 text-accent"
                              aria-label="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setDraft(null)}
                              className="grid size-8 place-items-center rounded-full bg-black/5"
                              aria-label="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setDraft({ ...m })}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => del(m)}
                              className="grid size-8 place-items-center rounded-full text-red-500 transition hover:bg-red-50"
                              aria-label={`Remove ${m.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ImportPreview({ preview, busy, onCancel, onApply }) {
  const { creates, updates, errors } = preview
  return (
    <div className="mb-4 rounded-card border border-primary/20 bg-white p-4 shadow-md">
      <p className="font-display mb-1 font-semibold text-primary">Import preview</p>
      <p className="mb-3 text-xs text-ink-soft">
        Nothing is saved until you apply. Rows are matched by name + brand.
      </p>

      <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700">
          {creates.length} new
        </span>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">
          {updates.length} updated
        </span>
        {errors.length > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">
            {errors.length} skipped
          </span>
        )}
      </div>

      {updates.length > 0 && (
        <div className="mb-3 max-h-44 overflow-y-auto rounded-btn bg-black/[.03] p-2 text-xs">
          {updates.map((u) => (
            <div key={u.id} className="flex flex-wrap gap-2 py-0.5">
              <span className="font-medium">{u.name}</span>
              {Number(u.before.price) !== u.price && (
                <span className="text-ink-soft">
                  price {inr(u.before.price)} → <b className="text-ink">{inr(u.price)}</b>
                </span>
              )}
              {Number(u.before.stock) !== u.stock && (
                <span className="text-ink-soft">
                  stock {u.before.stock} → <b className="text-ink">{u.stock}</b>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-3 flex gap-2 rounded-btn bg-red-50 p-2.5 text-xs text-red-600">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>{errors.slice(0, 5).map((e) => <div key={e}>{e}</div>)}</div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          disabled={busy || (creates.length === 0 && updates.length === 0)}
          onClick={onApply}
          className="rounded-btn bg-primary px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
        >
          {busy ? 'Applying…' : 'Apply changes'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-btn bg-black/5 px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
