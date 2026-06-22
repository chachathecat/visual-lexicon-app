# Track B Review Reliability Gate

## Baseline Findings

Audited on 2026-06-22 before production code changes.

### Current Answer Path

1. `ReviewSessionView` builds a session from route words or local `saved`, `due`,
   and `weak` candidates.
2. The current card renders with answer choices.
3. `handleSelect` records one pending selection with `selected`, `result`,
   `responseMs`, and `selectedAt`.
4. `handleConfidence` calls `applyReviewAnswer`.
5. `applyReviewAnswer` reads `vlx_review_state_v1`, `vlx_review_events_v1`, and
   `vlx_daily_stats_v1`.
6. The pure SRS engine computes the next state, review event, and daily stats.
7. Storage writes happen in sequence: review state, review event append, daily
   stats.
8. The UI sets feedback, appends an in-memory session answer, updates the live
   region, and focuses the next action.
9. `handleNext` advances to the next card or builds the summary from in-memory
   answers plus persisted review state.
10. Summary renders after the final committed in-memory answer.

### Duplicate Guards

- Answer options are disabled only after `currentAnswer` exists.
- Confidence submission uses `answerSubmissionLocked.current`, so rapid repeated
  confidence clicks in the same mounted component are mostly blocked.
- Next-card submission uses `nextActionLocked.current`, so repeated next clicks
  are mostly blocked.
- There is no durable idempotency check in storage. The lock refs do not survive
  refresh or remount.

### Event Idempotency

- `eventId` exists on `VlxReviewEvent` and can be supplied on
  `VlxReviewAnswerInput`.
- The stored answer path does not check whether an `eventId` already exists.
- Applying the same `eventId` twice can update `review_state` twice, append two
  events, and increment `daily_stats` twice.
- `appendReviewEvent` always appends and can store duplicate `eventId` values.
- A duplicate `eventId` with conflicting slug, result, or payload is not
  rejected.

### Local Storage Failure Model

- Malformed JSON is treated as missing data by `readJson`; the route generally
  does not crash, but that store appears empty to downstream logic.
- If `review_state` write fails, no later write happens, and the UI currently has
  no recoverable error path.
- If `review_events` write fails after `review_state` succeeds, memory state can
  be advanced without a durable event.
- If `daily_stats` write fails after state and event succeed, the event and
  memory state can be committed without stats.
- There is no rollback across the three stores, so failed writes can leave
  partially updated state.
- Empty catch blocks in read parsing hide malformed JSON, but write failures are
  not caught in the stored answer path.

### Reload And Navigation

- Reload before answer starts a new safe session from persisted state.
- Reload after answer selection but before confidence loses the uncommitted
  pending selection. The app does not claim session resume.
- Reload after confidence submission sees persisted state/events and starts a new
  route session. Without storage idempotency, replaying the same event payload
  from another caller would duplicate it.
- Reload during feedback does not re-run `handleConfidence`, but the in-memory
  session answer and summary progress are lost.
- Reload before summary starts a fresh safe session from persisted state. The app
  does not restore the completed in-memory session.
- Browser back/forward remounts or restores the page but has no explicit replay
  hook. The remaining risk is duplicate input while mounted or duplicate storage
  calls with the same event identity.

### Session And Summary Integrity

- Local mixed, saved, due, weak, and weak-sprint candidates are deduped by slug.
- Route-provided `word` and `hub` sessions are not deduped in
  `startSession`; duplicated pack candidates could create duplicate cards.
- Summary `reviewed` is based on the in-memory `answers.length`; currently this
  can include only answers that reached UI feedback, but it is not independently
  tied to committed events.
- Summary `correct + wrong` equals reviewed because it is derived from the same
  in-memory `answers` array.
- `dailyStats.sessions` is counted by checking whether a prior event exists for
  the same session/date. This is correct for ordinary sequential answers, but a
  duplicate `eventId` can still inflate stats if applied again after the first
  event exists.

### Edge Cases

- Zero cards render honest empty states.
- One-card sessions can complete and show summary.
- Repeated local slugs are deduped; route session duplicate slugs need hardening.
- Corrupted JSON does not crash the route, but the corrupted store is treated as
  empty.
- Missing images fall back through existing visual helpers.
- Exact `nextDueAt` equality is treated as due because comparisons use `<=`.

## Failure Model

- Review answer persistence is treated as one logical commit across
  `vlx_review_state_v1`, `vlx_review_events_v1`, and `vlx_daily_stats_v1`.
- The three-store localStorage commit is best-effort atomic within one mounted
  browser tab: the app snapshots raw values before writing and attempts to
  restore those exact raw values if one write fails.
- Simultaneous writes from multiple browser tabs are not fully serialized in
  this PR. There is no cross-tab lock, no compare-and-swap storage primitive,
  and no new localStorage key.
- Account-backed transactional persistence is required later for cross-device
  and concurrent-tab guarantees.
- Read-only route rendering remains tolerant of malformed storage and shows safe
  empty states instead of crashing.
- Answer commits parse the three review stores strictly before writing. If a
  store is malformed or has the wrong top-level shape, the answer is not saved
  and the raw value is preserved.
- If `localStorage` is unavailable, the answer fails before feedback and before
  the card advances.
- If any of the three writes throws, the previous raw values for all three stores
  are restored.
- If rollback cannot restore one or more raw values, the UI receives a fatal
  local-storage error, does not claim the memory state was saved, and requires
  user intervention because local storage may be inconsistent.

## Idempotency Behavior

- `eventId` is the idempotency key when supplied to `applyReviewAnswer`.
- A repeated `eventId` with the same answer payload is a no-op at storage level:
  review state, events, daily stats, and sessions are not incremented again.
- A repeated `eventId` with a conflicting slug, selected answer, result,
  question type, confidence, response time, timestamp, or other event payload
  fails safely with a storage error.
- `appendReviewEvent` also refuses to append a duplicate `eventId`; identical
  events are returned unchanged, and conflicting events throw.
- Inputs without `eventId` retain compatible behavior and still create a fresh
  generated event through the existing SRS engine path.

## Atomic Commit And Rollback Behavior

- The SRS result is computed once after strict parsing and idempotency checks.
- The previous raw values of the three approved review stores are snapshotted
  before writing.
- The commit writes the next review state, next review events, and next daily
  stats in sequence.
- On any write failure, all three raw values are restored exactly, including
  unrelated words, events, and daily-stat dates.
- A retry after a restored rollback reuses the same UI-held `eventId` and commits
  exactly one event.
- Malformed data is not repaired implicitly in this PR because doing so could
  wipe valid user data hidden behind a corrupt store. The app preserves the raw
  malformed value and asks the user to retry only after storage is safe.

## UI Retry Behavior

- Each card receives a stable pending `eventId` when the learner selects an
  answer.
- Once an answer is selected, answer choices are disabled for that card. The app
  no longer allows switching answers before confidence.
- Once confidence is submitted, confidence controls are locked for that card and
  persistence runs with the selected answer plus selected confidence.
- Feedback, "Memory state updated" live text, analytics answer events, and next
  card navigation happen only after `applyReviewAnswer` succeeds.
- On persistence failure, the learner stays on the same card. The selected answer
  and confidence are retained, a `role="alert"` message is shown, and `Retry
  save` reuses the same `eventId`.
- Successful retry creates exactly one persisted event and advances normally.
- Browser refresh, back, and forward navigation do not replay committed events.
  The app restarts safely from persisted state and does not promise session
  resume for uncommitted in-progress work.
- Uncommitted session resume is not implemented. If a learner reloads after
  selecting an answer but before a successful commit, the pending in-memory
  selection is lost and no success state is claimed.

## Route-by-route Gate

- `/` - PASS, unchanged by this PR.
- `/dashboard` - PASS, existing dashboard links and local review state readers
  remain unchanged.
- `/save` - PASS, save confirmation still creates one saved-word record and one
  review-state item for the slug, then preserves those raw records on duplicate
  loads.
- `/saved` - PASS, unchanged by this PR.
- `/review` - PASS, mixed route still builds from real saved, due, and weak
  candidates and dedupes session slugs.
- `/review/due` - PASS, due route still selects only due memory-state items.
- `/review/weak` - PASS, weak route still selects weak evidence from memory
  state.
- `/review/weak-sprint` - PASS, weak sprint remains capped at existing product
  limits.
- `/packs` - PASS, unchanged by this PR.
- `/packs/[packId]` - PASS, unchanged by this PR.
- `/word/[slug]` - PASS, unchanged by this PR.
- `/pricing` - PASS, unchanged by this PR.
- `/settings` - BLOCKED from manual verification in this PR because the focused
  automated gate does not exercise that route. No settings files were changed.

## Deterministic Automated Checks

- Storage idempotency: same `eventId` applies once, conflicting duplicate fails,
  and no-eventId behavior remains compatible.
- Atomic rollback: forced failures for `review_state`, `review_events`, and
  `daily_stats` restore all three stores.
- Rollback accuracy: tests cover keys that existed before the failed commit and
  keys that were absent before the failed commit; absent keys are removed again
  instead of replaced with empty objects or arrays.
- Fatal rollback handling: tests force rollback `removeItem` and rollback
  `setItem` failures and require a fatal error rather than a recovery claim.
- Retry: a failed write followed by retry commits exactly one event.
- Stable event identity: browser retry instrumentation proves the failed
  attempted write and the successful retry use the same UI-held `eventId`.
- Input hardening: rapid answer double click, repeated confidence submission,
  repeated next action, Enter/Space/click activation, and keyboard-plus-pointer
  activation create or advance once.
- Navigation: refresh, back, and forward after a committed answer do not
  duplicate events.
- Summary integrity: one-card and five-card summaries match committed session
  events; failed and duplicate answers are excluded.
- Queue integrity: duplicate slugs are removed, corrupted storage does not crash
  the route, empty queues stay honest, missing images fall back, and exact
  `nextDueAt` boundary is due.
- Route coverage: mixed, saved, due, weak, weak-sprint, word, and hub review
  modes still render.
- Accessibility and visual gates: live region behavior remains in place, and the
  existing Figma parity screenshot gate remains wired.
- Focused local result: `npm.cmd run test -- tests/track-b-review-reliability.spec.ts --workers=1`
  passed with 39 tests on 2026-06-22.

## Remaining Manual Checks

- Manual browser QA should still verify a real learner flow across Save ->
  Review -> Summary -> Dashboard using the production-like browser profile.
- Manual QA should verify storage quota or browser privacy modes if available;
  automated tests simulate thrown `setItem` but do not exhaust real quota.
- Manual QA should verify the fatal rollback copy by forcing rollback restore
  failure in a controlled browser session.
- Manual QA should rerun Figma parity screenshots before merge and review any
  visual diff instead of updating baselines blindly.
- Manual QA should confirm `/settings` if that route is present in the target
  branch because this PR did not touch or exercise it.

## Validation Results

Local validation on 2026-06-22:

- PASS `npm.cmd run typecheck`
- PASS `npm.cmd run lint`
- PASS `npm.cmd run build`
- PASS `npm.cmd run test -- --workers=1` - 813 tests
- PASS `npm.cmd run test -- tests/review-state-regression.spec.ts --workers=1` - 5 tests
- PASS `npm.cmd run test -- tests/review-mode-routes.spec.ts --workers=1` - 26 tests
- PASS `npm.cmd run test -- tests/track-b-review-reliability.spec.ts --workers=1` - 39 tests
- PASS `npm.cmd run test -- tests/track-b-accessibility-release-gate.spec.ts --workers=1` - 15 tests
- PASS `npm.cmd run test -- tests/track-b-performance-budget.spec.ts --workers=1` - 7 tests
- PASS `npm.cmd run test -- tests/figma-parity-screenshots.spec.ts --workers=1` - 14 tests
- PASS `git diff --check`
- PASS `git diff -- package.json package-lock.json next-env.d.ts tsconfig.json`

## Known Limitations

- The app restarts safely after refresh but does not resume an uncommitted
  in-progress session.
- The localStorage commit is best-effort atomic only inside one tab. Concurrent
  tabs can still interleave reads and writes because this PR intentionally does
  not add a lock or storage key.
- Cross-device and fully serialized concurrent-tab guarantees require future
  account-backed transactional persistence.
- Fatal rollback failure requires user intervention; the app must show the fatal
  storage error and must not report the answer as saved.
- Malformed review stores are preserved and not auto-repaired. That avoids data
  loss, but it means an answer cannot be committed until storage is repaired or
  cleared by the user.
- Local refs still guard mounted-component interactions; durable idempotency is
  limited to callers that provide `eventId`.
- `dailyStats.sessions` remains date/session based on stored review events. This
  PR prevents duplicate `eventId` increments but does not change the session
  counting product rule.

## Storage Contract Confirmation

- No new `localStorage` key was added.
- No `sessionStorage` persistence was added.
- The four approved storage keys remain:
  `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, and
  `vlx_daily_stats_v1`.
- `VlxReviewEvent`, `VlxReviewStateItem`, and `VlxDailyStatsItem` shapes were not
  changed.
- The pure SRS scheduling algorithm, box intervals, mastery rules, weakScore
  rules, response-time thresholds, distractor rules, and local queue-priority
  rules were not changed. Route sessions now drop duplicate slugs after route
  selection so one session cannot contain repeated cards.
- No Webflow, Cloudflare Workers, R2, Vercel, DNS, deployment settings, auth,
  billing, payment, checkout, subscriptions, secrets, API routes, route
  handlers, middleware, or production data were touched.
