// ============================================================
//  RELIEF MEDICAL & GENERAL STORE — SITE DATA
//  Edit everything here. Nothing is hardcoded elsewhere.
// ============================================================

export const BUSINESS = {
  name: 'Relief Medical',
  nameSuffix: '& General Store',
  fullName: 'Relief Medical & General Store',
  tagline: 'Chemist • Druggist • General Store',
  blurb:
    'Your trusted neighbourhood pharmacy in Nigdi — genuine medicines, healthcare essentials and free home delivery.',
  logo: '/logo.svg', // drop a client HD logo into /public and update this path
  shareUrl: typeof window !== 'undefined' ? window.location.href : 'https://reliefmedical.in',
}

// ------------------------------------------------------------
//  OWNER & CONTACT
// ------------------------------------------------------------
export const OWNER = {
  name: 'Ganesh H. Sirvi',
  role: 'Proprietor',
  initials: 'GS',
  photo: null, // e.g. '/owner.jpg' — avatar with initials is shown while null
}

export const CONTACT = {
  phone: '+91 9373624688',
  tel: 'tel:+919373624688',
  phoneSecondary: '09373624688',
  telSecondary: 'tel:09373624688',
  whatsapp: 'https://wa.me/919373624688',
  whatsappText:
    'https://wa.me/919373624688?text=' +
    encodeURIComponent('Hello Relief Medical! I would like to place an order.'),
  email: 'reliefmedical27657598@gmail.com',
  mailto: 'mailto:reliefmedical27657598@gmail.com',
}

export const LOCATION = {
  lines: ['Plot No. 370, Sector No. 24', 'Opp. Savali Hotel, Pradhikaran', 'Nigdi, Pune – 411044'],
  short: 'Nigdi, Pune 411044',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Relief Medical & General Store, Nigdi, Pune'),
}

// Store timings — set to null to hide the row entirely.
// e.g. { days: 'Mon – Sun', hours: '9:00 AM – 10:30 PM' }
export const TIMINGS = null

// ------------------------------------------------------------
//  SERVICES (front-side chips)
// ------------------------------------------------------------
export const SERVICES = [
  { icon: 'pill', label: 'Prescription Medicines' },
  { icon: 'cross', label: 'OTC Medicines' },
  { icon: 'heart', label: 'Healthcare Products' },
  { icon: 'baby', label: 'Baby Care' },
  { icon: 'sparkles', label: 'Cosmetics' },
  { icon: 'truck', label: 'Free Home Delivery' },
]

// ------------------------------------------------------------
//  BRANDS (back-side auto-scrolling carousel)
// ------------------------------------------------------------
export const BRANDS = [
  { name: "L'Oréal Professionnel", color: '#C8A24B' },
  { name: 'Schwarzkopf Professional', color: '#1F2937' },
  { name: 'Wella Professionals', color: '#B91C1C' },
  { name: 'Lakmé', color: '#7C3AED' },
  { name: 'Maybelline', color: '#111827' },
  { name: 'Lotus Professional', color: '#15803D' },
  { name: 'Elle 18', color: '#DB2777' },
  { name: 'Revlon', color: '#DC2626' },
  { name: 'Biotique', color: '#166534' },
  { name: 'Mamaearth', color: '#0891B2' },
  { name: 'Pigeon', color: '#2563EB' },
  { name: 'Chicco', color: '#0284C7' },
  { name: 'Philips Avent', color: '#0EA5E9' },
  { name: 'Beardo', color: '#374151' },
  { name: 'Richfeel', color: '#0D9488' },
  { name: 'Ustraa', color: '#4B5563' },
  { name: 'Oriflame', color: '#BE185D' },
  { name: 'Jovees', color: '#65A30D' },
  { name: 'Bio Age', color: '#059669' },
  { name: 'Sebamed', color: '#0369A1' },
  { name: 'The Body Shop', color: '#14532D' },
  { name: 'Bed Head', color: '#EA580C' },
  { name: "Cherryl's Cosmeceuticals", color: '#9333EA' },
]

// ------------------------------------------------------------
//  GOOGLE REVIEWS
// ------------------------------------------------------------
export const REVIEWS = {
  title: 'Customer Reviews',
  line: 'Loved by families across Nigdi for genuine medicines & caring service.',
  url: 'https://www.google.com/search?sxsrf=APpeQnttC-jdCHzyuDASomQmmvqIUBtU-A:1784007098948&si=APenkKn5T4YN59srr511wD6k6Pufj9DEzRUvB1XJSwUeeT5afhB513XBoaHTpitrMLoFgcH-gQPbI4iDURanWKFsR8B_lNeCWnefxQrLAWGtR3sY0M5g52RUw5vi0lmT4wtaJwz51Mg9bZ_OdItcW1fasCWDCmYNFg%3D%3D&q=Relief+Medical+And+General+Stores+Reviews',
  qr: null, // e.g. '/qr/google-review.png' — shows a QR tile when provided
}

// UPI payment QR — set to a path to show a "Pay via UPI" action.
export const UPI_QR = null // e.g. '/qr/upi.png'

// ------------------------------------------------------------
//  TRUST SECTION — rotating lines (back side)
// ------------------------------------------------------------
export const TRUST_TITLE = 'Why Customers Trust Us'
export const TRUST_LINES = [
  '✔ Genuine Medicines',
  '✔ Trusted Healthcare Partner',
  '✔ Fast & Free Home Delivery',
  '✔ Quality You Can Trust',
  '✔ Caring Beyond Medicines',
  '✔ Health First, Always',
  "✔ Your Family's Neighborhood Pharmacy",
]

// ------------------------------------------------------------
//  GALLERY — storefront / interior photos (auto-hides while empty)
//  Drop images in /public/gallery and list them here.
// ------------------------------------------------------------
export const GALLERY = [
  // { src: '/gallery/storefront.jpg', alt: 'Relief Medical storefront' },
  // { src: '/gallery/interior-1.jpg', alt: 'Store interior' },
]

// ------------------------------------------------------------
//  vCard for "Save Contact"
// ------------------------------------------------------------
export function buildVCard() {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${BUSINESS.fullName}`,
    `ORG:${BUSINESS.fullName}`,
    `TITLE:${BUSINESS.tagline}`,
    `NOTE:Owner: ${OWNER.name}. ${BUSINESS.blurb}`,
    'TEL;TYPE=CELL:+919373624688',
    `EMAIL;TYPE=WORK:${CONTACT.email}`,
    `URL:${BUSINESS.shareUrl}`,
    `ADR;TYPE=WORK:;;${LOCATION.lines.join(', ')};;;;`,
    'END:VCARD',
  ].join('\n')
}

export function buildContactText() {
  return [
    `${BUSINESS.fullName} — ${BUSINESS.tagline}`,
    '',
    `Owner: ${OWNER.name}`,
    `Phone: ${CONTACT.phone}`,
    `Secondary: ${CONTACT.phoneSecondary}`,
    `WhatsApp: ${CONTACT.whatsapp}`,
    `Email: ${CONTACT.email}`,
    '',
    `Address: ${LOCATION.lines.join(', ')}`,
    `Maps: ${LOCATION.mapsUrl}`,
  ].join('\n')
}
