# Track B Analytics Learning Funnel Dashboard

Date: 2026-07-06

Scope: Track B paid beta readiness measurement. This contract adds a local,
read-only analytics snapshot helper and dashboard definition for learning-loop
evidence. It does not add an analytics vendor, external SDK, tracking pixel,
network delivery, production dashboard, auth, billing, payment, checkout,
subscription, entitlement, DNS, deployment, Webflow, Cloudflare Workers, R2, or
production-data behavior.

## North Star

Weekly Reviewed Words is the primary metric. Traffic, saved words, pack
previews, pricing views, and upgrade interest are useful only when they explain
whether learners repeat active review behavior.

Core formula:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Local Snapshot Helper

The readiness helper lives at:

```txt
src/lib/analytics/learning-funnel.ts
```

It exports:

```ts
getLearningFunnelSnapshot(rawStores?, now?)
```

The helper is pure for tests and can also read the browser's existing local
storage when called without `rawStores`. It is read-only. It never writes local
state, sends analytics, installs SDKs, creates identifiers, or grants access.

## Source Stores

Only existing Track B localStorage-compatible sources are in scope:

| Key | Purpose | Dashboard use |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word records. | Saved count and Save -> Review conversion denominator. |
| `vlx_review_state_v1` | Current SRS state. | Due, Weak, and Mastered counts. |
| `vlx_review_events_v1` | Review answer evidence. | Weekly Reviewed Words, review-event count, completion sessions, weak repair, last review. |
| `vlx_daily_stats_v1` | Daily review totals. | Fallback Weekly Reviewed Words evidence and session count when event evidence is absent. |
| `vlx_pack_progress_v1` | Pack preview/review progress. | Pack preview start and completion counts. |
| `vlx_upgrade_interest_v1` | Local paid-beta interest records. | Upgrade interest count only; never entitlement. |

Corrupt or mismatched payloads are ignored and reported in
`corruptPayloadKeys`. They do not create inferred progress.

## Snapshot Fields

| Field | Formula |
| --- | --- |
| `weeklyReviewedWords` | Preferred: unique reviewed slugs in valid `vlx_review_events_v1` events over the seven-date UTC window ending at `now`. Fallback: sum of `vlx_daily_stats_v1.reviewed` in the same window when event evidence is absent. |
| `weeklyReviewedWordsSource` | `review_events`, `daily_stats`, or `none`. |
| `savedWordCount` | Valid saved-word records in `vlx_saved_words_v1`. |
| `saveToReviewWordCount` | Saved words with a valid review event at or after `savedAt`. |
| `saveToReviewRate` | `saveToReviewWordCount / savedWordCount`, or `null` when no words are saved. |
| `dueWordCount` | Non-mastered review-state items due by the end of the current UTC day. |
| `weakWordCount` | Review-state items with weak evidence: weak score, misses, or Weak mastery backed by miss/weak-score state. |
| `masteredWordCount` | Review-state items with `box === 5`, `mastery === "Mastered"`, positive correct count, and review timestamp evidence. |
| `reviewEventCount` | Valid, deduped local review answer events. |
| `reviewCompletionCount` | Unique review sessions from valid events, or daily-stat sessions when that is stronger evidence. |
| `weakWordRepairCount` | Unique in-window slugs whose review event reduced weak score. |
| `packPreviewStartedCount` | Pack progress entries with preview start/start evidence. |
| `packPreviewCompletedCount` | Pack progress entries with preview completion or reviewed-count evidence. |
| `upgradeInterestCount` | Valid local upgrade interest records. |
| `lastReviewAt` | Latest valid review-event timestamp, or latest reviewed daily-stat date when event evidence is absent. |
| `safetyFlags` | P0/P1 safety status for local-only measurement boundaries. |

## Event Names To Map Later

This PR does not add new event emission, but the dashboard contract maps to the
current/future taxonomy:

```txt
vlx_save_word_click
vlx_quiz_start
vlx_quiz_answer
vlx_quiz_complete
vlx_review_state_update
vlx_due_review_start
vlx_weak_review_start
vlx_pack_preview_start
vlx_pack_preview_complete
vlx_pricing_view
vlx_paywall_view
vlx_upgrade_click
```

Existing runtime names such as `vlx_save_word`, `vlx_review_start`,
`vlx_review_answer`, `vlx_review_complete`, `vlx_pricing_interest`, and
`vlx_paywall_interest` remain local diagnostics until production analytics is
approved.

## Funnel Interpretation

Save -> Review is considered healthy only when saved words produce real review
answer events. Saved count alone is not activation.

Review completion evidence comes from committed review answer sessions or daily
stats. Client completion events remain advisory until server-derived reporting
exists.

Weak-word repair requires weak-score improvement after a review answer. A weak
label without miss or weak-score evidence is not enough.

Pack preview evidence comes from `vlx_pack_progress_v1`; planned packs and page
views must not become fake progress.

Pricing, paywall, and upgrade-interest evidence is attribution-only. It cannot
create paid access, a subscription, an invoice, a checkout session, or an
entitlement.

## Safety Boundary

The snapshot reports:

- `productionConnected: false`
- `analyticsSdkConnected: false`
- `realPaidEntitlementEnabled: false`
- `publicPaidBetaUnblocked: false`

Public paid beta remains No-Go. This readiness helper does not satisfy account
sync, monitoring, privacy, accessibility, support, refund, rollback, production
analytics, or billing/entitlement gates.

Explicit safety confirmation: No Webflow, Cloudflare Workers, auth, billing,
payment, checkout, DNS, deployment settings, secrets, production data, R2
production objects, real user data, payment SDK, real entitlement, analytics
SDK, third-party tracking pixel, or public paid beta unblock.

## Validation

Focused test:

```powershell
npm.cmd run test -- tests/analytics-learning-funnel-dashboard.spec.ts --workers=1
```

Release validation should also run the AGENTS.md checks and the focused Track B
regression suites for accessibility/performance, pricing/paywall, packs, saved
library, review routes, and review-state regressions.
