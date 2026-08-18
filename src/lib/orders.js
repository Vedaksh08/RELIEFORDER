import { supabase } from './supabase.js'

/**
 * Places an order. Stock is NOT decremented here — that happens atomically
 * in Postgres when the admin accepts (see accept_order in supabase/schema.sql).
 */
export async function placeOrder({ userId, items, mobile, address, note }) {
  const total = items.reduce((n, i) => n + i.qty * Number(i.price), 0)

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ user_id: userId, total, mobile, address, note, status: 'placed' })
    .select()
    .single()
  if (orderErr) throw orderErr

  // price/name/brand are snapshotted so repricing never rewrites history
  const rows = items.map((i) => ({
    order_id: order.id,
    medicine_id: i.id,
    name: i.name,
    brand: i.brand,
    price: i.price,
    qty: i.qty,
  }))

  const { error: itemsErr } = await supabase.from('order_items').insert(rows)
  if (itemsErr) {
    // don't strand a headless order if the items fail to write
    await supabase.from('orders').delete().eq('id', order.id)
    throw itemsErr
  }
  return order
}

export async function fetchMyOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllOrders() {
  // profiles is fetched separately rather than embedded: orders.user_id points at
  // auth.users, so PostgREST can only embed profiles once the extra FK in
  // schema.sql exists. Two queries work either way.
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = [...new Set((data ?? []).map((o) => o.user_id))]
  if (ids.length === 0) return data

  const { data: people } = await supabase
    .from('profiles')
    .select('id, full_name, email, mobile')
    .in('id', ids)

  const byId = new Map((people ?? []).map((p) => [p.id, p]))
  return (data ?? []).map((o) => ({ ...o, profiles: byId.get(o.user_id) ?? null }))
}

export const acceptOrder = (id) => supabase.rpc('accept_order', { p_order_id: id })
export const rejectOrder = (id) => supabase.rpc('reject_order', { p_order_id: id })

export async function dispatchOrder(id) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'dispatched', dispatched_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markDelivered(id) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export function saveProfileDetails(userId, { mobile, address }) {
  return supabase.from('profiles').update({ mobile, address }).eq('id', userId)
}
