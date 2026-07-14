// Generates PWA icons + the OpenGraph image from the store logo.
// Run once (or after changing the logo):  npm run icons
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'public/logo.svg'
const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

async function make(size, pad, name, bg = WHITE) {
  const inner = Math.round(size * (1 - pad * 2))
  const logo = await sharp(SRC, { density: 300 })
    .resize(inner, inner, { fit: 'contain', background: WHITE })
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`${OUT}/${name}`)
  console.log('wrote', name, `${size}x${size}`)
}

// standard "any purpose" icons — small padding
await make(192, 0.1, 'icon-192.png')
await make(512, 0.1, 'icon-512.png')
// maskable — generous safe-zone padding (~20%)
await make(192, 0.2, 'maskable-192.png')
await make(512, 0.2, 'maskable-512.png')
// apple touch — white bg, modest padding (iOS rounds corners itself)
await make(180, 0.12, 'apple-touch-icon.png')
// favicon
await make(48, 0.06, 'favicon-48.png')

// OpenGraph image — logo on a royal-blue → emerald gradient banner
const ogLogo = await sharp(SRC, { density: 300 })
  .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()
const ogBg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A1F52"/>
      <stop offset="0.55" stop-color="#1D4ED8"/>
      <stop offset="1" stop-color="#0D9488"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="600" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#FFFFFF">Relief Medical &amp; General Store</text>
  <text x="600" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#A7F3D0">Chemist • Druggist • General Store — Nigdi, Pune</text>
</svg>`)
await sharp(ogBg)
  .composite([{ input: ogLogo, top: 60, left: 420 }])
  .png()
  .toFile('public/og-image.png')
console.log('wrote og-image.png 1200x630')

console.log('done')
