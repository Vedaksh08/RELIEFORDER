import { supabase } from './supabase.js'

// Renamed away from "ads"/"ad-posters": browser shields (Brave, uBlock,
// AdGuard) block any request whose URL contains "ads", which cancelled every
// call with ERR_BLOCKED_BY_CLIENT before it left the browser. See
// supabase/migration-06-rename-ads.sql.
const TABLE = 'promos'
const BUCKET = 'promo-media'

// Posters uploaded before the rename still live in the old bucket, so their
// URLs must keep resolving.
const LEGACY_BUCKET = 'ad-posters'

/** Active ads, newest first. Used by the public card. */
export async function fetchActiveAds() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Every ad including paused ones. Admin only — RLS enforces it. */
export async function fetchAllAds() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function uploadPoster(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function removePoster(url) {
  if (!url) return
  // public URLs end with /<bucket>/<path>; posters predating the rename are
  // still in the legacy bucket
  for (const bucket of [BUCKET, LEGACY_BUCKET]) {
    const marker = `/${bucket}/`
    const i = url.indexOf(marker)
    if (i === -1) continue
    const path = url.slice(i + marker.length)
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error // caller decides whether this matters
    return
  }
}

export async function createAd({ heading, body, posterUrl }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      heading: heading || null,
      body: body || null,
      poster_url: posterUrl || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAd(id, patch) {
  // same reasoning as deleteAd: a blocked update is a silent no-op unless we
  // ask for the affected rows back
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('The advertisement was not updated — admin rights may be missing.')
  }
}

export async function deleteAd(ad) {
  // .select() matters: without it PostgREST returns 200 and an empty body
  // whether it deleted the row or RLS silently blocked it. Asking for the
  // deleted rows back is the only way to tell the difference.
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', ad.id)
    .select('id')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error(
      'The advertisement was not deleted — your account may not have admin ' +
        'rights. Run migration-05-ads-rls-fix.sql, then check `select is_admin();` ' +
        'in Supabase returns true.',
    )
  }

  // The row is gone at this point and that is what matters. Poster cleanup
  // is best-effort housekeeping: it must never throw, or a storage hiccup
  // (offline, blocked request, missing object) would surface as "delete
  // failed" for a delete that actually succeeded.
  //
  // Re-run copies share the original's poster URL, so the image is only
  // removed once no other ad still points at it — otherwise deleting one
  // re-run would blank out the poster on all its siblings.
  try {
    if (ad.poster_url) {
      const { count } = await supabase
        .from(TABLE)
        .select('id', { count: 'exact', head: true })
        .eq('poster_url', ad.poster_url)
      if (!count) await removePoster(ad.poster_url)
    }
  } catch (e) {
    console.warn('[ads] row deleted; poster cleanup failed:', e?.message ?? e)
  }
}

/**
 * Re-runs an ad by inserting a fresh copy. A new row means a new id, and
 * dismissals are tracked per id — so everyone sees it again, including the
 * people who closed the original. Toggling a flag on the old row could never
 * do this, because its id has already been dismissed.
 */
export async function rerunAd(ad) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      heading: ad.heading,
      body: ad.body,
      poster_url: ad.poster_url, // same image, no re-upload needed
    })
    .select()
    .single()
  if (error) throw error
  return data
}
