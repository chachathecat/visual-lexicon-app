# Account Sync Idempotency Storage Design

## Purpose

This document defines the durable idempotency and persistence storage design
required before any future account sync apply route can exist for Track B.

The contract lives in:

```txt
src/lib/account-persistence/idempotency-storage/
```

Final verdict: **design_only, not implementation-ready**.

## Non-Goals

This work does not add a real database, database schema, migration, API route,
route handler, middleware, runtime route/component integration, real auth,
auth provider SDK, database provider SDK, payment SDK, network call,
environment-variable read, checkout, billing, subscription, invoice,
entitlement grant, Webflow change, Cloudflare Worker change, DNS change,
Vercel setting, deployment setting, secret, production data access, or
`npm audit fix`.

It does not implement the future apply route. It does not choose a storage
vendor. It does not permit production account sync writes.

## Relationship To #58 And #59

PR #58 concluded that real account sync routes are No-Go until the P0 gates are
separately approved. Durable idempotency storage and transaction design were
explicit P0 blockers.

PR #59 defined the auth ownership boundary: future account sync routes must
derive account ownership from an authenticated server session and must reject
cross-account access.

This design builds on those boundaries. It assumes the future apply route has
already verified strict auth ownership before any storage lookup or mutation.
It does not satisfy the real auth, database, schema validation, payload limit,
rate limit, audit retention, monitoring, or deployment gates.

## Durable Idempotency Principles

- Apply must require an idempotency key.
- The key is scoped to the authenticated account owner and the apply route.
- The key is never globally reusable across accounts.
- Same account, same key, and same request fingerprint replays the original
  redacted outcome safely.
- Same account and same key with a different request fingerprint is rejected
  as an idempotency conflict.
- Cross-account replay is rejected before any learning-state mutation.
- Replay never re-applies review events or advances SRS again.
- Accepted review events are committed exactly once.
- Blocked plans are recorded as blocked without mutating learning state.
- Rejected malformed payloads cannot create partial learning state.

## Request Fingerprint Policy

The future request fingerprint should be a canonical hash over validated apply
inputs:

- account sync payload version
- apply mode
- client confirmation
- snapshot evidence
- previewed plan
- accepted resolution ids

The fingerprint record must not store raw guest snapshots, raw request bodies,
provider tokens, production secrets, billing/payment state, checkout state,
subscription state, or paid entitlement state.

## Same-Key Replay Policy

When an existing idempotency record belongs to the same account owner, the same
route, the same idempotency key, and the same request fingerprint, apply should
return the original redacted outcome summary.

Replay must not:

- insert review events again
- recompute SRS as if new evidence arrived
- increment daily stats again
- update pack progress again
- grant paid entitlement
- write billing/payment state

## Same-Key Conflict Policy

When an existing idempotency record belongs to the same account owner and key
but has a different request fingerprint, apply must reject the request as an
idempotency conflict.

The conflict response may tell the client to retry with a new idempotency key
only after the user creates a new, intentional apply request. It must not
mutate review events, review state, daily stats, saved words, pack progress, or
entitlement state.

## Cross-Account Replay Rejection

Storage lookup must include the authenticated account owner id. A record found
for another account cannot be replayed, even when the key string and request
fingerprint match.

A future backend must never query idempotency by key alone.

## Storage Table And Group Design

| Group | Purpose | Owner key |
| --- | --- | --- |
| `account_sync_idempotency_records` | Store account-scoped apply keys, request fingerprints, statuses, redacted outcome summaries, and timestamps. | `account_owner_id + route_id + idempotency_key` |
| `account_sync_audit_summaries` | Store redacted apply summaries for accepted, skipped, rejected, audit-only, blocked, and conflict outcomes. | `account_owner_id + audit_id` |
| `account_review_events` | Store accepted review-event evidence exactly once. | `account_owner_id + event_id` |
| `account_review_state` | Store current SRS state recomputed from accepted event evidence. | `account_owner_id + slug` |
| `account_daily_stats` | Store daily review counts derived from accepted events. | `account_owner_id + date` |
| `account_saved_words` | Store allowed saved-word records without resetting existing review state. | `account_owner_id + slug` |
| `account_pack_progress` | Store pack progress only when backed by review event evidence. | `account_owner_id + pack_id` |

Every group must define required fields, forbidden fields, write behavior, read
behavior, retention notes, and privacy notes in the TypeScript design module.

Forbidden fields include raw guest snapshots, raw server payloads, raw request
bodies, provider tokens, production secrets, full account state in audit
responses, billing/payment state, checkout state, subscription state, and paid
entitlement state.

## Transaction-Like Apply Commit Sequence

Future apply must behave as one transaction-like boundary:

1. Verify auth ownership.
2. Validate schema and payload size.
3. Check idempotency key.
4. Reject same-key/different-fingerprint conflicts.
5. Replay same-key/same-fingerprint results without mutation.
6. Reject blocked plans before learning-state writes.
7. Insert accepted review events exactly once.
8. Recompute review state from event evidence.
9. Update daily stats from accepted events.
10. Update saved words from allowed inputs.
11. Update pack progress only with review event evidence or an audit-only
    marker.
12. Write redacted audit summary.
13. Store idempotency outcome.
14. Commit atomically or rollback.

## Rollback Expectations

Partial writes must not be possible across idempotency records, review events,
derived review state, daily stats, saved words, pack progress, and audit
summaries.

If any write in the accepted mutation set fails, the future backend must roll
back the entire unit or return a deterministic recovery state that cannot
double-count review events on retry.

Malformed payloads should fail before learning-state writes. Blocked plans
should be recorded as blocked or returned as blocked without applying review
events, SRS state, daily stats, saved words, or pack progress.

## Audit Logging And Privacy Redaction

Audit summaries should contain bounded redacted metadata:

- account owner id
- audit id
- route id
- plan id
- decision status
- reason codes
- counts
- created timestamp
- retention timestamp

Audit summaries must not contain raw guest snapshots, raw server payloads,
full account state, provider tokens, production secrets, billing/payment state,
checkout state, subscription state, or paid entitlement state.

## Fake Mastery Blocking

Fake local `Mastered` state must never become server `Mastered` state. Server
review state must be recomputed from accepted review-event evidence. Mastery
requires delayed recall evidence through the SRS reducer path.

Pack progress without review event evidence remains audit-only.

## Paid Entitlement Boundary

Account sync idempotency and persistence storage must never grant paid
entitlement. Upgrade interest remains attribution-only.

The idempotency record, audit summary, review event, review state, daily stats,
saved word, and pack progress groups must all forbid paid entitlement fields.

## Billing And Payment Boundary

Billing, payment, checkout, subscription, invoice, billing portal, and payment
provider behavior remain outside account sync storage.

Sync storage must not import, infer, mutate, repair, or mirror billing/payment
state.

## P0 Blockers Still Remaining

Real account sync routes remain blocked by:

- approved real auth provider and session implementation
- schema validation
- payload size limits
- rate limiting
- mutating-route CSRF/session protection
- real database persistence adapter
- actual database transaction and rollback implementation
- audit retention and redaction approval
- production data safety review
- monitoring and alerting
- deployment and rollback plan

## Final Verdict

Verdict: **design_only, not implementation-ready**.

This PR defines storage contracts only. It does not add real database
persistence, API routes, route handlers, middleware, runtime clients, provider
SDKs, billing/payment behavior, paid entitlement grants, production data
access, or deployment changes.

## Recommended Next PR

#61 Account sync schema validation and payload size limits contract, still
docs/contracts/tests only.

Do not recommend real API route implementation yet.
