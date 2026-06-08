# Visual Lexicon App

Track B app scaffold for `app.visuallexicon.org`.

This repository is for the learning app only. It does not include Webflow publishing, Cloudflare Worker changes, authentication, payment, or production data writes.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Optional static pack source:

```txt
NEXT_PUBLIC_VLX_PACK_BASE_URL=https://static.example.com
```

When no static pack base URL is configured, the app uses local mock pack
data. The pack reader expects public JSON files only; do not put API tokens in
pack URLs or browser-exposed environment variables.

Optional paid beta upgrade placeholders:

```txt
NEXT_PUBLIC_LITE_PAYMENT_URL=https://example.com/lite-beta
NEXT_PUBLIC_PRO_PAYMENT_URL=https://example.com/pro-beta
NEXT_PUBLIC_PAID_BETA_FORM_URL=https://example.com/paid-beta-interest
```

These URLs are placeholders only. When a Lite or Pro URL is configured, upgrade
CTAs render as external links and append `plan` and `source` query parameters.
When no URL is configured, the app stays local, records interest in
`vlx_upgrade_interest_v1`, and shows: `Paid beta interest noted locally. Billing
is not connected.` No checkout route, payment SDK, billing setting, or real
subscription is created by this app.

## Verification

Run the static health checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Start the app for browser checks:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3006
```

Then run the focused MVP checks in another terminal:

```bash
npm run test:mvp
npm run test:review
npm run test:packs
```

The Playwright checks expect the app to be running on `http://127.0.0.1:3006`
unless `PLAYWRIGHT_BASE_URL` is set.

## Current Scope

- Next.js App Router shell
- Approved initial routes
- Shared layout and navigation
- Mock learning cards and pack previews
- Empty-state components
- Local-only scaffold data

No SRS engine, auth, payment, Webflow bridge, or Cloudflare production integration is implemented in this phase.
