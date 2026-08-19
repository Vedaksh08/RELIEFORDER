import { supabase } from './supabase.js'

const BUCKET = 'ad-posters'

/** Active ads, newest first. Used by the public card. */
export async function fetchActiveAds() {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Every ad including paused ones. Admin only — RLS enforces it. */
export async function fetchAllAds() {
  const { data, error } = await supabase
    .from('ads')
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
  // public URLs end with /<bucket>/<path>
  const marker = `/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return
  const path = url.slice(i + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}

export async function createAd({ heading, body, posterUrl }) {
  const { data, error } = await supabase
    .from('ads')
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
    .from('ads')
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
    .from('ads')
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

  // Re-run copies share the original's poster URL, so the image can only be
  // deleted once no other ad still points at it — otherwise deleting one
  // re-run would blank out the poster on all its siblings.
  if (ad.poster_url) {
    const { count } = await supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('poster_url', ad.poster_url)
    if (!count) await removePoster(ad.poster_url).catch(() => {})
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
    .from('ads')
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
