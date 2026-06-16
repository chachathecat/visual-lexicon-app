# Account Sync Preview Digest Mock

This module is a docs/contracts/tests-only preview and redacted digest mock for
future account sync planning. It does not implement real sync.

Allowed local state keys:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- `vlx_pack_progress_v1`
- `vlx_upgrade_interest_v1`

The module exports deterministic fixtures and pure helpers:

- `getAccountSyncPreviewDigestMock()`
- `buildAccountSyncPreviewPayload()`
- `buildAccountSyncDigest()`
- `redactAccountSyncPreviewPayload()`
- `getAccountSyncPreviewAllowedKeys()`
- `getAccountSyncPreviewBlockedFields()`
- `getAccountSyncPreviewP0Blockers()`
- `getAccountSyncPreviewNextPRSequence()`

Safety boundaries:

- Real account sync: Blocked
- Preview/digest mock: Allowed
- Apply/write operation: Blocked
- Public paid beta: No-Go
- Private paid beta: Conditional / Manual-only

This module must not read or write browser storage at runtime, call a network,
add route handlers, add middleware, integrate auth, integrate a database, add
payment SDKs, call AI, mutate entitlement, or touch production data.
