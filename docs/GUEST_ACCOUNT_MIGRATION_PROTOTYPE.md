# Guest Account Migration Prototype

Date: 2026-06-11

## Purpose

Prototype the ordering, conflict detection, and in-memory migration mechanics for moving
guest local state into an account-owned structure without changing runtime behavior.

- Confirm ordered operations for migration planning.
- Confirm idempotent application through spike service APIs.
- Confirm conflicts and skips are explicit.
- Confirm no fake mastery, paid entitlement, or production persistence.

## Scope

- In-memory only.
- No production storage writes.
- No real auth implementation.
- No provider SDKs.
- No network requests.
- No route or component integration by default.
- No database, payment, or entitlement side effects.

## Files Added

- `src/lib/account-persistence/migration-prototype/README.md`
- `src/lib/account-persistence/migration-prototype/migration-plan.ts`
- `src/lib/account-persistence/migration-prototype/migration-runner.ts`
- `src/lib/account-persistence/migration-prototype/conflicts.ts`
- `src/lib/account-persistence/migration-prototype/fixtures.ts`
- `tests/guest-account-migration-prototype.spec.ts`

## Relationship to #49 and #50

- Uses `#49` account persistence contracts (`VlxAccountProfile`, snapshot
  contracts, merge-related payload shapes) for typed plans and fixture inputs.
- Uses `#50` server SRS spike (`createInMemoryServerSrsSyncService`) for
  in-memory save and review-event behavior, including idempotency and reviewed-state
  derivation.

## Migration Ordering

The plan always emits operations in this order:

1. review events
2. saved words
3. review state (audit evidence only)
4. daily stats
5. pack progress
6. upgrade interest

No operation mutates runtime stores directly.

## What is Validated

- Duplicate review events are idempotent in run result.
- Saved words create review state through spike `saveWord`.
- Weakness and box updates are preserved from migrated review-event evidence.
- Fake mastery does not get promoted in-memory without evidence.
- Pack progress without events is explicitly skipped or flagged.
- Upgrade interest import never grants entitlement.

## What is Not Validated

- Not connected to runtime routes/components.
- No migration job scheduler, background worker, or webhook.
- No persistence to localStorage, database, or external API.
- No auth token handling or entitlement upgrade flow.

## Conflict Handling

- Duplicate saved word and duplicate review event are preview-only conflicts.
- Stale review state and fake mastery risk are marked.
- Pack progress without event evidence is skipped/flagged.
- Upgrade-interest-only snapshots are recorded as attribution evidence only.
- Unsupported payloads are categorized as blockers.

## No-Go Conditions

- Any code path that grants paid entitlement.
- Any code path that reads/writes production data.
- Any code path that performs network I/O.
- Any code path that writes master state from one-event evidence.

## Future Path to Real Auth/Backend Migration

- Keep this prototype plan/runner shape as the contract layer.
- Replace spike service calls with authenticated backend migration endpoints.
- Add persisted conflict resolution and resumable jobs.
- Add migration audits and admin override tooling.
- Add reconciliation between local and server states.

## Next PR Recommendation

- Recommended next PR: `#52 Server-side review event idempotency tests`
