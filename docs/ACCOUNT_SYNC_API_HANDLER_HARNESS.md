# Account Sync API Handler Harness

## Purpose

This document describes the disabled, mock-only account sync API handler
harness for Track B. It follows PRs #49-#56 by simulating the future
preview/apply/digest/audit handler boundary without creating real API routes,
route handlers, auth integration, database persistence, runtime clients, or
production behavior.

The harness lives in:

```txt
src/lib/account-persistence/api-handler-harness/
```

## Non-Goals

This work does not add `app/api`, `pages/api`, `src/app/api`, `src/pages/api`,
`route.ts`, middleware, runtime route/component integration, real auth,
database persistence, Supabase, Clerk, Auth.js, Firebase, provider SDKs,
payment SDKs, checkout, billing, subscriptions, entitlement grants,
environment-variable reads, `fetch`, localStorage reads, Webflow, Cloudflare,
Vercel, DNS, deployment changes, secrets, production data access, or
`npm audit fix`.

## Mock Handler Inventory

| Function | Simulated route | Method | Mutating | Purpose |
| --- | --- | --- | --- | --- |
| `handleAccountSyncPreviewMock` | `/api/account/sync/preview` | `POST` | No | Validate preview request shape, require mock auth, run the disabled harness, and return plan/preview/digest/safety output. |
| `handleAccountSyncApplyMock` | `/api/account/sync/apply` | `POST` | Mock-only | Validate apply request shape, require mock auth, require idempotency and paid-entitlement confirmation, reject blocked plans, and return counts/digest/audit summaries. |
| `handleAccountSyncDigestMock` | `/api/account/sync/digest` | `GET` | No | Return account state digest metadata only. |
| `handleAccountSyncAuditMock` | `/api/account/sync/audit` | `GET` | No | Return bounded audit summaries only. |

The registry `VLX_ACCOUNT_SYNC_MOCK_HANDLER_REGISTRY` exposes only these four
handlers.

## Request, Context, And Response Shape

Mock requests include:

- `method`
- `path`
- `body` or `query`
- `accountId`
- `mockAuthState`
- `idempotencyKey` when apply requires it
- `requestId`
- `createdAt`
- `accountSyncPayloadVersion` for preview/apply
- optional initial in-memory server state

Mock context includes the same safe test-only boundary:

- mock authenticated or anonymous state
- account id
- optional initial in-memory server state
- optional idempotency ledger
- optional accepted resolution ids
- optional audit summary bound

Mock responses include:

- numeric `status`
- boolean `ok`
- `route`
- `body` on success
- structured `error` on expected failures
- route safety policy
- `noNetwork: true`
- `noRuntime: true`
- digest where appropriate
- apply counts where appropriate
- next mock idempotency ledger when apply records or replays a key

## Preview Handler Lifecycle

1. Validate method and path against the route registry.
2. Require `accountSyncPayloadVersion: 1`.
3. Require mock authenticated context.
4. Validate a preview request body with guest/local snapshot evidence.
5. Run the disabled server persistence integration harness.
6. Return conflict plan, adapter preview, projected digest, current digest, and
   safety flags.
7. Mark `mutatedServerState: false`.

Preview is non-mutating. It may show a projected digest from the mock harness,
but it does not write runtime state or create a route.

## Apply Handler Lifecycle

1. Validate method and path against the route registry.
2. Require `accountSyncPayloadVersion: 1`.
3. Require mock authenticated context.
4. Require `idempotencyKey`.
5. Require explicit client confirmation that account sync will not grant paid
   entitlement.
6. Validate local snapshot evidence.
7. Check the mock idempotency ledger.
8. Run the disabled server persistence integration harness.
9. Reject blocked plans.
10. Return accepted/skipped/rejected/audit counts, digest, audit summaries, and
    safety flags.

The idempotency ledger is passed in and returned by value so tests can replay a
request without adding any runtime store.

## Digest Handler Lifecycle

1. Validate method and path.
2. Require mock authenticated context.
3. Read a digest from the provided in-memory mock server state.
4. Return digest metadata only.

Digest responses must not include saved word payloads, review state payloads,
review event payloads, full pack progress state, raw upgrade-interest records,
or sensitive account data.

## Audit Handler Lifecycle

1. Validate method and path.
2. Require mock authenticated context.
3. Read audit records from the provided in-memory mock server state.
4. Return bounded summaries only.

Audit summaries do not include raw guest snapshots, raw server payloads,
secrets, provider tokens, production data, or full sensitive state.

## Structured Error Model

Expected invalid requests return structured errors instead of throwing:

| Code | Meaning |
| --- | --- |
| `method_not_allowed` | Known route path used with an unsupported method. |
| `route_not_found` | Unknown route path or wrong mock handler boundary. |
| `auth_required_future_boundary` | Missing mock authenticated context. |
| `invalid_payload_version` | Missing or unsupported `accountSyncPayloadVersion`. |
| `missing_idempotency_key` | Apply request has no idempotency key. |
| `paid_entitlement_confirmation_required` | Apply request does not acknowledge that sync cannot grant paid entitlement. |
| `blocked_plan` | Apply request produced or supplied a blocked plan. |
| `invalid_request` | Malformed request body or conflicting mock metadata. |
| `idempotency_payload_conflict` | Reused apply idempotency key with a different payload. |

## Mock Auth Boundary

The harness requires `mock_authenticated` context so tests can prove handler
behavior behind a future owner-only boundary. It does not implement real auth,
sessions, provider validation, middleware, cookies, access tokens, or account
lookup.

Real auth remains a future implementation gate before any account state, digest,
or audit summaries are loaded from a backend.

## Idempotency Policy

Apply requires an idempotency key. The mock ledger records the request payload
fingerprint and the success or blocked-plan response. Reusing the same key with
the same payload replays the stored response. Reusing the same key with a
different payload returns `idempotency_payload_conflict`.

Review-event idempotency remains enforced lower in the server persistence
adapter, where duplicate review events cannot advance SRS twice.

## Fake Mastery Policy

Local `Mastered` labels or box 5 state are blocked unless supported by delayed
review-event evidence through the SRS reducer path. A fake-mastery plan returns
`blocked_plan`, does not create Mastered server state, and leaves the digest
unchanged.

## Paid Entitlement Safety Policy

Account sync never grants paid entitlement. Upgrade interest remains
attribution-only. Billing, checkout, subscriptions, invoices, billing portals,
payment SDKs, entitlement grants, and provider billing state remain outside the
harness and outside account sync.

## Why This Is Still Not An API Route

The harness exports plain TypeScript functions from a library folder. It does
not live under a framework route directory, does not export framework handler
entry points, does not accept framework request/response objects, does not add a
client, and is used only by contract tests.

This keeps the request/response behavior reviewable while avoiding premature
auth, database, network, deployment, or production-data coupling.

## Future Real Route Implementation Gates

Before real route implementation, require:

- explicit auth and ownership checks
- schema validation and payload limits
- rate limiting
- CSRF/session protection where applicable
- database transaction design
- durable idempotency storage
- audit logging review
- production data safety review
- entitlement and billing boundary review
- deployment and rollback plan

## Next Recommended PR

#58 Account sync route readiness audit or API route implementation gate
checklist, still no real backend.
