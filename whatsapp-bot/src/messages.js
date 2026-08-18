// Message templates.
//
// Each status has several phrasings and one is picked at random. Sending the
// byte-identical string to hundreds of people is one of the clearest bot
// signals there is, so this variation is a deliberate safety measure, not
// cosmetic.

const SHOP = process.env.SHOP_NAME ?? 'Relief Medical'
const SHOP_PHONE = process.env.SHOP_PHONE ?? ''

const inr = (n) => `₹${Number(n || 0).toFixed(2)}`

const itemLines = (items = []) =>
  items.map((i) => `• ${i.name}${i.brand ? ` (${i.brand})` : ''} × ${i.qty}`).join('\n')

const ref = (id) => String(id ?? '').slice(0, 8).toUpperCase()

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const footer = () =>
  SHOP_PHONE ? `\n\nQuestions? Call us on ${SHOP_PHONE}.` : ''

/** Customer-facing message for each order status. */
export function customerMessage(status, order) {
  const id = ref(order.id)
  const items = itemLines(order.order_items)
  const total = inr(order.total)

  switch (status) {
    case 'placed':
      return (
        pick([
          `Thanks for your order with ${SHOP}!`,
          `We've received your order at ${SHOP}.`,
          `Your ${SHOP} order is in.`,
        ]) +
        `\n\nOrder #${id}\n${items}\n\nTotal: ${total}\n\n` +
        pick([
          'We will confirm availability shortly.',
          "We're checking stock and will confirm soon.",
          'You will hear from us once it is confirmed.',
        ]) +
        footer()
      )

    case 'accepted':
      return (
        pick([
          `Good news — your order is confirmed.`,
          `Your order has been accepted.`,
          `We've confirmed your order.`,
        ]) +
        `\n\nOrder #${id}\n${items}\n\nTotal: ${total} (pay on delivery)\n\n` +
        pick([
          'We are preparing it for delivery.',
          'It is being packed now.',
          "We'll get it ready and send it out soon.",
        ]) +
        footer()
      )

    case 'dispatched':
      return (
        pick([
          'Your order is on its way!',
          'Your order has been dispatched.',
          'Your medicines are out for delivery.',
        ]) +
        `\n\nOrder #${id}\nAmount due: ${total}\n\n` +
        pick([
          'Please keep the amount ready for the delivery person.',
          'Kindly have the payment ready on delivery.',
          'Our delivery partner will reach you shortly.',
        ]) +
        footer()
      )

    case 'delivered':
      return (
        pick([
          'Your order has been delivered.',
          'Delivery complete — thank you!',
          'That order is now delivered.',
        ]) +
        `\n\nOrder #${id}\n\n` +
        pick([
          `Thank you for choosing ${SHOP}. Get well soon!`,
          `We appreciate your business. Stay healthy!`,
          `Thanks for shopping with ${SHOP}.`,
        ]) +
        footer()
      )

    case 'rejected':
      return (
        `We're sorry — we could not fulfil order #${id}.\n\n` +
        pick([
          'Some items may be out of stock right now.',
          'The items you wanted are unavailable at the moment.',
        ]) +
        (SHOP_PHONE
          ? `\n\nPlease call us on ${SHOP_PHONE} and we'll help you find an alternative.`
          : '')
      )

    default:
      return null
  }
}

/** Admin-facing "new order" alert. Receive-only — admins never get replies. */
export function adminMessage(order) {
  const id = ref(order.id)
  return (
    `🔔 NEW ORDER #${id}\n\n` +
    `${order.customer_name ?? 'Customer'}\n` +
    `${order.mobile ?? '-'}\n\n` +
    `${itemLines(order.order_items)}\n\n` +
    `Total: ${inr(order.total)}\n` +
    `Address: ${order.address ?? '-'}` +
    (order.note ? `\nNote: ${order.note}` : '')
  )
}

/**
 * Normalises an Indian mobile to WhatsApp's chat-id form.
 * Accepts "9373624688", "09373624688", "+91 9373 624688", etc.
 */
export function toChatId(mobile) {
  if (!mobile) return null
  let d = String(mobile).replace(/\D/g, '')
  if (d.length === 10) d = `91${d}`
  else if (d.length === 11 && d.startsWith('0')) d = `91${d.slice(1)}`
  else if (d.length === 12 && d.startsWith('91')) {
    /* already correct */
  } else if (d.length < 10) return null
  return `${d}@c.us`
}
