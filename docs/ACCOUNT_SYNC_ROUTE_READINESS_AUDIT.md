# Account Sync Route Readiness Audit

## Purpose

This audit defines the implementation gate checklist for the planned account
sync API routes before any real route implementation is allowed.

Final recommendation: **No-Go** for real API route implementation.

Actual API route implementation must not begin until real auth ownership checks,
schema validation, payload limits, durable idempotency storage, database
transaction design, audit logging, privacy redaction, monitoring, and
deployment/rollback gates are separately approved.

## Non-Goals

This audit does not add a real backend. It does not add `app/api`, `pages/api`,
`src/app/api`, `src/pages/api`, route handlers, middleware, runtime route or
component integration, real auth, database persistence, Supabase, Clerk,
Auth.js, Firebase, provider SDKs, network or fetch calls, localStorage reads,
environment-variable reads, payment SDKs, checkout, billing, subscriptions,
entitlement grants, Webflow changes, Cloudflare Workers, DNS, Vercel settings,
deployment settings, secrets, production data access, or `npm audit fix`.

## Completed Foundation From PRs #49-#57

| PR | Foundation |
| --- | --- |
| #49 | Account persistence contracts and mocks. |
| #50 | Disabled-by-default in-memory server SRS sync spike. |
| #51 | Guest-to-account migration prototype. |
| #52 | Server-side review event idempotency tests and payload conflict guarding. |
| #53 | Pure account sync conflict-resolution contracts. |
| #54 | Disabled/mock-only server persistence adapter contracts. |
| #55 | Disabled/mock-only server persistence integration harness. |
| #56 | Design-only account sync API route contracts for preview/apply/digest/audit. |
| #57 | Disabled/mock-only account sync API handler harness. |

The chain proves the contract shape in mocks. It does not prove production auth,
storage, network, deployment, or data-safety readiness.

## Planned Route Inventory

| Method | Planned route | Mutating | Current status |
| --- | --- | --- | --- |
| `POST` | `/api/account/sync/preview` | No | Design-only; blocked from real implementation. |
| `POST` | `/api/account/sync/apply` | Yes | Design-only; blocked from real implementation. |
| `GET` | `/api/account/sync/digest` | No | Design-only; blocked from real implementation. |
| `GET` | `/api/account/sync/audit` | No | Design-only; blocked from real implementation. |

No actual route file path is allowed in this PR.

## Readiness Gate Matrix

| Gate group | Status | Severity | Required before routes? |
| --- | --- | --- | --- |
| Auth ownership | Requires owner approval | P0 | Yes |
| Schema validation | Requires separate PR | P0 | Yes |
| Payload size | Requires separate PR | P0 | Yes |
| CSRF/session | Requires owner approval | P0 | Yes for mutating apply |
| Rate limit | Requires separate PR | P0 | Yes |
| Durable idempotency | Requires separate PR | P0 | Yes for apply |
| Database transaction | Requires separate PR | P0 | Yes for apply |
| Persistence adapter | Blocked | P0 | Yes |
| Audit logging | Requires separate PR | P0 | Yes |
| Privacy redaction | Requires owner approval | P0 | Yes |
| SRS integrity | Design-only | P0 | Yes |
| Fake mastery block | Design-only | P0 | Yes |
| Paid entitlement boundary | Design-only | P0 | Yes |
| Billing/payment boundary | Design-only | P0 | Yes |
| Deployment rollback | Requires separate PR | P0 | Yes |
| Monitoring/alerting | Requires separate PR | P0 | Yes |
| Production data safety | Requires owner approval | P0 | Yes |

## P0/P1/P2 Blockers

### P0

- No real auth ownership boundary exists yet.
- No real database persistence adapter exists yet.
- No durable idempotency table/store exists yet.
- No transaction/rollback strategy exists yet.
- No production payload schema validation exists yet.
- No payload size limits exist yet.
- No route rate limiting exists yet.
- No audit retention/redaction policy exists yet.
- No deployment/rollback plan exists yet.
- No monitoring/alerting plan exists yet.

### P1

- Preview audit policy is not defined beyond design-only response-local
  summaries.
- Operator runbook for sync conflicts, blocked plans, and idempotency conflicts
  is not defined.
- Digest/audit retention windows and support visibility rules are not approved.

### P2

- Product analytics for sync preview/apply success, blocked plans, and retries
  are not specified.
- Manual QA fixtures for real-provider auth sessions are not defined.
- Support copy for failed sync recovery is not drafted.

## Route-By-Route Implementation Prerequisites

### Preview

Required before implementation:

- Auth ownership check.
- Schema validation.
- Payload size limit.
- Rate limiting.
- No mutation guarantee.
- Preview audit policy.
- No paid entitlement guarantee.

Preview must never mutate server state. It may return a projected plan and
preview result, but it must not write account state, audit rows, entitlement
state, or derived learning state.

### Apply

Required before implementation:

- Auth ownership check.
- Schema validation.
- Payload size limit.
- Rate limiting.
- CSRF/session protection where applicable.
- Idempotency key validation.
- Durable idempotency storage.
- Transaction-like commit.
- Blocked plan rejection.
- Event-derived SRS recomputation.
- Audit logging.
- Rollback strategy.
- No paid entitlement guarantee.

Apply must reject blocked plans before any write. Accepted mutations must commit
with idempotency outcome, review events, recomputed SRS state, daily stats, pack
progress, and redacted audit summaries in a transaction-like boundary.

### Digest

Required before implementation:

- Auth ownership check.
- Rate limiting.
- Bounded response.
- No full sensitive state.
- No raw payloads.
- No production secrets.
- Privacy redaction policy.
- Sensitive payload exclusion.

Digest should return account state metadata only. It must not expose full saved
word payloads, full review state payloads, review event payloads, raw
upgrade-interest records, raw snapshots, provider tokens, or production secrets.

### Audit

Required before implementation:

- Auth ownership check.
- Bounded response.
- No raw guest snapshots.
- No raw server payloads.
- No provider tokens.
- No production secrets.
- Redaction policy.
- Sensitive payload exclusion.

Audit should return bounded owner-only summaries. It must not expose raw guest
snapshots, raw server payloads, provider tokens, production secrets, or full
sensitive state.

## Auth Ownership Boundary Requirements

Real routes must verify the authenticated account owns every loaded account
state, idempotency record, digest, and audit summary. Apply must revalidate
ownership immediately before mutating state.

This audit does not choose or implement an auth provider.

## Schema Validation And Payload Size Policy

Preview and apply must reject malformed snapshots before conflict resolution.
Apply must validate mode, client confirmation, idempotency key, optional
previewed plan, and snapshot evidence.

Digest and audit must return bounded responses. Payload ceilings must be
defined for request bodies, response bodies, audit summary counts, and any sync
cursor metadata before real route work begins.

## Idempotency And Transaction Policy

Apply requires durable idempotency storage. Reusing the same idempotency key
with the same payload must be safe. Reusing the same key with a different
payload must be rejected.

Duplicate review events must not advance SRS twice. Accepted review-event
evidence must update review state, daily stats, and pack progress exactly once.
Partial writes must not be possible across idempotency records, review events,
derived state, and audit summaries.

## Audit Logging And Privacy Redaction Policy

Apply should write redacted audit summaries for accepted, skipped, rejected,
audit-only, and blocked decisions. Preview may return response-local preview
audit information, but it must not write server audit state until a policy is
approved.

Audit records must be owner-only and must not include raw sensitive payloads,
raw guest snapshots, raw server payloads, provider tokens, production secrets,
or full account state.

## Fake Mastery Policy

Fake local `Mastered` state must never become server `Mastered` state. Review
events remain the source of truth, and review state must be recomputed from
event evidence. Mastery requires delayed recall evidence through the SRS
reducer path.

Pack progress without review event evidence must remain audit-only.

## Paid Entitlement Safety Policy

Account sync routes must never grant paid entitlement. Upgrade interest remains
attribution-only.

Billing, payment, checkout, subscription, invoice, billing portal, entitlement
grant, and payment/provider SDK behavior must stay outside account sync routes.

## Deployment, Rollback, And Monitoring Requirements

Before real routes are implemented, a separate PR must define:

- Deployment and rollback plan for account sync routes.
- Kill switch or disable path for apply.
- Idempotency replay and partial-write recovery procedure.
- Monitoring for preview/apply failures, blocked plans, idempotency conflicts,
  latency, payload rejection, and digest/audit access failures.
- Alert thresholds and owner escalation.
- Manual QA plan for authenticated preview, apply, digest, and audit flows.

## Go/No-Go Recommendation

Recommendation: **No-Go**.

Reason: the planned route surface is understood, but required production gates
are not satisfied. Real route implementation would be premature without auth
ownership, schema validation, payload limits, durable idempotency, database
transactions, audit logging, redaction, monitoring, and rollback approval.

## Next Recommended PR

#59 should be one of:

- Auth/provider implementation decision refresh.
- Account sync persistence storage design.

Do not recommend real production API route implementation until all P0 gates
are explicitly satisfied and approved.
