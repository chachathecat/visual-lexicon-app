# Server SRS Sync Contract

Contract date: 2026-06-11

Scope: typed production v1 sync planning only. This document does not implement
network calls, API routes, real persistence, auth, database SDKs, billing,
checkout, deployment changes, secrets, or runtime behavior.

## Contract Goals

- Preserve the current local Save -> Review -> SRS loop.
- Make account-owned server state the durable source of truth after sign-in.
- Keep review events append-only and idempotent.
- Keep Due, Weak, and Mastered derived from review state.
- Define retry, stale-client, offline, guest, and validation behavior before
  implementation.

## Common Envelope

Every write request should use a sync envelope:

```ts
type SyncEnvelope<TPayload> = {
  clientMutationId: string;
  idempotencyKey: string;
  deviceId: string;
  userId?: string;
  localStorageKey?:
    | "vlx_saved_words_v1"
    | "vlx_review_state_v1"
    | "vlx_review_events_v1"
    | "vlx_daily_stats_v1"
    | "vlx_pack_progress_v1";
  operation:
    | "save_word"
    | "archive_word"
    | "submit_review_event"
    | "sync_pending_local_queue"
    | "upsert_pack_progress";
  payloadVersion: 1;
  clientCreatedAt: string;
  payload: TPayload;
};
```

Responses should use:

```ts
type SyncResponse<TData> =
  | {
      ok: true;
      data: TData;
      serverTime: string;
      syncCursor?: string;
      idempotencyKey?: string;
      duplicateOf?: string;
    }
  | {
      ok: false;
      error: SyncError;
      serverTime: string;
      idempotencyKey?: string;
    };
```

## Save Word

Request payload:

```ts
{
  savedWord: {
    slug: string;
    word: string;
    image?: string;
    definition?: string;
    hub?: string;
    source?: "word_page" | "hub_page" | "extension" | "alias_search" | "app" | "exam_pack" | "manual";
    savedAt: string;
  };
}
```

Response data:

```ts
{
  savedWord: ServerSavedWord;
  reviewState: ServerReviewStateItem;
  created: boolean;
  reactivated: boolean;
  duplicate: boolean;
}
```

Behavior:

- Upsert by `userId + slug`.
- Duplicate active saves return the existing saved word.
- First save creates or preserves review state.
- Duplicate save must not reset box, mastery, weak score, or recall counts.

## Archive / Unsave Word

Request payload:

```ts
{
  slug: string;
  archivedAt: string;
  reason?: "user_unsave" | "account_merge_conflict" | "support_repair";
}
```

Response data:

```ts
{
  savedWord: ServerSavedWord;
  archived: true;
  reviewStatePreserved: true;
}
```

Behavior:

- Archive by `userId + slug`.
- Do not delete review events or review state.
- Repeated archive requests are idempotent and return the archived row.

## Submit Review Event

Request payload:

```ts
{
  event: {
    eventId: string;
    sessionId: string;
    slug: string;
    word: string;
    hub?: string;
    questionType: string;
    selected?: string;
    answer: string;
    result: "correct" | "wrong";
    responseMs: number;
    usedHint?: boolean;
    confidence?: "knew" | "guessed" | "forgot";
    createdAt: string;
    boxBefore?: number;
    boxAfter?: number;
    weakScoreBefore?: number;
    weakScoreAfter?: number;
    packId?: string;
  };
}
```

Response data:

```ts
{
  event: ServerReviewEvent;
  reviewState: ServerReviewStateItem;
  dailyStats: ServerDailyStatsItem;
  packProgress?: ServerPackProgress;
  duplicate: boolean;
}
```

Behavior:

- Append one accepted event per unique event ID or idempotency key.
- Retry returns the original event and resulting state.
- Server reducer is authoritative for box, mastery, weak score, and next due.
- Invalid or rejected events must not advance review state.

## Sync Pending Local Queue

Request payload:

```ts
{
  batchId: string;
  baseSyncCursor?: string;
  items: PendingLocalQueueItem[];
}
```

Response data:

```ts
{
  batchId: string;
  accepted: SyncMutationResult[];
  rejected: SyncMutationResult[];
  retryable: SyncMutationResult[];
  hydrationRequired: boolean;
  syncCursor: string;
}
```

Behavior:

- Process items in deterministic account/device order.
- Each item is independently idempotent.
- A failed retryable item does not invalidate accepted earlier items.
- If the client cursor is stale, return `hydrationRequired: true`.

## Hydrate Account State

Request:

```ts
{
  userId: string;
  deviceId?: string;
  sinceCursor?: string;
  includeArchived?: boolean;
  includeEventsSince?: string;
}
```

Response data:

```ts
{
  userId: string;
  hydratedAt: string;
  syncCursor: string;
  savedWords: Record<string, ServerSavedWord>;
  reviewState: Record<string, ServerReviewStateItem>;
  reviewEvents?: ServerReviewEvent[];
  dailyStats: Record<string, ServerDailyStatsItem>;
  packProgress: Record<string, ServerPackProgress>;
}
```

Behavior:

- New devices hydrate before showing account-owned memory metrics.
- Existing devices keep unsynced local queue items and replay them after
  hydration if still valid.
- Hydration failure falls back to the last local cache without claiming fresh
  cross-device sync.

## Fetch Due Queue

Request:

```ts
{
  userId: string;
  dueBy?: string;
  limit?: number;
  includeArchived?: false;
}
```

Response data:

```ts
{
  dueBy: string;
  items: ServerReviewStateItem[];
}
```

Behavior:

- Select non-Mastered state with no `nextDueAt` or `nextDueAt <= dueBy`.
- Sort by due time, then weakness.
- Do not include saved-only words without review state.

## Fetch Weak Queue

Request:

```ts
{
  userId: string;
  limit?: number;
  includeArchived?: false;
}
```

Response data:

```ts
{
  items: ServerReviewStateItem[];
}
```

Behavior:

- Select from review state using mastery, weak score, and real wrong/correct
  counts.
- Do not use fake weak counts or static pack metadata.

## Fetch Mastered Words

Request:

```ts
{
  userId: string;
  limit?: number;
  cursor?: string;
}
```

Response data:

```ts
{
  items: ServerReviewStateItem[];
  nextCursor?: string;
}
```

Behavior:

- Include only `box === 5` and `mastery === "Mastered"`.
- Mastered state must trace to delayed recall or audited migration evidence.

## Fetch Pack Progress

Request:

```ts
{
  userId: string;
  packId?: string;
  includeArchived?: false;
}
```

Response data:

```ts
{
  items: Record<string, ServerPackProgress>;
}
```

Behavior:

- Return account-owned pack progress.
- Counts must come from accepted events or idempotent pack progress mutations.
- Page views alone are not completion.

## Idempotency Key Requirements

- Keys are required for every write.
- Keys must be stable across retry of the same local mutation.
- Keys must not be reused for different payloads.
- Server should store processed keys with operation, payload hash, result,
  server time, and sync cursor.
- Same key plus same payload returns the original result.
- Same key plus different payload returns an idempotency conflict error.

## Expected Error Shapes

```ts
type SyncError = {
  code:
    | "unauthenticated"
    | "forbidden"
    | "validation_error"
    | "idempotency_conflict"
    | "stale_client"
    | "conflict_requires_hydration"
    | "rate_limited"
    | "server_unavailable"
    | "unknown";
  message: string;
  retryable: boolean;
  status?: number;
  fieldErrors?: Record<string, string[]>;
  retryAfterMs?: number;
  serverNow?: string;
};
```

## Retry-Safe Behavior

- Retry accepted saves without creating duplicates.
- Retry accepted review events without applying SRS transitions twice.
- Retry accepted queue batches by returning per-item processed results.
- Retry pack progress without double-incrementing counters.
- Retry after network failure only with the same idempotency key.

## Stale-Client Behavior

- If `baseSyncCursor` is too old, return `stale_client` or
  `conflict_requires_hydration`.
- Do not accept materialized review state patches over newer server state.
- Require hydration before replaying old local mutations when the server cannot
  prove a safe merge.

## Server Unavailable Behavior

- Client keeps local review usable and queues mutations.
- UI may show pending local changes but must not claim cross-device freshness.
- Retry with backoff using the same idempotency keys.
- Do not drop the local queue on 5xx, timeout, DNS, or offline errors.

## No-Auth / Signed-Out Behavior

- Guests keep using localStorage keys and local review state.
- Signed-out clients do not write to server state.
- If a session expires, stop server writes, keep local queue items pending, and
  prompt sign-in through future auth behavior.
- Guest-to-account migration is explicit and idempotent after sign-in.

## Validation Rules

- `slug`, `word`, `eventId`, `sessionId`, `questionType`, `answer`, `result`,
  `responseMs`, and timestamps are required where applicable.
- `result` must be `correct` or `wrong`.
- `responseMs` must be finite and non-negative within an accepted maximum.
- `box` must be 0 through 5 when included as migration evidence.
- `weakScore` must be 0 through 1.
- `mastery` must be one of `New`, `Learning`, `Weak`, `Strong`, `Mastered`.
- Future client timestamps must be rejected or clamped by drift policy.
- Saved-word and review-event payloads must not include secrets, payment data,
  private page text, or full browsing history.
