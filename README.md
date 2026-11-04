# AdEarn — Telegram Ads Rewards Mini App (v1, full build)

Premium dark-navy fintech-style Mini App: Home, Watch Ads, History, Withdraw
(bottom nav), with Telegram login, a real credit system, and a modular ad
provider. Withdrawals are intentionally disabled in v1.

> **Name note:** your brief was titled "MusAd" but says "Project Name: AdEarn"
> inside, so this build keeps **AdEarn** to match your earlier project.
>
> **Stack note — this replaces the Step 1/2 skeleton's stack on purpose:**
> Step 1/2 used plain HTML/CSS/JS on GitHub Pages. This spec asks for
> React + Vite + Tailwind + Cloudflare Pages, so that is what is built here.
> Your old Step 1/2 files in `~/workspace/adearn/` are **untouched** — this
> lives in `adearn-full/` so your GitHub Pages test site does not break
> until you choose to swap it over.

## What is real, and what is deliberately NOT faked

- **Real:** Telegram `initData` verified on the backend (HMAC-SHA256 with the
  bot token, 24h expiry). Frontend `initDataUnsafe` is display-only.
- **Real:** users, ad_views and transactions in Postgres (Supabase). Balance
  changes only in one backend transaction.
- **Real:** duplicate protection — `ad_views.provider_event_id` is UNIQUE,
  and a retried provider postback finds no pending claim, so it cannot pay twice.
- **Real:** daily cap — 20 rewarded credits/user/day (`DAILY_CREDIT_CAP`).
- **NOT faked:** there is no demo ad and no "click = +1 credit" path. If no
  provider is configured, Watch Ads says so plainly and the button is disabled.
  A credit appears only after the provider's server postback confirms the ad.
- **Withdraw:** disabled by design. The screen shows the exact "coming soon"
  message from the spec, and there is no withdrawal endpoint at all.

## Project structure

```
adearn-full/
  README.md
  frontend/                 React + Vite + Tailwind v4 + Lucide
    src/
      App.jsx               tabs, auth bootstrap, preview mode
      screens/              Home.jsx, WatchAds.jsx, History.jsx, Withdraw.jsx
      components/           BottomNav.jsx
      lib/                  telegram.js, api.js, monetag.js (integration point)
  backend/                  Node + Express (no framework magic)
    src/
      server.js             routes: /api/auth, /api/me, /api/ads/*, /api/postback/*
      auth.js               Telegram initData verification
      db.js                 Postgres pool + transaction helper
      credit.js             the ONLY credit path (postback -> pending claim)
      providers/
        index.js            AD_PROVIDER switch + status
        monetag.js          v1 verified provider (server postback, ymid)
        adsgram.js          stub — client callback alone is never trusted
  supabase/schema.sql       users, ad_views, transactions
```

## Ad flow (read this before wiring Monetag)

1. User taps Watch Ad -> `POST /api/ads/start` (checks provider + daily cap, credits nothing).
2. Frontend shows the Monetag rewarded ad and gets its `ymid`.
3. Frontend `POST /api/ads/register { ymid }` with initData — records
   "this user saw this ymid". Credits nothing.
4. Monetag's server calls `GET /api/postback/monetag?secret=...&ymid={ymid}`
   after confirming the event -> backend flips that pending claim to
   completed, +1 credit, +1 transaction row. Retries are safe.
5. Frontend polls `/api/me` and shows the success animation only when the
   balance actually moved.

Adsgram can be added later with the same shape: a server confirmation +
UNIQUE event id + the credit path above. Its client-side callback alone must
never be wired to credits.

## The one file you must finish by hand: Monetag's tag

`frontend/src/lib/monetag.js` is intentionally a stub that throws a clear
error. Monetag gives you an exact rewarded-interstitial tag per zone in its
dashboard, and guessing it would ship a fake-looking button. Paste your tag
there so `showRewardedAd()` returns the impression's `ymid`, then:

- Monetag dashboard postback URL:
  `https://<your-render-url>/api/postback/monetag?secret=<POSTBACK_SECRET>&ymid={ymid}`
  (route only valued events to it)
- Backend env: `AD_PROVIDER=monetag`, `MONETAG_ZONE_ID=<your zone>`

## Run locally (Termux / any terminal)

```bash
# Backend
cd adearn-full/backend
cp .env.example .env   # fill BOT_TOKEN, DATABASE_URL, POSTBACK_SECRET — never commit .env
npm install
npm start              # http://localhost:3000/health

# Frontend (second terminal)
cd adearn-full/frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Database first: in Supabase, SQL Editor -> paste `supabase/schema.sql` -> Run.

## Deploy (all free tier)

1. **Supabase (free):** new project, run `supabase/schema.sql`. Limits to know:
   500 MB database, 50,000 monthly active users, 5 GB egress, free projects
   pause after 1 week of inactivity and have no automatic backups — export
   regularly. Never put the service-role key in frontend code; the frontend
   never talks to Supabase directly, only to the backend.
2. **Render (free) — backend:** New Web Service from this repo, root
   directory `adearn-full/backend`, build `npm install`, start `npm start`.
   Set env vars from `backend/.env.example` (BOT_TOKEN, DATABASE_URL,
   POSTBACK_SECRET, AD_PROVIDER=none until Monetag is wired, FRONTEND_ORIGIN).
   Free limits: 750 instance-hours/month, 512 MB, spins down after 15 min
   idle and takes ~1 min to wake — the first visit after idle will feel slow.
   Render says do not use free instances for production.
3. **Cloudflare Pages (free) — frontend:** connect the repo, root
   `adearn-full/frontend`, build `npm run build`, output `dist`, env
   `VITE_API_URL=https://<your-render-url>`. Then point the bot's Menu Button
   at the Pages URL (BotFather -> your bot -> Menu Button).
4. **Telegram:** the bot needs no 24/7 process in v1 — BotFather Menu Button
   only. The Mini App must be served over HTTPS, which Pages gives you.

## Free-tier honesty

- No paid API, paid hosting, or paid UI library is used. React, Vite,
  Tailwind, Lucide, Express, Supabase free tier, Render free tier and
  Cloudflare Pages free tier are all free at this scale.
- Ad income (to you as publisher, not to users) is CPM-based and varies by
  country/device/demand — no fixed income per ad is promised anywhere here.
- User credits are in-app points only in v1. Real cashout later needs
  payment, fraud, tax and legal checks and is not free or automatic.
