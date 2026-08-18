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
  const { error } = await supabase
    .from('ads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAd(ad) {
  const { error } = await supabase.from('ads').delete().eq('id', ad.id)
  if (error) throw error
  // drop the image too, so the bucket does not fill with orphans
  await removePoster(ad.poster_url).catch(() => {})
}

export const toggleAd = (id, isActive) => updateAd(id, { is_active: isActive })
