# Server SRS Sync Spike

## Purpose

PR #50 adds a disabled-by-default implementation spike for server-side SRS sync
behavior. The goal is to validate reducer and idempotency semantics before real
backend persistence is built.

This is not production persistence and does not change current app runtime
behavior.

## Scope

The spike is limited to pure TypeScript and in-memory test helpers. It covers
saved words, review state, review events, daily stats, pack progress, processed
idempotency keys, hydration, queues, and pending local queue processing.

## Files Added

- `src/lib/server-srs-sync/spike/README.md`
- `src/lib/server-srs-sync/spike/feature-flag.ts`
- `src/lib/server-srs-sync/spike/in-memory-store.ts`
- `src/lib/server-srs-sync/spike/srs-reducer.ts`
- `src/lib/server-srs-sync/spike/sync-service.ts`
- `tests/server-srs-sync-spike.spec.ts`

## Feature Flag Posture

`VLX_SERVER_SRS_SYNC_SPIKE_ENABLED` is hard-coded to `false`. It does not read
environment variables and does not enable any route, component, network, auth,
database, or production persistence behavior.

## Relationship To #42 And #49

#42 defined server SRS sync contracts/selectors for saved words, review events,
materialized review state, hydration, and queues.

#49 added account persistence typed contracts and disconnected in-memory mocks.

This spike uses those boundaries to prove server-side SRS behavior can be
idempotent before the app connects to a real auth provider or backend.

## What Is Validated

- Save creates or preserves review state.
- Duplicate saved words are handled without duplicate records.
- Review event idempotency prevents double application.
- Wrong answers move state toward weak status.
- Archive preserves review state and events.
- Hydration returns saved/review/event/stats/progress state.
- Due, Weak, and Mastered queues derive from real review state.
- Pending local queue sync separates accepted, rejected, and retryable items.
- One answer does not fake `Mastered`.
- The spike does not grant paid entitlement.

## What Is Not Validated

- Real auth or account identity.
- Database schema, migrations, credentials, or row-level security.
- Network APIs, live routes, production writes, or deployment behavior.
- Cross-device conflict resolution against real server data.
- Payment, billing, checkout, subscription, invoice, billing portal, or paid
  entitlement enforcement.
- Analytics/reporting trustworthiness.

## No-Go Conditions

Do not promote this spike to production if any of these remain true:

- Feature flag is not explicitly reviewed and safely integrated.
- Real account persistence is not implemented and validated.
- Review events are not idempotent.
- Materialized review state can be advanced twice from one event.
- Mastered, Due, or Weak can be faked without real review state.
- Paid entitlement can be granted from local or spike-only data.
- Auth, database, provider SDK, billing, DNS, Webflow, Cloudflare Worker,
  Vercel, secrets, or production data changes are required without explicit
  approval.

## Future Path To Real Backend

1. Keep this spike disabled and disconnected.
2. Use it to validate reducer and idempotency expectations in #50.
3. Proceed to #51 Guest-to-account migration prototype only after #50 proves
   idempotent in-memory server-side SRS behavior.
4. Add real backend persistence behind an explicit feature flag.
5. Add provider-specific auth only after account ownership is confirmed.
6. Add production smoke QA and rollback planning before enabling server sync.

Recommended next PR: #51 Guest-to-account migration prototype.

Do not add payment or production auth before real account persistence and server
SRS sync are implemented and validated.
