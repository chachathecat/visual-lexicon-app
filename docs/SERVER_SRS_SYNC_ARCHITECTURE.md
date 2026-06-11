# Server SRS Sync Architecture

Architecture date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document does
not implement real server persistence, auth, database writes, provider SDKs,
billing, checkout, Webflow changes, Cloudflare Worker changes, DNS changes,
deployment changes, secrets, production data mutation, or runtime behavior.

## Goal

Define the production v1 architecture for account-owned saved words, review
events, materialized review state, daily stats, pack progress, and local/offline
sync while preserving the current learning loop:

```txt
Save -> Review -> review_state/events -> Due/Weak/Mastered -> Weekly Reviewed Words
```

The server becomes the durable account source of truth after sign-in. The
browser can keep a local cache and offline queue, but it must not be treated as
production persistence once an account exists.

## Non-Goals

- Do not add a database SDK, database credentials, migrations, live API routes,
  auth provider, billing SDK, checkout, subscription, invoice, or entitlement
  runtime behavior in this architecture PR.
- Do not change current local runtime behavior.
- Do not touch Webflow, Cloudflare production Workers, DNS, deployment settings,
  secrets, production user data, real payment, or production pack data.
- Do not fake mastery, dashboard metrics, pack progress, streaks, or due/weak
  counts from frontend-only summaries.
- Do not make typed mocks or local queue contracts usable as production sync.

## Current Local SRS Loop Summary

The current app is a local/private beta learning MVP. Browser storage is the
source of truth:

| Local key | Current role |
| --- | --- |
| `vlx_saved_words_v1` | Saved words keyed by slug. |
| `vlx_review_state_v1` | Materialized SRS state keyed by slug. |
| `vlx_review_events_v1` | Append-style review answer events. |
| `vlx_daily_stats_v1` | Daily rollups for reviewed/correct/wrong/mastered/weak/session counts. |
| `vlx_pack_progress_v1` | Local pack preview and review counters. |

Saving creates or preserves review state. Review answers create events, update
box, mastery, weak score, due date, and daily stats. Due, Weak, and Mastered are
derived from `review_state`, not from static content or marketing counters.

## Server-Side Source Of Truth Proposal

Production v1 should use account-scoped server records:

- `saved_words`: one row per `userId + slug`, archive/reactivate instead of
  destructive unsave.
- `review_events`: append-only answer history, unique by event or idempotency
  key.
- `word_mastery` or `review_state`: materialized state derived from accepted
  review events and migration audit data.
- `daily_stats`: derived from accepted review events, optionally materialized
  for fast dashboard reads.
- `pack_progress`: pack-level progress derived from pack actions and accepted
  review events.
- `sync_mutations`: processed idempotency keys, client mutation IDs, queue
  status, conflict outcomes, and cursors.

The trusted SRS reducer should run server-side when real persistence is
implemented. Client-submitted `nextDueAt`, `boxAfter`, or `weakScoreAfter` can
be accepted only as migration evidence or diagnostics, not as unchecked
authority for future account state.

## Saved Words Sync Model

- A saved word is unique per `userId + slug`.
- First save creates an active saved-word row and creates a matching review
  state item with box `0`, mastery `New`, zero recall counts, and weak score `0`
  unless real account state already exists.
- Duplicate saves return the existing row and may update safe metadata:
  `lastSavedAt`, latest source, and source history.
- Unsave archives the saved row with `archivedAt`; it does not delete review
  events or memory state.
- Re-save clears `archivedAt` and preserves real review state.
- Extension and alias-search saves use the same slug dedupe path and preserve
  safe source metadata only.

## Review Events Append-Only Model

- Each submitted answer creates one accepted event or returns the previously
  accepted event for an idempotent retry.
- Event uniqueness should use `userId + eventId` and/or
  `userId + idempotencyKey`.
- Events retain the current required fields: session, slug, word, hub,
  question type, selected answer, correct answer, result, response time,
  created time, box after, and weak score after.
- Events should also keep `boxBefore`, `weakScoreBefore`, `usedHint`,
  `confidence`, `packId`, server sequence, and server receipt time when present.
- Events are immutable. Repairs should append correction metadata or repair
  events rather than silently rewrite history.
- Rejected events must not advance materialized state.

## Materialized Review State / Word Mastery Model

Materialized state is the fast read model for dashboard, review queues, word
detail memory state, and library filters. It should keep the current required
fields:

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

Production rows should add server metadata such as `userId`, `version`,
`lastEventId`, `serverUpdatedAt`, `materializedFrom`, `migrationBatchId`, and
`conflictResolvedAt` when relevant.

Mastered must require delayed recall. A migration or one fast answer cannot
mark a word as Mastered without a traceable delayed recall event.

## Daily Stats Derivation Model

Daily stats should be derived from accepted review events, grouped by account
timezone rules:

- `reviewed`: accepted review events for the day.
- `correct` and `wrong`: accepted event result counts.
- `mastered`: transitions from non-Mastered to Mastered.
- `weakAdded`: transitions from non-Weak to Weak.
- `minutes`: response-time sum converted to minutes.
- `sessions`: distinct session IDs with accepted events.

Materialized daily stats are allowed for performance, but event history is the
repair source if rollups drift.

## Pack Progress Sync Model

- Pack progress is unique per `userId + packId`.
- Preview start/completion timestamps come from real pack preview actions.
- Review counters come from accepted pack review events or idempotent pack
  progress mutations.
- Pack completion cannot be inferred from opening a page.
- If pack content changes, progress should retain pack version/build metadata
  and stable word slugs so learners do not lose real review history.

## Due / Weak / Mastered Selector Model

Selectors must run from materialized review state:

- Due: non-Mastered items with no `nextDueAt` or `nextDueAt` at/before the
  selected due boundary, sorted by due time then weakness.
- Weak: items with mastery `Weak`, high weak score, repeated wrong answers, or
  wrong answers at least matching correct answers after multiple reviews.
- Mastered: items with `box === 5` and mastery `Mastered`, sorted by recent
  update.

Selectors must not read static pack counts, saved-only records, pricing state,
or frontend summaries as mastery evidence.

## Idempotency And Retry Model

Every write mutation needs a client mutation ID and idempotency key:

- Save: `userId + slug + clientMutationId`.
- Archive/unsave: `userId + slug + clientMutationId`.
- Review event: `userId + eventId` or `userId + idempotencyKey`.
- Queue batch: `userId + batchId`.
- Pack progress: accepted review event IDs or `userId + packId + clientMutationId`.

Retries must return the original accepted server result. They must not duplicate
review events, increment counters twice, over-advance SRS boxes, or re-open an
archived word unless the original mutation did so.

## Offline Local Queue Model

The local app can continue to save and review while offline:

- Write each local mutation to a durable pending queue with operation,
  payload version, local storage key, idempotency key, device ID, created time,
  retry count, and status.
- Apply local optimistic state for review continuity, but label it pending when
  account freshness matters.
- On reconnect, submit queued mutations in deterministic order per account and
  device.
- Keep retryable failures pending with backoff.
- Mark validation failures rejected without corrupting account SRS state.
- Hydrate account state before replaying stale local mutations on a new session.

## Guest-To-Account Migration Model

Guest data remains local until sign-in. First merge should:

1. Create a migration batch ID for account, device, and time.
2. Import review events first with idempotency keys.
3. Import saved words by slug, preserving archive/reactivation rules.
4. Import review state only as audited materialized migration data when event
   history is incomplete and it does not fake delayed recall.
5. Import daily stats as rollup evidence, then prefer server derivation.
6. Import pack progress after event import.
7. Mark local queue items synced only after server acceptance.

Failed migration keeps local data and retry metadata. It must not partially
claim cross-device sync.

## Cross-Device Conflict Model

- Review events append. Different idempotency keys from different devices can
  both be accepted, then materialized state advances in trusted event order.
- Saved words merge by slug. Archive/reactivation uses server-validated
  timestamps and mutation sequence.
- Materialized review state conflicts resolve from accepted events when
  possible, not from the newest client `updatedAt`.
- Newer wrong answers can move a word back toward Weak or Learning; older strong
  state cannot overwrite later mistakes.
- Device clock drift is bounded. Server receipt order and server sequence are
  the authority for conflict repair.

## Privacy, Export, And Delete Implications

- Export must include saved words, review events, materialized review state,
  daily stats, pack progress, sync metadata, and account-linked extension/alias
  events.
- Delete account must remove or anonymize account-linked learning data according
  to the retention policy.
- Extension sync must not collect full browsing history, private page text,
  secrets, credentials, or payment data.
- Alias sync should store only sanitized query/source metadata if privacy
  reviewed.
- Support tooling must avoid exposing secrets or payment credentials.

## P0 / P1 / P2 Implementation Plan

### P0

- Approve server SRS architecture, typed contracts, and test plan.
- Keep current local runtime behavior unchanged.
- Add pure selector helpers and tests for due, weak, and mastered from supplied
  review state.
- Define idempotency keys, local queue payloads, hydration payloads, stale
  client behavior, and retry-safe responses.

### P1

- Implement real persistence behind an explicit feature flag after provider and
  auth choices are approved.
- Add server SRS reducer tests, mutation route tests, local queue tests, and
  guest migration tests.
- Add cross-device QA and observability for duplicate retries, stale clients,
  clock drift, and sync failures.
- Add account export/delete support path before public launch.

### P2

- Add admin/support repair workflows after privacy review.
- Optimize selector query indexes and hydration payload size.
- Add analytics reporting for Weekly Reviewed Words from accepted server review
  events.
- Integrate billing/entitlement only after the separate billing architecture is
  reviewed and approved.

## Risks And Rollback Strategy

Risks:

- Duplicate event ingestion could over-advance boxes or counters.
- Stale local state could overwrite newer account mistakes.
- Device clock drift could fake delayed recall.
- Guest migration could duplicate saves or lose weak-word history.
- Local-only plan state could be mistaken for entitlement.
- UI copy could imply server sync before implementation exists.

Rollback:

- Contract-only work can be reverted without data migration because it does not
  write production data.
- Future implementation should ship behind a server-sync feature flag.
- If sync fails in production, stop accepting new server writes, keep local
  review usable, preserve queued mutations, and repair materialized state from
  append-only events.

## Recommendation

Do not implement billing or paid launch before server-side saved/review SRS sync
is validated. The memory state must remain the moat and must not be faked by
local-only or frontend-only state.
