# Relief Order — setup

The ordering platform lives inside the existing digital-card app.
The card is at `/`, the shop at `/order`, the admin panel at `/ADMIN`.

## 1. Environment

Fill in `.env` (already gitignored — keys are never committed):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ADMIN_USER=SYSTEM
VITE_ADMIN_PASS=SYSTEM
```

Both values are under **Supabase → Project Settings → API**. Use the
`anon` / public key — never the `service_role` key in a frontend app.

Restart `npm run dev` after editing `.env` (Vite only reads it at boot).

## 2. Database

Open **Supabase → SQL Editor → New query**, paste all of
`supabase/schema.sql`, and Run. It creates:

- `profiles`, `medicines`, `orders`, `order_items`
- `accept_order()` / `reject_order()` — atomic stock functions
- Row Level Security policies
- a trigger that creates a profile row on first Google sign-in

### Already have a database from before?

Run `supabase/migration-02-dispatch.sql` as well. It is additive and safe on
live data: it adds the `dispatched` status, the lifecycle timestamps, and the
`orders -> profiles` foreign key.

That FK is the fix for **"1 pending order" showing above an empty list** — the
admin query embedded `profiles`, but `orders.user_id` pointed at `auth.users`,
so there was no relationship to embed through and the query failed silently
while the stat (which does no join) kept counting.

## 3. Google sign-in

**Supabase → Authentication → Providers → Google** → enable, and paste the
Client ID / Secret from the Google Cloud Console.

In the Google Cloud console, under **Authorized redirect URIs**, add:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Then in **Supabase → Authentication → URL Configuration**, add both:

```
http://localhost:3000
https://relieforder.vercel.app
```

## 4. Make yourself admin

Sign in once at `/order` so your profile row is created, then run in the
SQL editor:

```sql
update profiles set is_admin = true where email = 'vedant.ksh08@gmail.com';
```

## 5. Admin panel

Go to `/ADMIN` → log in with `SYSTEM` / `SYSTEM`.

> The SYSTEM/SYSTEM gate is a convenience lock on the front door — anything
> checked in the browser is readable in the JS bundle. The real permission
> check is `profiles.is_admin`, enforced by Postgres RLS, which is why you
> also need step 4. Change the credentials any time via `VITE_ADMIN_*`.

**Inventory tab** — add / inline-edit name, brand, category, price, stock.
CSV import shows a preview of every change before anything is written;
export downloads the current catalogue.

CSV columns: `name, brand, category, price, stock`
(rows are matched to existing medicines by name + brand).

**Orders tab** — live queue, updates without refresh.

The lifecycle is **Placed -> Accept order -> Order dispatched -> Mark
delivered**, with Reject available while an order is still pending. Customers
see the same progress on a timeline under My Orders, updating live.

`public/notification.mp3` plays when an order is placed, when a new order
reaches the admin queue, and on each status change. The speaker icon beside
the status tabs mutes it, remembered per device.

> Browsers block sound until you interact with the page. Logging in at
> `/ADMIN` counts as that interaction, so leave the tab open and new orders
> will chime.

## How the stock math works

Ordering 2 Dolo when stock is 100 does **not** change stock. Stock moves
only when you press **Accept**, which calls `accept_order()` — a single
Postgres transaction that locks the rows, decrements, and flips the status
together. So 100 becomes 98 at accept time.

Two consequences worth knowing:

- A `CHECK (stock >= 0)` constraint means a double-accept or a simultaneous
  accept can never oversell — the whole transaction aborts instead.
- Rejecting costs nothing, because nothing was reserved at placement.

Prices on `order_items` are snapshotted at order time, so repricing a
medicine later never rewrites old orders.

## Deploying to Vercel

Add the same four `VITE_*` variables under **Vercel → Project → Settings →
Environment Variables**, then redeploy. Vite inlines them at build time, so
a redeploy is required after any change.
