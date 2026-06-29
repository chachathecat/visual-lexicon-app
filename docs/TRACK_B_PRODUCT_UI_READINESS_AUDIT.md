# Track B Product/UI Readiness Audit

## Executive Summary

- Private paid beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**
- Audit refresh date: 2026-06-29
- Audited branch: `trackb/product-ui-readiness-audit`
- Audited base: `origin/main` at `6a4db80b9671dcc3e7ca74ea8a8156546c3dfcf1`
  after PR #136, Owner Command Center planner.
- Repository: `chachathecat/visual-lexicon-app`
- Scope: Track B learning app product/UI readiness only.
- Runtime scope: **No runtime UI changes**. This PR records audit docs and a
  focused contract test only.

The core local learning loop is real enough for owner-managed manual beta:
save creates or preserves review state, review answers write events and update
memory state, and Due, Weak, and Mastered are derived from local review state.
The product should still be presented as browser-local, no-checkout, and
manual-owner-operated.

Public paid beta remains blocked. The app still lacks account-owned learning
persistence, server-authoritative entitlements, real billing/payment flows,
provider policy, production monitoring, privacy/support/refund operations, and
public launch safety gates. Canonical monetization prices and capabilities also
are not yet reconciled with the visible pricing UI.

## Report Status And Precedence

- Report type: Track B product/UI readiness audit, docs/tests-only refresh.
- Report version: 2
- This report supersedes the static typed product/UI readiness baseline v1 in
  `src/lib/product-ui-readiness/product-ui-readiness-audit.ts` only for
  product/UI Go/No-Go decisions on the audited branch.
- The typed v1 contract remains historical and contains pre-rendered-audit
  assumptions. Its `getP0Blockers()` helper must not be used as the current automated release gate until a separate contract-reconciliation PR updates it.
- This report does not supersede canonical non-UI blockers involving payment,
  billing, account sync, support, privacy, refunds, production operations, or
  deployment.
- This PR does not implement FCT-070, ACC-010, roadmap status changes, or
  auto-merge.

## Audit Method

Evidence was gathered from the current source tree, existing route contracts,
storage contracts, product-quality docs, and existing Playwright coverage. This
refresh did not run browser QA while drafting the audit; validation results for
this PR are reported in the PR body and final response after commands run.

Primary source files reviewed:

- Routes under `src/app`
- SRS state and selectors in `src/lib/srs`
- Review session UI in `src/components/views/review-session-view.tsx`
- Dashboard, Saved, Save, Packs, Pricing, Settings, and Word views
- Pack progress and preview contracts in `src/lib/packs`
- Upgrade interest and local entitlement contracts
- Analytics event contracts in `src/lib/analytics`
- Operating docs: `docs/golden_user_flows.md`,
  `docs/product_quality_rubric.md`, `docs/security_and_permissions.md`,
  `docs/release_checklist.md`, monetization v1 docs, and `PLANS.md`

## Current Product Status

Implemented and suitable for manual owner-run validation:

- `/` redirects to `/dashboard`, making dashboard the Track B app entry.
- Save creates or preserves `vlx_saved_words_v1` and
  `vlx_review_state_v1`.
- Review answers atomically update `vlx_review_state_v1`,
  `vlx_review_events_v1`, and `vlx_daily_stats_v1`.
- Due, Weak, New, and Mastered selectors derive from review state.
- Weekly Reviewed Words derives from review events.
- Saved Library is already framed as a memory queue rather than static storage.
- Due, Weak, Focused Word, Hub, and Weak Sprint review modes exist.
- Academic Vocabulary pack preview and pack progress exist locally.
- Pricing and paywall CTAs capture local upgrade interest only when no external
  beta URL is configured.
- Minimal Supabase Magic Link session boundary exists for private dogfood, but
  learning data remains browser-local.

Not implemented for public paid beta:

- Account-owned saved words, review state, review events, daily stats, or pack
  progress.
- Server-authoritative entitlement enforcement for the learning app.
- Real checkout, billing, subscription, invoice, billing portal, webhook, or
  payment-provider integration.
- Public support, refund/cancellation, privacy, monitoring, alerting, rollback,
  and incident operations.
- Production-grade IELTS/GRE pack content and paid pack entitlement enforcement.
- AI mistake explanation and multilingual page generation.
- Production analytics pipeline beyond local/dataLayer contracts.

## Route Inventory

| Route | Current behavior | Readiness |
| --- | --- | --- |
| `/` | Redirects to `/dashboard`. | OK. Not a separate product surface. |
| `/dashboard` | Renders `DashboardV2View` with Today Memory Mission, Start Review, real due/weak/new/mastered state, and local reading panels. | Conditional private OK; public needs account-backed state and final hierarchy. |
| `/saved` | Renders `SavedLibraryView`; groups Review now, Needs another pass, Held in memory, and New from local SRS state. | Conditional private OK; public needs account persistence and continued queue-first framing. |
| `/save?slug=dissonance&source=word_page` | Resolves the word and writes saved word plus initial review state. | P0 contract satisfied locally; keep covered. |
| `/save?slug=dissonance&source=alias_search` | Supported by the save source union and alias search source contract; must save canonical slug, not an invented alias card. | Conditional private OK for known aliases; unknown alias states must remain non-actionable. |
| `/save?slug=dissonance&source=extension` | Supported by `buildExtensionSaveUrl()` and normalized source handling. | Conditional private OK; must not store browsing history, page content, or extension secrets. |
| `/review` | Mixed/default review session from local due, weak, saved, or starter candidates. | Conditional private OK; public needs account persistence and production a11y evidence. |
| `/review?mode=due` | Query-mode due review via `parseReviewRouteContract()`. | Conditional private OK; due comes from `nextDueAt`. |
| `/review?mode=weak` | Query-mode weak review via `parseReviewRouteContract()`. | Conditional private OK; weak comes from mastery/weakScore/mistakes. |
| `/review/due` | Direct due route passing `mode="due"`. | Conditional private OK. |
| `/review/weak` | Direct weak route passing `mode="weak"`. | Conditional private OK. |
| `/review/weak-sprint` | Five-card weak sprint passing `mode="weak-sprint"` and `limit={5}`. | Conditional private OK; keep repair-focused. |
| `/packs` | Pack catalog/product surface from `getPackPreviewCatalog()`, including available Academic Vocabulary and planned IELTS/GRE placeholders. | Conditional private OK; public content and entitlement blockers remain. |
| `/packs/academic-vocabulary` | Supported pack detail generated from `packPreviewIds` and current pack reader data. | Conditional private OK; pack progress must remain event-derived. |
| `/packs/[packId]` | Static pack detail for known preview IDs; unknown IDs 404. | Conditional private OK for known IDs only. |
| `/pricing` | Early access interest page. Lite/Pro use `UpgradePlaceholderButton` with `interestOnly`; no checkout live. | Conditional private OK; public P0 until canonical prices, billing, support, and entitlements exist. |
| `/settings` | Account status, local plan diagnostics, paywall trigger diagnostics, and local preferences copy. | Conditional private OK with disclosure; diagnostics should be removed or gated before broader beta. |
| `/word/dissonance` | Static/mock word page with local `WordMemoryStatePanel`; primary header Review link is generic while the panel offers focused review. | P1 private/public: legacy shell/mobile and CTA hierarchy risk. |

Other existing routes such as `/login`, `/auth/confirm`, and
`/api/me/entitlements` are outside this UI audit scope. This PR does not edit
those routes.

## Core Funnel Inventory

| Funnel step | Current source of truth | Readiness judgment |
| --- | --- | --- |
| Visual metaphor | Static/mock word data and local visuals. | OK for manual beta; public content provenance and asset policy need final gates. |
| Save | `SaveLandingView`, `writeSavedWords()`, `createReviewItemFromSavedWord()`. | P0 satisfied locally. |
| Active recall | `ReviewSessionView` with answer, confidence, feedback, and summary. | P0 satisfied locally; P1 polish for focus and mobile proof remains. |
| Mistake record | Review events include result, selected/answer, responseMs, confidence, box/weakScore before/after. | P0 satisfied locally. |
| Spaced review | `applyReviewAnswer()` enforces 5-box SRS intervals and wrong-answer return. | P0 satisfied locally. |
| Mastery status | `getMasteryLabel()` only returns Mastered at box 5; delayed recall blocks premature box 5 promotion. | P0 satisfied locally. |
| Weekly Reviewed Words | `getWeeklyReviewedWords()` counts unique slugs from review events in the current UTC week. | P0 satisfied locally; public analytics pipeline missing. |
| Paid habit | Pricing/paywall capture local interest only. | Safe for manual beta; public paid beta P0 blocked. |

## LocalStorage And State Inventory

| Key | Current owner | Current role | Audit classification |
| --- | --- | --- | --- |
| `vlx_saved_words_v1` | `src/lib/srs/types.ts`, `src/lib/srs/storage.ts` | Saved word records by slug. | Approved learning key; must create/preserve review state. |
| `vlx_review_state_v1` | SRS storage and engine | Box, mastery, counts, weak score, due date, response metadata. | Approved learning key; source of Due/Weak/Mastered truth. |
| `vlx_review_events_v1` | SRS storage and analytics/retention | Append-style review answer history. | Approved learning key; source for Weekly Reviewed Words. |
| `vlx_daily_stats_v1` | SRS storage | Local daily reviewed/correct/wrong/mastered/weak/session counters. | Approved learning key; derived from answers only. |
| `vlx_pack_progress_v1` | `src/lib/packs/progress.ts` | Local pack preview start/completion and reviewed/correct counts. | Beta key; OK only when progress is driven by preview/review activity. |
| `vlx_plan_state_v1` | `src/lib/entitlements/local-entitlements.ts` | Client-side local plan preview/diagnostic state. | Never proof of paid access; public P0 if used as authorization. |
| `vlx_upgrade_interest_v1` | `src/lib/upgrade/upgrade-interest.ts` | Local interest records for pricing/paywall intent. | Attribution-only; never purchase, grant, receipt, or entitlement. |
| `vlx_pending_home_quiz` | Docs/tests and beta readiness helpers | Optional transition key; no active app writer found in current route surfaces. | Preserve as transition-only if reintroduced; do not compete with SRS keys. |

## Screen-By-Screen Audit

| Surface | Primary action clarity | Contribution to Weekly Reviewed Words | Key risks | Severity |
| --- | --- | --- | --- | --- |
| Dashboard | Good: Start Review is the first learning action. | Strong: due/weak/new/mastered read from state and lead to review. | Some supporting panels still add scan cost; public needs account-backed counts. | P1 public, P2 private. |
| Saved Library | Good: memory queue sections support Due/Weak/New/Mastered. | Strong: saved words route back into review. | Must avoid drifting back into static bookmark framing; large-library mobile scan needs QA. | P1 public, P2 private. |
| Save Landing | Clear: "Added to your review queue" and Review now. | Strong: save creates initial review state. | Unknown/missing slugs must not create fake state; storage error paths need manual evidence. | P1 public, P2 private. |
| Review | Clear and focused enough for manual beta. | Direct: every committed answer writes event/state/stats. | Screen-reader behavior and mobile ergonomics require broader manual evidence. | P1 public, P2 private. |
| Due Review | Clear: due route is state-derived. | Direct: due answers count toward weekly reviewed words. | Empty-state education can improve; public needs server source of truth. | P1 public. |
| Weak Review / Weak Sprint | Clear repair path from real weakness. | Direct: weak repair creates review events. | Future AI explanation must wait until SRS loop remains stable. | P1 public, P2 future AI. |
| Packs | Better than catalog: course/product framing exists. | Medium: pack previews lead to review and progress. | IELTS/GRE placeholders and mock/static pack fallback cannot support public paid claims. | P1 private if copy overpromises; P0 public if sold. |
| Pricing / Paywall | Safe but not conversion-ready: interest-only/no checkout. | Indirect: supports paid habit after learning loop. | Canonical prices/capabilities are not reflected; no billing/support/refund/account flow. | P0 public, P1 private copy. |
| Settings | Honest: account sync/billing not connected. | Low direct contribution. | Local plan/paywall trigger panels feel diagnostic; support/privacy/reset settings not productized. | P1 public, P2 private. |
| Word Detail | Useful memory state panel. | Medium: focused review link exists in panel. | Legacy shell/mobile risk remains; header Review CTA is generic. | P1. |

## Placeholder And Planned Feature Inventory

Search terms audited: `placeholder`, `planned`, `TODO`, `FIXME`, `mock`,
`fallback`, `Billing is not connected`, `Paid beta placeholder`,
`coming soon`, `not implemented`, `beta interest`, and `upgrade interest`.

| Finding | Evidence | Classification |
| --- | --- | --- |
| No active runtime `TODO` / `FIXME` matches found; docs contain these terms as audit prompts. | `rg "TODO|FIXME" src docs tests` returns only audit/planning docs. | OK for audit-only beta docs. |
| Pricing and paywall say paid beta interest only; billing not connected. | `UpgradePlaceholderButton`, `PaywallPrompt`, `/pricing`. | OK/private safety; P0 blocker before public paid beta. |
| Canonical Lite/Pro prices exist but `/pricing` shows "Beta - pricing TBD". | Monetization JSON and `plan-catalog.v1.ts` list Lite USD 7.99 / KRW 7900 and Pro USD 14.99 / KRW 14900. | P0 blocker before public paid beta; P1 copy reconciliation before external manual beta. |
| `vlx_plan_state_v1` local plan preview. | `local-entitlements.ts`. | OK diagnostic only; P0 if used to authorize paid access. |
| IELTS/GRE pack placeholders. | `src/lib/packs/preview.ts` planned pack definitions. | OK if clearly marked; P1 before private if copy implies availability; P0 before public sale. |
| Mock/static pack and alias data. | `src/lib/packs/mock-data.ts`, `src/lib/packs/pack-reader.ts`, multilingual mock alias packs. | OK for local/manual beta with disclosure; P1 public content provenance. |
| Static pack fallback candidates in review. | `review-session-view.tsx` labels fallback candidates. | OK because labeled; P1 if fallback dominates real confusable logic. |
| AI mistake explanations planned later. | `paywall/triggers.ts`, local entitlement placeholder fields. | P2 future; do not implement before SRS loop/public gates. |
| Account sync not implemented for learning state. | Settings copy and account persistence docs. | Conditional private with disclosure; P0 public. |
| Support/refund/privacy placeholders in private beta invite packet docs. | `src/lib/private-beta-invite-packet`. | P1 before inviting external paid/manual participants unless owner fills final copy manually. |
| Login input placeholder. | `/login` approved learner email placeholder. | OK for private dogfood; not in paid UI scope. |

## P0 Issue List

P0 for public paid beta:

- `P0-PUBLIC-001`: No account-owned persistence for saved words, review state,
  review events, daily stats, or pack progress.
- `P0-PUBLIC-002`: No real checkout, subscription, billing portal, invoice,
  webhook, payment provider, or paid-entitlement grant path.
- `P0-PUBLIC-003`: Local `vlx_plan_state_v1` and upgrade interest are
  client-controlled and cannot authorize paid access.
- `P0-PUBLIC-004`: `/pricing` is interest-only and not reconciled with the
  canonical monetization JSON prices/capabilities.
- `P0-PUBLIC-005`: Support, refund/cancellation, privacy, monitoring,
  alerting, rollback, and public incident operations are not launch-ready.
- `P0-PUBLIC-006`: Public production analytics/reporting for Weekly Reviewed
  Words is not trusted server-side yet.
- `P0-PUBLIC-007`: IELTS/GRE and paid pack claims cannot be sold until content,
  entitlement, and pack progress truthfulness are verified.

P0 for private/manual beta:

- None found in the core local Save -> Review -> SRS loop during this audit
  refresh, assuming no real payment is offered and owner disclosures stay clear.

## P1 Issue List

- `P1-001`: Word detail still uses the legacy app shell and a generic header
  Review CTA; make focused Save/Review the obvious primary action.
- `P1-002`: Settings shows diagnostic local plan/paywall panels; gate or remove
  before broader beta.
- `P1-003`: Dashboard, Saved, and Packs should continue reducing scan cost so
  Today Memory Mission remains dominant.
- `P1-004`: Pricing copy must reconcile interest-only safety with canonical
  outcome/value messaging and prices before external paid conversion.
- `P1-005`: Packs need stronger 30-day plan/product framing and verified real
  IELTS/GRE content before paid claims.
- `P1-006`: Manual QA needs a current execution report for save, alias,
  extension, review, due, weak, packs, pricing, settings, word detail, mobile,
  keyboard, and storage probes.
- `P1-007`: Analytics coverage needs a clear route-to-event map for save,
  review start, answer, complete, weak repair, pack preview, pricing interest,
  paywall interest, and upgrade click.
- `P1-008`: Accessibility evidence must include mobile review ergonomics,
  keyboard-only review, live-region feedback quality, contrast, and screen
  reader checks before broader beta.

## P2 Issue List

- `P2-001`: Copy density and diagnostic wording should be trimmed after P0/P1
  contracts remain stable.
- `P2-002`: Continue polishing the premium/minimal visual system without adding
  decorative complexity.
- `P2-003`: Future AI mistake explanation remains deferred.
- `P2-004`: Future Supabase/account sync UI, multilingual pages, FCT-070,
  auto-merge, full factory activation, production payment integration, and
  B2B/Teacher/School functionality remain out of scope.

## Go / No-Go Recommendation

Private/manual beta: **Conditional Go**.

Conditions:

- Owner-operated and invite-only.
- No real payment, checkout, subscription, invoice, or billing portal.
- Participants are told learning state is browser-local unless explicit account
  sync work ships later.
- Support, refund/cancellation, privacy, and local-storage disclosure copy is
  filled before external participants are invited.
- Current manual QA is run and recorded.
- Any P0 found in save/review/state writes stops the beta.

Public paid beta: **No-Go**.

Public paid beta remains No-Go until account persistence, payment/provider
policy, server-authoritative entitlements, monitoring, privacy, support/refund,
accessibility, content, rollback, production analytics, and production safety
gates are satisfied.

## Private / Manual Beta Readiness

Conditional Go is reasonable because the local memory engine is materially
present:

- Save creates or preserves review state.
- Review answers create events and update memory state.
- Due, Weak, and Mastered are real-state-backed.
- Upgrade interest does not grant entitlement.
- Settings and pricing disclose missing account sync/billing.

Remaining private/manual conditions:

- Run a fresh manual QA execution report after this audit.
- Fill participant-facing support/refund/privacy/local-storage disclosures.
- Treat `vlx_plan_state_v1` as diagnostic only.
- Do not accept payment through the app.
- Keep route and storage probes focused on `dissonance` and safe mock data.

## Public Paid Beta Readiness

Public paid beta is No-Go because:

- Account sync is not the source of truth for memory state.
- Paid access cannot be created, audited, refunded, canceled, or revoked.
- Canonical monetization values are not reconciled with the visible UI.
- Pricing/paywall behavior is interest capture, not purchase.
- Public support, privacy, refund, monitoring, and rollback gates are missing.
- Paid pack access and content quality are not production-ready.
- Server-side reporting for Weekly Reviewed Words is not ready.

## Accessibility And Mobile Risk

Known strengths:

- Track B shell includes skip link and accessible navigation labels.
- Review includes `aria-live="polite"` and progressbar semantics.
- Existing accessibility release gate tests cover keyboard-only review flow,
  live-region behavior, and 320px/200 percent reflow on core routes.
- Current performance tests guard local word visuals and remote render-blocking
  font stylesheet usage.

Risks:

- Word detail still sits outside the Track B shell route-prefix list and should
  be checked or migrated.
- Screen-reader quality for feedback and summary has not been fully human
  verified.
- Mobile thumb ergonomics for rapid answer/confidence selection need manual QA.
- Settings diagnostics can be cognitively noisy for non-owner participants.

## Performance And Loading-State Risk

- Core local visuals are constrained by existing performance budget tests.
- Pack reader can fall back to safe mock/static data when no static pack base
  URL exists.
- Public beta still needs production CDN, image policy, monitoring, and slow
  network checks.
- Loading and empty states are mostly honest, but large saved libraries and
  missing pack data need broader QA.

## Analytics And Event Coverage

Current local event taxonomy includes:

```txt
vlx_save_word
vlx_saved_library_view
vlx_word_memory_state_view
vlx_review_start
vlx_review_answer
vlx_review_complete
vlx_pack_preview_start
vlx_pack_preview_complete
vlx_pricing_interest
vlx_paywall_interest
vlx_quiz_start
vlx_quiz_answer
vlx_quiz_complete
vlx_review_state_update
vlx_due_review_start
vlx_weak_review_start
vlx_alias_search
vlx_save_word_click
vlx_extension_open_app
vlx_extension_save_click
vlx_extension_review_start
vlx_extension_quiz_later_click
vlx_exam_pack_preview_view
vlx_exam_pack_preview_start
vlx_paywall_view
vlx_upgrade_click
```

Coverage gaps:

- No production analytics sink or dashboard is configured by this audit.
- Weekly Reviewed Words is computed locally from events, not server-side.
- Public beta needs route-to-event acceptance criteria and privacy-safe
  production reporting.
- Upgrade interest must remain attribution-only and must not become entitlement.

## Recommended Next PR Sequence

The current rebuild sequence is documented in
`docs/TRACK_B_UI_REBUILD_SEQUENCE.md`:

1. Dashboard v2 - Today's Memory Mission.
2. Review Session v2 - focused memory loop.
3. Saved Library v2 - Due/Weak/New/Mastered queue.
4. Packs v2 - 30-day plan/product cards.
5. Pricing/Paywall v2 - outcome-based conversion.
6. Manual QA execution report.
7. Private beta gate.

Relationship to the historical typed v1 sequence:

- #73 Track B design tokens / app shell v2
- #74 Dashboard v2: Today's Memory Mission
- #75 Review Session v2
- #76 Saved Library v2
- #77 Packs v2
- #78 Pricing / Paywall v2
- #79 Manual QA execution report

Do not implement FCT-070, ACC-010, auto-merge, real payment, real account sync,
new runtime API routes, middleware changes, or roadmap status changes in this
audit PR.

## Safety Confirmation

This audit PR does not implement runtime product changes.

This audit PR does not include payment, billing, account sync, production
deployment, Webflow, Cloudflare Worker, R2 production object, DNS, secrets,
provider settings, middleware, or production data changes.

This audit PR does not implement FCT-070 or ACC-010.

This audit PR does not enable auto-merge.

This audit PR does not change roadmap statuses.

No runtime UI changes.
