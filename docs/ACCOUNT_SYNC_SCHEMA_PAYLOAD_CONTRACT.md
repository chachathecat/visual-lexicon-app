# Account Sync Schema Payload Contract

## Purpose

This document defines the schema validation and payload size limits required
before any future account sync API route can exist for Track B.

The contract lives in:

```txt
src/lib/account-persistence/schema-payload/
```

Final verdict: **design_only, not implementation-ready**.

## Non-Goals

This work does not add real API routes, route handlers, middleware, runtime
route/component integration, real auth, database persistence, validation
dependencies, provider SDKs, network calls, browser storage reads,
environment-variable reads, billing, payment, checkout, subscription, invoice,
entitlement grants, Webflow changes, Cloudflare Workers, DNS changes, Vercel
settings, deployment settings, secrets, production data access, or
`npm audit fix`.

It does not implement production schema parsing. It does not choose a runtime
validation library. It does not authorize account sync route implementation.

## Relationship To #58, #59, And #60

PR #58 concluded that real account sync routes are No-Go until P0 gates are
separately approved. Schema validation and payload size limits were explicit
P0 blockers.

PR #59 defined the auth ownership boundary: future routes must derive ownership
from an authenticated server session, and client-provided `accountId` values
are never ownership proof.

PR #60 defined durable idempotency and persistence storage design for future
apply writes. It requires schema and payload validation before idempotency
records or learning-state writes.

This PR defines only the design contract for schema and payload validation. It
does not satisfy real auth, database, route, rate limit, audit logging,
privacy redaction, monitoring, or deployment gates.

## Planned Route Schema Matrix

| Method | Planned route | Schema policy | Payload limit | Mutation policy | Status |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/account/sync/preview` | Validate preview request body and snapshot evidence before conflict resolution. | 98,304 bytes. | No mutation. | Design-only |
| `POST` | `/api/account/sync/apply` | Validate apply mode, snapshot or preview evidence, idempotency key, and client confirmation before conflict resolution. | 163,840 bytes plus bounded collections. | Reject malformed before idempotency or learning-state writes. | Design-only |
| `GET` | `/api/account/sync/digest` | Validate bounded query and cursor metadata. | 2,048 query/cursor bytes and 32,768 summary bytes. | No mutation. | Design-only |
| `GET` | `/api/account/sync/audit` | Validate bounded query and cursor metadata. | 4,096 query/cursor bytes and 65,536 summary bytes. | No mutation. | Design-only |

No actual route file path is allowed by this work.

## Payload Size Limit Table

| Limit | Ceiling | Unit | Notes |
| --- | ---: | --- | --- |
| Preview request body | 98,304 | bytes | Design-only limit for guest snapshot preview inputs. |
| Apply request body | 163,840 | bytes | Design-only limit for apply inputs after explicit user intent. |
| Digest query/cursor | 2,048 | bytes | Bounded digest cursor and query metadata. |
| Audit query/cursor | 4,096 | bytes | Bounded audit cursor and query metadata. |
| Digest response summary | 32,768 | bytes | Digest response must remain metadata-only. |
| Audit response summary | 65,536 | bytes | Audit response must remain bounded summaries only. |
| Review events per apply | 100 | items | Prevent large event imports from one apply. |
| Saved words per apply | 200 | items | Prevent large saved-word imports from one apply. |
| Pack progress entries per apply | 50 | items | Progress still requires review event evidence. |
| Upgrade interest records per apply | 10 | items | Attribution-only and never entitlement. |

These ceilings are conservative and design-only. They are not runtime
validators.

## Malformed Payload Rejection Policy

Preview and apply must reject malformed payloads before conflict resolution.

Apply must reject malformed payloads before any future idempotency record,
review event insertion, review-state recomputation, daily stats update, saved
word update, pack progress update, or audit summary write.

Malformed apply payloads must not create partial learning state. If a future
backend cannot prove this boundary, the apply route remains blocked.

Digest and audit must reject unbounded query/cursor metadata and must return
bounded responses only.

## Pre-Write Apply Validation Policy

Future apply validation must run before all learning-state writes. It must
validate:

- account sync payload version
- apply mode
- snapshot or previewed plan evidence
- idempotency key
- explicit client confirmation or equivalent safe apply intent
- payload byte ceiling
- review event count
- saved word count
- pack progress entry count
- upgrade interest record count
- sensitive field exclusion
- fake mastery exclusion

Only validated review-event evidence may become server learning evidence.

## Idempotency Key Validation Relationship

Apply requires an idempotency key, but the key is not enough. The future apply
route must validate schema, payload size, idempotency key presence, and safe
apply intent before any idempotency record can be created.

The durable idempotency contract from #60 still applies: same owner, same key,
and same request fingerprint may replay the original redacted outcome; same
owner and key with a different fingerprint must be rejected.

## Account Id Non-Trust Policy

Client-provided `accountId` values are never ownership proof. They may be kept
as legacy metadata or hints, but they must not authorize reads, writes,
digest access, audit access, idempotency records, or learning-state mutation.

Ownership must come from the future server-session boundary from #59.

## Fake Mastery Blocking

Payloads must not contain fake server mastery claims. Local `Mastered` labels,
box 5 state, or local mastery counters remain client claims only.

Server mastery can only come from review-event evidence and delayed recall
through the SRS reducer path. Review events remain the source of truth.

## Paid Entitlement Boundary

Account sync payloads must not request, grant, repair, or infer paid
entitlement. Upgrade interest remains attribution-only and must not grant paid
access.

## Billing And Payment Boundary

Billing, payment, checkout, subscription, invoice, billing portal, and payment
provider data are forbidden from account sync payloads.

Account sync must not import, mirror, mutate, or repair billing/payment state.

## Sensitive Field Exclusion Policy

Payloads must exclude raw provider tokens, production credentials, raw
sensitive payloads, raw guest snapshots in digest/audit output, paid
entitlement grants, billing/payment data, checkout/session data, subscription
state, invoices, and fake server mastery claims.

Digest and audit must not return raw guest snapshots, raw server payloads, or
raw sensitive payloads.

## Digest/Audit Bounded Response Policy

Digest responses must return metadata-only summaries. They must not return
full saved-word payloads, full review-state payloads, review-event payloads,
raw upgrade-interest records, provider material, production credentials, or
full sensitive account state.

Audit responses must return owner-only bounded summaries. They must not return
raw guest snapshots, raw server payloads, provider material, production
credentials, or full sensitive account state.

## P0 Blockers Still Remaining

Real account sync routes remain blocked by:

- approved real auth provider and session implementation
- rate limiting
- mutating-route CSRF/session protection
- real database persistence adapter
- actual transaction and rollback implementation
- audit logging retention and redaction approval
- production data safety review
- monitoring and alerting
- deployment and rollback plan
- runtime validation library selection and integration

## Final Verdict

Verdict: **design_only, not implementation-ready**.

This PR defines schema and payload contracts only. It does not add real API
routes, route handlers, middleware, runtime clients, auth, database
persistence, validation dependencies, payment behavior, paid entitlement
grants, production data access, or deployment changes.

## Recommended Next PR

#62 Account sync audit logging and privacy redaction policy, still
docs/contracts/tests only.

Do not recommend real API route implementation yet.
