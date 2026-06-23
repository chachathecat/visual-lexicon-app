# Track B Analytics & Retention Gate

Date: 2026-06-22

This gate hardens the browser-local analytics and retention evidence for Track B
paid beta. It does not add an analytics SDK, network delivery, cookies,
identity, fingerprinting, durable analytics storage, backend ingestion, auth,
billing, checkout, payment, deployment, Webflow, Cloudflare, R2, DNS, secrets,
or production data changes.

## Runtime Envelope

Runtime events are pushed only to `window.dataLayer` as client-local diagnostics.
The runtime payload is allowlisted and sanitized before push:

- `event`: canonical `vlx_*` event name.
- `eventId`: required idempotency key for the event name.
- `eventTime`: ISO timestamp.
- `schemaVersion`: always `1`.
- `sourceOfTruth`: always `client`.
- `route`: pathname only; query strings and hashes are stripped.
- Allowed learning fields include `slug`, `mode`, `source`, `sessionId`,
  `questionType`, `result`, `responseMs`, `durationMs`, SRS boxes, weak scores,
  mastery labels, confidence, and aggregate counts.

Invalid numeric values are omitted. Box values must be integers `0..5`; weak
scores must be `0..1`; counts must be non-negative integers; confidence must be
`knew`, `guessed`, or `forgot`.

## Dedupe

The client dataLayer dedupe key is:

```txt
event name + eventId
```

Same event name plus same eventId pushes once. A conflicting duplicate payload
does not push again and may warn in development, but it must never interrupt the
learning flow. Different event names may share the same underlying SRS
`eventId`, so `vlx_review_answer` and a future `vlx_review_state_update` can
share an accepted SRS event id.

## Canonical Event Map

| Event | Timing | Event id/session rule | Payload notes |
| --- | --- | --- | --- |
| `vlx_save_word` | After the save outcome is known. | Deterministic local id by slug/result. | Emits exactly one result: `saved`, `duplicate`, `missing`, or `storage_error`. Duplicate saves preserve existing SRS progress. |
| `vlx_review_start` | After a real non-empty review session becomes active. | `eventId = vlx_review_start_${sessionId}`. | Includes `sessionId`, `mode`, `source`, `queueSize`, `dueCount`, `weakCount`. Loading and honest empty queues do not emit. |
| `vlx_review_answer` | Only after `applyReviewAnswer` commits successfully. | Uses exact committed `output.event.eventId` and `output.event.sessionId`. | Includes slug, mode, source, result, question type, responseMs, confidence, `boxBefore`, `boxAfter`, `weakScoreBefore`, `weakScoreAfter`, `masteryAfter`. Selected answer text is not emitted. |
| `vlx_review_state_update` | Not emitted by the current review view. | If reintroduced, it must use the committed SRS event id and emit only after commit. | Must never emit after rollback. |
| `vlx_review_complete` | Once all cards in the logical session have committed answers. | `eventId = vlx_review_complete_${sessionId}`. | Includes `sessionId`, `mode`, `source`, `reviewedCount`, `correctCount`, `wrongCount`, and `durationMs` when measurable. `reviewedCount = correctCount + wrongCount`. |
| `vlx_pricing_interest` / `vlx_paywall_interest` | On explicit learner interest. | Local diagnostic event id. | Interest-only. No entitlement, billing, checkout, subscription, or paid-access claim changes. |

Rollback behavior: failed SRS writes emit no review answer, no state update, and
no completion. Retrying the same pending answer reuses the same attempted SRS
event id and emits exactly one answer after the retry commit succeeds.

`vlx_review_complete` is advisory until backend-derived reporting exists. The
authoritative completed-session metric should eventually derive from accepted
review answers.

## Retention Formulas

All formulas use valid, deduped review events from local
`vlx_review_events_v1`. Browser-local retention is not cross-device or
account-wide retention.

UTC window:

- Start: `00:00:00.000Z` six UTC dates before the supplied `now` date.
- End: supplied `now` timestamp.
- Events after `now` are invalid/future and excluded.
- Events exactly at the start boundary and exactly at `now` are included.

Valid review event requirements:

- canonical slug
- allowed question type
- `result` of `correct` or `wrong`
- valid non-future `createdAt`
- integer non-negative `responseMs`
- `boxAfter` integer `0..5`
- `weakScoreBefore` and `weakScoreAfter` in `0..1`
- non-empty canonical answer

Current review events dedupe by `eventId`. Exact repeats count as duplicates.
Conflicting repeated event ids count as invalid. Legacy events without
`eventId` dedupe by a compatibility fingerprint.

Signals:

- `weeklyReviewedWords`: unique accepted review-event slugs in the seven-date UTC window.
- `reviewedTodayWords`: unique accepted review-event slugs on the UTC date of `now`.
- `activeReviewDays7d`: number of UTC dates in the window with at least one accepted review.
- `hasConsecutiveDayReturn`: true when accepted reviews exist on adjacent UTC dates.
- `dueReviewedWords7d`: unique in-window slugs with `questionType === "due_review"`.
- `weakRecoveredWords7d`: unique in-window slugs where `weakScoreAfter < weakScoreBefore`.
- `savedWordsCount`: unique canonical slugs in `vlx_saved_words_v1`.
- `savedWordsReviewedAtLeastOnce`: saved slugs with at least one valid review event at or after that word's `savedAt`.
- `saveToFirstReviewRate`: `null` when `savedWordsCount` is zero; otherwise `savedWordsReviewedAtLeastOnce / savedWordsCount`.
- `duplicateEventCount`: excluded exact duplicates.
- `invalidEventCount`: malformed, future, impossible, or conflicting events.

The selector does not mutate inputs.

## Dashboard Route Boundary

Route wiring:

- `/` redirects to `/dashboard` from `src/app/page.tsx`.
- `/dashboard` renders `DashboardV2View` from `src/app/dashboard/page.tsx`.

Weekly Reviewed Words remains a retention selector and analytics metric:

```ts
getRetentionSignals(savedWords, reviewEvents, now).weeklyReviewedWords
```

It is covered by direct selector tests over `vlx_review_events_v1` and
`vlx_saved_words_v1`. It is not a visible `/` UI assertion, and this gate does
not add it as a DashboardV2 card, chart, module, or label.

The shipped `/dashboard` V2 screen has no "Reviewed this week" or Weekly
Reviewed Words card. No card, chart, module, label, or screenshot baseline was
added to DashboardV2.

## Privacy Boundary

Allowed runtime diagnostics are limited to the payload allowlist. Forbidden
data includes email, auth values, tokens, arbitrary URLs, query strings, hashes,
raw alias queries, page content, arbitrary objects, payment data, checkout
state, subscription state, identity, cookies, fingerprints, anonymous ids, and
analytics SDK identifiers.

No event can change mastery, payment, entitlement, or access. Mastery only
changes through the SRS reducer and accepted local SRS commits. Entitlement
only reads existing local plan state; pricing/paywall events record interest
only.

Field retention remains unverified. Backend account event ingestion, trusted
analytics reporting, cross-device retention, and account-wide retention remain
future work.

## Route Status

| Route | Status | Notes |
| --- | --- | --- |
| `/save` | PASS | Emits honest save result after outcome; strips query/hash/private values; duplicate preserves SRS progress. |
| `/review` | PASS | Non-empty sessions emit one start; committed answers use exact SRS event id/session id; completion counts committed answers. |
| `/review/due` | PASS | Same review contract, due queue source. |
| `/review/weak` | PASS | Same review contract, weak queue source. |
| `/review/weak-sprint` | PASS | Same review contract, weak sprint source. |
| `/dashboard` | PASS | Canonical Track B app entry. Renders DashboardV2View. V2 layout preserved; no Weekly Reviewed Words card added. |
| `/` | PASS | Redirects to `/dashboard`; it does not render the legacy dashboard. |
| `/pricing` | PASS | Interest-only event; entitlement unchanged. |
| `/saved` | PASS | Existing saved-library view event remains local and count-based. |
| `/word/[slug]` | PASS | Existing word memory state view event remains local and state-based. |
| `/packs` and `/packs/[packId]` | PASS | Existing pack preview events remain local diagnostics. |

## Remaining Manual dataLayer Checks

- Open `/save?slug=dissonance&source=word_page&email=x&token=y`; confirm one
  `vlx_save_word` with route `/save`, result `saved`, no query/hash/private
  fields.
- Open the same saved word again; confirm `duplicate` and unchanged SRS state.
- Start `/review?mode=saved&limit=1`; confirm one `vlx_review_start` only after
  the card appears.
- Answer and retry after a forced storage failure; confirm no answer event
  before retry commit and exactly one answer after commit.
- Complete the session; confirm one `vlx_review_complete` and
  `reviewedCount = correctCount + wrongCount`.
- Click `/pricing` interest; confirm `vlx_pricing_interest` and unchanged
  `vlx_plan_state_v1`.

## Requirement-To-Test Mapping

| Requirement | Assertion coverage |
| --- | --- |
| `/` redirects to `/dashboard`; `/dashboard` uses `DashboardV2View`. | `tests/dashboard-v2.spec.ts` asserts the root redirect, direct dashboard render, and no `/dashboard` redirect loop. |
| Do not add a new DashboardV2 card or metric. | `tests/track-b-analytics-retention-gate.spec.ts` asserts `/dashboard` has `.dashboard-v2-mission-card` and no Weekly Reviewed Words or Reviewed this week text. |
| Weekly Reviewed Words remains selector-only for this route gate. | `tests/track-b-analytics-retention-core.spec.ts` and `tests/track-b-analytics-retention-gate.spec.ts` exercise `getRetentionSignals(...)` directly. |
| No-saved-words conversion rate is `null`. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` retention conversion test. |
| Review before `savedAt` does not count. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` retention conversion test. |
| Review at or after `savedAt` counts. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` retention conversion test. |
| Runtime envelope includes `schemaVersion=1` and `sourceOfTruth=client`. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` runtime envelope test. |
| Valid `sessionId`, timing, confidence, mastery, and weak-score fields survive. | `tests/track-b-analytics-retention-gate.spec.ts` runtime envelope and committed-answer tests. |
| Invalid numeric values are omitted. | `tests/track-b-analytics-retention-gate.spec.ts` invalid numeric envelope test. |
| Query/hash/PII/token/raw URL/raw alias query/arbitrary objects are removed. | `tests/analytics-events.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` runtime envelope and save analytics tests. |
| Same event name plus same eventId pushes once. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` dataLayer dedupe test. |
| Conflicting duplicate payload does not push twice. | `tests/track-b-analytics-retention-gate.spec.ts` dataLayer dedupe test. |
| Different event names can share the same SRS eventId. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` dataLayer dedupe test. |
| Active review emits start once. | `tests/track-b-analytics-retention-gate.spec.ts` active review test. |
| Empty review emits no start. | `tests/track-b-analytics-retention-gate.spec.ts` empty review test. |
| Committed answer uses exact SRS eventId and sessionId. | `tests/track-b-analytics-retention-gate.spec.ts` compares `vlx_review_answer` against `vlx_review_events_v1`. |
| Rolled-back answer emits no answer/state-update. | `tests/track-b-analytics-retention-gate.spec.ts` rollback test. |
| Retry emits one answer. | `tests/track-b-analytics-retention-gate.spec.ts` rollback retry test. |
| Completion emits once and totals equal committed correct plus wrong. | `tests/track-b-analytics-retention-gate.spec.ts` active review and retry completion assertions. |
| Failed answer is excluded from completion. | `tests/track-b-review-reliability.spec.ts`; full suite includes this existing reliability assertion. |
| Save emits `saved` once. | `tests/analytics-events.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` save analytics test. |
| Duplicate save emits `duplicate` rather than `saved` and preserves SRS progress. | `tests/track-b-analytics-retention-gate.spec.ts` save analytics test. |
| Missing and storage error save results are honest. | `tests/track-b-analytics-retention-gate.spec.ts` save analytics test. |
| Save analytics strips query PII/token. | `tests/analytics-events.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` save analytics test. |
| Pricing interest changes no entitlement. | `tests/track-b-analytics-retention-gate.spec.ts` pricing interest test. |
| Weekly Reviewed Words is unique slug count over seven UTC dates. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| Duplicate review of one slug counts once. | `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| Duplicate eventId counts once. | `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| Malformed and future events are excluded. | `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| Exact UTC boundary behavior. | `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| `reviewedTodayWords`, `activeReviewDays7d`, and consecutive-day evidence. | `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| `dueReviewedWords7d` and `weakRecoveredWords7d`. | `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| Legacy fingerprint compatibility and conflicting duplicate diagnostics. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| Selector does not mutate inputs. | `tests/track-b-analytics-retention-core.spec.ts`; `tests/track-b-analytics-retention-gate.spec.ts` retention selector test. |
| No new localStorage/sessionStorage key. | `tests/track-b-analytics-retention-gate.spec.ts` runtime storage-key test. |

## Validation

Focused gate:

```powershell
npm.cmd run test -- tests/analytics-events.spec.ts tests/track-b-analytics-retention-core.spec.ts tests/track-b-analytics-retention-gate.spec.ts --workers=1
```

Full release validation should also run the AGENTS.md commands plus review
reliability, accessibility, performance, and Figma parity gates.
