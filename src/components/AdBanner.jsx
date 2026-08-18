import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { supabase, supabaseReady } from '../lib/supabase.js'
import { fetchActiveAds } from '../lib/ads.js'

// Dismissals are remembered per ad, so closing one does not hide the next.
const KEY = 'relief_ads_dismissed'

const readDismissed = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) ?? [])
  } catch {
    return new Set()
  }
}

export default function AdBanner() {
  const [ads, setAds] = useState([])
  const [dismissed, setDismissed] = useState(readDismissed)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!supabaseReady) return

    const load = () =>
      fetchActiveAds()
        .then(setAds)
        .catch(() => setAds([]))

    load()

    // live: a new ad appears (and an edited/removed one updates) without
    // the visitor reloading the card
    const ch = supabase
      .channel('public-ads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, load)
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [])

  const ad = ads.find((a) => !dismissed.has(a.id))

  // small delay so the ad does not fight the splash screen for attention
  useEffect(() => {
    if (!ad) return setShown(false)
    const t = setTimeout(() => setShown(true), 900)
    return () => clearTimeout(t)
  }, [ad])

  if (!ad) return null

  const close = () => {
    setShown(false)
    // let the exit animation finish before unmounting
    setTimeout(() => {
      const next = new Set(dismissed).add(ad.id)
      setDismissed(next)
      localStorage.setItem(KEY, JSON.stringify([...next]))
    }, 260)
  }

  return createPortal(
    <div
      className={`ad-overlay ${shown ? 'is-open' : ''}`}
      role="dialog"
      aria-label={ad.heading || 'Advertisement'}
      onClick={close}
    >
      <div className="ad-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="ad-close" aria-label="Close advertisement">
          <X size={16} strokeWidth={2.6} />
        </button>

        {ad.poster_url && (
          <img
            src={ad.poster_url}
            alt={ad.heading || 'Advertisement'}
            className="ad-poster"
            loading="lazy"
          />
        )}

        {(ad.heading || ad.body) && (
          <div className="ad-body">
            {ad.heading && <h3 className="ad-heading">{ad.heading}</h3>}
            {ad.body && <p className="ad-text">{ad.body}</p>}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
