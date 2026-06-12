# Account Sync Idempotency Storage Design

This folder contains a pure, mock-only design contract for future durable
account sync idempotency and persistence storage. It does not create storage,
tables, routes, handlers, middleware, provider clients, billing behavior, or
runtime integration.

## Files

- `idempotency-storage-design.ts` defines the account-scoped idempotency key,
  request fingerprint, idempotency record, replay/conflict decisions, storage
  group designs, transaction boundary, and apply commit plan/result shapes.
- `fixtures.ts` provides static contract fixtures for tests.

## Policy

Future apply requires an idempotency key scoped to the authenticated account
owner. The same owner, key, and request fingerprint replays the original
redacted outcome without applying review events again. The same owner and key
with a different fingerprint is rejected as a conflict. A key from another
account is never replayable.

## Storage Groups

The design names the future storage groups only:

- `account_sync_idempotency_records`
- `account_sync_audit_summaries`
- `account_review_events`
- `account_review_state`
- `account_daily_stats`
- `account_saved_words`
- `account_pack_progress`

Each group defines purpose, owner key, required fields, forbidden fields, write
behavior, read behavior, retention notes, and privacy notes.

## Safety

- Review events are committed exactly once.
- Replay never advances SRS again.
- Duplicate review events are no-op evidence for derived stores.
- Blocked plans are recorded without mutating learning state.
- Malformed payloads cannot create partial learning state.
- Pack progress without review event evidence remains audit-only.
- Fake local `Mastered` state cannot become server `Mastered` state.
- Paid entitlement and billing/payment state remain outside sync storage.

Final verdict: `design_only`, not implementation-ready.
