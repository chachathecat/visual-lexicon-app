# Track B v3 Beta Readiness Audit

Date: 2026-07-06  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/v3-beta-readiness-audit`  
Scope: Track B paid learning app for `app.visuallexicon.org`.

## Executive Summary

This audit answers whether the current Track B v3 app can be treated as a
private/manual paid beta candidate and what still blocks public paid beta.

Verdict:

- Private/manual beta: **conditional owner-gated candidate only**
- Public paid beta: **No-Go**

The v3 learning loop now has credible local evidence across dashboard, review,
saved library, packs, pricing/paywall copy, accessibility/performance gates, and
the local analytics readiness snapshot. That is enough to justify a controlled
owner-run manual QA pass and possible private/manual beta candidate review.

It is not enough to launch or unblock public paid beta. Public paid beta remains
blocked until account sync, production analytics/monitoring, privacy/legal,
accessibility, support, refund, rollback, billing/entitlement, and owner signoff
gates are complete.

## Current Track B v3 Status

Recent merged readiness sequence:

- #168 Dashboard v3 Today Memory Mission: `/dashboard` prioritizes Due, Weak,
  New saved, then save/start actions from real local state.
- #169 Review Session v3 Focus Mode: review answers remain the writer for
  review events, review state, and daily stats.
- #170 Saved Library v3 Memory Queue: `/saved` is a learning queue with Due,
  Weak, New, Learning, and Mastered tabs derived from local SRS evidence.
- #171 Packs v3 30-Day Plan Surface: `/packs` is read-only on load and pack
  progress comes only from explicit preview or review actions.
- #172 Pricing / Paywall v3 Outcome Copy: pricing records local interest only
  and keeps no-checkout/no-billing/no-entitlement safety copy.
- #173 Accessibility / Performance Release Gate: scoped routes are smoke-gated
  for accessibility, performance, screenshot parity expectations, and safety.
- #174 Analytics Learning Funnel Dashboard: local read-only snapshot represents
  Weekly Reviewed Words and related learning-loop metrics without an analytics
  SDK, network delivery, tracking pixel, or production dashboard.

Current private/manual beta positive evidence:

- Save creates or preserves a review item in `vlx_review_state_v1`.
- Review answers create `vlx_review_events_v1` records and update
  `vlx_review_state_v1`.
- Review answers update `vlx_daily_stats_v1`.
- Due, Weak, and Mastered are derived from real review state.
- Pack progress is derived from explicit preview/review evidence.
- Pricing and paywall actions create local upgrade-interest records only.
- Local analytics snapshot is read-only and readiness-only.
- Primary routes preserve public paid beta No-Go language.

Current public paid beta blockers:

- Account sync and server-side SRS source of truth are not production-ready.
- Production analytics and monitoring are not connected.
- Billing, checkout, payment, subscription, invoice, and entitlement systems are
  not implemented or approved.
- Support, refund, privacy, manual entitlement policy, rollback, and owner
  launch signoff remain incomplete.
- Manual QA evidence still must be recorded for the full v3 golden flow.

## Route Inventory

| Route | Current readiness | Evidence rule |
| --- | --- | --- |
| `/` | Ready for private/manual QA | Redirects to `/dashboard`; must not become a marketing or checkout surface. |
| `/dashboard` | Ready for private/manual QA | Today Memory Mission reads real saved/review/state/progress evidence; no writes on load. |
| `/review` | Ready for private/manual QA | Focus review writes review events, review state, and daily stats only after answers. |
| `/review/due` | Ready for private/manual QA | Due queue comes from `nextDueAt` and excludes fake due or fake mastery. |
| `/review/weak` | Ready for private/manual QA | Weak queue comes from real Weak, wrong, or `weakScore` evidence. |
| `/saved` | Ready for private/manual QA | Due, Weak, New, Learning, and Mastered tabs derive from saved and SRS state. |
| `/packs` | Ready for private/manual QA | Read-only on load; no fake progress from page views or planned pack copy. |
| `/packs/academic-vocabulary` | Ready for private/manual QA | Academic preview can start real review and progress only after explicit action. |
| `/pricing` | Ready for private/manual QA | Outcome copy and interest capture only; no checkout, billing, payment, or entitlement. |
| `/settings` | Ready for private/manual QA | Local diagnostics only; plan state is not paid access. |
| `/save?slug=dissonance&source=word_page` | Ready for private/manual QA | Save from word page must create/preserve saved word and review item. |
| `/save?slug=dissonance&source=extension` | Manual E2E QA required | App route supports extension source; extension loop alignment still needs browser QA. |
| `/word/dissonance` | Present and ready for private/manual QA | Word page must show memory state from local SRS evidence, not static fake mastery. |

## LocalStorage Key Inventory

| Key | Role | Readiness rule |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word records. | Save must create or preserve records and a matching review item. |
| `vlx_review_state_v1` | SRS memory state. | Due, Weak, Mastered, box, weak score, and next due must come from this real state. |
| `vlx_review_events_v1` | Review answer evidence. | Every committed review answer must append a real event. |
| `vlx_daily_stats_v1` | Daily review rollup. | Review answers must update stats; dashboard and analytics may read it. |
| `vlx_pack_progress_v1` | Pack preview/review progress. | Created only by explicit pack preview action or real pack review completion. |
| `vlx_plan_state_v1` | Local plan preview/diagnostic state. | Never a paid entitlement, subscription, receipt, or billing source of truth. |
| `vlx_upgrade_interest_v1` | Local upgrade interest attribution. | Local-only interest signal; never checkout, payment, subscription, or paid access. |

## Analytics Snapshot Inventory

The #174 analytics snapshot is a local/readiness-only view over existing browser
stores. It does not send analytics, install an SDK, create a tracking pixel, or
connect production reporting.

| Metric | Required interpretation |
| --- | --- |
| Weekly Reviewed Words | Primary metric, derived from unique reviewed slugs in review events or daily stats fallback. |
| `savedWordCount` | Count valid saved-word records. |
| `saveToReviewRate` | Saved words with review event evidence divided by saved words. |
| `dueWordCount` | Non-mastered review-state items due by the current day. |
| `weakWordCount` | Words with real weak evidence, not weak labels alone. |
| `masteredWordCount` | Words with `box === 5`, `mastery === "Mastered"`, and review timestamp evidence. |
| `reviewEventCount` | Valid local review answer events. |
| `reviewCompletionCount` | Review sessions from event or daily-stat evidence. |
| `weakWordRepairCount` | Words whose in-window review event reduced weak score. |
| `packPreviewStartedCount` | Pack progress records with explicit preview start evidence. |
| `packPreviewCompletedCount` | Pack progress records with completion or reviewed-count evidence. |
| `upgradeInterestCount` | Valid local upgrade-interest records only. |
| `corruptPayloadKeys` | Local payload keys ignored because they were corrupt or mismatched. |
| `safetyFlags` | Readiness flags for local-only, no SDK, no tracking pixel, no entitlement, and public No-Go boundaries. |

## Test Inventory

Required full validation for this audit PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/v3-beta-readiness-audit.spec.ts --workers=1
npm.cmd run test -- tests/analytics-learning-funnel-dashboard.spec.ts tests/track-b-accessibility-performance-release-gate.spec.ts tests/pricing-paywall-v3-outcome-copy.spec.ts tests/packs-v3-30-day-plan-surface.spec.ts tests/saved-library-v3-memory-queue.spec.ts tests/review-mode-routes.spec.ts tests/review-state-regression.spec.ts --workers=1
npm.cmd run test -- --workers=1
```

Relevant suites:

| Suite | Coverage |
| --- | --- |
| `tests/v3-beta-readiness-audit.spec.ts` | This audit, manual QA script, route/storage/analytics inventories, and safety guards. |
| `tests/dashboard-v3-today-memory-mission.spec.ts` | Dashboard v3 CTA priority and honest local state reads. |
| `tests/review-session-v3-focus-mode.spec.ts` | Focus review behavior and answer/feedback flow. |
| `tests/review-mode-routes.spec.ts` | Review, due, weak, hub, word, and source routes. |
| `tests/review-state-regression.spec.ts` | SRS state, events, due/weak/mastered selectors, and duplicate-save behavior. |
| `tests/saved-library-v3-memory-queue.spec.ts` | Saved Library memory queue tabs and no fake mastery. |
| `tests/packs-v3-30-day-plan-surface.spec.ts` | Read-only packs load, explicit progress creation, planned pack honesty. |
| `tests/pricing-paywall-v3-outcome-copy.spec.ts` | Outcome copy, local interest only, no payment routes/dependencies. |
| `tests/track-b-accessibility-performance-release-gate.spec.ts` | Route smoke, named controls, performance/safety, visual parity expectations. |
| `tests/analytics-learning-funnel-dashboard.spec.ts` | Local readiness snapshot and no analytics/payment integrations. |

## Manual QA Checklist

Use `docs/TRACK_B_V3_MANUAL_QA_SCRIPT.md` for the step-by-step run.

Minimum pass before owner considers private/manual beta:

- [ ] Clear Track B localStorage keys.
- [ ] Save `dissonance` from `/save?slug=dissonance&source=word_page`.
- [ ] Confirm `vlx_saved_words_v1` and `vlx_review_state_v1`.
- [ ] Run `/review/due`, answer at least one card, and confirm
      `vlx_review_events_v1`.
- [ ] Confirm `vlx_daily_stats_v1`.
- [ ] Seed or create a weak word and run `/review/weak`.
- [ ] Check `/saved` Due, Weak, New, Learning, and Mastered tabs.
- [ ] Check `/packs` has no progress after a clean load.
- [ ] Start Academic preview and confirm `vlx_pack_progress_v1` appears only
      after explicit action.
- [ ] Check `/pricing`, click Lite or Pro interest CTA, and confirm
      `vlx_upgrade_interest_v1`.
- [ ] Confirm no checkout, payment, or billing route exists.
- [ ] Confirm no public paid beta launch claim and no private/manual beta launch
      claim.
- [ ] Complete mobile, keyboard, and console-error smoke checks.

## P0 Risk List

These are blockers for private/manual beta candidate signoff and public paid
beta unless explicitly scoped as public-only:

- P0: Save -> review item creation breaks or no longer preserves review state.
- P0: Review answer -> `vlx_review_state_v1` update breaks.
- P0: `vlx_review_events_v1` creation breaks.
- P0: `vlx_daily_stats_v1` update breaks.
- P0: Due, Weak, or Mastered derivation stops using real review state.
- P0: Pack progress derivation stops using real preview/review evidence.
- P0: Packs page read-only progress rule breaks.
- P0: Pricing/paywall interest-only rule breaks.
- P0: Upgrade interest local-only rule breaks.
- P0: Accessibility/performance release gate breaks.
- P0: Analytics local/readiness-only rule breaks.
- P0: Checkout, payment, or billing route appears.
- P0: Fake paid entitlement appears.
- P0: Public paid beta is unblocked or claimed launched.
- P0: Account sync/server persistence is treated as production-ready before its
  gates pass.
- P0: Payment, checkout, subscription, billing portal, invoice, or entitlement
  implementation appears without explicit approval.

## P1 Risk List

- P1: IELTS/GRE content depth remains planned/preview and is not public-launch
  ready.
- P1: Production analytics are not connected.
- P1: Account sync is not production-ready.
- P1: Manual QA evidence is still needed before private/manual beta.
- P1: Placeholder copy could confuse learners about billing, account sync,
  plan access, support, or data persistence.
- P1: Extension loop alignment still needs end-to-end browser QA.
- P1: Support, refund, privacy, and manual entitlement policy are not finalized.
- P1: Visual screenshot parity must remain checked; do not skip or rewrite
  baselines without explicit review.

## P2 Risk List

- P2: Richer dashboard visualization.
- P2: Future AI mistake explanation after the SRS loop works.
- P2: Future export/download polish.
- P2: Future full multilingual pages.
- P2: Future Supabase/account sync.
- P2: Future B2B/teacher mode.
- P2: Future exam pack content expansion.

## Private/Manual Beta Recommendation

Recommendation: **conditional private/manual beta candidate, owner-gated only**.

This audit supports an owner-run manual QA pass and a controlled candidate
review if every P0 automated and manual check passes. It does not launch private
beta, does not invite users, does not collect payment, and does not grant paid
access.

Private/manual beta remains owner-gated. The owner must confirm manual QA
evidence, support/privacy/refund disclosures, local-state limitations, and
rollback/pause rules before any invite or payment request.

## Public Paid Beta Go/No-Go Recommendation

Recommendation: **Public paid beta remains No-Go**.

Public paid beta cannot proceed until all P0 blockers are closed and public
launch gates are approved for account sync, server-side SRS, production
analytics/monitoring, privacy/legal, accessibility, support, refund, rollback,
billing/payment/checkout, entitlement enforcement, and production operations.

This audit must not be interpreted as a public paid beta unblock.

## Explicit Safety Boundaries

This PR is limited to docs, tests, static/readiness helpers, README links, and
tiny safety assertion fixes only if a test exposes a clear issue.

Explicit safety confirmation: No Webflow, Cloudflare Workers, auth, billing,
payment, checkout, DNS, deployment settings, secrets, production data, R2
production objects, real user data, payment SDK, real entitlement, analytics
SDK, tracking pixel, or public paid beta unblock.

Also forbidden in this audit scope:

- No new product UI.
- No real paid entitlement behavior.
- No analytics SDK or tracking pixel.
- No payment, checkout, billing, subscription, invoice, or billing portal route.
- No fake metrics.
- No fake mastery.
- No fake paid entitlement.
- No fake pack progress.
- No public paid beta launch claim.
- No private/manual beta launch claim.
- No `npm audit fix`.
