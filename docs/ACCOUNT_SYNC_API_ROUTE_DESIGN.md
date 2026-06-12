# Account Sync API Route Design

## Purpose

This document defines the future account sync API route boundary for Track B
without implementing any API route, route handler, auth integration, database
persistence, fetch client, or runtime wiring.

It follows the contracts from PRs #49-#55:

```txt
guest snapshot -> conflict resolver -> server persistence adapter preview -> apply -> digest/audit
```

The goal is to make the request/response surface testable before adding real
backend code.

## Non-Goals

This PR does not add real backend behavior. It does not add `app/api`,
`pages/api`, `route.ts`, handlers, middleware, auth wrappers, fetch clients,
runtime route/component integration, real auth, database persistence, Supabase,
Clerk, Auth.js, Firebase, provider SDKs, payment SDKs, checkout, billing,
subscriptions, entitlement grants, environment-variable reads, Webflow,
Cloudflare Workers, DNS, Vercel settings, deployment settings, secrets,
production data access, or `npm audit fix`.

## Route Inventory

| Method | Planned route | Mutating | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/account/sync/preview` | No | Accept a guest/local snapshot, load account server state after future auth, build a conflict-resolution plan, preview server persistence adapter application, and return safety flags plus digest. |
| `POST` | `/api/account/sync/apply` | Yes | Accept a previewed plan or a guest/local snapshot plus client confirmation, revalidate account identity after future auth, rebuild or verify the plan, reject blocked plans, and apply idempotently. |
| `GET` | `/api/account/sync/digest` | No | Return account state digest metadata for saved words, review events, review state, pack progress, upgrade interest attribution, and sync cursor. |
| `GET` | `/api/account/sync/audit` | No | Return latest owner-only sync audit summaries without raw sensitive payloads or production secrets. |

All four routes are design-only in this PR. No actual route file path is
allowed.

## Request And Response Contracts

The TypeScript contracts live in:

```txt
src/lib/account-persistence/api-route-design/route-contracts.ts
```

The design exports:

- `VlxAccountSyncPreviewRouteRequest`
- `VlxAccountSyncPreviewRouteResponse`
- `VlxAccountSyncApplyRouteRequest`
- `VlxAccountSyncApplyRouteResponse`
- `VlxAccountSyncDigestRouteResponse`
- `VlxAccountSyncAuditRouteResponse`
- `VlxAccountSyncRouteError`
- `VlxAccountSyncRouteMethod`
- `VlxAccountSyncRouteDefinition`
- `VlxAccountSyncRouteSafetyPolicy`

Preview and apply requests require
`accountSyncPayloadVersion: 1`. Apply requests also require an
`idempotencyKey` and explicit client confirmation that account sync will not
grant paid entitlement.

Apply responses must return:

- accepted count
- skipped count
- rejected count
- audit count
- account digest
- route safety policy
- idempotency key

Digest and audit responses must be owner-only after real auth. Digest returns
metadata only, not full sensitive state. Audit returns summaries only, not raw
guest snapshots, raw server payloads, secrets, or provider data.

## Preview Vs Apply Lifecycle

Preview is read-only and non-mutating.

Future preview sequence:

1. Validate request schema and payload size.
2. Verify auth/session ownership.
3. Load account server state.
4. Build a conflict-resolution plan from the guest snapshot.
5. Preview the plan through the server persistence adapter.
6. Return plan, preview, digest, safety flags, and blocked reasons.
7. Do not write account state.

Apply is mutating but must remain transaction-like.

Future apply sequence:

1. Validate request schema, payload size, CSRF/session protection, and
   idempotency key.
2. Revalidate auth/session ownership.
3. Rebuild or verify the previewed conflict-resolution plan.
4. Reject blocked plans.
5. Apply accepted mutations in a transaction-like boundary.
6. Recompute materialized learning state from accepted review-event evidence.
7. Record audit summaries.
8. Return accepted/skipped/rejected/audit counts and account digest.

## Source-Of-Truth Hierarchy

Review events remain the source-of-truth learning evidence.

The hierarchy is:

1. Review events.
2. Review state recomputed from review events.
3. Existing server review state when local review state lacks event evidence.
4. Weak local evidence when supported by review events.
5. Pack progress derived from review-event evidence.
6. Upgrade interest as attribution-only metadata.

Duplicate saves must not reset `review_state`. Duplicate review events must not
advance SRS twice.

## Idempotency Policy

The apply route requires an idempotency key. Reusing the same idempotency key
with the same payload must be safe. Reusing the same idempotency key with a
different payload must be rejected.

Review-event idempotency is especially strict because duplicate review events
would otherwise advance SRS twice, inflate daily stats, and distort weak/mastery
status.

## Fake Mastery Policy

Account sync must never import fake mastery. Local `Mastered` labels or box 5
state cannot become server mastery without delayed review-event evidence.

Blocked fake-mastery plans must not apply. Mastery must come from the SRS
reducer path and delayed recall evidence, not from client labels.

## Paid Entitlement Safety Policy

Account sync must never grant paid entitlement.

Upgrade interest remains attribution-only. Billing, payment, subscription,
checkout, invoices, billing portals, entitlement grants, and payment/provider
SDKs are outside these routes.

## Future Auth Boundary

Real implementation must add an explicit auth boundary before loading account
state or audit summaries. The future route owner must verify that the
authenticated account owns the requested sync state and audit records.

This PR does not add auth, auth SDKs, sessions, middleware, or provider code.

## Future Rate Limiting And Payload Validation

Real implementation must add:

- schema validation
- payload size limits
- rate limiting
- idempotency key validation
- CSRF/session protection where applicable
- structured route errors

Preview and apply must reject malformed snapshots before conflict resolution.
Audit and digest must return bounded responses.

## Audit Logging Policy

Apply should record audit summaries for skipped, rejected, audit-only, and
blocked decisions. Audit records must be owner-only and must not include raw
sensitive payloads, secrets, provider tokens, or production data.

Preview may return a non-mutating preview audit shape, but it must not write
server audit state.

## Why This Is Design-Only

The sync contracts now cover persistence mocks, conflict resolution, server
adapter behavior, idempotency, fake mastery blocking, and the disabled
integration harness. The next boundary is the route contract itself.

Keeping this PR design-only prevents accidental auth, database, payment,
network, route handler, or production behavior from entering before the route
surface is reviewed.

## Next Recommended PR

#57 Account sync API handler test harness, still disabled/mock-only and no real
backend.
