import { useEffect, useRef, useState } from 'react'
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

/**
 * Keeps the dismissed list from growing forever, and — more importantly —
 * lets a deleted ad's id fall out so the list cannot mask a future ad that
 * happens to reuse it. We only need to remember ads that still exist.
 */
const pruneDismissed = (liveIds) => {
  try {
    const kept = [...readDismissed()].filter((id) => liveIds.has(id))
    localStorage.setItem(KEY, JSON.stringify(kept))
    return new Set(kept)
  } catch {
    return readDismissed()
  }
}

export default function AdBanner() {
  const [ads, setAds] = useState([])
  const [dismissed, setDismissed] = useState(readDismissed)
  const [shown, setShown] = useState(false)
  const closingRef = useRef(false)

  useEffect(() => {
    if (!supabaseReady) return

    const load = async () => {
      try {
        const live = await fetchActiveAds()
        setAds(live)
        // drop dismissals for ads that no longer exist
        setDismissed(pruneDismissed(new Set(live.map((a) => a.id))))
      } catch {
        setAds([])
      }
    }

    load()

    // Live: publishing, editing or DELETING an ad updates open cards without
    // the visitor reloading. DELETE events require `replica identity full`
    // on the table — see supabase/migration-04-ads-delete.sql.
    const ch = supabase
      .channel('public-ads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, load)
      .subscribe()

    // A phone that was asleep misses realtime entirely, so re-check whenever
    // the tab becomes visible again. Without this a pulled ad can linger for
    // hours on a backgrounded device.
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(ch)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const ad = ads.find((a) => !dismissed.has(a.id))

  // Show after a beat so the ad does not fight the splash screen. If the ad
  // is pulled while on screen, this also drives the exit: `ad` becomes
  // undefined, `shown` goes false, and the overlay animates out rather than
  // vanishing mid-frame.
  useEffect(() => {
    if (!ad) {
      setShown(false)
      return
    }
    closingRef.current = false
    const t = setTimeout(() => setShown(true), 900)
    return () => clearTimeout(t)
  }, [ad])

  // Keep the element mounted through the fade-out, then drop it.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (shown) return setMounted(true)
    if (!mounted) return
    const t = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(t)
  }, [shown, mounted])

  // Nothing to show and nothing left to animate out.
  if (!mounted && !ad) return null

  const close = () => {
    if (closingRef.current || !ad) return
    closingRef.current = true
    setShown(false)
    // remember the dismissal only after the exit animation
    const id = ad.id
    setTimeout(() => {
      setDismissed((cur) => {
        const next = new Set(cur).add(id)
        localStorage.setItem(KEY, JSON.stringify([...next]))
        return next
      })
    }, 280)
  }

  return createPortal(
    <div
      className={`ad-overlay ${shown ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label={ad?.heading || 'Advertisement'}
      onClick={close}
    >
      <div className="ad-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="ad-close" aria-label="Close advertisement">
          <X size={16} strokeWidth={2.6} />
        </button>

        {ad?.poster_url && (
          <img
            src={ad.poster_url}
            alt={ad.heading || 'Advertisement'}
            className="ad-poster"
            loading="lazy"
          />
        )}

        {(ad?.heading || ad?.body) && (
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
