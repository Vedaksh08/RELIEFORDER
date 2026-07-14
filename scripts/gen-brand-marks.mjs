// Generates clean wordmark tiles for brands whose official logo file is
// not bundled yet. Drop a real logo into /public/brands with the same
// slug to replace any of these (then update siteData if the extension
// differs). Run:  node scripts/gen-brand-marks.mjs
import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'

const OUT = 'public/brands'
mkdirSync(OUT, { recursive: true })

const SANS = 'Segoe UI, Arial, sans-serif'
const SERIF = 'Georgia, Times New Roman, serif'

// Each mark: main word styled close to the real brand identity + optional sub-line.
const MARKS = [
  {
    slug: 'schwarzkopf',
    main: 'SCHWARZKOPF',
    mainStyle: `font-family="${SANS}" font-size="64" font-weight="800" letter-spacing="2" fill="#111111"`,
    sub: 'PROFESSIONAL',
    subStyle: `font-family="${SANS}" font-size="26" font-weight="600" letter-spacing="14" fill="#444444"`,
  },
  {
    slug: 'lotus-professional',
    main: 'LOTUS',
    mainStyle: `font-family="${SERIF}" font-size="84" font-weight="700" letter-spacing="10" fill="#15803D"`,
    sub: 'PROFESSIONAL',
    subStyle: `font-family="${SANS}" font-size="26" font-weight="600" letter-spacing="12" fill="#555555"`,
  },
  {
    slug: 'elle18',
    main: 'elle 18',
    mainStyle: `font-family="${SANS}" font-size="96" font-weight="800" letter-spacing="0" fill="#DB2777"`,
  },
  {
    slug: 'mamaearth',
    main: 'mamaearth',
    mainStyle: `font-family="${SANS}" font-size="82" font-weight="700" letter-spacing="0" fill="#0B9D58"`,
    sub: 'GOODNESS INSIDE',
    subStyle: `font-family="${SANS}" font-size="24" font-weight="600" letter-spacing="8" fill="#3E7C60"`,
  },
  {
    slug: 'pigeon',
    main: 'Pigeon',
    mainStyle: `font-family="${SANS}" font-size="96" font-weight="700" letter-spacing="1" fill="#2563EB"`,
  },
  {
    slug: 'beardo',
    main: 'BEARDO',
    mainStyle: `font-family="${SANS}" font-size="88" font-weight="800" letter-spacing="6" fill="#1F2937"`,
  },
  {
    slug: 'richfeel',
    main: 'RichFeel',
    mainStyle: `font-family="${SERIF}" font-size="88" font-weight="700" letter-spacing="1" fill="#0D9488"`,
  },
  {
    slug: 'ustraa',
    main: 'USTRAA',
    mainStyle: `font-family="${SANS}" font-size="88" font-weight="800" letter-spacing="10" fill="#374151"`,
  },
  {
    slug: 'jovees',
    main: 'JOVEES',
    mainStyle: `font-family="${SERIF}" font-size="84" font-weight="700" letter-spacing="8" fill="#4D7C0F"`,
    sub: 'HERBAL',
    subStyle: `font-family="${SANS}" font-size="26" font-weight="600" letter-spacing="16" fill="#666666"`,
  },
  {
    slug: 'bio-age',
    main: 'BIO AGE',
    mainStyle: `font-family="${SANS}" font-size="84" font-weight="700" letter-spacing="8" fill="#047857"`,
  },
  {
    slug: 'bed-head',
    main: 'BED HEAD',
    mainStyle: `font-family="${SANS}" font-size="80" font-weight="800" letter-spacing="4" fill="#EA580C"`,
    sub: 'TIGI',
    subStyle: `font-family="${SANS}" font-size="30" font-weight="700" letter-spacing="18" fill="#1F2937"`,
  },
  {
    slug: 'cheryls',
    main: "CHERYL'S",
    mainStyle: `font-family="${SERIF}" font-size="78" font-weight="700" letter-spacing="4" fill="#7E22CE"`,
    sub: 'COSMECEUTICALS',
    subStyle: `font-family="${SANS}" font-size="24" font-weight="600" letter-spacing="8" fill="#666666"`,
  },
]

const W = 640
const H = 320

for (const m of MARKS) {
  const file = `${OUT}/${m.slug}.png`
  if (existsSync(file)) {
    console.log('skip (exists)', m.slug)
    continue
  }
  const mainY = m.sub ? 168 : 190
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <text x="50%" y="${mainY}" text-anchor="middle" ${m.mainStyle}>${m.main.replace(/&/g, '&amp;')}</text>
    ${m.sub ? `<text x="50%" y="${mainY + 62}" text-anchor="middle" ${m.subStyle}>${m.sub}</text>` : ''}
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(file)
  console.log('wrote', m.slug)
}
console.log('done')
