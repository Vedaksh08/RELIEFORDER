# Relief Medical & General Store — Digital Business Card

Premium flip-style digital business card (PWA) for **Relief Medical & General Store**, Nigdi, Pune.
Owner: **Ganesh H. Sirvi** · Chemist • Druggist • General Store

## Stack

- Vite + React 19 + Tailwind CSS v4
- `vite-plugin-pwa` — installable, offline-ready
- `qrcode.react` — share QR
- `lucide-react` — icons

## Develop

```bash
npm install
npm run dev       # local dev server
npm run build     # production build (dist/)
npm run preview   # preview the production build
npm run icons     # regenerate PWA icons + og-image from public/logo.svg
```

## Editing content

Everything lives in **`src/data/siteData.js`** — contacts, services, brands,
review link, trust lines, gallery, timings. Nothing is hardcoded in components.

## Asset placeholders (auto-hide until provided)

| Asset            | Where to put it              | How to activate                                  |
| ---------------- | ---------------------------- | ------------------------------------------------ |
| HD logo          | `public/` (e.g. `logo.png`)  | update `BUSINESS.logo`, run `npm run icons`      |
| Store photos     | `public/gallery/`            | list them in `GALLERY`                           |
| Owner photo      | `public/` (e.g. `owner.jpg`) | set `OWNER.photo`                                |
| Google review QR | `public/qr/`                 | set `REVIEWS.qr`                                 |
| UPI QR           | `public/qr/`                 | set `UPI_QR`                                     |
| Store timings    | —                            | set `TIMINGS` (e.g. `{ days, hours }`)           |

Sections tied to these assets render nothing while the value is `null` / empty.
