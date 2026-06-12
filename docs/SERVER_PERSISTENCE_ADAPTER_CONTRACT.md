# Server Persistence Adapter Contract

## Purpose

This contract defines how a future backend persistence layer should load account
learning state and apply accepted account sync conflict-resolution operations.
It follows PRs #49-#53 by turning the account persistence, server SRS sync,
guest migration, idempotency, and conflict-resolution contracts into a single
adapter boundary.

Current status: disabled, mock-only, and disconnected from runtime
routes/components.

## Non-Goals

- No real backend persistence.
- No auth provider, login behavior, account SDK, or token handling.
- No database, Supabase, Clerk, Auth.js, Firebase, payment, billing, checkout,
  subscription, invoice, or entitlement integration.
- No `fetch`, network calls, API routes, environment variables, secrets,
  Webflow, Cloudflare Workers, Vercel, DNS, deployment settings, production
  user data, or production pack data access.
- No runtime dashboard, save, review, settings, route, or component integration.
- No paid entitlement grants.

## Adapter Responsibilities

`VlxServerPersistenceAdapter` is defined in
`src/lib/account-persistence/server-adapter/adapter-contract.ts`.

The contract separates:

- State loading through `loadAccountSyncServerState(accountId)`.
- Preview through `previewApplyAccountSyncResolutionPlan(plan)`.
- Apply through `applyAccountSyncResolutionPlan(plan)`.
- Idempotent saved-word writes through `recordSavedWord(...)`.
- Idempotent review-event writes through `recordReviewEvent(...)`.
- Attribution-only upgrade interest through
  `recordUpgradeInterestAttribution(...)`.
- Audit-only records through `recordSyncAudit(...)`.
- Lightweight state summaries through `getAccountStateDigest(accountId)`.

The in-memory implementation stores data only in a caller-provided object and is
used only by tests.

## Preview vs Apply

Preview returns planned mutations, no-op duplicates, audit-only entries, and
blocked reasons without changing memory state.

Apply is transactional for the mock adapter. A blocked plan is rejected before
any state is changed. If an accepted operation is missing required evidence or
reuses an idempotency key with a different payload, the operation returns
explicit reason metadata and no partial plan state is committed.

## Source Of Truth

1. Review events are source-of-truth evidence.
2. Review state is recomputed through the SRS reducer when review-event evidence
   is accepted.
3. Saved words may create an initial `New` review item, but duplicate saves do
   not reset existing review state.
4. Pack progress must be derived from accepted review-event evidence.
5. Pack progress without event evidence remains audit-only.
6. Upgrade interest is attribution-only and separate from entitlement.

## Idempotency Policy

- Saved-word and review-event writes require an idempotency key.
- Replaying the same key with the same payload is a no-op duplicate.
- Replaying the same key with a different payload is rejected as
  `idempotency_payload_conflict`.
- Duplicate review events must not advance SRS twice.
- Queue or batch retries must not double-count `daily_stats` or
  `pack_progress`; both are updated only when new review-event evidence is
  accepted.

## Fake Mastery Policy

Local `review_state` labels are not trusted as mastery evidence.

`Mastered` cannot be imported from local labels alone. Mastery must come through
delayed review-event evidence and the SRS reducer path. Fake mastery plans are
blocked or audit-only and do not create server `Mastered` state.

## Paid Entitlement Safety

Upgrade interest is attribution-only. Billing, payment, checkout,
subscription, invoice, and entitlement state are outside this adapter.

The mock adapter always keeps entitlement as:

```ts
{
  paid: false,
  source: "not_in_server_persistence_adapter"
}
```

## Blocked Plans

Any plan with a blocked resolution is rejected before apply. Blocked plans leave
the in-memory store unchanged, including audit records. The adapter returns
explicit `blocked_plan` reason metadata with blocked resolution ids.

## Future Real Backend Path

A future backend implementation can replace the in-memory adapter behind the
same contract after separate design approval. That PR should add an integration
test harness first, then separately design API routes and persistence tables.
Real auth, database writes, billing, and runtime route integration must remain
separate approval gates.

## Next Recommended PR

#55 Server persistence adapter integration test harness or account sync API
route design doc, still disabled and without a real backend.
