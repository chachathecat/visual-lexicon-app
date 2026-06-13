# Account Sync Auth Provider Decision

## Purpose

This document records the final auth provider integration boundary decision for
future account sync routes. It keeps PR #65 docs/contracts/tests only and does
not implement real auth.

Final verdict: `design_only`, not implementation-ready.

## Non-Goals

This PR does not add real auth, auth provider SDKs, database persistence,
logging or observability SDKs, validation dependencies, network calls, API
routes, route handlers, middleware, runtime route or component integration,
environment variables, feature flags, billing, payment, checkout,
subscriptions, paid entitlement grants, Webflow changes, Cloudflare Workers,
DNS changes, Vercel or deployment settings, secrets, production data, or
`npm audit fix`.

## Relationship To #58-#64

| PR | Gate | Relationship |
| --- | --- | --- |
| #58 | Route readiness audit and No-Go gate | Real account sync routes remain blocked. |
| #59 | Auth ownership boundary | This PR chooses the future provider boundary that must satisfy the ownership contract. |
| #60 | Durable idempotency and persistence storage design | Auth must identify the account owner before idempotency or persistence records can be loaded. |
| #61 | Schema validation and payload limits | Auth failure must reject before schema-accepted payloads reach sync core. |
| #62 | Audit logging and privacy redaction | Digest and audit access must remain owner-only, bounded, and redacted. |
| #63 | Monitoring, rollout, rollback, and kill switch | Provider integration still needs monitoring, rollback, kill-switch, and QA evidence later. |
| #64 | Final implementation readiness review | #64 recommended #65 as an auth provider final decision and mock integration boundary. |

These gates do not authorize real API route implementation.

## Auth Provider Candidate Matrix

| Candidate | Decision | Sync core provider-neutral? | Provider SDK in sync core? | Notes |
| --- | --- | --- | --- | --- |
| `existing_account_session_boundary` | Selected first | Yes | No | Prefer the existing app/account session boundary if it can expose a stable server-derived owner. |
| `clerk` | Compatible future candidate | Yes | No | Provider-specific session data would be adapted outside sync core. |
| `authjs` | Compatible future candidate | Yes | No | Future adapter must normalize session subject and account owner. |
| `supabase_auth` | Compatible future candidate | Yes | No | Auth and database decisions remain separate. |
| `firebase_auth` | Compatible future candidate | Yes | No | Provider claims must normalize to the same principal shape. |
| `custom_backend_session` | Deferred | Yes | No | Consider only after confirming the existing session boundary and database design. |

## Selected Strategy

The selected strategy is:

- `existing_account_session_boundary_first`
- `provider_neutral_adapter_boundary`
- `no_provider_sdk_in_sync_core`

Account sync core must not know provider-specific SDK details. A future adapter
may translate provider-specific server session data into a normalized account
sync principal, but the core sync logic receives only that normalized principal.

## Normalized Auth Principal Shape

The normalized principal contains only bounded server-side identity context:

- `authenticatedAccountId`
- `providerKind`
- `providerSubject`
- `sessionId`
- `sessionIssuedAt`
- `sessionExpiresAt`
- `sessionRevoked`
- `accountStatus`
- `emailVerified`
- `assuranceLevel`
- `planContextReadonly`
- `ownershipSource`

It must not include provider tokens, refresh tokens, session secrets, API keys,
raw provider payloads, billing payloads, payment payloads, checkout payloads,
subscription payloads, or production credentials.

## Server Session Ownership Principle

Future real sync routes must derive owner identity from the authenticated server
session only. The owner is the normalized principal's
`authenticatedAccountId`, derived from an authenticated server session and
unambiguous provider subject.

Client-provided `accountId` values are never ownership proof. They may appear as
legacy metadata or hints, but they cannot authorize preview, apply, digest, or
audit access.

## Route-By-Route Auth Requirements

| Route | Requirement |
| --- | --- |
| `preview` | Requires a normalized authenticated server principal before any account sync state is loaded. Preview is read-only. |
| `apply` | Requires the same owner identity and immediate revalidation before mutation. Apply remains blocked until auth, idempotency, persistence, validation, audit, rollback, monitoring, and QA gates close. |
| `digest` | Requires owner-only bounded read access. It must return summary metadata only. |
| `audit` | Requires owner-only bounded audit access with redacted summaries only. |

## Rejected Auth States

Future account sync routes must reject:

- `anonymous`
- `missing`
- `expired`
- `revoked`
- `ambiguous`
- `unsupported`
- `deleted`
- `blocked`

These states reject before account sync core loads or mutates account state.

## Cross-Account Rejection Policy

Any target account that does not match the server-derived
`authenticatedAccountId` must be rejected. A client-provided account id cannot
repair or override a mismatch.

## Read-Only Plan Context Policy

The auth boundary may expose plan metadata only as read-only context. Plan
context can help future policy decisions, but it cannot grant paid entitlement,
repair billing state, create checkout, or change subscription state.

## Paid Entitlement Boundary

Account sync must never grant paid entitlement. Upgrade interest and plan
metadata remain attribution or read-only context only.

## Billing And Payment Boundary

Billing, payment, checkout, invoice, subscription, and billing portal behavior
remain outside account sync. Account sync must not import provider SDKs, process
payment data, or mutate billing-adjacent state.

## Fake Mastery Blocking

Fake local `Mastered` state remains blocked. Review events and delayed recall
evidence remain the source of truth for SRS and server mastery.

## Provider SDK Non-Goals

This PR imports no Clerk, Auth.js, Supabase Auth, Firebase Auth, database,
payment, logging, observability, or validation SDKs. A future provider-specific
adapter must be approved in a separate PR.

## Manual QA Requirements For Future Real Provider Integration

Future real provider work must prove:

- Preview accepts only the authenticated owner session and remains read-only.
- Apply revalidates the owner immediately before mutation.
- Digest and audit are owner-only, bounded, and redacted.
- Cross-account targets are rejected.
- Anonymous, missing, expired, revoked, ambiguous, unsupported, deleted, and
  blocked accounts are rejected.
- Plan context is read-only and cannot grant paid entitlement.
- Fake mastery remains blocked and review events remain the SRS source of
  truth.

## Remaining Blockers

Real route implementation remains blocked by:

- Owner-approved real auth provider integration.
- Database persistence provider decision and table design.
- Runtime validation dependency decision.
- Production rate limiting.
- Monitoring and alerting implementation.
- Rollout, rollback, and kill-switch implementation.
- Authenticated manual QA with safe test accounts.

## Final Verdict

Verdict: `design_only`, not implementation-ready.

This PR defines the auth provider decision and mock integration boundary only.
It does not permit real API routes, route handlers, middleware, real auth,
provider SDKs, database persistence, runtime validation dependencies, network
calls, billing/payment behavior, paid entitlement grants, or production data
access.

## Next Recommended PR

#66 Database persistence provider decision and table design, still
docs/contracts/tests only.

Do not recommend real API route implementation yet.
