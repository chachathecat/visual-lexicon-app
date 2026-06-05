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

## Verification

Run type checking:

```bash
npm run typecheck
```

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Current Scope

- Next.js App Router shell
- Approved initial routes
- Shared layout and navigation
- Mock learning cards and pack previews
- Empty-state components
- Local-only scaffold data

No SRS engine, auth, payment, Webflow bridge, or Cloudflare production integration is implemented in this phase.
