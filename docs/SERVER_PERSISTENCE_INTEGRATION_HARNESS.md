# Server Persistence Integration Harness

## Purpose

The server persistence integration harness proves that the planned account sync
pipeline composes end to end without real backend persistence:

```txt
guest snapshot -> conflict resolver -> server persistence adapter preview -> apply -> state digest/audit
```

It is a disabled, mock-only TypeScript harness used by tests. It connects the
contracts added in PRs #49-#54 so future backend work can start from proven
sync behavior instead of isolated contract tests.

## Non-Goals

This harness does not add runtime product behavior. It does not add API routes,
real auth, database persistence, provider SDKs, payment SDKs, network calls,
`fetch`, environment-variable reads, localStorage reads, route/component
integration, Webflow changes, Cloudflare Worker changes, Vercel or DNS changes,
deployment changes, billing, checkout, subscriptions, secrets, production data
access, or paid entitlement grants.

## Full Mock Sync Pipeline

The harness accepts:

- A typed guest/local snapshot.
- An optional typed in-memory server state.
- A deterministic account id and timestamp for tests.

It then:

1. Creates the disabled in-memory server persistence adapter.
2. Reads the before digest from the adapter.
3. Loads typed account sync server state from the adapter.
4. Builds a conflict-resolution plan with the account sync conflict resolver.
5. Previews the plan through the server persistence adapter.
6. Applies the plan only when the plan is not blocked and preview safety allows
   apply.
7. Reads the after digest and returns counts, safety flags, and cloned mock
   server state for assertions.

## Preview/Apply Lifecycle

Preview is always non-mutating. The preview result classifies planned
resolutions as accepted, audit-only, no-op duplicate, or rejected.

Apply is attempted only when:

- The plan status is not `blocked`.
- The preview says `canApply: true`.
- Contract safety flags remain false for runtime storage mutation, network,
  localStorage, `process.env`, auth SDK, database SDK, payment SDK, and paid
  entitlement.

Blocked plans return a skipped apply result from the harness and leave server
state unchanged.

## Source-of-Truth Hierarchy

1. Review events are the strongest learning evidence.
2. Review state is recomputed from accepted review-event evidence.
3. Existing server review state is preserved when local review state has no
   supporting event evidence.
4. Weak local evidence is preserved even when it conflicts with stronger-looking
   stale state.
5. Pack progress is derived from review events, not imported from unsupported
   counters alone.
6. Upgrade interest is attribution-only.

## Idempotency Policy

Review-event and saved-word writes use idempotency keys through the mock server
persistence adapter. Re-running the same harness input must not duplicate saved
words, review events, daily stats, or pack progress. A reused idempotency key
with a different payload is blocked or rejected and leaves server state
unchanged.

## Fake Mastery Policy

Local `Mastered` labels or box 5 state are not imported from `review_state`
alone. Mastery requires delayed review-event evidence through the SRS reducer
path. Fake mastery risk produces a blocked plan and does not create a Mastered
server state.

## Paid Entitlement Safety Policy

Upgrade interest can be recorded only as attribution. It never grants paid
entitlement, never touches billing, and never creates checkout, subscription,
invoice, or billing portal behavior. The mock adapter entitlement remains:

```txt
paid: false
source: not_in_server_persistence_adapter
```

## Blocked-Plan Behavior

The harness previews blocked plans but does not apply them. The before and after
digests remain equal, and the cloned in-memory server state remains unchanged.
This keeps conflict detection visible without creating partial writes.

## Why This Comes Before API Routes

API routes should not be introduced until the sync policy is proven in a pure
contract environment. This harness verifies idempotency, event-derived SRS
state, fake mastery blocking, audit-only pack progress, and entitlement safety
before any request handling, auth boundary, database write, or provider SDK is
added.

## Future Real Backend Path

The future backend path should keep the same lifecycle:

1. Load authenticated account state.
2. Resolve conflicts from a typed guest snapshot.
3. Preview the plan.
4. Apply only safe accepted mutations in a transaction.
5. Write review events as source-of-truth evidence.
6. Recompute review state, daily stats, and pack progress from event evidence.
7. Record audit-only decisions.
8. Return a deterministic digest.

The real backend implementation must add auth, persistence, environment, and
deployment safety reviews before any production connection.

## Next Recommended PR

#56 Account sync API route design document, still no implementation and no real
backend.
