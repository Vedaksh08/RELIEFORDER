# Reusing this system for another business

Keep this file. When you want the same system for a different client, point
Claude at this folder and paste the prompt below.

---

## The prompt to give

> I want to build an online ordering system for a new business, using this
> folder as the reference implementation:
> `C:\Users\mugve\Desktop\RELIEF MEDICAL EXTRA TRIAL`
>
> **Read that project first** — especially `src/data/siteData.js`,
> `supabase/schema.sql`, `src/order/`, `src/admin/` and this file. Reuse its
> architecture and its bug fixes rather than writing a fresh version.
>
> The new business is:
> - **Name:** …
> - **What they sell:** … (called "products" / "parts" / "books" / …)
> - **Address, phone, email:** …
> - **Brand colours:** … (or "use their logo's colours")
>
> Keep exactly as-is: Supabase Google auth, the admin panel with its tabs,
> atomic stock decrement on accept, order status flow, invoices, ads, the
> sticky cart bar, and the responsive layout.
>
> What differs for this client:
> - **Stock fields:** … (e.g. "same as medicines" or "also needs size,
>   colour and batch number")
> - **Anything else:** …
>
> Set it up as a new repo and a new Supabase project — do not share either
> with the existing client.

---

## Why point at the folder rather than describe the system

Re-generating from a description silently re-introduces bugs that took real
debugging to find here:

| Bug | Symptom if lost |
|---|---|
| PostgREST caps queries at 1000 rows | Admin shows 1,000 of 10,203 products; counts wrong |
| Head-only `count` returned 0 under RLS | "Pending orders: 0" above a visible order |
| Flex `min-width: auto` | ADD buttons cut off the screen edge on phones |
| Customer browser cannot reach the bot | "Order placed" WhatsApp never sends |
| whatsapp-web.js detached frame | Bot reports ready but every send fails |
| Android reports 0 safe-area inset | Sticky bar clipped by the nav bar |
| Stale service worker in dev | Env changes appear to do nothing |
| Stock decremented in JS, not SQL | Two accepts oversell the same stock |

All of these are already fixed in this code. None survive a prompt.

---

## What is already portable

- **28 of 35 source files contain no branding at all** — every `lib/`,
  every admin panel, cart, shop, router.
- The few that do contain only display strings, not logic.
- Business details live in one file: `src/data/siteData.js`.
- Brand colours live in one `@theme` block: `src/index.css`.

So a new client is mostly configuration, not rewriting.

---

## Per-client checklist

**1. Code**
- Clone this repo (or use it as a GitHub template)
- `src/data/siteData.js` — name, tagline, phone, email, address, `LEGAL`
- `src/index.css` — the `@theme` colour tokens
- `public/logo.svg` — their logo
- Replace the word "medicine" in UI labels (9 files; the database table can
  stay named `medicines` — it is internal and renaming breaks every query,
  `accept_order` and the RLS policies)

**2. Supabase** — a NEW project, never shared
- Run in order: `schema.sql`, `migration-02-dispatch.sql`,
  `migration-03-ads.sql`
- Authentication → Providers → enable Google (needs a Google Cloud OAuth
  client)
- Authentication → URL Configuration → add `http://localhost:3000/**` and
  the production URL
- After first sign-in:
  `update profiles set is_admin = true where email = '<their email>';`

**3. Environment** — `.env` locally and in Vercel
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_USER      (front-door gate, default SYSTEM)
VITE_ADMIN_PASS
VITE_BOT_URL         (only if using WhatsApp)
VITE_BOT_SECRET
```
Vite reads `.env` only at startup — restart after editing.

**4. WhatsApp bot** — optional
- Use a **separate SIM**, never the shop's main number. It is unofficial
  automation and bans do happen.
- Needs a host that stays on 24/7 with a persistent volume for the session.
- New-order messages are sent from the admin panel, so it must be open. For
  unattended operation this needs moving to a Supabase database webhook.

---

## Things worth deciding early

**Stock model.** The schema is `name / brand / category / price / stock`.
Most retail fits. If a client needs batch numbers, expiry, sizes or
variants, prefer adding nullable columns over restructuring — one schema
serves every client and unused fields stay empty. Only build a fully
flexible attribute system if two real clients actually need it; it makes the
admin panel, CSV import and search significantly more complex.

**Never share across clients.** Not the codebase (a change for B can break
A's live shop) and not the Supabase project (data isolation, and one outage
would hit everyone). Clone per client and port fixes deliberately.

**Supabase free tier** pauses a project after 7 days of inactivity, which
stops orders. Move a live client to Pro ($25/mo) for that reason, not for
storage — the free storage and database limits are far beyond what a shop
this size will reach.
