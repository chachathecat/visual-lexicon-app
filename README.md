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

## Paid Beta Readiness

Audit and manual QA docs:

```txt
docs/BETA_READINESS_AUDIT.md
docs/PAID_BETA_MANUAL_QA.md
```

These docs are for the no-payment paid beta readiness review. They do not add
checkout, billing, auth, Webflow, Cloudflare Worker, DNS, production data, or
deployment behavior.

## Current Scope

- Next.js App Router shell for the Track B learning app
- Approved initial routes plus local save and review modes
- Local Save -> Review -> SRS state/events loop
- Dashboard memory mission from local SRS state
- Pack previews and local pack progress
- Local paid beta placeholder surfaces and upgrade interest capture
- Extension bridge and multilingual alias search contracts

Auth, real payment, Webflow publishing, Cloudflare production integration,
production user data, and deployment settings are outside this repository scope.
