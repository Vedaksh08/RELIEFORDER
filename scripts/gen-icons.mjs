// Generates PWA icons + the OpenGraph image from the store logo.
// Run once (or after changing the logo):  npm run icons
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'public/logo.svg'
const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

async function make(size, pad, name, { bg = WHITE, round = 0 } = {}) {
  const inner = Math.round(size * (1 - pad * 2))
  const logo = await sharp(SRC, { density: 300 })
    .resize(inner, inner, { fit: 'contain', background: WHITE })
    .toBuffer()
  let img = sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: 'center' }])
  if (round > 0) {
    // clip to a rounded rect so the icon has soft corners
    const flat = await img.png().toBuffer()
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${round}" fill="#fff"/></svg>`
    )
    img = sharp(flat).composite([{ input: mask, blend: 'dest-in' }])
  }
  await img.png().toFile(`${OUT}/${name}`)
  console.log('wrote', name, `${size}x${size}`)
}

// standard "any purpose" icons — small padding, softly rounded corners
await make(192, 0.1, 'icon-192.png', { round: 42 })
await make(512, 0.1, 'icon-512.png', { round: 112 })
// maskable — full-bleed square, the launcher applies its own mask
await make(192, 0.2, 'maskable-192.png')
await make(512, 0.2, 'maskable-512.png')
// apple touch — square white bg (iOS rounds corners itself)
await make(180, 0.12, 'apple-touch-icon.png')
// favicon — rounded corners
await make(48, 0.06, 'favicon-48.png', { round: 11 })

// OpenGraph / social banner — styled like the storefront sign board:
// deep pharmacy green field, big brand lettering with an ECG heartbeat
// line and heart, clean strip for the trade line. Neat, no glare.
const ogLogo = await sharp(SRC, { density: 300 })
  .resize(300, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
const ogBg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0C7A4E"/>
      <stop offset="0.55" stop-color="#0A6B45"/>
      <stop offset="1" stop-color="#075C3B"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#F7C948"/>
      <stop offset="1" stop-color="#F4B63C"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#field)"/>
  <!-- subtle field depth -->
  <ellipse cx="600" cy="-80" rx="900" ry="330" fill="#FFFFFF" opacity="0.05"/>
  <ellipse cx="600" cy="720" rx="900" ry="300" fill="#000000" opacity="0.1"/>
  <!-- signboard edge strips -->
  <rect x="0" y="0" width="1200" height="12" fill="url(#edge)"/>
  <rect x="0" y="618" width="1200" height="12" fill="url(#edge)"/>

  <!-- ECG heartbeat line running behind the title -->
  <polyline points="40,300 300,300 330,300 350,252 378,352 404,272 424,316 438,300 700,300 1160,300"
    fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="7"
    stroke-linecap="round" stroke-linejoin="round"/>
  <!-- red heart resting on the line, like the sign -->
  <path transform="translate(1064 274) scale(1.15)" fill="#E23744"
    d="M23 42 C10 31 0 22 0 12 C0 4 6 0 12 0 C17 0 21 3 23 7 C25 3 29 0 34 0 C40 0 46 4 46 12 C46 22 36 31 23 42 Z"/>

  <!-- title with a soft drop shadow -->
  <text x="602" y="316" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="104" font-weight="bold" fill="#043D27" opacity="0.55">Relief Medical</text>
  <text x="598" y="312" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
    font-size="104" font-weight="bold" fill="#FFFFFF">Relief Medical</text>
  <text x="600" y="372" text-anchor="middle" font-family="Arial, sans-serif"
    font-size="38" font-weight="600" fill="#CFF5E2">&amp; General Store</text>

  <!-- trade strip -->
  <rect x="270" y="424" width="660" height="62" rx="31" fill="#FFFFFF"/>
  <text x="600" y="465" text-anchor="middle" font-family="Arial, sans-serif"
    font-size="25" font-weight="bold" letter-spacing="4" fill="#0A6B45">CHEMIST • DRUGGIST • GENERAL STORE</text>

  <!-- footer line -->
  <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif"
    font-size="27" font-weight="600" fill="#EAF9F1" opacity="0.92">Nigdi, Pune  •  Free Home Delivery  •  +91 93736 24688</text>
</svg>`)
await sharp(ogBg)
  .composite([{ input: ogLogo, top: 52, left: 450 }])
  .png()
  .toFile('public/og-image.png')
console.log('wrote og-image.png 1200x630')

console.log('done')
