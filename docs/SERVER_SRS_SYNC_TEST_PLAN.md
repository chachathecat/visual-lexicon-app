# Server SRS Sync Test Plan

Plan date: 2026-06-11

Scope: production v1 server SRS sync planning only. This plan does not implement
real persistence, auth, database SDKs, billing, checkout, deployment changes,
secrets, production data mutation, or runtime behavior.

## Unit Test Plan

- Selector helpers:
  - Due excludes Mastered and future-due words.
  - Due includes words with no `nextDueAt`.
  - Weak derives from mastery, weak score, wrong count, and wrong/correct ratio.
  - Mastered requires both `box === 5` and mastery `Mastered`.
  - Sorting is deterministic for due, weak, and mastered lists.
- Future SRS reducer:
  - Correct fast answer advances appropriately.
  - Correct slow or guessed answer does not over-advance.
  - Wrong answer decreases box or returns to box 0.
  - Repeated mistakes increase weak score.
  - Mastered requires delayed recall.
- Contract validation:
  - Reject missing slug, word, event ID, answer, result, response time, and
    required timestamps.
  - Reject invalid box, weak score, mastery, result, and future timestamps
    outside drift tolerance.

## Integration Test Plan

For future real persistence behind an explicit feature flag:

- Save creates or reactivates a saved word and creates/preserves review state.
- Duplicate save retry returns the original saved row.
- Archive unsaves without deleting review events or review state.
- Submit review event appends once and advances materialized state once.
- Duplicate review event retry returns the original event and state.
- Daily stats derive from accepted events.
- Pack progress derives from accepted pack actions and review events.
- Rejected writes do not mutate materialized state.

## Playwright / Golden-Flow Test Plan

- Guest save -> review -> due/weak/mastered remains local when signed out.
- Sign in -> hydrate account state -> dashboard shows account due queue.
- Save on device A -> hydrate on device B -> saved word and review state appear.
- Review due word on device A -> device B hydration shows updated due/weak state.
- Wrong answer moves word toward Weak and returns sooner.
- Mastered appears only after delayed recall.
- Server unavailable during review queues the event and keeps local review usable.
- Reconnect sync resolves the pending queue without duplicate transitions.

## Migration Test Plan

- Guest saved words merge by slug.
- Guest review events import before materialized review state.
- Guest review state without events imports only as audited migration state.
- Guest daily stats import as rollup evidence and can be repaired from events.
- Guest pack progress imports without faking completion.
- Failed migration keeps local data and retryable metadata.
- Re-running the same migration batch is idempotent.

## Cross-Device Test Plan

- Two devices saving the same slug create one active saved word.
- Two devices reviewing the same word online produce ordered accepted events.
- Two devices reviewing offline produce separate events and deterministic
  materialized state after sync.
- Newer wrong answers are not overwritten by older strong local state.
- Archived state and re-save state resolve by server mutation sequence.
- Device clock drift cannot create delayed recall or push due dates far ahead.

## Idempotency Test Plan

- Same save key plus same payload returns original response.
- Same save key plus different payload returns idempotency conflict.
- Same review event key plus same payload does not duplicate event or counters.
- Same queue batch can be retried without duplicating accepted items.
- Pack progress counters do not double-increment after retry.
- Processed idempotency keys include operation, payload hash, result, and cursor.

## Offline Queue Test Plan

- Offline save, review, and pack progress mutations are queued with stable keys.
- Queue preserves operation order per account/device.
- Retryable server errors keep queue items pending.
- Validation errors mark queue items rejected without mutating account state.
- Hydration-required responses pause replay until account state is refreshed.
- Session expiry stops server writes and keeps local pending items.

## Due / Weak / Mastered Selector Test Plan

- Selectors accept server review state records and arrays.
- Due uses `nextDueAt` and excludes Mastered words.
- Weak uses real state fields, not saved-only records or fake dashboard counts.
- Mastered requires `box === 5` and mastery `Mastered`.
- Selector output stays stable when static pack metadata contains unrelated
  words.
- Selector output handles invalid dates conservatively.

## Privacy / Export / Delete Test Plan

- Export includes saved words, review events, review state, daily stats, pack
  progress, sync metadata, and account-linked source events.
- Delete removes or anonymizes account learning data according to policy.
- Archive/unsave is distinct from account deletion.
- Extension sync rejects full browsing history, private page text, secrets, and
  credentials.
- Alias sync stores only approved sanitized metadata.
- Support repair paths retain audit metadata.

## Launch Readiness Criteria

- Server SRS architecture, contract, and implementation are reviewed.
- Save and review writes are durable, idempotent, and account-owned.
- Due, Weak, and Mastered derive from real server state.
- Guest-to-account migration is tested and reversible through support repair.
- Cross-device conflicts are deterministic and tested.
- Offline queue behavior is tested under retry, rejection, stale cursor, and
  session expiry.
- Export/delete support path is documented and tested.
- Observability covers sync failures, duplicate retries, stale clients, and
  reducer errors.
- Required validation commands pass:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npm.cmd run test -- --workers=1`

Do not implement billing or paid launch before server-side saved/review SRS sync
is validated. The memory state must remain the moat and must not be faked by
local-only or frontend-only state.
