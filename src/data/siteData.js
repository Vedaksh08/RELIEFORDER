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


// ------------------------------------------------------------
//  SERVICES (front-side chips)
// ------------------------------------------------------------
export const SERVICES = [
  { icon: 'pill', label: 'Prescription Medicines' },
  { icon: 'cross', label: 'OTC Medicines' },
  { icon: 'heart', label: 'Healthcare Products' },
  { icon: 'baby', label: 'Baby Care' },
  { icon: 'sparkles', label: 'Cosmetics' },
  { icon: 'leaf', label: 'Ayurvedic & Allopathy' },
]

// ------------------------------------------------------------
//  BRANDS (back-side auto-scrolling logo carousel)
//  Logos live in /public/brands — replace any file to update.
// ------------------------------------------------------------
export const BRANDS = [
  { name: "L'Oréal Professionnel", src: '/brands/loreal-professionnel.svg' },
  { name: 'Schwarzkopf Professional', src: '/brands/schwarzkopf.png' },
  { name: 'Wella Professionals', src: '/brands/wella.jpg' },
  { name: 'Lakmé', src: '/brands/lakme.jpg' },
  { name: 'Maybelline', src: '/brands/maybelline.svg' },
  { name: 'Lotus Professional', src: '/brands/lotus-professional.png' },
  { name: 'Elle 18', src: '/brands/elle18.png' },
  { name: 'Revlon', src: '/brands/revlon.svg' },
  { name: 'Biotique', src: '/brands/biotique.png' },
  { name: 'Mamaearth', src: '/brands/mamaearth.png' },
  { name: 'Pigeon', src: '/brands/pigeon.png' },
  { name: 'Chicco', src: '/brands/chicco.svg' },
  { name: 'Philips Avent', src: '/brands/philips-avent.svg' },
  { name: 'Beardo', src: '/brands/beardo.png' },
  { name: 'Richfeel', src: '/brands/richfeel.png' },
  { name: 'Ustraa', src: '/brands/ustraa.png' },
  { name: 'Oriflame', src: '/brands/oriflame.svg' },
  { name: 'Jovees', src: '/brands/jovees.png' },
  { name: 'Bio Age', src: '/brands/bio-age.png' },
  { name: 'Sebamed', src: '/brands/sebamed.svg' },
  { name: 'The Body Shop', src: '/brands/the-body-shop.svg' },
  { name: 'Bed Head', src: '/brands/bed-head.png' },
  { name: "Cherryl's Cosmeceuticals", src: '/brands/cheryls.png' },
]

// ------------------------------------------------------------
//  GOOGLE REVIEWS
// ------------------------------------------------------------
export const REVIEWS = {
  title: 'Customer Reviews',
  // Real Google review quotes (rotated on the card; names withheld)
  items: [
    '“I wanted some medicines, shared the details and received them the same day. Great shop!”',
    '“You will find almost all medicines here — no need to visit two shops. Computerised printed billing too.”',
    '“A big medical and general store. Medicines, hygiene products and cosmetics — they can even order stuff for you.”',
    '“We get all our medicines here. Cash, card and Google Pay accepted.”',
    '“Polite staff and good, friendly service.”',
  ],
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
  'Genuine Medicines',
  'Fast & Free Home Delivery',
  'Trusted Healthcare Partner',
  'Premium Healthcare Products',
  'Caring Beyond Medicines',
  "Your Family's Neighborhood Pharmacy",
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
    `NOTE:${BUSINESS.blurb}`,
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
    `WhatsApp: ${CONTACT.whatsapp}`,
    `Email: ${CONTACT.email}`,
    '',
    `Address: ${LOCATION.lines.join(', ')}`,
    `Maps: ${LOCATION.mapsUrl}`,
  ].join('\n')
}
