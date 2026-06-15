# Track B Product/UI Readiness Audit

Audit date: 2026-06-15  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/track-b-product-ui-readiness-audit`  
PR: `#72 Track B Product/UI Readiness Audit`  
Scope: Track B learning app surfaces after PR #71.

## Executive Summary

Visual Lexicon Track B has the right learning-loop foundation: Save creates or
preserves review state, review answers write events and update memory state, and
Due / Weak / Mastered are derived from real local SRS state. The current UI is
credible for owner-run evaluation, but it is not ready for a public paid beta.

Current verdict:

- Private paid beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**

The next rebuild should focus the app around this mental model:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

North Star Metric remains **Weekly Reviewed Words**. Saved-word count, pack
previews, and upgrade interest matter only when they increase real weekly
review behavior.

## P0 Blockers

- No real account/server sync for saved words, review state, or review events.
- No real payment, checkout, subscription, billing, or entitlement path.
- No full-route product/UI manual QA report is recorded for this branch.
- Accessibility, keyboard/focus, screen-reader, and mobile evidence is incomplete.
- Privacy, support, account recovery, data reset, and rollback operations are not launch-ready.

## P1 Improvements

- Dashboard needs a stricter Today first hierarchy.
- Review Session needs explicit confidence and less mode-switching inside the answer flow.
- Saved page needs queue tabs instead of a bookmark-list feel.
- Packs need a course/plan model instead of a catalog model.
- Pricing and paywall triggers need sharper outcome clarity.
- Analytics readiness needs a route-to-event mapping for Weekly Reviewed Words.

## P2 Polish

- Copy density and MVP/debug language should be reduced after safety evidence is in place.
- Visual cue styling should be made consistent across cards, packs, and review.
- Progress should become a later surface after review habit proof and account sync.

## Per-Route Audit Matrix

| Surface | Primary action | Current strengths | Main UI/Product risks | Rebuild direction |
| --- | --- | --- | --- | --- |
| `/dashboard` | Start today's review mission. | Today Memory Mission exists; Due / Weak / New / Mastered are real-state counts. | Too many modules compete with Start Review; mobile/accessibility evidence missing. | Center Today's Memory Mission, Start due review, Due / Weak / New / Mastered, Continue pack, Recently saved, contextual upgrade only. |
| `/review` | Answer one recall question and advance memory state. | Answers write review events and SRS state; summary shows real movement. | Header choices increase Hick load; no explicit confidence control; focus flow needs evidence. | One card, one question, answer, confidence, immediate feedback, review_state, review_events, honest nextDueAt. |
| `/review/due` | Review cards due now. | Due candidates come from `nextDueAt` and box state. | Inherits mixed review complexity; due-date comprehension needs QA. | Make due review the default Start Review target when due words exist. |
| `/review/weak` | Practice fragile words. | Weak candidates come from real misses and weakScore. | Difference between Weak Review and Weak Sprint is not crisp enough. | Make Weak a repair queue with mistake count, weakScore, and focused feedback. |
| `/review/weak-sprint` | Complete a five-card weak sprint. | Uses real weak state and updates the same records. | Needs clearer repair framing, mobile tap targets, and contextual paywall timing. | Keep it short, state-driven, and mistake-focused. |
| `/saved` | Turn saved words into review queues. | Saved cards show real state only when present. | Still feels like a bookmark list; no Due / Weak / New / Learning / Mastered / All tabs. | Rebuild as a review queue. |
| `/packs` | Choose a learning path. | Academic Vocabulary can start hub review; planned packs are honest placeholders. | Catalog framing is weak for paid learning; content depth needs audit. | Rebuild as Academic Vocabulary, IELTS Writing, GRE Visual Verbal course paths. |
| `/packs/[packId]` | Start or continue a specific pack. | Preview words and progress are honest. | Needs syllabus, next lesson, and free/paid plan hierarchy. | Course detail with outcome, next review, preview sample, locked plan, honest progress. |
| `/pricing` | Understand paid outcomes without creating paid access. | Free/Lite/Pro draft outcomes are close; billing disclaimer is clear. | Public copy needs support/payment/account-sync readiness; value contrast can be sharper. | Sell outcomes: memory start, daily habit, weak-word repair and exam prep. |
| `/save` | Confirm a saved word is queued for review. | Save creates or preserves review state; unknown words do not create fake state. | Save success should make focused review feel like the natural next step. | Keep the page short and drive directly into focused review. |
| `/word/[slug]` | Save or review this word with real memory state. | Memory panel reads saved state, review state, and event count. | SRS details need better hierarchy; visual/focus labels need QA. | Support the loop: save, review this word, see honest state, return to queue. |
| `/settings` | Understand local-only plan/preferences boundaries. | Avoids real account, auth, billing, and payment settings. | Debug-like local plan/paywall surfaces are not learner-facing beta polish. | Keep settings quiet: disclosure, local data controls later, no fake account or billing. |

## Per-Route Criteria Ratings

The typed contract in
`src/lib/product-ui-readiness/product-ui-readiness-audit.ts` stores the full
field-by-field rating for every route. This table summarizes the same criteria
for review planning.

| Surface | Action clarity | Cognitive / Hick / Fitts / Gestalt | Save -> Review loop | Review state / Due / Weak / Mastered truth | Paywall / pricing / free-paid value | Mobile / accessibility / keyboard | Performance | Analytics | Paid beta blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | Adequate | Partial | Adequate | Clear, real SRS counts | Partial, context needed | Medium risk, evidence missing | Low risk | Adequate local events | Account sync, support, privacy, payment |
| `/review` | Adequate | Partial | Adequate | Clear, writes events and state | Partial summary triggers | Medium risk, confidence/focus evidence missing | Low risk | Adequate local events | Account sync, accessibility, mobile QA |
| `/review/due` | Clear | Partial | Adequate | Clear, due from `nextDueAt` | Not applicable | Medium risk, focus evidence missing | Low risk | Adequate local events | Account sync, accessibility, mobile QA |
| `/review/weak` | Clear | Partial | Adequate | Clear, weak from mistakes/weakScore | Adequate but contextual | Medium risk, mode distinction needs QA | Low risk | Adequate local events | Account sync, accessibility, mobile QA |
| `/review/weak-sprint` | Adequate | Partial | Adequate | Clear, no fake weak sprint | Adequate but timing-sensitive | Medium risk, tap target evidence missing | Low risk | Adequate local events | Account sync, accessibility, mobile QA |
| `/saved` | Partial | Partial | Adequate | Clear, no fake mastery | Not applicable | Medium risk on dense lists | Low risk | Adequate local events | Account sync, data reset, support |
| `/packs` | Partial | Partial | Partial | Adequate where review starts | Partial, plan model unclear | Medium risk on catalog grids | Low risk | Partial | Content audit, account sync, payment |
| `/packs/[packId]` | Adequate | Partial | Partial | Adequate where preview review starts | Partial, preview/full split unclear | Medium risk on preview grids | Low risk | Partial | Content audit, account sync, payment |
| `/pricing` | Adequate | Adequate | Adequate conceptually | Not applicable | Adequate draft, public copy not final | Medium risk, evidence missing | Low risk | Adequate local interest events | Payment, entitlement, support, privacy |
| `/save` | Clear | Adequate | Clear | Adequate, creates/preserves review state | Partial save-limit context | Medium risk, storage-error QA missing | Low risk | Adequate local events | Account sync, storage disclosure |
| `/word/[slug]` | Adequate | Adequate | Adequate | Clear, memory panel reads real state | Not applicable | Medium risk, label/focus evidence missing | Low risk | Adequate local events | Account sync, support, data portability |
| `/settings` | Partial | Partial | Not applicable | Not applicable | Partial, debug-like plan/paywall panels | Medium risk, learner-facing polish missing | Low risk | Partial | Auth/account/payment/support not implemented |

## Recommended UI Rebuild Sequence

1. **#73 Track B design tokens / app shell v2**  
   Set calmer premium layout, navigation, spacing, focus, and responsive foundations.

2. **#74 Dashboard v2: Today's Memory Mission**  
   Make Today the first screen and put review behavior above saved-library browsing.

3. **#75 Review Session v2**  
   Rebuild active recall around one card, confidence, feedback, review_state,
   review_events, and nextDueAt.

4. **#76 Saved Library v2**  
   Turn Saved into a review queue with Due, Weak, New, Learning, Mastered, and All.

5. **#77 Packs v2**  
   Reframe packs as course paths with honest preview and paid plan boundaries.

6. **#78 Pricing / Paywall v2**  
   Sell outcomes instead of quotas while preserving no-payment and no-fake-access boundaries.

7. **#79 Manual QA execution report**  
   Record route, mobile, keyboard, focus, accessibility, privacy, and golden-flow evidence.

## Future Surface Requirements

Dashboard v2 should center on:

- Today's Memory Mission
- Start due review
- Due / Weak / New / Mastered
- Continue pack
- Recently saved
- Upgrade trigger only when contextually relevant

Review Session v2 should center on:

- One card
- One question
- Image/definition/word recall
- Answer
- Confidence
- Immediate feedback
- `review_state` update
- `review_events` update
- Honest `nextDueAt`
- No fake mastery

Saved Library v2 should become a review queue, not a bookmark list:

- Due
- Weak
- New
- Learning
- Mastered
- All

Packs v2 should become a course/plan surface, not just a catalog:

- Academic Vocabulary
- IELTS Writing
- GRE Visual Verbal
- Preview for free users
- Full plan for paid users

Pricing / Paywall v2 should sell outcomes, not quotas:

- Free: Start remembering your first words.
- Lite: Build a daily visual memory habit.
- Pro: Fix weak words and prepare for exams.

## Safety Boundaries

This PR is docs/contracts/tests only.

- No runtime UI changes.
- No real API routes.
- No route handlers.
- No middleware.
- No database integrations.
- No Supabase, Prisma, Drizzle, Neon, Firebase, Cloudflare D1, or provider SDK.
- No payment, billing, subscription, checkout, invoice, paid entitlement, or paid access logic.
- No auth or account-sync implementation.
- No production data mutation.
- No env var changes.
- No deployment.
- No Webflow, Cloudflare, Vercel, DNS, or production setting changes.
- No fake mastery, fake pack progress, fake streaks, or fake paid access.
- No network calls.
- No browser storage writes.
- `npm audit fix` must not be run.

## Stop Conditions

Stop and ask for explicit approval if a task requires:

- Webflow publishing.
- Cloudflare production Worker changes.
- DNS changes.
- Payment, billing, checkout, subscription, invoice, or entitlement implementation.
- Auth, account sync API routes, database providers, migrations, or production data mutation.
- Secrets, API keys, passwords, tokens, billing credentials, or env var changes.
- New route groups beyond the approved Track B routes.
- Any UI that implies fake mastery, fake paid access, fake pack progress, or fake streaks.

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

## Safety Confirmation

This audit did not touch Webflow, Cloudflare Workers, auth, billing, DNS,
payment, secrets, production data, deployment settings, API routes, route
handlers, middleware, database providers, or runtime UI behavior.
