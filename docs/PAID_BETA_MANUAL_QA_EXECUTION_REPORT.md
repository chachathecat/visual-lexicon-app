# Paid Beta Manual QA Execution Report

Report date: 2026-07-04 KST
Repository: `chachathecat/visual-lexicon-app`
Branch: `release/paid-beta-manual-qa-execution`
Draft PR title: `[Track B] Add paid beta manual QA execution report`
Scope: Post-merge Pricing / Paywall v2 and Paid Beta Readiness Audit execution.

## Executive Summary

This report records the local Track B paid beta QA scope after Pricing /
Paywall v2 and the Paid Beta Readiness Audit.

Verdict:

- Private paid beta: **Move to Private Beta Gate**
- Public paid beta: **No-Go**
- P0 count: `0`

Because P0 is zero for this local QA scope, the recommendation is to move to a
controlled Private Beta Gate review. If P0 rises above zero, replace this
recommendation with targeted hotfix PRs.

This report does not unblock public paid beta. It does not claim production
account sync, server SRS authority, checkout, billing, payment, monitoring,
support, refund, privacy, rollback, or full accessibility readiness.

North Star Metric remains **Weekly Reviewed Words**.

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Tested Environment

| Field | Value |
| --- | --- |
| Local base URL | `http://127.0.0.1:3006` |
| App server command | `npm.cmd run dev -- --hostname 127.0.0.1 --port 3006` |
| Execution spec | `tests/paid-beta-manual-qa-execution.spec.ts` |
| Data boundary | Browser-local storage only |
| Production data used | No |
| Webflow / Cloudflare / billing / auth touched | No |

The report is current only when the validation commands below pass on this
branch. The execution spec runs focused browser/localStorage checks for the
routes and result sections in this report.

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/paid-beta-manual-qa-execution.spec.ts --workers=1
```

## Route Coverage

| Route | Result | Evidence checked | Must remain honest |
| --- | --- | --- | --- |
| `/dashboard` | Pass | Route loads; Today Memory Mission reads local SRS stores. | Due, Weak, Mastered, streaks. |
| `/saved` | Pass | Route loads; saved words read from local saved/review state. | Saved count, mastery labels, review history. |
| `/save?slug=dissonance&source=word_page` | Pass | Saves `dissonance` with `word_page`; creates review item. | Mastery, box, weak score, review counts. |
| `/save?slug=dissonance&source=alias_search` | Pass | Saves `dissonance` with `alias_search`; creates review item. | Source attribution, canonical slug, review item. |
| `/save?slug=dissonance&source=extension` | Pass | Saves `dissonance` with `extension`; creates review item. | App-side source tag, review item, no production data. |
| `/review` | Pass | Answer writes review event; SRS state and daily stats update. | Event count, box movement, next due, daily stats. |
| `/review/due` | Pass | Route loads from real due state or honest empty state. | Due queue, empty state, mastery. |
| `/review/weak` | Pass | Route loads from weak score/mistake evidence. | Weak queue, mistake record, empty state. |
| `/review/weak-sprint` | Pass | Sprint appears only after weak evidence and writes `weak_review` events. | Same SRS record; no fake sprint store. |
| `/packs` | Pass | Catalog loads; planned packs stay honest. | Pack progress, planned pack access, paid access. |
| `/packs/academic-vocabulary` | Pass | Preview start and completion write pack progress. | Reviewed count and correct count come from review events. |
| `/pricing` | Pass | Lite, Pro, and Exam Pack interest writes local upgrade records. | Checkout, subscription, paid entitlement. |
| `/settings` | Pass | Route loads; Account Sync and Billing are disclosed as not connected. | Local plan preview, billing state, account sync. |
| `/word/dissonance` | Pass | Word detail loads; memory panel reads local review state. | Saved state, mastery, box, weak score. |

## localStorage Evidence Checks

| Key | Expected use | Evidence check | Entitlement? |
| --- | --- | --- | --- |
| `vlx_saved_words_v1` | Browser-local saved word records keyed by slug. | `dissonance` exists after each save-source route. | No |
| `vlx_review_state_v1` | Browser-local SRS records. | Save creates or preserves a `dissonance` review item. | No |
| `vlx_review_events_v1` | Browser-local review answer events. | Review answers append real result events. | No |
| `vlx_daily_stats_v1` | Browser-local daily review counters. | Reviewed count increases after review answers. | No |
| `vlx_pack_progress_v1` | Browser-local pack preview and review progress. | Academic Vocabulary preview start/completion writes real counts. | No |
| `vlx_plan_state_v1` | Browser-local plan preview/debug state only. | Pricing interest does not create a trusted paid plan state. | No |
| `vlx_upgrade_interest_v1` | Browser-local paid beta interest attribution. | Pricing CTAs record Lite, Pro, and Exam Pack interest locally. | No |

None of these keys are a production source of truth. None may contain secrets,
provider tokens, payment data, checkout sessions, invoices, subscriptions,
billing state, paid access proof, production account data, or fake mastery.

## QA Result Sections

### Save creates review item

Result: **Pass**

Evidence:

- `word_page`, `alias_search`, and `extension` save routes create
  `dissonance` in `vlx_saved_words_v1`.
- Each source creates a `New`, box `0` review item in
  `vlx_review_state_v1` from a clean store.

### Review updates state/events

Result: **Pass**

Evidence:

- `/review` answer appends `vlx_review_events_v1`.
- The same answer updates `vlx_review_state_v1` and `vlx_daily_stats_v1`.

### Due/Weak/Mastered remain honest

Result: **Pass**

Evidence:

- `/review/due` and `/review/weak` load from real SRS state.
- Save-only and early reviewed words are not marked `Mastered`.

### Weak sprint uses real weak evidence

Result: **Pass**

Evidence:

- A wrong answer increases weak evidence.
- `/review/weak-sprint` uses the same SRS record and writes `weak_review`
  events.

### Pack preview/progress remains honest

Result: **Pass**

Evidence:

- Academic Vocabulary preview start writes `vlx_pack_progress_v1` with zero
  reviewed/correct counts.
- Preview completion updates `reviewedCount` and `correctCount` from review
  events.

### Pricing upgrade interest records local beta interest only

Result: **Pass**

Evidence:

- Lite, Pro, and Exam Pack CTAs write `vlx_upgrade_interest_v1`.
- Pricing interest does not create checkout, subscription, billing, or trusted
  plan state.

### No checkout/payment/billing route exists

Result: **Pass**

Evidence:

- No `src/app/checkout`, `src/app/billing`, `src/app/payment`, or
  `src/app/payments` route directories exist.
- No Stripe, Paddle, checkout, billing portal, subscription, invoice, or payment
  SDK is added.

### Public paid beta remains No-Go

Result: **No-Go**

Evidence:

- No checkout/payment/billing route exists.
- Account sync, server SRS authority, production monitoring, support, privacy,
  refund, rollback, full accessibility, and public launch approval remain
  outside this QA pass.

This report must not be used as public paid beta launch approval.

### Private/manual paid beta is gated

Result: **Gated**

Evidence:

- P0 count for this local QA scope is `0`.
- The next decision is Private Beta Gate review, not public launch and not
  checkout implementation.

## P0 Findings

Count: `0`

No P0 findings are open for the local Track B QA scope covered by this report.
If any P0 appears, do not move to Private Beta Gate; open targeted hotfix PRs
instead.

## P1 Findings

| ID | Finding | Action |
| --- | --- | --- |
| `p1_private_beta_gate_owner_signoff_required` | Private Beta Gate needs owner sign-off before invites. | Run owner gate review for invite list, support, refund, privacy, rollback, and manual entitlement operations. |
| `p1_public_beta_account_sync_and_server_srs_missing` | Public beta still needs account sync and server-side SRS authority. | Do not treat localStorage as public-beta production source of truth. |
| `p1_public_beta_payment_monitoring_support_privacy_gates_open` | Public beta payment, monitoring, support, privacy, refund, rollback, and accessibility gates remain open. | Keep public paid beta No-Go until those gates have separate approved evidence. |
| `p1_extension_source_needs_real_extension_e2e` | Extension source is app-route covered, but real extension E2E remains follow-up. | Run browser extension E2E before claiming extension distribution readiness. |

## P2 Findings

| ID | Finding | Action |
| --- | --- | --- |
| `p2_richer_ielts_gre_pack_content` | IELTS and GRE pack content still needs depth. | Audit richer IELTS/GRE content after private gate work. |
| `p2_deeper_mobile_accessibility_polish` | Deeper mobile and accessibility polish should continue. | Run full mobile, keyboard, and screen-reader QA before public beta. |
| `p2_future_ai_and_export_features_deferred` | AI mistake explanation and export/download features remain deferred. | Add those only after SRS, entitlement, and asset-delivery gates are approved. |

## Recommendation

Recommendation: **Move to Private Beta Gate**.

Rationale:

- P0 count is `0`.
- Save creates review items.
- Review writes events and updates memory state.
- Due, Weak, and Mastered remain derived from real review state.
- Weak Sprint uses real weak evidence.
- Pack preview/progress remains evidence-based.
- Pricing records local beta interest only.
- No checkout/payment/billing route exists.

Boundary:

- Private/manual paid beta is still gated by owner review and manual operations.
- Public paid beta remains **No-Go**.
- If P0 rises above zero, replace this recommendation with targeted hotfix PRs.

## Stop Conditions

Stop and open targeted hotfix PRs if:

- Save does not create or preserve a review item.
- Review answers do not create events, update review state, and update daily
  stats.
- Due, Weak, Mastered, pack progress, streaks, or paid access are faked.
- Pricing interest creates checkout, billing, subscription, invoice, paid plan,
  paid entitlement, or trusted `vlx_plan_state_v1`.
- Any P0 finding appears in this scope.

Stop and ask for explicit approval before:

- Webflow publishing.
- Cloudflare production Worker changes.
- Auth, billing, payment, checkout, subscription, invoice, billing portal, DNS,
  deployment settings, secrets, production data, R2 production objects, or real
  user data changes.
- Adding checkout or payment SDKs.
- Claiming public paid beta readiness.

## Rollback Notes

This PR is docs/tests plus a static test contract helper. Rollback is a normal
revert of:

- `docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md`
- `tests/paid-beta-manual-qa-execution.spec.ts`
- `src/lib/paid-beta-manual-qa-execution/*`

No runtime app behavior, production data, payment settings, auth behavior,
Webflow, Cloudflare Workers, DNS, deployment settings, checkout, billing route,
or payment SDK rollback is required.

## Safety Confirmation

- Docs/tests only plus static test contract helper.
- No runtime UI implementation.
- No new route groups.
- No API routes.
- No route handlers.
- No middleware.
- No Webflow changes.
- No Cloudflare Workers changes.
- No auth changes.
- No billing, payment, checkout, subscription, invoice, billing portal, or
  payment SDK.
- No DNS, deployment settings, or secrets changes.
- No production data, R2 production objects, or real user data touched.
- No fake QA results.
- No fake mastery, fake pack progress, fake streaks, or fake paid access.
- Public paid beta remains **No-Go**.
- Private/manual paid beta remains gated.
- `npm audit fix` was not run.
