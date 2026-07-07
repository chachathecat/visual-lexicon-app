# Track B v3 Manual QA Execution Report

Report date: 2026-07-07 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/v3-manual-qa-execution-report`  
Commit under test: `30d520de34248da12c125672aa1dcad7b058d5d4`  
Scope: Track B v3 local manual QA execution following
`docs/TRACK_B_V3_BETA_READINESS_AUDIT.md` and
`docs/TRACK_B_V3_MANUAL_QA_SCRIPT.md`.

## Executive Summary

This report records the executed local Track B v3 manual QA pass for the
Save -> Review -> Events -> Daily Stats -> Packs -> Pricing path.

Verdict:

- P0 count: `0`
- Private/manual beta: **conditional owner-gated candidate only**
- Public paid beta: **No-Go**

The local v3 learning loop passed the core manual QA checks: saving
`dissonance` created both saved-word and review-state records, due and weak
review answers wrote review events and daily stats, Saved Library tabs read real
SRS state, packs stayed read-only on load, Academic preview progress appeared
only after explicit action, and pricing recorded local upgrade interest without
checkout, payment, billing, subscription, invoice, or entitlement behavior.

This report does not launch private/manual beta, does not unblock public paid
beta, and does not approve billing or entitlement behavior.

## Environment

| Field | Value |
| --- | --- |
| Local base URL | `http://127.0.0.1:3006` |
| App server command | `npm.cmd run dev -- --hostname 127.0.0.1 --port 3006` |
| Dependency setup | `npm.cmd ci` |
| Data boundary | Browser localStorage only |
| Production data used | No |
| Webflow / Cloudflare / auth / billing touched | No |

`npm.cmd ci` completed from the lockfile. It reported existing audit findings;
`npm audit fix` was not run.

## Date/Time Of QA

| Field | Value |
| --- | --- |
| QA started | 2026-07-07 10:33:36 KST |
| QA finished | 2026-07-07 10:34:38 KST |
| Manual QA browser timestamp | `2026-07-07T01:33:36.836Z` to `2026-07-07T01:34:38.208Z` |

## Local Test Setup

The local dev server was started on `127.0.0.1:3006`. The manual QA pass used a
focused Playwright Chromium browser run against that live server and read only
browser-local storage. Route and localStorage probes were hydrated before
classification; early `domcontentloaded`-only probes were not used as final
evidence when hydration was still pending.

## Browser Used

| Browser | Use |
| --- | --- |
| Playwright Chromium `148.0.7778.96` | Manual QA flow, localStorage probes, route checks, mobile viewport smoke, keyboard activation smoke |
| Codex in-app Browser | Local visual/browser setup connection and route inspection support |

## Validation Commands

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint` | PASS |
| `npm.cmd run build` | PASS with existing Supabase Edge Runtime warning |
| `npm.cmd run test -- tests/v3-beta-readiness-audit.spec.ts --workers=1` | PASS, 16 passed |
| `npm.cmd run test -- tests/analytics-learning-funnel-dashboard.spec.ts tests/track-b-accessibility-performance-release-gate.spec.ts tests/pricing-paywall-v3-outcome-copy.spec.ts tests/packs-v3-30-day-plan-surface.spec.ts tests/saved-library-v3-memory-queue.spec.ts tests/review-mode-routes.spec.ts tests/review-state-regression.spec.ts --workers=1` | PASS, 81 passed |
| `npm.cmd run test -- --workers=1` | Attempted; command timed out after 604 seconds before returning usable test output. Not claimed as passed. |

## Manual QA Steps

Status vocabulary: `PASS`, `PASS WITH NOTE`, `FAIL`, `BLOCKED`, `NOT RUN`.

| Step | Result | Evidence |
| --- | --- | --- |
| Clear localStorage | PASS | All Track B localStorage keys were removed and `/dashboard` reloaded. |
| Save word from `/save?slug=dissonance&source=word_page` | PASS | `Dissonance` rendered; `vlx_saved_words_v1.dissonance.source` was `word_page`. |
| Confirm `vlx_saved_words_v1` | PASS | Saved word existed for `dissonance`. |
| Confirm `vlx_review_state_v1` | PASS | Review item existed with `mastery: "New"`, `box: 0`, `weakScore: 0`. |
| Run `/review/due` | PASS | Due session rendered from real local SRS state. |
| Answer at least one due card | PASS | Correct answer for `Dissonance` was submitted with confidence `knew`. |
| Confirm `vlx_review_events_v1` | PASS | Event count became `1`; last event was `due_review`, `result: "correct"`, `boxAfter: 1`. |
| Confirm `vlx_daily_stats_v1` | PASS | Daily reviewed count became `1` after the due answer. |
| Seed weak state or use existing weak fixture | PASS | A real wrong answer selected `Melody` for `Dissonance`, producing `wrong: 1`, `mastery: "Weak"`, `weakScore: 0.24`. |
| Run `/review/weak` | PASS | Weak session rendered from weak evidence. |
| Answer at least one weak card | PASS | Correct weak answer wrote a `weak_review` event and reduced weak score from `0.24` to `0.08`. |
| Check `/saved` Due / Weak / New / Learning / Mastered tabs | PASS | All tabs were visible and derived from seeded saved/review state; opening tabs did not write review events, daily stats, pack progress, or upgrade interest. |
| Check `/packs` with no progress | PASS | Active packs, Preview progress, and Completed previews showed `0`; `vlx_pack_progress_v1` remained absent on page load. |
| Start Academic preview | PASS | Explicit CTA navigated to `/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview`. |
| Confirm pack progress is created only by explicit action | PASS | `vlx_pack_progress_v1["academic-vocabulary"]` appeared after CTA with `reviewedCount: 0`, `correctCount: 0`, `source: "pack_detail"`. |
| Check `/pricing` | PASS | Billing-not-connected, no-checkout, and public No-Go copy were visible. |
| Click Lite interest CTA | PASS | Lite CTA wrote one local interest record. |
| Confirm `vlx_upgrade_interest_v1` | PASS | Last interest record had `plan: "lite"`, `source: "pricing_page"`, `pagePath: "/pricing"`. |
| Confirm upgrade interest grants no entitlement | PASS | `vlx_plan_state_v1` remained absent after pricing interest. |
| Confirm no checkout/payment/billing route exists | PASS | `/checkout`, `/payment`, `/payments`, `/billing`, `/api/checkout`, `/api/payment`, `/api/payments`, and `/api/billing` returned 404 and no paid claim. Filesystem check found no matching route directories under `src/app`. |
| Confirm no public paid beta launch claim | PASS | `/dashboard`, `/saved`, `/packs`, `/pricing`, and `/settings` had no public launch, private launch, or fake paid-access claim. |
| Mobile smoke | PASS | `390px` viewport covered `/dashboard`, `/review/due`, `/review/weak`, `/saved`, `/packs`, and `/pricing`; no horizontal overflow was observed. |
| Keyboard navigation smoke | PASS WITH NOTE | Focus plus Enter activation was verified for review CTA, current answer, confidence, Saved tab, and pricing CTA. Full sequential Tab traversal was brittle in automation after route transitions, so this remains a QA note. |
| Console error smoke | PASS WITH NOTE | No page errors or unexpected console errors were observed. Eight console 404 resource messages came from the deliberate absent checkout/payment/billing route probes. |

## Evidence Summary

- `vlx_saved_words_v1`: `dissonance` existed after save with source
  `word_page`.
- `vlx_review_state_v1`: save created `New` box `0`; due answer moved
  `dissonance` to `Learning` box `1`; wrong answer made it `Weak`; weak answer
  wrote `lastQuestionType: "weak_review"`.
- `vlx_review_events_v1`: event count reached `3` across due, wrong, and weak
  answers.
- `vlx_daily_stats_v1`: reviewed count reached `3` after those answers.
- `vlx_pack_progress_v1`: absent on `/packs` load; Academic progress appeared
  only after explicit preview action.
- `vlx_upgrade_interest_v1`: Lite pricing interest wrote one local record.
- `vlx_plan_state_v1`: remained absent; no entitlement was granted.

## Console Error Summary

No unexpected browser console errors and no page errors were observed during the
manual QA flow.

Expected console noise:

- Eight `404 (Not Found)` resource messages appeared while intentionally
  visiting absent checkout/payment/billing routes and API routes.

## Mobile Smoke Summary

At `390px` width, these routes rendered with a visible `main`, available
controls, and no horizontal overflow:

- `/dashboard`
- `/review/due`
- `/review/weak`
- `/saved`
- `/packs`
- `/pricing`

## Keyboard Navigation Smoke Summary

Result: **PASS WITH NOTE**.

Keyboard activation with focus plus Enter was verified for the review CTA,
current review answer, confidence choice, Saved tab, and Lite pricing interest
CTA. The automated full sequential Tab traversal was brittle after route
transitions, so deeper human keyboard QA remains recommended before any owner
private/manual beta signoff.

## P0/P1/P2 Result

### P0

Count: `0`

No P0 blocker was found in this local manual QA pass.

### P1

| ID | Finding | Action |
| --- | --- | --- |
| `p1_keyboard_deeper_human_qa_recommended` | Keyboard activation passed with a note, but full sequential Tab traversal was brittle in automation after route transitions. | Run a deeper human keyboard pass before owner private/manual beta signoff. |
| `p1_account_sync_server_srs_public_beta_missing` | Account sync and server-side SRS are still not public-beta production sources of truth. | Keep public paid beta No-Go. |
| `p1_production_analytics_monitoring_missing` | Production analytics and monitoring are not connected. | Keep analytics local/readiness-only until separately approved. |
| `p1_support_refund_privacy_owner_signoff_required` | Support, refund, privacy, manual entitlement, rollback, and owner signoff remain outside this QA pass. | Require owner gate review before any invite/payment request. |
| `p1_extension_loop_app_side_only` | Extension source behavior is app-side/readiness only. | Run real extension E2E before claiming extension distribution readiness. |

### P2

| ID | Finding | Action |
| --- | --- | --- |
| `p2_visual_polish` | Continue visual polish beyond the smoke route checks. | Keep polishing before public launch. |
| `p2_exam_pack_expansion` | IELTS/GRE depth remains planned/preview. | Expand only after beta gates. |
| `p2_future_ai_export_multilingual` | AI mistake explanations, export polish, and multilingual pages remain future work. | Do not add before the SRS loop and gates are approved. |

## Private/Manual Beta Recommendation

Recommendation: **conditional private/manual beta candidate, owner-gated only**.

Rationale:

- P0 count is `0`.
- Save creates review state.
- Review answers create events, update review state, and update daily stats.
- Due, Weak, and Mastered are derived from review state.
- Pack progress is not created by page load.
- Pricing records local interest only and grants no entitlement.
- No checkout, payment, or billing route exists.

This is not a private beta launch claim. Owner review remains required for
support, refund, privacy, manual entitlement, rollback, invite language, and
keyboard follow-up.

## Public Paid Beta Recommendation

Recommendation: **Public paid beta remains No-Go**.

Public paid beta remains blocked until production account sync, server-side SRS,
production analytics/monitoring, privacy/legal, accessibility, support, refund,
rollback, billing/payment/checkout, entitlement enforcement, and production
operations gates are separately completed and approved.

## Risk And Rollback

This PR is documentation plus a static docs guard and README link. Rollback is a
normal revert of:

- `docs/TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md`
- the README link to this report
- the static test assertions for this report, if included

No runtime app rollback, production data rollback, payment rollback, auth
rollback, Webflow rollback, Cloudflare rollback, DNS rollback, or deployment
rollback is required.

## Safety Confirmation

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, analytics SDK, tracking pixel, or public
paid beta unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake pack progress, fake paid access, private beta launch claim, or public paid
beta launch claim were added.

`npm audit fix` was not run.
