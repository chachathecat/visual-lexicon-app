# Track B Product/UI Readiness Audit

## Executive Summary

- Private/manual beta: **Conditional / Manual-only**
- Private paid beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**
- Audit refresh date: 2026-07-02
- Audited repository: `chachathecat/visual-lexicon-app`
- Audited branch: `release/track-b-product-ui-readiness-audit-v2`
- Audited base/current HEAD: `673e48e9aedc7d0eb52ca1298603c260b482e23b`
- Audited merge: PR #154, `release/track-b-goal-runway`
- Report version: 3
- Runtime scope: **Docs/tests only; no runtime UI changes.**

The post-PR #154 Track B app has a real local learning loop: saving a word
creates or preserves review state, review answers append events and update
memory state, and Due, Weak, and Mastered are derived from local SRS state.
That is enough for owner-run manual validation, provided the beta remains
invite-only, browser-local, and no-payment.

Public paid beta remains blocked. The current product still lacks
account-owned learning persistence, server-authoritative entitlement
enforcement, real checkout/billing, production support/refund/privacy
operations, production monitoring/rollback, public analytics reporting, and
paid pack/content entitlement proof.

## Report Status And Precedence

- This is the current human-readable Product/UI readiness audit for Track B
  after merged PR #154.
- This report supersedes the previous rendered audit dated 2026-06-29 for
  product/UI Go/No-Go decisions on the audited branch.
- The static typed baseline in
  `src/lib/product-ui-readiness/product-ui-readiness-audit.ts` remains
  historical v1 data and must not be treated as the current release gate.
- This report does not supersede canonical non-UI blockers involving auth,
  account sync, billing, payment, privacy, support, refunds, monitoring,
  deployment, or production data.
- This audit does not implement FCT-070, ACC-010, roadmap status changes,
  auto-merge, payment, account sync, provider integrations, or runtime routes.

## Audit Method

Evidence was gathered from the current source tree and existing docs/tests.
Primary files reviewed:

- `src/app/dashboard/page.tsx`
- `src/app/review/page.tsx`
- `src/app/review/due/page.tsx`
- `src/app/review/weak/page.tsx`
- `src/app/review/weak-sprint/page.tsx`
- `src/app/saved/page.tsx`
- `src/app/packs/page.tsx`
- `src/app/packs/[packId]/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/word/[slug]/page.tsx`
- `src/app/settings/page.tsx`
- `src/components/views/dashboard-v2-view.tsx`
- `src/components/views/review-session-view.tsx`
- `src/components/views/saved-library-view.tsx`
- `src/components/views/packs-v2-view.tsx`
- SRS selectors/storage/engine under `src/lib/srs`
- Pack preview/progress contracts under `src/lib/packs`
- Product operating docs listed in `AGENTS.md`

No browser QA was performed while drafting the audit. The validation commands
for this PR are recorded in the PR body and final response after they run.

## Current Product Status

Ready for manual owner validation:

- `/` redirects to `/dashboard`, so the learning app opens on the dashboard.
- `/dashboard` centers Today Memory Mission and routes to due review when due
  cards exist.
- `/saved` is a memory queue, not only a bookmark list.
- `/review`, `/review/due`, `/review/weak`, and `/review/weak-sprint` use the
  shared review session component.
- Review answers require answer selection plus confidence before memory state
  persists.
- Review events include answer/result/timing/confidence and box/weakScore
  before/after data.
- Weekly Reviewed Words is computed from review events, not saved counts.
- Pack progress is local and appears only after preview or review activity.
- Pricing and paywall controls capture interest only and do not grant paid
  access.

Not ready for public paid beta:

- Account-owned saved words, review state, review events, daily stats, and
  pack progress.
- Server-side Weekly Reviewed Words reporting.
- Server-authoritative paid entitlement enforcement.
- Checkout, subscription, invoice, billing portal, webhook, refund, or
  cancellation flows.
- Provider policy, payment incident handling, public support, privacy notices,
  monitoring, alerts, rollback, and production operating gates.
- Paid pack content and entitlement proof for IELTS/GRE/public paid claims.

## Route Inventory

| Route/surface | Current behavior | Readiness |
| --- | --- | --- |
| `/` | Redirects to `/dashboard`. | OK as app entry; not a separate learning surface. |
| `/dashboard` | `DashboardV2View` reads saved words, review state, review events, and daily stats; primary CTA is Start today's review. | Conditional private OK. Public needs account-backed state and production analytics. |
| `/review` | Mixed/default local review queue built from due, weak, saved, or starter cards. | Conditional private OK. Needs continued mobile/a11y evidence. |
| `/review?mode=due` | Query-mode due review via the route contract. | Conditional private OK; equivalent due source of truth. |
| `/review?mode=weak` | Query-mode weak review via the route contract. | Conditional private OK; equivalent weak source of truth. |
| `/review/due` | Direct due route using real `nextDueAt` state. | Conditional private OK. |
| `/review/weak` | Direct weak route using Weak mastery, weakScore, wrong answers, and boxes. | Conditional private OK. |
| `/review/weak-sprint` | Five-card weak repair route using the same SRS writer. | Conditional private OK. Keep it repair-focused. |
| `/saved` | `SavedLibraryView` groups Review now, Needs another pass, Saved and waiting, and Held in memory. | Conditional private OK. Public needs account persistence and large-library QA. |
| `/packs` | `PacksV2View` frames Academic Vocabulary, IELTS, and GRE as plans with local progress. | Conditional private OK with honest placeholders. Public paid pack claims blocked. |
| `/packs/academic-vocabulary` | Pack detail generated from pack preview data; progress summary remains local/activity-derived. | Conditional private OK. |
| `/pricing` | Early access interest page. No checkout is live and upgrade clicks are interest-only. | Safe for manual beta. P0 blocker for public paid beta. |
| `/word/dissonance` | Static/mock word detail page with legacy shell, visual card, generic Review link, and memory-state panel. | P1: focused Save/Review hierarchy and mobile overflow need runtime follow-up. |
| `/settings` | Account status, browser-local state disclosure, local plan diagnostics, paywall trigger diagnostics, preferences copy. | Conditional private OK for owner testing. P1 before broader beta. |

Supporting Save -> Review routes remain critical even though they are outside
the requested route list:

- `/save?slug=dissonance&source=word_page`
- `/save?slug=dissonance&source=alias_search`
- `/save?slug=dissonance&source=extension`

These must keep creating/preserving `vlx_saved_words_v1` and
`vlx_review_state_v1` without storing page content, browsing history, secrets,
or fake cards.

## Screen-By-Screen Audit

| Surface | Primary user action clarity | Cognitive load | Weekly Reviewed Words contribution | Save -> Review loop clarity | Due / Weak / Mastered truthfulness | Paywall trigger placement | Accessibility and mobile risks | Fake mastery risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | Good: Start review is the dominant action. | Medium: secondary panels still add scan cost. | Strong: routes users toward review events. | Good: mission links back to queue/review. | Strong: counts come from selectors. | Contextual; not overexposed. | Mobile shell mostly covered; first viewport still needs manual QA. | Low. |
| `/review` | Good: one card, answer, confidence, feedback. | Medium-low: answer flow is clear, but mode context is still visible. | Direct: every committed answer writes an event. | Good for saved/focused modes. | Strong: SRS engine owns updates. | Minimal. | Needs screen-reader/live-region and thumb ergonomics evidence. | Low. |
| `/review?mode=due` and `/review/due` | Clear: review due cards now. | Low. | Direct. | Good when save makes due/new cards. | Strong: due comes from `nextDueAt`. | Minimal. | Empty state and mobile speed need QA. | Low. |
| `/review?mode=weak` and `/review/weak` | Clear: repair fragile recall. | Low. | Direct. | Good after wrong answers. | Strong: weak comes from state/mistakes. | Contextual only. | Needs focus and repeated-miss QA. | Low. |
| `/review/weak-sprint` | Adequate: five-card sprint is understandable. | Low-medium: must not feel like a separate game. | Direct. | Good after weak state exists. | Strong if candidates stay weak-derived. | Contextual only. | Needs mobile one-handed checks. | Low. |
| `/saved` | Good: memory queue framing is present. | Medium: multiple sections and card metadata can grow dense. | Strong: Review now/weak links drive events. | Strong: saved words become queue items. | Strong: sections derive from review state. | Mostly absent, appropriate. | Large libraries and 320px layouts need QA. | Low. |
| `/packs` | Adequate: choose/continue plan. | Medium: catalog, plan, progress, and Pro note compete. | Medium: pack preview routes into review. | Partial: pack preview is not the same as saving encountered words. | Adequate when progress stays activity-derived. | Acceptable as no-access Pro note. | Pack card density needs mobile QA. | Low if progress remains honest. |
| `/packs/academic-vocabulary` | Good: start/continue preview. | Medium. | Medium/direct when review starts. | Partial: preview should become review items through the same SRS path. | Adequate: summary is local and computable. | Acceptable. | Preview grid and progress summary need mobile/keyboard QA. | Low. |
| `/pricing` | Adequate: join/request interest. | Low-medium. | Indirect only. | Indirect; must not distract before the loop works. | Not applicable. | Safe because interest-only/no checkout. | Contrast/focus on cards and buttons need QA. | Low for mastery; high public paid-access risk if copy changes. |
| `/word/dissonance` | Partial: generic header Review competes with focused word review. | Medium: legacy shell and detail panels are heavier than Track B shell. | Medium: focused review can create events. | Adequate via memory panel, weak at header level. | Strong where memory panel reads state. | Absent. | Known P1 mobile overflow/legacy shell risk. | Low. |
| `/settings` | Partial: diagnostics dominate learner settings. | Medium-high for non-owner users. | Low. | Not applicable. | Honest local/account/billing disclosures. | Diagnostics only; remove/gate later. | Copy density and focus order need QA. | Low, unless local plan state is misunderstood. |

## Core Funnel Inventory

| Funnel step | Current source of truth | Audit judgment |
| --- | --- | --- |
| Visual metaphor | Static/mock word data and local visual assets. | OK for manual beta; public content provenance still needed. |
| Save | Save landing and SRS storage helpers. | Locally real; must stay covered by tests. |
| Active recall | Review session answer plus confidence flow. | Locally real; mobile/a11y proof still needed. |
| Mistake record | Review events and weakScore/box updates. | Locally real. |
| Spaced review | 5-box SRS engine and `nextDueAt`. | Locally real. |
| Mastery status | `box`/mastery derived from review state. | Locally real; do not fake delayed recall. |
| Weekly Reviewed Words | Unique reviewed slugs from review events. | Locally real; public server reporting missing. |
| Paid habit | Pricing/paywall interest capture. | Safe for manual beta; public paid beta blocked. |

## LocalStorage And State Inventory

| Key | Role | Audit classification |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word records by slug. | Approved MVP key. |
| `vlx_review_state_v1` | SRS box, mastery, counts, weakScore, due dates. | Approved MVP key and source of truth for memory state. |
| `vlx_review_events_v1` | Review answer history. | Approved MVP key and source for Weekly Reviewed Words. |
| `vlx_daily_stats_v1` | Local daily review counters. | Approved MVP key; must be answer-derived. |
| `vlx_pack_progress_v1` | Local pack preview/review progress. | Beta key; cannot support public paid entitlement. |
| `vlx_plan_state_v1` | Local plan diagnostics. | Never paid-access proof. |
| `vlx_upgrade_interest_v1` | Local upgrade interest attribution. | Never purchase, receipt, or entitlement. |
| `vlx_pending_home_quiz` | Optional transition key. | Do not use as competing SRS state. |

## Placeholder And Planned Feature Inventory

| Placeholder/planned item | Current product handling | Audit classification |
| --- | --- | --- |
| Billing and checkout | Pricing says no checkout is live; upgrade controls are interest-only. | Safe for manual beta; P0 public blocker. |
| Canonical prices/capabilities | Monetization docs exist, but `/pricing` still shows beta pricing TBD. | P1 private copy issue; P0 public blocker. |
| Local plan diagnostics | Settings can display local plan/paywall diagnostics. | Owner-use only; remove or gate before broader beta. |
| IELTS/GRE packs | Packs can show planned/premium preview framing. | OK only while clearly unavailable/planned; no paid claims. |
| Static/mock word and pack data | Word detail and pack previews still depend on static/mock data. | OK for manual validation; public content proof required. |
| AI mistake explanation | Deferred. | Keep deferred until SRS/mistake loop is stable. |
| Account sync | Settings discloses browser-local learning state. | Public P0 blocker until implemented and approved. |
| Payment SDK/provider integration | Not present in this audit scope. | Must remain absent without explicit approval. |

## P0 Issue List

P0 for public paid beta:

- `P0-PUBLIC-001`: Account-owned persistence is missing for saved words,
  review state, review events, daily stats, and pack progress.
- `P0-PUBLIC-002`: Server-authoritative entitlements are missing; local plan
  state and upgrade interest cannot authorize paid access.
- `P0-PUBLIC-003`: Real checkout, subscription, invoice, billing portal,
  webhook, payment failure, refund, and cancellation flows are absent.
- `P0-PUBLIC-004`: `/pricing` still says beta pricing is TBD and is not
  reconciled with canonical monetization prices/capabilities.
- `P0-PUBLIC-005`: Public support, privacy, refund/cancellation, monitoring,
  alerting, rollback, and incident operations are not launch-ready.
- `P0-PUBLIC-006`: Public production analytics for Weekly Reviewed Words are
  not server-side or trusted.
- `P0-PUBLIC-007`: Paid pack claims for IELTS/GRE/public paid access are not
  backed by final content, entitlement enforcement, or pack-progress proof.

P0 for private/manual beta:

- No P0 was found in the local Save -> Review -> SRS loop from source review.
  Private/manual beta remains conditional on current manual QA evidence and
  explicit no-payment/browser-local disclosures.

## P1 Issue List

- `P1-001`: `/word/dissonance` still uses the legacy shell and a generic
  header Review CTA; make focused Save/Review the obvious primary action.
- `P1-002`: `/settings` exposes local plan and paywall trigger diagnostics that
  should be removed or gated before broader beta.
- `P1-003`: Dashboard supporting panels should keep losing visual weight so
  Today Memory Mission stays dominant.
- `P1-004`: Review session needs fresh mobile, keyboard, focus, and
  screen-reader QA after PR #154.
- `P1-005`: Saved Library needs large-library mobile proof and a stricter queue
  model if saved count grows.
- `P1-006`: Packs need stronger 30-day plan framing and verified content before
  paid claims.
- `P1-007`: Pricing/paywall copy needs canonical price/capability
  reconciliation before external paid conversion.
- `P1-008`: A current Manual QA Execution Report is required before external
  private/manual participants are invited.

## P2 Issue List

- `P2-001`: Trim explanatory and diagnostic copy after the learning contracts
  remain stable.
- `P2-002`: Continue premium/minimal visual polish through shared Track B app
  shell and design tokens.
- `P2-003`: Keep AI mistake explanations deferred until the SRS loop and
  mistake record are production-ready.
- `P2-004`: Defer multilingual page generation, large new route groups,
  progress dashboards, and classroom/B2B surfaces.

## Go / No-Go Recommendation

Private/manual beta: **Conditional Go** for owner-run, invite-only,
no-payment validation after a current Manual QA Execution Report is recorded.

Public paid beta: **No-Go**. Public paid beta remains No-Go until account
persistence, server entitlements, billing/payment operations, support/privacy,
refund/cancellation, monitoring, rollback, accessibility, content, analytics,
and production safety gates pass.

## Public Paid Beta Blockers

Public paid beta is **No-Go** until all of the following are complete:

- Account sync owns learner memory state across devices.
- Paid entitlements are server-authoritative and auditable.
- Billing/payment provider flows are approved and implemented.
- Support, privacy, refund/cancellation, monitoring, alerting, rollback, and
  incident response are release-ready.
- Pricing UI matches canonical monetization data.
- Paid pack content and entitlement boundaries are verified.
- Weekly Reviewed Words reporting is privacy-safe and production-ready.
- Accessibility evidence covers keyboard, screen reader, live regions,
  contrast, reflow, and mobile review ergonomics.

## Private / Manual Beta Readiness

Private/manual beta is **Conditional / Manual-only**.

Conditions:

- Owner-operated and invite-only.
- No checkout, card collection, subscription, invoice, billing portal, or paid
  entitlement grant.
- Learners are told state is browser-local unless a later account-sync PR ships.
- Support, privacy, refund/cancellation, and local-storage disclosures are
  filled before external participants join.
- Manual QA is run after PR #154 and recorded in a Manual QA Execution Report.
- Any regression in save, answer persistence, event creation, due selection,
  weak selection, or mastery truthfulness stops the beta.

## Public Paid Beta Readiness

Public paid beta is **No-Go**.

The current UI can explain an interest-only beta, but it cannot safely sell or
operate a paid public learning product because account persistence, payment,
server entitlements, public support/privacy/refund operations, monitoring,
rollback, paid pack proof, and production analytics are not complete.

## Accessibility And Mobile Risk

Known strengths:

- Track B shell routes use accessible navigation labels and a skip link.
- Review uses live-region messaging and progressbar semantics.
- Review answer controls and confidence controls are buttons.
- Existing tests cover keyboard reachability for principal learning actions.

Risks:

- `/word/dissonance` is still outside the Track B shell and has a known mobile
  overflow characterization test.
- Review live-region quality has not been human-verified with a screen reader.
- Weak Sprint needs one-handed/thumb ergonomics checks.
- Pricing and settings copy density can hurt comprehension on small screens.

## Performance And Loading-State Risk

- Core local visuals are constrained by existing performance budget coverage.
- Pack loading states disclose local/static data reads without claiming fake
  progress.
- Large saved libraries, pack preview grids, and word detail mobile overflow
  need manual QA before broader beta.
- Public beta still needs production image/CDN policy, slow-network checks,
  monitoring, and rollback evidence.

## Analytics And Event Coverage

Current local events and storage support Weekly Reviewed Words locally, but
public analytics remain incomplete.

Coverage that must stay protected:

- Save word.
- Review start.
- Review answer.
- Review complete.
- Due review start.
- Weak review start.
- Pack preview view/start/complete.
- Pricing interest.
- Paywall interest.
- Upgrade click.

Remaining gaps:

- No trusted server-side Weekly Reviewed Words reporting.
- No production dashboard or alerting pipeline for retention.
- No final privacy-safe route-to-event acceptance map for public paid beta.
- Upgrade interest remains attribution-only and must not become entitlement.

## Paywall And Pricing Risk

Current placement is safe because it is interest-only:

- `/pricing` states no checkout is live.
- Upgrade interest writes local attribution only.
- Packs show Pro preview notes that link to pricing without granting access.

Remaining risk:

- Canonical prices and capabilities are not reflected in the visible pricing
  UI.
- Local plan diagnostics must never be confused with paid access.
- Paywall prompts should remain attached to learning value, not arbitrary
  navigation or saved count.

## Fake Mastery Risk

Current fake mastery risk is low because Due, Weak, and Mastered are selected
from SRS state. The main risk is future UI copy: do not present saved count,
pack preview, local plan state, or placeholder content as mastery, progress, or
paid unlock.

## Recommended Next PR Sequence

The rebuild sequence is documented in
`docs/TRACK_B_UI_REBUILD_SEQUENCE.md` and should proceed in this order:

1. Track B App Shell / Design Tokens.
2. Dashboard v2.
3. Review Session v2.
4. Saved Library v2.
5. Packs v2.
6. Pricing / Paywall v2.
7. Manual QA Execution Report.
8. Private Beta Gate.

Compatibility with the historical typed v1 sequence:

- #73 Track B design tokens / app shell v2.
- #74 Dashboard v2: Today's Memory Mission.
- #75 Review Session v2.
- #76 Saved Library v2.
- #77 Packs v2.
- #78 Pricing / Paywall v2.
- #79 Manual QA execution report.

## Validation Plan

Required validation for this PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/product-ui-readiness.spec.ts --workers=1
```

Repository-level AGENTS validation may also include:

```powershell
npm.cmd run test -- --workers=1
```

Report any failure honestly. Do not claim checks passed unless they actually
ran.

## Safety Confirmation

This audit PR is docs/tests only and includes no runtime UI changes.

No runtime UI changes.

No real checkout.

Public paid beta still lacks server-authoritative entitlements and the visible
pricing UI is not reconciled with canonical monetization JSON.

Required operations still include support, refund/cancellation, privacy,
monitoring, rollback, and incident response.

This audit PR does not touch Webflow, Cloudflare Workers, auth, billing,
payment, DNS, deployment settings, secrets, production data, R2 production
objects, real user data, provider settings, middleware, route handlers, or
runtime API routes.

This audit PR does not include production deployment, provider settings,
middleware, or production data changes.

This audit PR does not add real payment, checkout, subscription, invoice,
billing portal, payment SDK, account sync, fake paid access, fake mastery,
auto-merge, FCT-070, ACC-010, multilingual page generation, or public paid beta
unblocking.

This audit PR does not implement FCT-070 or ACC-010.

This audit PR does not enable auto-merge.

This audit PR does not change roadmap statuses.
