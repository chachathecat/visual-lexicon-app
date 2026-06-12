# Account Sync Audit Redaction Policy

## Purpose

This document defines the audit logging, privacy redaction, sensitive payload
exclusion, and owner-only digest/audit policy required before any future
account sync API route can exist for Track B.

The contract lives in:

```txt
src/lib/account-persistence/audit-redaction/
```

Final verdict: **design_only, not implementation-ready**.

## Non-Goals

This work does not add real API routes, route handlers, middleware, runtime
route/component integration, real auth, database persistence, validation
dependencies, provider SDKs, logging provider SDKs, network calls, browser
storage reads, environment-variable reads, billing, payment, checkout,
subscription, invoice, entitlement grants, Webflow changes, Cloudflare Workers,
DNS changes, Vercel settings, deployment settings, secrets, production data
access, or `npm audit fix`.

It does not implement production audit logging. It does not choose a logging or
observability provider. It does not authorize account sync route
implementation.

## Relationship To #58, #59, #60, And #61

PR #58 concluded that real account sync routes are No-Go until P0 gates are
separately approved. Audit logging, privacy redaction, monitoring, and rollback
were explicit blockers.

PR #59 defined the auth ownership boundary. Digest and audit reads must be
owner-only, and client-provided account ids are never ownership proof.

PR #60 defined durable idempotency and persistence storage design. Apply
requires redacted audit summaries for accepted, replayed, blocked, rejected,
and conflict outcomes without storing raw payloads.

PR #61 defined schema validation and payload size limits. Malformed payloads
must be rejected before learning-state writes, and digest/audit responses must
remain bounded.

This policy defines only the audit and redaction contract. It does not satisfy
real auth, database, route, monitoring, deployment, or rollback gates.

## Audit Event Taxonomy

| Event type | Route | Severity | Policy |
| --- | --- | --- | --- |
| `preview_requested` | preview | info | Response-local by default. |
| `preview_rejected` | preview | warning | Response-local by default. |
| `apply_requested` | apply | info | Redacted owner-scoped summary after required gates. |
| `apply_replayed` | apply | info | Redacted replay summary; no learning mutation. |
| `apply_accepted` | apply | info | Redacted accepted summary. |
| `apply_blocked` | apply | blocked | Redacted blocked summary; no blocked learning write. |
| `apply_rejected` | apply | warning | Redacted rejection summary. |
| `apply_conflict` | apply | warning | Redacted conflict summary. |
| `digest_requested` | digest | info | Owner-only bounded access summary. |
| `digest_rejected` | digest | warning | Safe metadata only. |
| `audit_requested` | audit | info | Owner-only bounded access summary. |
| `audit_rejected` | audit | warning | Safe metadata only. |
| `schema_rejected` | apply | warning | Redacted rejection summary only. |
| `payload_too_large` | apply | warning | Redacted rejection summary only. |
| `ownership_rejected` | apply | critical | Safe metadata only; no target payload. |
| `idempotency_conflict` | apply | warning | Redacted same-key conflict summary. |
| `fake_mastery_blocked` | apply | blocked | Blocked or downgraded client claim only. |
| `paid_entitlement_ignored` | apply | blocked | Attribution only; no entitlement mutation. |
| `billing_payload_rejected` | apply | blocked | Billing/payment payload rejected. |

## Redacted Audit Summary Shape

Audit summaries must be owner-scoped, bounded, and redacted. Required summary
fields are:

```txt
accountOwnerId
auditId
eventType
routeId
severity
reasonCodes
counts
createdAt
retentionUntil
```

Optional identifiers such as plan ids, idempotency keys, request fingerprints,
review event ids, saved word slugs, pack ids, and target account ids are
hash-or-count only. Client-provided account ids, upgrade interest, and local
mastery claims are redacted marker-only fields.

Audit summaries must not store raw guest snapshots, raw server payloads, full
review event bodies, raw saved words, provider tokens, production secrets,
billing/payment payloads, or full account state.

## Sensitive Field Classification

| Classification | Examples | Storage rule |
| --- | --- | --- |
| `allowed_summary` | `eventType`, `routeId`, `severity`, `reasonCodes`, `counts` | Bounded summary value. |
| `hashed_or_count_only` | `requestFingerprint`, `idempotencyKey`, `reviewEventIds`, `targetAccountId` | Hash, opaque reference, or count only. |
| `redacted` | `clientProvidedAccountId`, `upgradeInterest`, `clientMasteryClaim` | Redacted marker only. |
| `forbidden` | raw snapshots, tokens, secrets, billing/payment payloads, full account state | Reject from summary shape. |

## Forbidden Field List

These fields are forbidden from account sync audit summaries:

```txt
rawGuestSnapshot
rawServerPayload
rawReviewEvents
rawSavedWords
providerToken
sessionToken
refreshToken
apiKey
secret
env
paymentMethod
checkoutSession
subscriptionPayload
billingPortalPayload
invoicePayload
productionCredential
fullAccountState
```

## Owner-Only Digest/Audit Visibility Policy

Digest and audit read surfaces must require owner-only access from a future
authenticated server-session owner. Client-provided account ids are not
ownership proof.

Digest returns bounded metadata only. Audit returns bounded redacted summaries
only. Neither surface may return raw guest snapshots, raw server payloads, full
review event bodies, raw upgrade-interest records, provider tokens, production
secrets, billing/payment payloads, or full account state.

Cross-account attempts may record safe metadata, but must not expose target
account payload data.

## Retention Notes

The design-only retention policy uses redacted summaries only:

- Audit summary retention: 90 days.
- Idempotency conflict summary retention: 30 days.
- Rejected payload summary retention: 30 days.
- Preview response-local audit retention: 0 days.
- Raw payload retention: 0 days.

Actual retention windows still require approval before production
implementation.

## Preview Audit Policy

Preview must not write durable audit logs by default. It may return
response-local preview audit summaries for the current response.

Durable preview audit logging requires separate approval and must still use the
same owner-scoped redacted summary shape. Preview must never write learning
state, account state, entitlement state, or billing/payment state.

## Apply Audit Policy

Apply may write redacted audit summaries only after the future ownership,
schema, payload, and idempotency gates have passed. Apply audit summaries may
record accepted, replayed, blocked, rejected, conflict, fake-mastery-blocked,
and paid-entitlement-ignored outcomes.

Apply audit logging must not store raw snapshots, raw server payloads, full
review event bodies, provider tokens, production secrets, billing/payment
payloads, or full account state.

## Idempotency Conflict Audit Policy

Same-key/different-fingerprint conflicts should write a redacted conflict
summary only. The summary may include owner scope, event type, reason code,
count metadata, and a request fingerprint reference. It must not store raw
payloads from either request.

Cross-account idempotency attempts must not expose target account payloads.

## Malformed Payload Rejection Audit Policy

Malformed payloads and oversized payloads should log redacted rejection
summaries only when a future backend can do so without storing raw request
bodies or creating partial learning state.

Rejected malformed payloads must not write review events, review state, daily
stats, saved words, pack progress, entitlement state, or billing/payment state.

## Fake Mastery Blocking

Fake local `Mastered` state must never become server mastery through audit
logging. Audit summaries may record fake mastery only as a blocked outcome or
downgraded client claim.

Review events remain the source of truth. Server mastery still requires delayed
recall evidence through the SRS reducer path.

## Paid Entitlement Boundary

Account sync audit logging cannot grant paid entitlement. Upgrade interest
remains attribution-only.

Any sync payload that tries to grant paid access must be ignored or rejected
with a redacted summary. It must not mutate account plan state.

## Billing/Payment Boundary

Billing, payment, checkout, subscription, invoice, billing portal, and payment
provider data remain outside account sync.

Billing/payment payloads are forbidden from account sync audit summaries and
must be rejected or excluded as safe redacted metadata only.

## P0 Blockers Still Remaining

Real account sync routes remain blocked by:

- approved real auth provider and session implementation
- rate limiting
- mutating-route CSRF/session protection
- real database persistence adapter
- actual transaction and rollback implementation
- production data safety review
- monitoring and alerting
- deployment and rollback plan
- kill-switch or disable path for apply
- approved production audit retention and visibility operations

## Final Verdict

Verdict: **design_only, not implementation-ready**.

This PR defines audit/redaction contracts only. It does not add real API
routes, route handlers, middleware, runtime clients, auth, database
persistence, logging provider integration, payment behavior, paid entitlement
grants, production data access, or deployment changes.

## Recommended Next PR

#63 Account sync monitoring, rollout, rollback, and kill-switch gate, still
docs/contracts/tests only.

Do not recommend real API route implementation yet.
