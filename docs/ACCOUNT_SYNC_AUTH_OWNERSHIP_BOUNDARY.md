# Account Sync Auth Ownership Boundary

## Purpose

This document defines the auth ownership boundary required before any future
account sync API route can exist for Track B. It is a design-only contract for
preview, apply, digest, and audit ownership checks.

The contract lives in:

```txt
src/lib/account-persistence/auth-ownership/
```

Final verdict: **design_only, not implementation-ready**.

## Non-Goals

This work does not add real auth, auth provider SDKs, database persistence,
network or fetch calls, API routes, route handlers, middleware, runtime
route/component integration, billing, payment, checkout, subscriptions,
entitlement grants, environment-variable access, Webflow changes, Cloudflare
Workers, DNS, Vercel settings, deployment settings, secrets, production data
access, or `npm audit fix`.

It does not choose an auth provider. It does not create production sessions. It
does not load or write account data.

## Relationship To #58 Route Readiness Audit

PR #58 concluded that real account sync routes are No-Go because production
gates are still missing. The first P0 gate in that audit is real auth ownership.

This PR addresses only the design contract for that gate. It defines the
ownership policy and failure reasons that future route implementation must
respect, but it does not satisfy the production auth gate or authorize route
implementation.

## Planned Route Ownership Matrix

| Method | Planned route | Ownership policy | Mutating | Implementation status |
| --- | --- | --- | --- | --- |
| `POST` | `/api/account/sync/preview` | Authenticated server-session owner | No | Design-only |
| `POST` | `/api/account/sync/apply` | Strict mutating owner revalidation | Yes | Design-only |
| `GET` | `/api/account/sync/digest` | Privacy-safe owner-only bounded read | No | Design-only |
| `GET` | `/api/account/sync/audit` | Privacy-safe owner-only bounded audit read | No | Design-only |

All four planned routes require auth ownership. No actual route file path is
allowed by this work.

## Trusted Server Session Principle

Future sync routes must derive the account owner from the authenticated server
session. The trusted owner is the account id attached to the validated server
session and unambiguous subject.

A request cannot select its own owner. Any account state, idempotency record,
digest, or audit summary loaded by future routes must belong to the account
owner derived from that server session.

## Client Account Id Non-Trust Policy

Client-provided `accountId` values are never ownership proof. They may appear
as hints or legacy request metadata, but they cannot authorize reads, writes,
digest access, or audit access.

If a request includes a `targetAccountId`, it must match the authenticated
server-session owner. If the only available account id came from the client,
the decision must reject with `client_account_id_not_trusted`.

## Route-By-Route Ownership Requirements

Preview requires an authenticated server-session owner before loading account
state or previewing conflicts. Preview remains non-mutating.

Apply requires the strictest policy. It must revalidate ownership immediately
before mutation, reject cross-account access, and still require the separate
durable idempotency, transaction, schema, payload, CSRF/session, audit, and
rollback gates from #58.

Digest requires owner-only access, bounded response shape, and metadata-only
output. It must not return full saved-word payloads, full review state payloads,
review event payloads, raw upgrade-interest records, or sensitive sync inputs.

Audit requires owner-only access, bounded summaries, and redacted output. It
must not return raw guest snapshots, raw server payloads, provider tokens,
production secrets, or full account state.

## Failure Reasons

The contract defines these ownership failure reasons:

```txt
anonymous
missing_account
missing_session
expired_session
revoked_session
unsupported_provider
ambiguous_subject
missing_target_account
client_account_id_not_trusted
cross_account_access
deleted_account
blocked_account
ownership_not_verified
insufficient_route_policy
fake_mastery_not_accepted
paid_entitlement_outside_sync
billing_payment_outside_sync
privacy_response_not_bounded
```

The first fourteen reasons are the core auth ownership boundary. The final
four preserve adjacent safety boundaries that future routes must not weaken.

## Privacy And Redaction Expectations

Digest and audit are privacy-sensitive reads. They require a privacy-safe
ownership policy before returning any account-adjacent data.

Digest output should be metadata only. Audit output should be bounded summaries
only. Neither response should expose raw guest snapshots, raw server payloads,
provider tokens, production secrets, full account state, or sensitive payloads.

## Fake Mastery Blocking

Fake local `Mastered` state must never become server `Mastered` state. Review
event evidence remains the source of truth.

The ownership decision reports `acceptsFakeMastery: false`. If the target
contains a local mastery claim without delayed review-event evidence, the
decision rejects with `fake_mastery_not_accepted`.

Future implementation must still recompute server review state through the SRS
reducer path and delayed recall evidence.

## Paid Entitlement Boundary

Auth may identify plan state, but account sync routes must never grant paid
entitlement. A paid plan observed on the auth context is read-only evidence for
future policy decisions, not an entitlement mutation.

The ownership decision always reports `grantsPaidEntitlement: false`. Requests
that try to grant paid access through sync are rejected with
`paid_entitlement_outside_sync`.

## Billing And Payment Boundary

Billing, payment, checkout, subscription, invoice, billing portal, and payment
provider behavior remain outside account sync. Account sync must not import,
mutate, infer, or repair billing state.

Requests that include billing or payment state are rejected with
`billing_payment_outside_sync`.

## Next Implementation Gates Still Blocked

Real route implementation remains blocked by:

- Approved real auth provider and session implementation.
- Schema validation and payload size limits.
- Rate limiting and mutating-route CSRF/session protection.
- Durable idempotency storage.
- Database persistence and transaction design.
- Audit logging retention and redaction approval.
- Production data safety review.
- Deployment, rollback, monitoring, and alerting plans.

## Final Verdict

Verdict: **design_only, not implementation-ready**.

This PR defines the auth ownership contract only. It does not permit real API
route implementation, route handlers, middleware, runtime clients, auth SDKs,
database persistence, network calls, billing/payment behavior, or production
data access.

## Recommended Next PR

#60 Account sync durable idempotency and persistence storage design, still
docs/contracts/tests only.

Do not recommend real API route implementation yet.
