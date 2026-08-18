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
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), profiles(full_name, email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const acceptOrder = (id) => supabase.rpc('accept_order', { p_order_id: id })
export const rejectOrder = (id) => supabase.rpc('reject_order', { p_order_id: id })

export async function markDelivered(id) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', id)
  if (error) throw error
}

export function saveProfileDetails(userId, { mobile, address }) {
  return supabase.from('profiles').update({ mobile, address }).eq('id', userId)
}
