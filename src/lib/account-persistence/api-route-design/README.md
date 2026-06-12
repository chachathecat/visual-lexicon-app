# Account Sync API Route Design Contracts

This directory defines the future account sync API route boundary without
creating any route handlers or runtime integration.

Scope:

- Pure TypeScript route metadata, request/response types, and deterministic
  fixtures.
- Used by contract tests only.
- No `app/api`, `pages/api`, `route.ts`, handler, middleware, auth wrapper, or
  client fetch implementation.
- No `localStorage`, network, `fetch`, environment-variable reads, auth
  provider SDK, database SDK, payment SDK, Webflow, Cloudflare, Vercel, DNS,
  billing, secrets, production data, or paid entitlement behavior.

Planned routes:

- `POST /api/account/sync/preview`
- `POST /api/account/sync/apply`
- `GET /api/account/sync/digest`
- `GET /api/account/sync/audit`

Files:

- `route-contracts.ts` exports route definitions, safety policy, and typed
  request/response contracts.
- `fixtures.ts` provides deterministic examples for route contract tests.

This remains design-only. Future work must add real auth, rate limiting, schema
validation, payload limits, audit logging, CSRF/session protection where
applicable, and a disabled test harness before any production backend wiring.
