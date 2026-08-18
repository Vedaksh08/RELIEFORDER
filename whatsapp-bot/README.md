# Relief Medical — WhatsApp bot

Sends order updates over WhatsApp using `whatsapp-web.js`, driven from the
admin panel. Runs as a **separate always-on service** — it cannot live in
Vercel or Supabase Edge Functions, because it holds a logged-in browser
session that must stay alive between requests.

---

## Read this first

`whatsapp-web.js` automates the consumer WhatsApp app. That is **against
Meta's Terms of Service**, and numbers do get banned. The pattern that
triggers bans is exactly this use case: outbound messages to people who did
not message you first.

Protections already built in:

- Randomised 8–20s gap between sends, 40/hour cap (`MIN_GAP_MS`, `MAX_PER_HOUR`)
- Several phrasings per message, picked at random — identical text sent to
  hundreds of people is an obvious bot signal
- Numbers checked against WhatsApp before sending
- A kill switch in the admin panel that stops sending instantly

What you must do:

- **Use a spare SIM, never the shop's main number.** A ban takes the whole
  account, chats and contacts included.
- Keep customer messages to the minimum that is actually useful. Every extra
  status you enable doubles or triples volume.
- If customers block or report the number, stop and reconsider.

---

## Run it

```bash
cd whatsapp-bot
cp .env.example .env       # then fill in BOT_SECRET
npm install
npm start
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Put the **same** value in the web app's `.env`:

```
VITE_BOT_URL=http://localhost:8080
VITE_BOT_SECRET=<same BOT_SECRET>
```

Then open the admin panel → **WhatsApp** tab. The QR appears there; scan it
with the bot's phone (WhatsApp → Settings → Linked devices → Link a device).
The panel switches to "connected" by itself.

### Docker

```bash
docker build -t relief-wa-bot .
docker run -d --name relief-wa-bot \
  -p 8080:8080 --env-file .env \
  -v relief-wa-data:/data \
  relief-wa-bot
```

The `/data` volume is not optional — without it the session is lost on every
restart and you re-scan the QR each time.

---

## Hosting

Anywhere Node + Chromium runs and stays on:

| Option | Notes |
|---|---|
| VPS (Hetzner, DigitalOcean, Contabo) | ~₹400–600/mo. Most control. |
| Railway / Render | Easy deploys. **Attach a persistent volume.** |
| Fly.io | Works well; attach a volume for `/data`. |
| Spare PC at the shop | Free, but needs a tunnel (Cloudflare Tunnel / ngrok) for Vercel to reach it, and must never sleep. |

Serverless hosts (Vercel, Netlify, Lambda, Supabase Edge Functions) **cannot**
run this — no persistent process, no persistent disk.

---

## Endpoints

All except `/health` require the `x-bot-secret` header.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Public liveness check |
| GET | `/status` | Ready state, QR data-URL, queue depth, settings |
| GET/POST | `/settings` | Read / update admin numbers, statuses, kill switch |
| POST | `/notify` | `{ status, order }` — the web app calls this |
| POST | `/send` | `{ to, body }` — manual/test send |
| POST | `/logout` | Unlink the number so another can be scanned |
| GET | `/qr?secret=…` | Standalone QR page (the admin panel is easier) |

---

## Who gets what

- **Customer** — messages on the statuses ticked in the admin panel
  (placed / confirmed / dispatched / delivered / rejected).
- **Admin numbers** — a single "new order received" message, and nothing
  else. Receive-only; the bot never reads replies.

---

## A note on the secret

`VITE_BOT_SECRET` is compiled into the browser bundle and is therefore
readable by anyone using the site. That is tolerable only while the bot is
**not** publicly reachable — keep it behind a tunnel, a private network, or
an IP allowlist.

If you expose the bot to the open internet, move the `/notify` call into a
Supabase Edge Function so the secret stays server-side. The bot code does not
need to change; only who calls it does.
