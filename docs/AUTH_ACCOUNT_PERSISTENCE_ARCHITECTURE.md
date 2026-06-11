# Auth Account Persistence Architecture

Architecture date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document does
not implement auth, add an auth provider SDK, add login/signup behavior, create
database migrations, add billing, touch Webflow, touch Cloudflare Workers, use
secrets, mutate production data, or deploy.

## Goal

Define how Visual Lexicon Track B should move from browser-local learning state
to account-owned production persistence without weakening the core memory loop:

```txt
Save -> Review -> review_state/events -> Due/Weak/Mastered -> weekly reviewed words
```

Production v1 must let a learner keep saved words, review state, review events,
daily stats, pack progress, upgrade interest, and entitlement snapshots across
devices while keeping local-first review usable when connectivity is poor.

## Non-Goals

- Do not choose or install a real auth provider in this PR.
- Do not add login, signup, password reset, magic link, session refresh, or
  account settings runtime behavior.
- Do not add database credentials, live migrations, server routes, SDK clients,
  billing SDKs, checkout, payment links, webhooks, or entitlement enforcement.
- Do not claim production auth, server sync, cross-device progress, or paid
  launch readiness is complete.
- Do not change Track A, Webflow, Cloudflare production Workers, DNS,
  deployment settings, secrets, payment settings, or production user data.

## Current localStorage State Inventory

The local/private beta app uses browser storage as the source of truth. These
keys are useful migration contracts but are not production persistence.

| Key | Current purpose | Production mapping |
| --- | --- | --- |
| `vlx_saved_words_v1` | Record keyed by slug with saved word metadata and save source. | `saved_words` account rows. |
| `vlx_review_state_v1` | Record keyed by slug with box, mastery, correct/wrong counts, streak, weak score, and due dates. | `word_mastery` or `review_state` account rows. |
| `vlx_review_events_v1` | Append-style array of answer events with session, question, result, response time, and state after answer. | `review_events` append-only account rows. |
| `vlx_daily_stats_v1` | Record keyed by date with reviewed, correct, wrong, mastered, weak added, minutes, and sessions. | `daily_stats` account rows derived from review events or incrementally materialized. |
| `vlx_pack_progress_v1` | Record keyed by pack ID with preview start/completion and reviewed/correct counts. | `pack_progress` account rows. |
| `vlx_plan_state_v1` | Local-only entitlement preview state for guest/free/lite/pro UI placeholders. | `entitlement_snapshots` read model only after real billing architecture exists. |
| `vlx_upgrade_interest_v1` | Array of local upgrade interest records from pricing and paywall prompts. | `upgrade_interest` account or anonymous-attribution rows. |
| `vlx_pending_home_quiz` | Optional transition key for home quiz continuity. | Short-lived client queue only; do not make it an account source of truth without a separate contract. |

Related non-storage signals:

- `vlx_save_word`, `vlx_saved_library_view`, `vlx_word_memory_state_view`,
  `vlx_review_start`, `vlx_review_answer`, `vlx_review_complete`,
  `vlx_pack_preview_start`, `vlx_pack_preview_complete`,
  `vlx_pricing_interest`, `vlx_paywall_interest`, and
  `vlx_upgrade_click` describe app funnel behavior.
- `vlx_alias_search` records sanitized alias-search behavior.
- `vlx_extension_open_app`, `vlx_extension_save_click`,
  `vlx_extension_review_start`, and `vlx_extension_quiz_later_click` describe
  extension bridge behavior.

## Account Lifecycle

### Guest

- Can save and review locally.
- Uses the existing localStorage keys as the temporary local source of truth.
- Has no durable account ID and no production entitlement.
- May have an anonymous `guestDeviceId` or install ID for deduplication, but it
  must not be treated as a login identity.
- Must be told clearly that progress is local until an account exists.

### Free Account

- Has a durable `userId` and account-bound saved/review data.
- On first sign-in, can merge eligible guest local state into account state.
- Reads hydrated server state after login, then writes through the sync queue.
- May retain local cache for offline review, but the account record becomes the
  durable source of truth.
- Entitlements are free-tier only unless billing snapshots later say otherwise.

### Lite/Pro Account

- Has the same saved/review persistence model as Free.
- Adds account-bound entitlement snapshots after billing architecture is
  approved and implemented.
- Must not trust `vlx_plan_state_v1` as proof of a paid subscription.
- Must continue to preserve SRS truth: paid state can unlock surfaces, but it
  cannot fake due, weak, mastered, or pack completion state.

## Account Persistence Requirements

- Every persisted learning record must belong to a stable `userId`.
- Guest records must carry a local-only device/session identifier until merge.
- Account state must include `createdAt`, `updatedAt`, and enough source
  metadata to audit migrations and retries.
- Server writes must be idempotent so retries do not duplicate saves, events, or
  progress increments.
- Client cache must include sync status for queued, synced, rejected, and
  conflict-resolved records.
- Account deletion/export must cover saved words, review state, review events,
  daily stats, pack progress, upgrade interest, alias/extension events when
  account-linked, and entitlement snapshots.

## Saved Words Sync Requirements

- A saved word is unique per `userId + slug`.
- Saving the same slug again must update safe metadata such as `lastSavedAt`,
  `source`, or `sourceHistory`, not create duplicates.
- First save must create or preserve a matching review state item with box `0`,
  mastery `New`, zero recall counts, and weak score `0` unless the account
  already has stronger real review state.
- Unsaving should archive the saved-word row rather than delete review history.
- Re-saving an archived word should reactivate the saved row and preserve the
  prior review state unless product explicitly chooses a reset flow.

## Review State Sync Requirements

- The required state fields remain:

```ts
{
  slug: string;
  word: string;
  image?: string;
  hub?: string;
  box: number;
  mastery: "New" | "Learning" | "Weak" | "Strong" | "Mastered";
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: string;
}
```

- `Due`, `Weak`, and `Mastered` must derive from review state, not marketing
  copy or sample content.
- `Mastered` must require delayed recall and cannot be created by one fast local
  answer or migration alone.
- Server updates should be based on accepted review events whenever possible.
- Direct state patching is allowed only for migration, repair, or backfill paths
  with an audit reason.

## Review Events Sync Requirements

- Review events are append-only and unique by `userId + eventId` or
  `userId + idempotencyKey`.
- Every accepted answer creates one event shaped like the current contract:

```ts
{
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  questionType: string;
  selected?: string;
  answer: string;
  result: "correct" | "wrong";
  responseMs: number;
  createdAt: string;
  boxAfter: number;
  weakScoreAfter: number;
}
```

- Events should also retain `boxBefore`, `weakScoreBefore`, `usedHint`, and
  `confidence` when present because they explain SRS transitions.
- Retrying the same event must return the existing accepted result instead of
  reapplying the answer.
- Rejected events must keep enough error status locally for retry or support
  diagnosis without corrupting SRS state.

## Pack Progress Sync Requirements

- Pack progress is unique per `userId + packId`.
- `previewStartedAt`, `previewCompletedAt`, `lastReviewedAt`, `reviewedCount`,
  and `correctCount` must come from real pack or review actions.
- Pack completion cannot be inferred from page views alone.
- Review events with `packId` or `hub` should be the auditable source for
  reviewed/correct counts where possible.
- If pack content changes, account progress must remain tied to stable word
  slugs and pack version metadata.

## Upgrade Interest Capture Sync Requirements

- Upgrade interest is a lead/event record, not an entitlement.
- Records may be anonymous for guests and account-bound after sign-in.
- Key fields: `plan`, `source`, `trigger`, `pagePath`, `createdAt`, and a client
  idempotency key.
- Sync must deduplicate retries but allow repeated genuine interest events from
  different moments or prompts.
- Do not infer subscription, checkout, or paid access from interest records.

## Extension Save Source Sync Requirements

- Extension-origin saves should preserve `source: "extension"` on the saved
  word and record extension bridge events separately.
- Do not collect private page text, full browsing history, secrets, or page
  contents unless a later privacy-reviewed feature explicitly allows it.
- Store only the canonical word slug, normalized word, allowed source metadata,
  timestamp, and optional sanitized extension event type.
- Extension saves must use the same duplicate-save and review-state creation
  rules as app saves.

## Multilingual Alias Search Source Sync Requirements

- Alias search should resolve to canonical English slugs before saving.
- A save from alias search should preserve `source: "alias_search"` and may
  retain sanitized alias metadata such as input language, normalized query, and
  matched alias version when privacy-reviewed.
- Unknown aliases must not create fake saved words, fake review state, or fake
  pack progress.
- Alias search events are analytics/source events, not mastery evidence.

## Conflict Resolution Rules

- Review events are append-only; conflicts are handled by idempotency and event
  ordering, not destructive replacement.
- Saved words merge by `slug`; active wins over duplicate active records, while
  archived/deleted state requires explicit timestamp comparison.
- Review state should be recomputed from accepted review events when practical.
  If two materialized states conflict, choose the state with the newer accepted
  review event sequence, not simply the newest device timestamp.
- Higher mastery cannot overwrite newer wrong answers. A delayed wrong answer
  must be allowed to move a word back toward weak/learning state.
- Pack progress counters merge from accepted events or monotonic count deltas
  with idempotency keys.
- Upgrade interest and alias/extension events append with dedupe keys.

## Offline And Local-First Behavior

- Review must remain possible when the server is temporarily unavailable.
- Offline answers enter a durable local queue with idempotency keys.
- The UI can show local pending state, but should avoid promising cross-device
  sync until the queue is accepted by the server.
- On reconnect, queued writes sync in event order per account/device.
- Failed writes should keep retryable status and avoid applying duplicate SRS
  transitions.
- If account state cannot hydrate, the app should fall back to the last known
  local cache and clearly avoid claiming server sync freshness.

## Cross-Device Behavior

- After login, a new device hydrates server saved words, review state, daily
  stats, pack progress, and entitlement snapshots before showing account-owned
  memory metrics.
- Due and weak queues should use server state plus any accepted local pending
  writes on that device.
- If two devices review the same word offline, both events can be accepted if
  idempotency keys differ; materialized state must then be recomputed or
  advanced in deterministic event order.
- Device clock drift must not let a stale client push `nextDueAt` into the far
  future or falsely mark delayed recall complete.

## Privacy, Export, And Delete Requirements

- Export must include saved words, review state, review events, daily stats,
  pack progress, upgrade interest, alias/extension events tied to the account,
  and entitlement snapshots.
- Delete account must remove or anonymize account-linked learning and event
  data according to the published retention policy.
- Billing records, if later added, may need separate legal retention and should
  be covered by billing architecture.
- Extension and alias events must avoid unnecessary personal data by design.
- Support tooling must not expose secrets, full browsing history, private page
  text, or payment credentials.

## Production Risks

- Duplicate review event ingestion could over-advance SRS boxes.
- Stale offline state could overwrite newer account state.
- Device clock drift could corrupt due dates and delayed recall.
- Guest merge could duplicate saved words or lose weak-word history.
- Local entitlement preview state could be mistaken for real paid access.
- Account deletion/export could miss derived or analytics records.
- Extension or alias telemetry could collect more data than needed.
- UI copy could imply production sync before it is implemented.

## Implementation Plan

### P0

- Approve account persistence architecture, data model, and sync contract.
- Define guest-to-account merge rules and idempotency keys.
- Define account-bound saved word, review state, review event, daily stats, and
  pack progress contracts.
- Define privacy/export/delete requirements before implementation.
- Add contract tests and mocks before real provider integration.

### P1

- Implement server persistence behind a feature flag.
- Add account hydration and local queue sync with retry handling.
- Add cross-device save/review QA.
- Add deletion/export support path or documented manual operations.
- Add observability for sync failures, duplicate retries, and stale hydration.

### P2

- Add production support/admin views only after privacy review.
- Add deeper analytics for Weekly Reviewed Words and cohort retention.
- Add extension and alias attribution improvements with explicit minimization.
- Add entitlement integration after billing architecture and approval.
- Optimize sync performance after correctness is proven.
