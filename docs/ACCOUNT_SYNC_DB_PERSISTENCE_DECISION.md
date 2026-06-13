# Account Sync DB Persistence Decision

## Purpose

This document records the database persistence provider boundary and table
group design decision for future account sync routes. PR #66 remains
docs/contracts/tests only and does not implement a real database, database
schema, migration, API route, or route handler.

Final verdict: `design_only`, not implementation-ready.

## Non-Goals

This PR does not add real database persistence, Supabase, Prisma, Drizzle,
Neon, Firebase, Cloudflare D1, Postgres clients, provider SDKs, executable
schemas, migrations, API routes, route handlers, middleware, runtime route or
component integration, real auth, validation dependencies, logging or
observability SDKs, network/fetch calls, local storage access, environment
variables, feature flags, billing, payment, checkout, subscriptions, paid
entitlement grants, Webflow changes, Cloudflare Workers, DNS changes, Vercel or
deployment settings, secrets, production data access, or `npm audit fix`.

## Relationship To #58-#65

| PR | Gate | Relationship |
| --- | --- | --- |
| #58 | Route readiness audit and No-Go gate | Real account sync API routes remain blocked. |
| #59 | Auth ownership boundary | Every persistence table must be scoped by server-derived owner identity. |
| #60 | Durable idempotency and persistence storage design | This PR turns the storage groups into a provider-neutral DB table design. |
| #61 | Schema validation and payload size limits | Runtime validation is still unselected and remains the recommended next decision. |
| #62 | Audit logging and privacy redaction | Audit summaries remain redacted, bounded, and owner-only. |
| #63 | Monitoring, rollout, rollback, and kill switch | Real persistence still needs rollout, rollback, monitoring, and QA evidence. |
| #64 | Final implementation readiness review | Real routes remained No-Go and required provider/database/runtime decisions first. |
| #65 | Auth provider final decision | This DB decision depends on the server session owner boundary selected in #65. |

These gates do not authorize real account sync routes.

## DB Provider Candidate Matrix

| Candidate | Decision | Relational fit | Sync core can import SDK? | Notes |
| --- | --- | --- | --- | --- |
| `existing_account_backend` | Selected if available | Adapter must map to the table groups | No | Prefer the existing app/account backend first if available. |
| `postgres_compatible` | Preferred long-term shape | Strong | No | Preferred for owner keys, uniqueness constraints, and transaction-like apply. |
| `supabase_postgres` | Compatible future candidate | Strong | No | Future adapter only; no SDK in sync core. |
| `neon_postgres` | Compatible future candidate | Strong | No | Future adapter only; relational shape stays portable. |
| `vercel_postgres` | Compatible future candidate | Strong | No | Future adapter only; this PR changes no Vercel settings. |
| `cloudflare_d1` | Deferred | Partial | No | Consider only if the existing backend requires a different adapter. |
| `firebase_firestore` | Rejected for now | Weak | No | Does not match the requested relational uniqueness and transaction shape. |
| `custom_backend_storage` | Deferred | Adapter-dependent | No | Only after existing backend and owner-scoped port behavior are confirmed. |
| `in_memory_mock_only` | Mock only | Not production durable | No | Useful for tests and harnesses only. |

## Selected Strategy

The selected strategy is:

- `existing_account_backend_first_if_available`
- `postgres_compatible_relational_design`
- `provider_neutral_persistence_adapter`
- `no_db_provider_sdk_in_sync_core`
- `no_migrations_in_this_pr`

In plain terms, the selected strategy is existing account backend first if available,
with Postgres-compatible relational design as the preferred long-term shape.

Account sync core must not know database provider-specific SDK details. Future
provider-specific persistence must sit behind a normalized persistence port.

## Provider-Neutral Persistence Adapter Boundary

The future persistence adapter receives only server-normalized, owner-scoped
requests. Provider-specific code may live at the adapter edge later, but sync
core receives only the normalized port contract.

The port must support:

- owner-scoped preview state loading
- transaction-like apply
- insert-once review events
- event-derived review state
- bounded owner-only digest reads
- bounded owner-only redacted audit reads

This PR creates no adapter implementation.

## Postgres-Compatible Relational Design Rationale

A Postgres-compatible relational table design is the preferred long-term shape
because account sync needs:

- compound owner-scoped uniqueness constraints
- transaction-like apply across idempotency, review evidence, derived state,
  stats, saved words, pack progress, and audit summaries
- clear owner keys for every read and write
- bounded digest and audit reads
- explicit retention and rollback policies

If an existing account backend already exists and uses a different storage
adapter, it must still preserve the same normalized owner-scoped port behavior.

## Table Group Design

| Table group | Purpose | Owner key | Uniqueness |
| --- | --- | --- | --- |
| `account_sync_idempotency_records` | Store route idempotency keys, request fingerprints, status, redacted outcome, and expiry. | `ownerAccountId` | `ownerAccountId + routeId + idempotencyKey` |
| `account_sync_audit_summaries` | Store redacted owner-only apply, replay, reject, block, and audit-only summaries. | `ownerAccountId` | `ownerAccountId + auditId` |
| `account_review_events` | Store accepted review event evidence exactly once. | `ownerAccountId` | `ownerAccountId + eventId` |
| `account_review_state` | Store SRS state derived from accepted review events. | `ownerAccountId` | `ownerAccountId + slug` |
| `account_daily_stats` | Store daily aggregate review counts derived from accepted events. | `ownerAccountId` | `ownerAccountId + date` |
| `account_saved_words` | Store saved words and bounded metadata summaries. | `ownerAccountId` | `ownerAccountId + slug` |
| `account_pack_progress` | Store event-evidence-backed pack progress. | `ownerAccountId` | `ownerAccountId + packId` |
| `account_sync_operation_locks` | Represent future per-owner operation locks for apply coordination. | `ownerAccountId` | `ownerAccountId + operationKind` |
| `account_sync_cursors` | Store future owner-scoped digest, audit, and recomputation cursors. | `ownerAccountId` | `ownerAccountId + cursorKind` |

Every table group defines required fields, forbidden fields, write behavior,
read behavior, transaction participation, retention notes, privacy notes, and
rollback notes in
`src/lib/account-persistence/db-persistence-decision/db-persistence-decision.ts`.

## Owner Key Policy

`ownerAccountId` is the only persistence owner key and must come from the
authenticated server session. Client-provided `accountId` values are not
ownership proof. They may only be legacy metadata or request hints and cannot
authorize reads or writes.

Every persistence lookup must include `ownerAccountId`. Cross-account reads and
writes are rejected before persistence port access.

## Uniqueness Policy

Required uniqueness policies are:

- `account_sync_idempotency_records`: `ownerAccountId + routeId + idempotencyKey`
- `account_review_events`: `ownerAccountId + eventId`
- `account_review_state`: `ownerAccountId + slug`
- `account_saved_words`: `ownerAccountId + slug`
- `account_daily_stats`: `ownerAccountId + date`
- `account_pack_progress`: `ownerAccountId + packId`
- `account_sync_audit_summaries`: `ownerAccountId + auditId`
- `account_sync_operation_locks`: `ownerAccountId + operationKind`
- `account_sync_cursors`: `ownerAccountId + cursorKind`

No future backend may query idempotency or review evidence by key alone.

## Transaction-Like Apply Policy

Future apply must commit these groups as one transaction-like unit:

- `account_sync_idempotency_records`
- `account_review_events`
- `account_review_state`
- `account_daily_stats`
- `account_saved_words`
- `account_pack_progress`
- `account_sync_audit_summaries`

Partial writes are not allowed. Operation locks and cursors may support the
operation, but they do not replace the critical apply boundary.

## Idempotency Storage Policy

Same owner, same route, same idempotency key, and same request fingerprint must
replay the original redacted result without mutation.

Same owner, same route, same idempotency key, and a different request
fingerprint must be rejected as a conflict.

Replay must not insert review events again, recompute SRS as new evidence,
increment daily stats, update pack progress, grant paid entitlement, or mutate
billing/payment state.

## Review Event Source-Of-Truth Policy

Review events remain the source of truth for server SRS recomputation.
Duplicate review events must be no-op evidence and must not advance SRS twice.

## Derived Review State Policy

Review state is derived from accepted review events. Due, Weak, Strong, and
Mastered must come from real review evidence, not imported local labels.

## Fake Mastery Blocking

Fake local `Mastered` state must never become server `Mastered` state. Server
mastery requires delayed recall evidence through the SRS path.

## Pack Progress Policy

Pack progress without review event evidence remains audit-only. It must not
become progress, paid entitlement, or billing state.

## Audit Summary Privacy Policy

Audit summaries must be redacted and owner-only. They must not store raw
payloads, provider tokens, production secrets, billing/payment payloads,
checkout payloads, subscription payloads, paid entitlement, or full account
state.

## Digest And Audit Read Policy

Digest and audit reads must be bounded and owner-only. They return summaries,
counts, cursors, and redacted metadata only. They must not expose raw snapshots,
full account state, provider payloads, secrets, or billing/payment data.

## Retention And Rollback Notes

Idempotency records should expire after an approved retry window or keep only
redacted archive summaries. Review events remain learning evidence until a
future privacy deletion policy is approved. Audit summaries use a bounded
support and privacy window.

Rollback must prevent partial writes across idempotency, review events, derived
state, daily stats, saved words, pack progress, and audit summaries. Retries
must not double-count review events.

## Paid Entitlement Boundary

Account sync persistence must never grant paid entitlement. Paid plan,
subscription, invoice, checkout, billing portal, and entitlement state remain
outside sync persistence.

## Billing And Payment Boundary

Billing, payment, checkout, invoice, subscription, billing portal behavior, and
payment provider payloads remain outside account sync. Sync persistence must
not import, mirror, repair, or mutate billing/payment state.

## Provider SDK Non-Goals

This PR imports no Supabase, Prisma, Drizzle, Neon, Firebase, Cloudflare D1,
Postgres, auth, payment, logging, observability, or validation SDKs.

## Migration Non-Goals

This PR creates no migrations and no executable database schema files. A future
migration plan requires explicit provider selection, owner approval, rollback
procedure, retention policy, and production data safety review.

## Manual QA Requirements For Future Real Persistence Integration

Future real persistence work must prove:

- Preview loads only the authenticated owner's state.
- Apply writes only for the authenticated owner after revalidation.
- Cross-account reads and writes are rejected.
- Same-key/same-fingerprint replay does not mutate.
- Same-key/different-fingerprint conflicts are rejected.
- Duplicate review events do not advance SRS twice.
- Review state is recomputed from event evidence.
- Pack progress without event evidence remains audit-only.
- Fake mastery remains blocked.
- Digest and audit reads are bounded, owner-only, and redacted.
- Rollback prevents partial writes and duplicate SRS advancement.
- Billing/payment and paid entitlement state are not mutated.

## Remaining Blockers

Real route implementation remains blocked by:

- confirmation of the existing account backend persistence boundary
- provider-specific adapter implementation in a separate PR
- owner-approved table design and migration plan
- transaction and rollback proof
- runtime validator selection and dependency decision
- rate limiting and mutating-route protection
- monitoring and alerting implementation
- deployment, rollout, rollback, and kill-switch implementation
- authenticated manual QA with safe test accounts
- production data safety approval

## Final Verdict

Verdict: `design_only`, not implementation-ready.

This PR defines the database persistence provider decision, adapter boundary,
and table group design only. It does not permit real API routes, route
handlers, middleware, real auth, database persistence, provider SDKs,
migrations, executable schemas, runtime validation dependencies, network calls,
billing/payment behavior, paid entitlement grants, or production data access.

## Next Recommended PR

#67 Runtime validator selection and dependency decision, still
docs/contracts/tests only.

Do not recommend real API route implementation yet.
