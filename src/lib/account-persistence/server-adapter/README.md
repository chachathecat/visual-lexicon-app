# Server Persistence Adapter Contract

This directory defines a disabled, mock-only contract layer for future account
server persistence. It is not connected to runtime routes or components.

Scope:

- Pure TypeScript contracts, fixtures, and an in-memory test adapter.
- No `localStorage`, `fetch`, network calls, environment-variable reads, auth
  provider SDKs, database SDKs, payment SDKs, secrets, Webflow, Cloudflare,
  Vercel, DNS, deployment settings, billing, or production data access.
- No API routes, real backend persistence, real auth, real migrations, checkout,
  subscriptions, or paid entitlement writes.

Files:

- `adapter-contract.ts` defines `VlxServerPersistenceAdapter`, typed result
  metadata, audit records, preview/apply plan inputs, and the hard-disabled
  feature constant.
- `in-memory-adapter.ts` implements the contract against a caller-provided
  in-memory object for tests only.
- `fixtures.ts` reuses account sync conflict fixtures to build deterministic
  adapter plan inputs.

Policy:

- Review events are source-of-truth evidence.
- Review state is recomputed through the SRS reducer when review-event evidence
  is accepted.
- Local `Mastered` labels are not imported from `review_state`.
- Duplicate saved words and duplicate review events are no-op duplicates.
- Reused idempotency keys with different payloads are rejected with explicit
  reason metadata.
- Pack progress without review-event evidence is audit-only.
- Upgrade interest is attribution-only and never grants paid entitlement.
