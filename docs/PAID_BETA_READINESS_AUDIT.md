# Visual Lexicon Paid Beta Readiness Audit

Audit date: 2026-06-14  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/paid-beta-readiness-audit`  
Scope: Track B learning app surfaces for `app.visuallexicon.org`.

## Purpose

This audit answers whether Visual Lexicon Track B can be considered ready for a
limited paid beta.

Verdict:

- Private paid beta: **conditional_go_for_private_paid_beta_only**
- Public paid beta: **no_go_for_public_paid_beta**

The local learning loop and product surfaces are advanced enough for controlled
owner-run/private validation after manual QA evidence is recorded. Public paid
beta remains blocked until account sync, payment path, entitlement, production
analytics/monitoring, privacy/legal review, accessibility, launch support,
rollback, and data migration/backup gates are approved.

## Non-Goals

This PR is docs/contracts/tests only.

It does not add product features, API routes, route handlers, middleware, route
or component runtime integration, real auth, database persistence, provider
SDKs, validation dependencies, logging/observability SDKs, network/fetch calls,
environment variables, feature flags, billing, checkout, subscriptions, paid
entitlements, migrations, production data access, Webflow changes, Cloudflare
Worker changes, Vercel settings, DNS changes, or deployment changes.

## Current Product Status

Current private-beta-positive evidence:

- Save creates or preserves local saved words and review state.
- Saved words become review items.
- Review answers append events, update SRS state, and update daily stats.
- Due, Weak, and Mastered states are derived from real local review state.
- Weak sprint uses real weak state and writes review events.
- Dashboard prioritizes Today Memory Mission and review CTAs.
- Saved library supports the learning loop and has honest empty states.
- Academic Vocabulary pack preview can start hub review and record local progress.
- Pricing and paywall surfaces capture attribution-only upgrade interest.
- Extension source and alias search source can be represented safely in app-side routes.
- Local analytics events are sanitized and do not imply production monitoring approval.

Current public-beta blockers:

- No account/server sync.
- No real checkout, subscription, billing, or production entitlement path.
- No production analytics/monitoring approval.
- No full-funnel manual QA pass recorded for this branch.
- No privacy/legal launch review, accessibility audit pass, launch support,
  failed-payment/refund flow, public rollback plan, or production data
  migration/backup plan.

## Current Account Sync Status

Account sync remains design-only. The prior sequence through #69 intentionally
keeps real API route implementation blocked:

- No account sync API routes.
- No route handlers.
- No middleware.
- No auth provider integration.
- No database provider or migration.
- No runtime validator dependency.
- No production monitoring or rollout enablement.

Do not implement real account sync routes yet. The next PR should record manual
QA or Product/UI readiness evidence, not account sync implementation.

## Route Inventory

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Private-beta ready | Redirects to `/dashboard`, the canonical Track B app entry. |
| `/dashboard` | Private-beta ready | Today Memory Mission, review CTAs, weak sprint, and local progress. Canonical DashboardV2 exposes no learner-facing alias-search UI. |
| `/saved` | Private-beta ready | Reads saved words, review state, and event counts. No fake mastery. |
| `/save?slug=dissonance&source=word_page` | Private-beta ready | Saves known word with word page attribution and creates review item. |
| `/save?slug=dissonance&source=alias_search` | Private-beta ready | Saves canonical known word with alias search attribution. |
| `/save?slug=dissonance&source=extension` | Manual QA required | App-side extension source is represented; browser extension E2E QA remains P1. |
| `/review` | Private-beta ready | Mixed review writes events, state, and stats. |
| `/review?mode=due` | Private-beta ready | Due candidates come from SRS due dates. |
| `/review/due` | Private-beta ready | Approved due route alias. |
| `/review?mode=weak` | Private-beta ready | Weak candidates come from Weak mastery or weak score. |
| `/review/weak` | Private-beta ready | Approved weak route alias. |
| `/review?mode=word&slug=dissonance` | Private-beta ready | Focused review updates the same state record. |
| `/review?mode=hub&hub=academic-vocabulary&limit=10` | Private-beta ready | Hub review supports Academic Vocabulary preview. |
| `/review/weak-sprint` | Private-beta ready | Five-card sprint from real weak local state. |
| `/packs` | Private-beta ready with P1 content audit | Planned packs must stay honest. |
| `/packs/academic-vocabulary` | Private-beta ready with P1 content audit | Starts preview review and records real progress. |
| `/pricing` | Needs copy review | Must keep no-billing/no-checkout language clear. |
| `/settings` | Private-beta ready | Local plan preview only; not paid entitlement. |
| `/word/dissonance` | Private-beta ready | Static word content plus real local memory state panel. |

## localStorage Key Inventory

| Key | Status | Public beta note |
| --- | --- | --- |
| `vlx_saved_words_v1` | Private-beta ready | Needs account persistence/migration plan before public beta. |
| `vlx_review_state_v1` | Private-beta ready | Due/Weak/Mastered must stay real; no fake mastery. |
| `vlx_review_events_v1` | Private-beta ready | Public beta needs trusted server event storage. |
| `vlx_daily_stats_v1` | Private-beta ready | Weekly Reviewed Words needs server-backed reporting before public beta. |
| `vlx_pack_progress_v1` | Private-beta ready | Must reflect preview/review answers only. |
| `vlx_plan_state_v1` | Needs review | Local preview only; never paid access proof. |
| `vlx_upgrade_interest_v1` | Private-beta ready | Attribution-only interest; not subscription or receipt. |
| `vlx_pending_home_quiz` | Optional/future | Transition state only; not an account source of truth. |

## Test Inventory

Required validation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

Relevant suites:

| Suite | Coverage |
| --- | --- |
| `tests/mvp-smoke.spec.ts` | Save, SRS write, dashboard loop, review events, daily stats. |
| `tests/review-state-regression.spec.ts` | Duplicate saves, SRS rules, Due/Weak/Mastered selectors. |
| `tests/review-mode-routes.spec.ts` | Due, weak, word, hub, extension source, weak sprint, answer writes. |
| `tests/saved-library.spec.ts` | Saved library, empty state, links, no fake mastery. |
| `tests/word-detail-memory-state.spec.ts` | Word memory panel state and source labels. |
| `tests/exam-pack-preview.spec.ts` | Pack catalog/detail, preview start/completion, planned pack honesty. |
| `tests/paywall-triggers.spec.ts` | Trigger evaluator and no payment SDK guard. |
| `tests/paywall-surfaces.spec.ts` | Pricing and paywall interest capture. |
| `tests/entitlements.spec.ts` | Local entitlement skeleton and no payment route directories. |
| `tests/multilingual-alias-contract.spec.ts` | Alias resolver, known canonical slugs, route-independent safe word/save targets, and unknown alias no-action state. |
| `tests/analytics-events.spec.ts` | Sanitized local dataLayer events. |
| `tests/paid-beta-readiness-audit.spec.ts` | Static readiness contract, blockers, docs links, and safety guards. |

## Manual QA Checklist

Use `docs/PAID_BETA_MANUAL_QA.md` as the step-by-step runner.

Minimum pass before private invites:

- [ ] Clear all approved local storage keys.
- [ ] Save from `word_page`, `alias_search`, and `extension` sources.
- [ ] Confirm each saved word has a review state item.
- [ ] Open `/saved` and `/word/dissonance` and confirm no fake saved state,
      fake mastery, fake boxes, or fake progress.
- [ ] Complete review cards and confirm events, state, and daily stats mutate.
- [ ] Create a weak word from a wrong answer.
- [ ] Run `/review/weak-sprint` and confirm it updates the same state record.
- [ ] Start and complete Academic Vocabulary preview and confirm pack progress.
- [ ] Click Lite and Pro pricing CTAs and confirm attribution-only interest.
- [ ] Confirm no checkout, billing, subscription, or paid entitlement route.
- [ ] Record accessibility and mobile checks.

## Paid Beta Funnel Checklist

- [x] Visitor can save a word.
- [x] Saved word becomes review item.
- [x] Review session writes events and stats.
- [x] Due/Weak/Mastered are based on real local state.
- [x] Pack preview can start a review.
- [x] Pack progress is derived from real answers or honestly absent.
- [x] Weak sprint uses real weak state.
- [ ] Pricing copy needs outcome-based review.
- [x] Upgrade interest is attribution-only.
- [x] No paid entitlement is granted.
- [x] No real checkout is implied.
- [ ] Extension source needs end-to-end browser QA.
- [x] Alias search saves with source attribution.
- [x] Analytics events avoid secrets and private payloads.

## Pack Readiness Checklist

- [x] Academic Vocabulary preview exists.
- [x] Preview start can route into review.
- [x] Pack progress start is local and explicit.
- [x] Preview completion records reviewed/correct counts from answers.
- [x] Planned pack progress is not faked.
- [ ] IELTS/GRE/Academic content depth needs audit before public paid beta.
- [ ] Static/R2 pack source behavior needs staging-like validation before public paid beta.

## Weak Sprint Checklist

- [x] `/review/weak-sprint` exists.
- [x] Sprint candidates come from weak score, misses, or Weak mastery.
- [x] Empty state appears when no weak words exist.
- [x] Answers append weak review events.
- [x] Answers update the same review state records.
- [ ] Manual QA must record a miss-to-weak-sprint flow on this branch.

## Alias Search Checklist

- [x] Known aliases resolve to canonical English slugs.
- [x] Alias search save links use `source=alias_search`.
- [x] Unknown aliases avoid fake actions.
- [ ] KO/JA vocabulary coverage needs broader review.
- [ ] Alias UI needs manual QA after local storage reset.

## Extension Bridge Checklist

- [x] App-side extension save route can carry `source=extension`.
- [x] Extension route helpers are covered by tests.
- [ ] Browser extension end-to-end source tagging and review routing need QA.
- [ ] Extension payload privacy review is required before public beta.

## Analytics/Privacy Checklist

- [x] Local dataLayer events are sanitized.
- [x] Analytics events do not include tokens, secrets, account IDs, emails, or raw private payloads.
- [x] Upgrade interest remains attribution-only.
- [ ] Production monitoring and analytics dashboard approval are missing.
- [ ] Privacy/legal launch review is missing.
- [ ] Support, refund, failed-payment, and data disclosure flows are missing.

## Accessibility/Mobile Checklist

- [ ] Full accessibility audit pass is not recorded.
- [ ] Keyboard/focus QA is not recorded for the full funnel.
- [ ] Contrast and label QA is not recorded for the full funnel.
- [ ] Mobile QA is not fully evidenced.
- [ ] Empty/loading/error states need a route-by-route checklist.

## P0 Blockers

- No real account/server sync enabled.
- No real payment/checkout/subscription path.
- No production entitlement system.
- No production monitoring/analytics approval.
- No manual QA pass recorded for the full funnel.
- No privacy/legal launch review recorded.
- No support/refund/failed-payment flow.
- No public launch rollback plan.
- No production data migration or backup plan.
- No accessibility audit pass.

## P1 Blockers

- Mobile QA not fully evidenced.
- Empty/loading/error states need full checklist.
- Pricing copy may need outcome-based review.
- Pack content depth and IELTS/GRE/Academic completeness need content audit.
- Extension bridge needs end-to-end browser QA.
- KO/JA alias search needs broader vocabulary coverage review.
- Analytics taxonomy needs launch dashboard mapping.

## P2 Blockers

- UI polish and copy improvements.
- Advanced streak/calendar polish.
- More pack categories.
- Future AI mistake explanation.
- Future multilingual concept graph.

## Private Beta Recommendation

Recommendation: **Conditional Go for private owner-run/manual paid beta
validation only.**

Conditions:

- Invite flow remains controlled by the owner.
- Manual QA evidence is recorded first.
- Payment remains disconnected.
- Upgrade interest remains attribution-only.
- Users are told progress is local-only until account sync is implemented.
- Support and data reset disclosure are explicit for invited testers.

## Public Beta Go/No-Go Verdict

Verdict: **No-Go for public paid beta.**

Public paid beta cannot launch until all P0 blockers are closed and P1 launch
evidence is reviewed. The app must not claim public paid readiness while account
sync, payment, entitlement, monitoring, privacy/legal, accessibility, rollback,
support, and migration gates remain open.

## Next Recommended PR

Recommended next PR: **#71 Paid beta manual QA checklist runner or Product/UI readiness audit.**

Do not recommend real API route implementation yet.

## Safety Confirmation

- Docs/contracts/tests only.
- No runtime behavior changes.
- No actual API routes.
- No route handlers.
- No middleware.
- No route or component runtime integration.
- No real auth.
- No database persistence.
- No provider SDKs.
- No validation dependency.
- No logging/observability SDK.
- No network/fetch calls.
- No environment variables or production feature flags.
- No payment, billing, checkout, subscription, invoice, or paid entitlement.
- No migrations or executable database schema.
- No Webflow, Cloudflare Workers, Vercel, DNS, deployment, secrets, or
  production data changes.
- `npm audit fix` was not run.
