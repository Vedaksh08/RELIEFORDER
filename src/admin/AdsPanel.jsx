import { useEffect, useRef, useState } from 'react'
import {
  ImagePlus,
  Trash2,
  RotateCw,
  Plus,
  X,
  Megaphone,
  AlertTriangle,
} from 'lucide-react'
import {
  fetchAllAds,
  createAd,
  deleteAd,
  rerunAd,
  uploadPoster,
} from '../lib/ads.js'
import { Spinner, Empty } from '../order/Shell.jsx'

const MAX_MB = 5

export default function AdsPanel() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const fileRef = useRef(null)

  const load = () =>
    fetchAllAds()
      .then(setAds)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  // revoke the object URL when the chosen file changes, to avoid leaking it
  useEffect(() => {
    if (!file) return setPreview('')
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pickFile = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr('Please choose an image file.')
    if (f.size > MAX_MB * 1024 * 1024)
      return setErr(`That image is over ${MAX_MB}MB. Please pick a smaller one.`)
    setErr('')
    setFile(f)
  }

  const reset = () => {
    setHeading('')
    setBody('')
    setFile(null)
  }

  const publish = async () => {
    setErr('')
    setBusy(true)
    try {
      const posterUrl = file ? await uploadPoster(file) : null
      await createAd({ heading: heading.trim(), body: body.trim(), posterUrl })
      reset()
      load()
    } catch (e) {
      setErr(e.message ?? 'Could not publish the advertisement.')
    } finally {
      setBusy(false)
    }
  }

  // an ad with nothing in it would render as an empty box on the card
  const canPublish = Boolean(file || heading.trim() || body.trim())

  return (
    <div className="flex flex-col gap-3">
      {err && (
        <div className="flex items-start gap-2 rounded-card bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span className="min-w-0 break-words">{err}</span>
        </div>
      )}

      {/* ---------- create ---------- */}
      <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-primary">
            New advertisement
          </h2>
        </div>

        <label className="mb-1 block text-xs font-semibold text-ink-soft">
          Poster
        </label>
        {preview ? (
          <div className="relative mb-3 overflow-hidden rounded-card">
            <img src={preview} alt="Poster preview" className="w-full object-cover" />
            <button
              onClick={() => setFile(null)}
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/92 text-ink shadow-md transition hover:bg-white"
              aria-label="Remove poster"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="mb-3 flex w-full flex-col items-center gap-1.5 rounded-card border-2 border-dashed border-hairline py-7 text-ink-soft transition hover:border-primary/40 hover:bg-primary/[.03]"
          >
            <ImagePlus size={24} />
            <span className="text-sm font-medium">Add poster</span>
            <span className="text-[11px]">JPG or PNG, up to {MAX_MB}MB</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pickFile}
          className="hidden"
        />

        <label className="mb-1 block text-xs font-semibold text-ink-soft">
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          maxLength={70}
          placeholder="e.g. 20% off on all vitamins"
          className="mb-3 w-full rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <label className="mb-1 block text-xs font-semibold text-ink-soft">Text</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Offer details, validity, terms…"
          className="mb-1 w-full resize-none rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <p className="mb-4 text-right text-[11px] text-ink-soft">{body.length}/300</p>

        <div className="flex gap-2">
          <button
            onClick={publish}
            disabled={busy || !canPublish}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-btn bg-primary px-4 py-3 font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            <Plus size={17} />
            {busy ? 'Publishing…' : 'Publish to card'}
          </button>
          {(heading || body || file) && (
            <button
              onClick={reset}
              disabled={busy}
              className="rounded-btn bg-black/5 px-4 py-3 font-semibold text-ink transition hover:bg-black/10 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-soft">
          Appears on the card immediately. Visitors can close it.
        </p>
      </div>

      {/* ---------- existing ---------- */}
      <div className="rounded-card bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display mb-1 font-semibold text-primary">
          Live advertisements
        </h2>
        <p className="mb-3 text-xs text-ink-soft">
          <strong className="text-ink">Run again</strong> re-shows an ad to everyone,
          including people who closed it.{' '}
          <strong className="text-ink">Delete</strong> removes it from every device
          straight away.
        </p>

        {loading ? (
          <Spinner label="Loading ads…" />
        ) : ads.length === 0 ? (
          <Empty icon={Megaphone} title="No advertisements yet">
            Create one above and it will show on the card straight away.
          </Empty>
        ) : (
          <div className="flex flex-col gap-2.5">
            {ads.map((a) => (
              <div
                key={a.id}
                className="flex gap-3 rounded-card border border-hairline p-3 transition"
              >
                {a.poster_url ? (
                  <img
                    src={a.poster_url}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Megaphone size={20} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {a.heading && (
                    <p className="truncate font-semibold text-ink">{a.heading}</p>
                  )}
                  {a.body && (
                    <p className="line-clamp-2 text-xs text-ink-soft">{a.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-ink-soft">
                    Published{' '}
                    {new Date(a.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          'Run this ad again? Everyone sees it once more, including people who closed it before.',
                        )
                      )
                        return
                      setBusy(true)
                      try {
                        await rerunAd(a)
                        load()
                      } catch (e) {
                        setErr(e.message ?? 'Could not re-run the ad.')
                      } finally {
                        setBusy(false)
                      }
                    }}
                    disabled={busy}
                    className="grid size-8 place-items-center rounded-full text-primary transition hover:bg-primary/10 disabled:opacity-40"
                    aria-label="Run this ad again"
                    title="Run again"
                  >
                    <RotateCw size={15} />
                  </button>
                  <button
                    disabled={deletingId === a.id}
                    onClick={async () => {
                      const label = a.heading || a.body || 'this advertisement'
                      if (
                        !confirm(
                          `Delete "${label}"?

It disappears from every device immediately, including people who are looking at it right now. This cannot be undone.`,
                        )
                      )
                        return

                      setDeletingId(a.id)
                      setErr('')
                      // optimistic: the row goes at once, and comes back if
                      // the delete actually failed
                      setAds((cur) => cur.filter((x) => x.id !== a.id))
                      try {
                        await deleteAd(a)
                      } catch (e) {
                        setErr(e.message ?? 'Could not delete the advertisement.')
                        load()
                      } finally {
                        setDeletingId(null)
                      }
                    }}
                    className="grid size-8 place-items-center rounded-full text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                    aria-label={`Delete ${a.heading || 'advertisement'}`}
                    title="Delete everywhere"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
