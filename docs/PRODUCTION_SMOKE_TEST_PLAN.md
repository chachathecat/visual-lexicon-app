# Production Smoke Test Plan

Smoke test plan date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document does
not deploy, change Vercel settings, change DNS, touch Webflow, touch
Cloudflare Workers, add environment variables, add secrets, change auth
runtime, change billing runtime, add payment behavior, mutate production data,
or change current runtime app behavior.

## Purpose

Confirm that the deployed Track B app still supports the local/private beta
learning loop and still avoids production claims that are not implemented.

Run this plan against:

- Local development before merge.
- Preview/staging before production promotion.
- Production immediately after any explicitly approved production deployment.
- Production again after rollback, if rollback occurs.

## Prerequisites

- Use a fresh browser profile for first-run checks.
- Use a returning browser profile with existing localStorage for continuity
  checks.
- Keep DevTools available to inspect localStorage keys:
  - `vlx_saved_words_v1`
  - `vlx_review_state_v1`
  - `vlx_review_events_v1`
  - `vlx_daily_stats_v1`
  - `vlx_pending_home_quiz`
- Record test environment, URL, commit, tester, date, and result.
- Do not use production user data or real payment credentials.

## Smoke Tests

| Area | Route or surface | Steps | Expected result |
| --- | --- | --- | --- |
| Home page | `/` | Open the home page in a fresh browser. Scan primary actions and learning framing. | Page loads without runtime error. It does not claim production auth, account sync, real billing, or paid subscription access. |
| Dashboard | `/dashboard` | Open dashboard with no local state, then after saving/reviewing at least one word. | Today memory mission and review actions reflect local SRS state. Metrics do not fake review progress. |
| Saved | `/saved` | Open saved library before and after saving a word. | Saved words come from local saved state. Empty state does not claim server sync. |
| Save route | `/save` | Open route with a known word query or app-supported save flow. Save a word. | Word is saved locally and matching review state is created or preserved. No production account claim is made. |
| Review route | `/review` | Start a review from saved state. Answer at least one prompt. | Answer creates a review event and updates review state. Session remains short and focused on active recall. |
| Due review | `/review/due` | Create or use a due item, then open due review. | Due queue derives from real `nextDueAt` and review state, not sample marketing counts. |
| Weak review | `/review/weak` | Create or use a weak item by answering incorrectly, then open weak review. | Weak queue derives from real weak score or wrong review history. |
| Weak sprint | `/review/weak-sprint` | Open weak sprint with weak items available. Complete at least one answer. | Sprint uses weak items and records real answer events. It does not use fake weakness or random easy distractors as the main proof. |
| Packs | `/packs` | Open pack listing. Start or inspect a pack preview. | Packs load from approved local/mock or public static data. Pack progress is not faked. |
| Pack detail | `/packs/[packId]` | Open a known pack detail page from the pack list. | Detail page loads, routes correctly, and does not claim paid pack completion without real progress. |
| Pricing | `/pricing` | Open pricing and interact with available CTAs. | No real checkout, subscription, invoice, billing portal, payment SDK, or paid entitlement is created. Placeholder behavior is clearly non-production. |
| Settings | `/settings` | Open settings and inspect account/billing-related copy. | Settings do not claim real auth, account recovery, cross-device sync, production billing, or subscription management unless those systems are later implemented and approved. |
| Word detail | `/word/[slug]` | Open a known word detail page. Save from the detail page if available. | Word content renders, save works locally, and review state is created or preserved. |
| localStorage continuity | Browser storage | Save and review a word, reload, close/reopen browser, and revisit dashboard/saved/review. | `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, and `vlx_daily_stats_v1` preserve continuity. |
| No fake mastery | Dashboard/review/saved | Review a new word once, including a fast correct answer if possible. Inspect mastery status. | Mastered is not granted unless delayed recall rules are satisfied. Mastered count derives from real review state. |
| No accidental checkout | `/pricing`, paywall prompts, pack surfaces | Click every pricing or upgrade CTA in the tested environment. | No real payment flow starts unless a later approved paid release explicitly enables it. No payment credentials are requested. |
| No accidental auth claim | `/settings`, `/dashboard`, `/saved` | Scan account, sync, login, persistence, and recovery copy. | UI does not imply account persistence, sign-in, account recovery, or cross-device sync is live before auth is implemented. |
| No accidental production billing claim | `/pricing`, `/settings`, gated surfaces | Scan plan, upgrade, and entitlement copy. | UI does not claim active paid subscription, invoice support, cancellation portal, refund automation, or production billing readiness before billing is implemented. |

## Required Evidence

Record for each smoke test run:

- Environment: local, preview/staging, or production.
- URL.
- Commit/deployment ID.
- Tester.
- Date and time.
- Browser.
- Pass/fail result.
- Screenshots or notes for failures.
- Any P0/P1/P2 classification.
- Owner and follow-up for each failure.

## P0 Failure Examples

- App does not load at the target URL.
- Save fails to create or preserve review state.
- Review answer fails to create an event.
- Due, Weak, or Mastered is not derived from real state.
- Mastery is faked.
- Real checkout or payment behavior appears without explicit approval.
- UI claims auth, account sync, or production billing before implementation.
- Track A, Webflow, Cloudflare production Workers, DNS, or production data is
  affected by Track B deployment.

## Recommendation

Do not deploy or launch production paid SaaS until this smoke test plan passes
in staging and production, and until account persistence, server-side SRS sync,
billing entitlement architecture, deployment readiness, analytics/reporting,
support/refund/legal copy, and production release QA are validated.
