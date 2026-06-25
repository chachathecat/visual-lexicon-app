# Track B Product/UI Readiness Audit

## Executive decision

- Private paid beta: **Conditional / Manual-only** — a Conditional Go for owner-managed, invite-only use.
- Public paid beta: **No-Go**
- Audit date: 2026-06-24
- Audited commit SHA: `13141144a18e7192435b035478f2b0e7f469300f`
- Repository: `chachathecat/visual-lexicon-app`
- Branch: `release/track-b-product-ui-readiness-audit`

Track B is usable for a tightly controlled private paid beta run where the owner
accepts browser-local learning state, no real checkout, no account sync, and the
known mobile overflow on the legacy word-detail route. It is not ready for public
paid beta.

## Audit method

- Environment: Windows PowerShell, Next.js dev server at
  `http://127.0.0.1:3006`, system Chrome via Playwright because the managed
  Playwright Chromium binary for this package revision was missing locally.
- Routes tested: `/dashboard`, `/review`, `/review/due`, `/review/weak`,
  `/review/weak-sprint`, `/saved`, `/packs`, `/packs/academic-vocabulary`,
  `/pricing`, `/word/dissonance`, `/settings`, plus the golden save flow
  `/save?slug=dissonance&source=word_page`.
- Real word slug used: `dissonance`, from `src/lib/mock-data.ts:44` and
  `src/lib/packs/mock-data.ts:13`.
- Real pack route used: `/packs/academic-vocabulary`, from
  `src/lib/packs/preview.ts:62`.
- Desktop viewport: 1440 x 900.
- Mobile viewport: 390 x 844.
- State fixtures used: browser localStorage seeded only with the approved SRS
  keys from `src/lib/srs/types.ts:1`: `vlx_saved_words_v1`,
  `vlx_review_state_v1`, `vlx_review_events_v1`, and `vlx_daily_stats_v1`;
  pack and plan keys were cleared or seeded only where existing tests already do
  so.
- Browser evidence: route pass showed HTTP 200 and no Next.js error overlay on
  all audited routes; Track B shell routes had 0px horizontal overflow on mobile;
  `/word/dissonance` had 259px overflow at 390px viewport.
- Validation commands:
  - `npm.cmd run typecheck`
    - First run exited 1 while authoring the new spec:
      `tests/product-ui-readiness.spec.ts(387,26): error TS2345`.
    - Final run exited 0 after tightening the route readiness helper.
  - `npm.cmd run lint`
    - Exited 0: `next lint` reported no ESLint warnings or errors.
  - `npm.cmd run build`
    - Exited 0: production build compiled successfully and generated 27 static
      app pages.
  - `npm.cmd run test -- --workers=1`
    - First run timed out after 904 seconds before returning counts.
    - Second run exited 1 because the manual QA dev server still owned
      `127.0.0.1:3006` (`EADDRINUSE`).
    - Final run exited 0: 930 passed, 1 skipped/fixme in 8.6 minutes.
  - `npx.cmd playwright test tests/product-ui-readiness.spec.ts --workers=1`
    - Final run exited 0: 7 passed, 1 skipped/fixme in 1.5 minutes.

## Current product mental model

The current app now presents a coherent Track B loop:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

In the rendered app this maps to:

- Today: `/dashboard` opens with Today's Memory Mission and Start review.
- Review: `/review`, `/review/due`, `/review/weak`, and `/review/weak-sprint`
  use the shared review session and write SRS state.
- Weak: Weak review and Weak Sprint are derived from real mistakes and
  `weakScore`.
- Packs: `/packs` shows learning plans and the Weekly Reviewed Words metric.
- Saved: `/saved` is a memory queue with Review now, Needs another pass, and
  Held in memory sections.
- Progress: no separate approved route exists; progress is currently embedded
  in dashboard, packs, daily stats, and local SRS state.

Evidence:

- Dashboard reads real local SRS data through `readDashboardV2Snapshot` and
  `getDueToday` in `src/components/views/dashboard-v2-view.tsx:63` and
  `src/components/views/dashboard-v2-view.tsx:68`.
- Saved queue sections read real `getDueToday`, `getWeakWords`, `getNewSaved`,
  and `getMastered` selectors in
  `src/components/views/saved-library-view.tsx:66`.
- Packs reads `reviewEvents`, `dailyStats`, and `getWeeklyReviewedWords` in
  `src/components/views/packs-v2-view.tsx:103` through
  `src/components/views/packs-v2-view.tsx:115`.

## Route-by-route findings

| Route | Primary action | Evidence | Confirmed issues | Unverified risks | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | Start today's review mission. | Rendered 200 on desktop/mobile; Start review link visible; mobile overflow 0px. Source: `src/components/views/dashboard-v2-view.tsx:316`. | None blocking. | External Google font loads failed in restricted local browser; not reproduced as production asset failure. | P2 risk only. | Keep dashboard as Today-first; preserve real SRS counts. |
| `/review` | Answer a focused recall card. | Rendered 200; heading visible; answer flow writes event/state. Source: `src/components/views/review-session-view.tsx:1233`, `src/components/views/review-session-view.tsx:1421`. | None blocking. | Screen-reader announcement quality beyond live-region presence was not audited with assistive tech. | P2. | Keep confidence-before-feedback and event write path. |
| `/review/due` | Review cards due now. | Rendered 200; direct route uses shared `ReviewSessionView`; due candidates are from `getDueToday` at `src/lib/srs/selectors.ts:96`. | None blocking. | Due explanation copy could be tested with more learner scenarios. | P2. | Keep due as default Start review target. |
| `/review/weak` | Repair fragile recall. | Rendered 200; weak candidates use `getWeakWords` at `src/lib/srs/selectors.ts:107`. | None blocking. | Mistake explanation remains locked/paywalled and AI is not implemented, as intended. | P2. | Preserve state-derived weak queue before adding AI. |
| `/review/weak-sprint` | Complete a short weak-word sprint. | Rendered 200; sprint route passes `mode="weak-sprint"` and `limit={5}` in `src/app/review/weak-sprint/page.tsx:10`. | None blocking. | More mobile tap-target evidence would be useful after copy polish. | P2. | Keep as a small repair mode, not a parallel quiz product. |
| `/saved` | Turn saved words into review queue actions. | Rendered 200; sections Review now, Needs another pass, Held in memory visible after hydration. Source: `src/components/views/saved-library-view.tsx:182`, `src/components/views/saved-library-view.tsx:188`, `src/components/views/saved-library-view.tsx:200`. | None blocking. | Empty-state support for large libraries needs further manual QA. | P2. | Keep Saved as queue-first, not bookmark-first. |
| `/packs` | Choose a learning plan and start/continue review. | Rendered 200; displays `Weekly Reviewed Words: 2 | Reviewed today: 0` when seeded with two unique review-event slugs. Source: `src/components/views/packs-v2-view.tsx:507`. | None blocking. | Planned IELTS/GRE packs are honest placeholders but content depth is not audited for public sale. | P1 public. | Keep placeholders honest until pack data exists. |
| `/packs/[packId]` | Start or inspect a specific pack plan. | `/packs/academic-vocabulary` rendered 200; pack id is from `src/lib/packs/preview.ts:62`. | None blocking. | Paid/full-plan boundaries need public-beta content audit. | P1 public. | Preserve free preview and honest unavailable states. |
| `/pricing` | Express paid beta interest without checkout. | Rendered 200; Lite and Pro use `UpgradePlaceholderButton` with `interestOnly` at `src/app/pricing/page.tsx:94`; no checkout copy at `src/app/pricing/page.tsx:133`. | Public paid beta blocked because checkout/billing/prices are not live. | Pricing TBD copy is acceptable for private/manual beta but not public sale. | P0 public. | Keep interest-only until billing and support gates are approved. |
| `/word/[slug]` | Save or review a specific word with memory state context. | `/word/dissonance` rendered 200; source uses legacy page layout at `src/app/word/[slug]/page.tsx:38` and memory panel at `src/app/word/[slug]/page.tsx:61`. | `VLX-AUDIT-P1-001`: mobile 390px viewport measured 259px horizontal overflow from legacy `.sidebar`, `.nav-list`, and `.app-main`. | Header primary Review links to `/review` instead of focused word review; memory panel does expose focused review. | P1. | Move word detail to Track B shell or fix legacy shell responsive width; make primary action focused review/save. |
| `/settings` | Understand local account, plan, and local-only boundaries. | Rendered 200; Account Sync and Billing state shown as Not connected/Not configured at `src/app/settings/page.tsx:124`. | Public paid beta blocked because account sync and billing are not connected. | Local plan/paywall trigger diagnostic panels are not polished learner settings. | P0 public, P2 private. | Keep honest local-only disclosures; remove diagnostics before public beta. |

## Save -> Review truthfulness

Confirmed flow:

1. Open `/save?slug=dissonance&source=word_page`.
2. The rendered page shows "Added to your review queue".
3. `vlx_saved_words_v1.dissonance` is written with source `word_page`.
4. `vlx_review_state_v1.dissonance` is created with `box: 0`,
   `mastery: "New"`, `correct: 0`, `wrong: 0`, `weakScore: 0`, and
   `nextDueAt` equal to the save timestamp.
5. `/saved` shows Dissonance in the queue after hydration.
6. `/review?mode=word&slug=dissonance` lets the learner answer the real card.
7. Choosing "Dissonance" and "I knew it" writes one review event and updates
   the state to `box: 1`, `mastery: "Learning"`, `correct: 1`,
   `streakCorrect: 1`, `lastReviewedAt`, `nextDueAt`, and
   `lastQuestionType: "definition_to_word"`.
8. `vlx_daily_stats_v1["2026-06-24"].reviewed` becomes 1.

Implementation evidence:

- Save reads and writes approved local stores in
  `src/components/views/save-landing-view.tsx:400` through
  `src/components/views/save-landing-view.tsx:417`.
- Save success copy and Review now CTA are at
  `src/components/views/save-landing-view.tsx:567` and
  `src/components/views/save-landing-view.tsx:619`.
- Storage creates saved review items in `src/lib/srs/storage.ts:426` and writes
  review answers atomically in `src/lib/srs/storage.ts:446` through
  `src/lib/srs/storage.ts:494`.
- The SRS engine creates the review event at `src/lib/srs/engine.ts:366` and
  daily stats at `src/lib/srs/engine.ts:385`.

## Weekly Reviewed Words

Weekly Reviewed Words is derived from real review-event activity, not saved-word
count.

Evidence:

- Selector implementation: `getWeeklyReviewedWords` reads
  `VlxReviewEventsStore`, filters events within the current UTC seven-day
  window, maps to slugs, and returns the `Set` size at
  `src/lib/srs/selectors.ts:143`.
- Packs view reads `reviewEvents` from localStorage and computes
  `weeklyReviewedWords` at `src/components/views/packs-v2-view.tsx:103` through
  `src/components/views/packs-v2-view.tsx:115`.
- Rendered browser check:
  - With `vlx_review_events_v1 = []`, `/packs` showed
    `Weekly Reviewed Words: 0 | Reviewed today: 0`.
  - With three events covering two unique slugs, `/packs` showed
    `Weekly Reviewed Words: 2 | Reviewed today: 0`.

## Accessibility and mobile findings

Confirmed:

- Track B shell routes expose a skip link as the first focus target in review,
  saved, packs, pricing, and settings. Source:
  `src/components/track-b/app-shell.tsx:170`.
- Review cards include an `aria-live="polite"` region and a progressbar at
  `src/components/views/review-session-view.tsx:1635` and
  `src/components/views/review-session-view.tsx:1701`.
- The new Playwright test tabs to the dashboard Start review link, the review
  answer button, and the pricing interest button.
- Mobile overflow was 0px for `/dashboard`, `/review`, `/review/due`,
  `/review/weak`, `/review/weak-sprint`, `/saved`, `/packs`,
  `/packs/academic-vocabulary`, `/pricing`, and `/settings`.

Confirmed issue:

- `VLX-AUDIT-P1-001`: `/word/dissonance` overflows horizontally on 390 x 844.
  Browser evidence: `documentElement.scrollWidth = 649`,
  `clientWidth = 390`, overflow `259`. Overflowing nodes included `.sidebar`,
  `.brand`, `.nav-list`, `.app-main`, `.page`, and `.detail-grid`.
  Source evidence: the root layout wraps non-Track-B-shell routes in
  `AppShell` at `src/app/layout.tsx:19`; `/word/[slug]` is excluded from the
  Track B shell route prefix list in `src/components/app-shell.tsx:9` through
  `src/components/app-shell.tsx:18`; mobile legacy nav uses
  `repeat(5, minmax(120px, 1fr))` at `src/app/globals.css:1918`.

Unverified:

- Screen-reader announcement quality was inferred from semantics and not tested
  with a screen reader.

## Paywall and monetization findings

Confirmed:

- Pricing is interest-only. Lite and Pro actions use
  `UpgradePlaceholderButton` with `interestOnly` at
  `src/app/pricing/page.tsx:94` through `src/app/pricing/page.tsx:97`.
- Pricing explicitly says no checkout is live, pricing is not final, and
  submitting does not create an account or charge a card at
  `src/app/pricing/page.tsx:133`.
- Settings says Account Sync is Not connected and Billing is Not configured at
  `src/app/settings/page.tsx:124` through `src/app/settings/page.tsx:129`.
- Dashboard and low-count save flow rendered with no `[data-paywall-trigger]`.
- Upgrade interest records are local-only; `upgrade-interest.ts` notes paid beta
  interest should never block the learning flow at
  `src/lib/upgrade/upgrade-interest.ts:154`.

Public paid beta remains No-Go because the canonical paid-beta gates still
require account sync, monitoring, privacy, accessibility, support, refund, and
rollback readiness before public sale.

## Confirmed findings

| Issue ID | Route | Severity | Status | Evidence | Reproduction | User impact | Beta impact | Recommended correction | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VLX-AUDIT-P0-001 | `/pricing`, `/settings`, cross-route | P0 | Confirmed for public beta; not private manual beta | `src/app/pricing/page.tsx:94`, `src/app/pricing/page.tsx:133`, `src/app/settings/page.tsx:124` | Open `/pricing`; observe interest-only CTAs and no checkout. Open `/settings`; observe Account Sync Not connected and Billing Not configured. | Public paid users cannot buy, recover, sync, or manage paid access. | Public paid beta No-Go; private manual beta can continue with explicit owner-managed expectations. | Keep interest-only; implement approved billing/account/support gates in separate authorized work. | High |
| VLX-AUDIT-P1-001 | `/word/[slug]` | P1 | Confirmed | Browser metric at 390 x 844: overflow 259px. Source: `src/components/app-shell.tsx:9`, `src/app/globals.css:1918`, `src/app/word/[slug]/page.tsx:38`. | Open `/word/dissonance` at 390 x 844 and evaluate `document.documentElement.scrollWidth - document.documentElement.clientWidth`. | Mobile learners can accidentally pan horizontally on a word detail page. | Conditional private beta risk; not a core review-state blocker. | Move word detail into Track B shell or fix legacy AppShell responsive layout. | High |
| VLX-AUDIT-P1-002 | `/word/[slug]` | P1 | Confirmed | Header Review link points to `/review` at `src/app/word/[slug]/page.tsx:45`; focused review link exists only inside `WordMemoryStatePanel` at `src/app/word/[slug]/page.tsx:61`. | Open `/word/dissonance`; inspect the primary header action and memory panel. | The obvious Review action may start generic review rather than this word. | Private beta can continue; public clarity should improve. | Make word detail primary action `Review this word` or `Save to review` with focused route. | Medium |
| VLX-AUDIT-P2-001 | `/dashboard`, `/packs` | P2 | Confirmed local-environment console noise | Browser console reported `ERR_NETWORK_ACCESS_DENIED` for `fonts.gstatic.com` and local `favicon.ico` 404. | Run local rendered audit in restricted network environment. | Cosmetic/dev QA noise; app content still rendered. | No private beta blocker. | Self-host fonts or tolerate the local restriction; add favicon if desired. | Medium |
| VLX-AUDIT-P2-002 | `/settings` | P2 | Confirmed | Local plan and paywall trigger diagnostics are rendered by `src/app/settings/page.tsx:159` and `src/app/settings/page.tsx:161`. | Open `/settings`. | Learners see implementation/diagnostic surfaces instead of quiet settings. | Acceptable for owner-run private beta, not polished public beta. | Hide diagnostics behind an owner/debug mode before broader beta. | High |

## Suspected risks

| Issue ID | Route | Severity | Status | Evidence | Reproduction | User impact | Beta impact | Recommended correction | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VLX-AUDIT-RISK-001 | `/review/*` | P2 | Suspected | Review has live region and progressbar source evidence, but no screen-reader run was performed. | Use NVDA/VoiceOver through answer, confidence, feedback, summary. | Feedback may be verbose or unclear to screen-reader users. | Private beta should include manual a11y pass. | Run assistive-tech QA before expanding invite pool. | Medium |
| VLX-AUDIT-RISK-002 | `/packs` | P1 public | Suspected | IELTS/GRE plans are placeholders in `src/lib/packs/preview.ts:74` and `src/lib/packs/preview.ts:89`. | Inspect `/packs`; planned pack cards show unavailable/placeholder states. | Public paid users may expect real exam content. | Public paid beta No-Go until content is ready or scoped out. | Keep placeholders honest; do not sell unavailable plans. | Medium |

## Unverified items

- Production CDN behavior for fonts and external images was not verified because
  local browser network access was restricted.
- Real auth/account sync behavior was not verified beyond current Settings
  status copy; no runtime auth changes were made.
- Payment, billing, refund, cancellation, and support operations were not
  exercised because they are intentionally not implemented.
- Assistive technology behavior was not verified with a screen reader.

## P0 blockers

- `VLX-AUDIT-P0-001`: Public paid beta is blocked by missing real payment,
  billing, account sync, support, refund, and operational readiness. This does
  not block a private, manually operated beta if users are told learning state is
  browser-local and checkout is not live.

## P1 improvements

- `VLX-AUDIT-P1-001`: Fix `/word/[slug]` mobile overflow.
- `VLX-AUDIT-P1-002`: Make `/word/[slug]` primary action focused on that word.
- `VLX-AUDIT-RISK-002`: Keep unavailable exam packs out of paid claims.

## P2 polish

- `VLX-AUDIT-P2-001`: Reduce font/favicon console noise.
- `VLX-AUDIT-P2-002`: Move Settings diagnostics out of the learner-facing UI.
- Run a screen-reader pass for the review answer and feedback loop.

## Proposed implementation sequence

Use small, reviewable PR phases:

1. **#73 Track B design tokens / app shell v2**  
   Keep current Track B shell and token work stable; no rollback needed.
2. **#74 Dashboard v2: Today's Memory Mission**  
   Maintain the current Today-first dashboard and protect real SRS counts.
3. **#75 Review Session v2**  
   Preserve confidence-before-feedback and atomic event/state writes; add
   assistive-tech QA evidence.
4. **#76 Saved Library v2**  
   Keep queue sections tied to Due, Weak, New, and Mastered selectors.
5. **#77 Packs v2**  
   Keep planned pack placeholders honest; avoid paid claims for missing content.
6. **#78 Pricing / Paywall v2**  
   Continue interest-only paid beta capture until explicit billing approval.
7. **#79 Manual QA execution report**  
   Record the private beta manual run, including `/word/[slug]` overflow status.
8. Add a narrow follow-up PR to move `/word/[slug]` into the Track B shell or fix
   legacy AppShell responsive width.

## Explicit Go / No-Go recommendation

- Owner-managed, invite-only use must acknowledge browser-local state, no live
  checkout, no account sync, and the `/word/[slug]` mobile overflow. The core
  save -> review -> event -> state loop is confirmed.
- Public paid beta: **No-Go**. Do not open public paid access until billing,
  account sync, support, refund/cancellation, privacy, accessibility, monitoring,
  rollback, and content gates pass.

## Untouched systems

This audit PR changed only:

- `docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md`
- `tests/product-ui-readiness.spec.ts`

Confirmed untouched:

- Payment
- Billing
- Auth
- DNS
- Production data
- Webflow
- Cloudflare Workers
- R2 production
- Secrets
- Environment variables
- Deployment configuration
- Runtime UI

No runtime UI changes.
