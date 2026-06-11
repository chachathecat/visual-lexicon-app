# Auth Sync Contract

Contract date: 2026-06-11

Scope: production v1 sync architecture only. This document does not implement
sync, auth, database writes, provider SDKs, billing, deployment, secrets, or
runtime behavior.

## Contract Goals

- Preserve the current local Save -> Review -> SRS loop while making account
  persistence the durable source of truth after sign-in.
- Make local-to-server writes idempotent and safe under retries.
- Keep review events append-only and review state derived from accepted events.
- Define guest merge, cross-device hydration, conflict handling, deletion, and
  offline fallback before implementation.

## localStorage -> Server Sync Direction

Local stores map into server records as follows:

| Local key | Server target | Direction |
| --- | --- | --- |
| `vlx_saved_words_v1` | `saved_words` | Upsert by `userId + slug`; archive state handled separately. |
| `vlx_review_state_v1` | `word_mastery` or `review_state` | Import as materialized state only after event import or with migration audit metadata. |
| `vlx_review_events_v1` | `review_events` | Append with idempotency; accepted events advance materialized state. |
| `vlx_daily_stats_v1` | `daily_stats` | Import as rollup, then prefer server derivation from events. |
| `vlx_pack_progress_v1` | `pack_progress` | Upsert by `userId + packId`; prefer event-derived counters. |
| `vlx_upgrade_interest_v1` | `upgrade_interest` | Append/dedupe; never creates entitlement. |
| `vlx_plan_state_v1` | none for paid proof | Do not migrate as paid entitlement. It can be recorded only as local-preview metadata if needed. |

Each local mutation should be wrapped in a sync envelope:

```ts
{
  clientMutationId: string;
  idempotencyKey: string;
  deviceId: string;
  userId?: string;
  localStorageKey: string;
  operation: "upsert" | "append" | "archive" | "delete_request";
  clientCreatedAt: string;
  payloadVersion: number;
  payload: unknown;
}
```

## Server -> Client Hydration Direction

- On sign-in, hydrate account-owned saved words, review state, daily stats, pack
  progress, and entitlement snapshots before presenting account metrics.
- Hydration should include server `updatedAt`, `syncCursor`, and enough version
  metadata to resume incremental sync.
- Local pending writes created before hydration must not be discarded. They
  should merge against the hydrated account state using the conflict rules
  below.
- A new device with no local state should hydrate entirely from server state.
- A stale device should hydrate server state, then replay only unsynced local
  mutations with unique idempotency keys.

## Guest Pending State Merge

- Guest local state remains local until the learner signs in or creates an
  account.
- At first account merge, create a migration batch ID tied to account, device,
  and timestamp.
- Import review events first, saved words second, review state third, daily
  stats fourth, pack progress fifth, and upgrade interest last.
- If local review state has no matching events, import it as migration state
  only if it does not fake delayed recall or overwrite newer server state.
- After successful merge, mark the local batch as synced. Do not delete local
  cache immediately unless the user explicitly clears local data.
- If merge fails, keep local state and retryable metadata. Do not half-claim
  cross-device progress.

## Logged-In Conflict Handling

- Server state wins for already-synced records.
- Unsynced local records can be accepted if their idempotency key has not been
  processed and they pass validation.
- Review state conflicts resolve by accepted event order, not by blindly taking
  the latest client payload.
- Saved word conflicts resolve by `slug` and archive/reactivation timestamps.
- Pack progress conflicts resolve by event-derived counts or idempotent
  monotonic increments.
- Upgrade interest, alias search events, and extension events append with
  dedupe rather than overwrite.

## Duplicate Save Handling

- Duplicate active saves for the same `userId + slug` must return the existing
  saved word row.
- Safe metadata can update: `lastSavedAt`, latest `source`, and source history.
- Duplicate save must not reset review state, clear weak score, or mark mastery
  as new if the learner already has real review history.
- A re-save after archive reactivates the saved word while preserving review
  history unless product defines an explicit reset action.

## Idempotency Keys

Required idempotency boundaries:

- Save mutation: `userId + slug + clientMutationId`.
- Review event: `userId + eventId` and/or `userId + idempotencyKey`.
- Daily stat increment: derive from accepted review event IDs when possible.
- Pack progress increment: derive from accepted review event IDs or use
  `userId + packId + clientMutationId`.
- Upgrade interest: `userId/anonymousId + idempotencyKey`.
- Alias/extension event: `userId/anonymousId + idempotencyKey`.

Idempotent replay must return the originally accepted server result. It must
not reapply SRS transitions or increment counters again.

## Timestamp Precedence Rules

- Server `receivedAt` and server sequence/cursor order determine ingestion
  order.
- Client `createdAt` describes learner action time and can be used for display,
  daily grouping, and SRS intervals only within allowed drift tolerance.
- `lastReviewedAt` should come from accepted review action time after drift
  checks.
- `nextDueAt` should be computed by the trusted SRS reducer, not accepted as a
  client authority when syncing review answers.
- `updatedAt` on materialized rows should reflect server write time.

## Device Clock Drift Considerations

- Reject or clamp client timestamps that are far in the future.
- Preserve server ingestion order for event sequencing when device clocks
  disagree.
- Daily stats should use account timezone rules and server-side normalization.
- Delayed recall and `Mastered` transitions should use trusted elapsed time
  checks. A client clock jump cannot create mastery.
- Store drift diagnostics for support if a device repeatedly submits impossible
  timestamps.

## Deleted Or Archived Saved Words

- Unsave should set `archivedAt` on `saved_words`; it should not delete review
  events or review state.
- Archived words can still appear in history/export, but not as active saved
  library items unless product chooses a separate history view.
- Delete account is different from unsave. Account deletion should remove or
  anonymize account-linked rows according to retention policy.
- Re-saving an archived word clears `archivedAt`, updates source metadata, and
  keeps real memory state.

## Review Event Append-Only Behavior

- Accepted review events are immutable except for administrative correction
  metadata.
- Corrections should append a repair event or mark an event superseded with an
  audit reason; do not silently mutate answer history.
- Duplicate retries return the existing event.
- Failed validation leaves the local event in a rejected or retryable state and
  must not advance server SRS.

## `word_mastery` / `review_state` Derived-State Behavior

- Materialized state should be advanced by a trusted SRS reducer that consumes
  accepted review events.
- Direct materialized imports are allowed for migration only and should keep
  `migrationSource`, `migrationBatchId`, and `lastEventId` when available.
- Due, Weak, and Mastered selectors read from materialized state that can be
  traced back to events or migration audit.
- If derived state and event history disagree, event history is the repair
  source unless an explicit support correction says otherwise.

## Safe Fallback When Server Is Unavailable

- Keep local review usable with a pending sync queue.
- Show local pending state rather than claiming cross-device freshness.
- Queue save, review, pack progress, and interest writes with idempotency keys.
- Retry with backoff and avoid duplicate application after reconnect.
- If hydration fails, use the last successful local cache and record sync error
  status.
- If the account is signed out or session refresh fails, stop server writes and
  keep local-only changes pending until the learner signs in again.

## Minimum Test Matrix For Implementation

- Guest save/review then account merge.
- Duplicate save retry.
- Duplicate review answer retry.
- Two-device offline review of the same word.
- Stale local review state versus newer server wrong answer.
- Archived saved word reactivation.
- Clock drift with future timestamps.
- Server unavailable during review.
- Hydration failure with existing local cache.
- Upgrade interest sync without entitlement creation.
