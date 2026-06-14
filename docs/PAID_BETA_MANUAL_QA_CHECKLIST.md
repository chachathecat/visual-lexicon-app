# Paid Beta Manual QA Checklist Runner

Checklist date: 2026-06-14  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/paid-beta-manual-qa-checklist`  
Scope: Track B learning app owner-run manual QA for private paid beta readiness.

## Purpose

This document defines a deterministic manual QA contract for the owner to run
before any private paid beta invites.

The checklist verifies the paid beta learning loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

The QA runner is a checklist contract, not runtime automation. It gives the
owner exact routes to open, actions to perform, localStorage keys to inspect,
console snippets to paste manually, evidence to record, blocker severity rules,
and stop conditions.

## Non-Goals

This checklist does not add product features, real backend behavior, real auth,
database persistence, provider SDKs, validation dependencies, logging SDKs,
network calls, API routes, route handlers, middleware, payment, checkout,
subscription, billing, paid entitlement, environment variables, migrations,
production data access, Webflow changes, Cloudflare Worker changes, DNS
changes, Vercel or deployment settings, or runtime route/component integration.

No QA step requires production secrets, real payment, production data, Webflow,
Cloudflare, API routes, fake mastery, or random easy distractors.

## Relationship To #70

PR #70 added the paid beta readiness audit and concluded:

- Private paid beta can only be conditional, owner-run, and manually evidenced.
- Public paid beta remains No-Go until account sync, payment path, production
  monitoring, privacy/legal, accessibility, and support gates are cleared.

This PR turns that conclusion into a repeatable owner-run checklist. It does not
change the #70 verdict and does not recommend real API route implementation.

## Private Beta QA Protocol

Before private paid beta invites:

1. Run the app locally.
2. Clear approved VLX localStorage keys.
3. Execute every P0 scenario.
4. Record required screenshots, route notes, console probe outputs, and
   before/after storage observations.
5. Stop if any P0 condition is found.
6. Keep payment manual/off-app and upgrade interest attribution-only.
7. Record P1/P2 findings for follow-up without claiming public paid readiness.

Private beta can remain conditional only if all P0 manual QA scenarios pass and
the owner uses a manual payment/interest workflow.

## Public Beta No-Go Warning

Public paid beta remains **No-Go** until all of these gates are closed:

- Account sync.
- Payment path.
- Production entitlement.
- Production monitoring and launch analytics.
- Privacy/legal launch review.
- Accessibility audit pass.
- Support/refund/failed-payment operations.
- Public rollback plan.
- Production data migration and backup plan.

## Route Checklist

Open these route targets manually:

| Route | QA purpose |
| --- | --- |
| `/` | Clean guest first visit and dashboard load. |
| `/dashboard` | Today Memory Mission, review CTAs, alias search, and local counts. |
| `/saved` | Saved library review entry and no fake mastery. |
| `/save?slug=dissonance&source=word_page` | Word-page save attribution. |
| `/save?slug=dissonance&source=alias_search` | Alias-search canonical save. |
| `/save?slug=dissonance&source=extension` | App-side extension source save. |
| `/review` | Mixed review event/state writes. |
| `/review?mode=due` | Due review from SRS due state. |
| `/review?mode=weak` | Weak review from weak state. |
| `/review?mode=word&slug=dissonance` | Focused word review. |
| `/review?mode=hub&hub=academic-vocabulary&limit=10` | Hub review and pack preview evidence. |
| `/review/weak-sprint` | Real weak-word sprint. |
| `/packs` | Pack catalog honesty. |
| `/packs/academic-vocabulary` | Academic Vocabulary preview start and continuation. |
| `/pricing` | Interest capture with no checkout or entitlement. |
| `/settings` | Local plan state safety. |
| `/word/dissonance` | Word detail memory-state panel. |

## localStorage Checklist

Inspect these keys only:

| Key | Expected use | Must not contain |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved words keyed by slug. | Secrets, tokens, payment data, raw private payloads. |
| `vlx_review_state_v1` | SRS state records. | Fake mastery or paid access proof. |
| `vlx_review_events_v1` | Review answer events. | Private payloads, account secrets, payment data. |
| `vlx_daily_stats_v1` | Local daily review stats. | Fake weekly reviewed word counts. |
| `vlx_pack_progress_v1` | Local pack preview/review progress. | Progress without review evidence unless audit-only. |
| `vlx_plan_state_v1` | Local plan preview only. | Paid entitlement, subscription, receipt, checkout state. |
| `vlx_upgrade_interest_v1` | Attribution-only upgrade interest. | Paid entitlement, payment data, billing state. |

## Console Probe Checklist

Paste these snippets manually in browser DevTools. They are documentation
strings only in the TypeScript contract; the module does not execute them.

```js
Object.keys(localStorage).filter((key) => key.startsWith('vlx_')).sort()
```

```js
JSON.parse(localStorage.getItem('vlx_saved_words_v1') || '{}')
```

```js
JSON.parse(localStorage.getItem('vlx_review_state_v1') || '{}').dissonance
```

```js
(JSON.parse(localStorage.getItem('vlx_review_events_v1') || '[]')).length
```

```js
JSON.parse(localStorage.getItem('vlx_daily_stats_v1') || '{}')
```

```js
JSON.parse(localStorage.getItem('vlx_pack_progress_v1') || '{}')
```

```js
JSON.parse(localStorage.getItem('vlx_upgrade_interest_v1') || '[]')
```

```js
({
  interest: JSON.parse(localStorage.getItem('vlx_upgrade_interest_v1') || '[]'),
  planState: JSON.parse(localStorage.getItem('vlx_plan_state_v1') || '{}')
})
```

```js
JSON.parse(localStorage.getItem('vlx_review_state_v1') || '{}').dissonance?.mastery
```

## Scenario-By-Scenario Manual QA

Record every scenario with route, actions, expected result, evidence, severity,
and stop conditions.

| Scenario | Route | Severity | Actions | Expected result | Evidence |
| --- | --- | --- | --- | --- | --- |
| `clean_guest_first_visit` | `/` | P0 | Clear VLX keys, open home, list keys. | App loads with approved local keys only. | Screenshot and key listing. |
| `save_word_from_word_page` | `/word/dissonance` | P0 | Save the word, inspect saved and review state. | Save creates or preserves review item. | Word screenshot and storage probes. |
| `save_word_from_alias_search` | `/save?slug=dissonance&source=alias_search` | P0 | Save through alias path, inspect state. | Alias resolves to canonical slug. | Route screenshot and probes. |
| `save_word_from_extension_source` | `/save?slug=dissonance&source=extension` | P0 | Open extension source route, inspect state. | Extension source save creates review item. | Route screenshot and probes. |
| `saved_library_review_entry` | `/saved` | P0 | Open saved library and use review entry. | Saved word supports review and is not Mastered from save alone. | Screenshot and route note. |
| `review_due_session` | `/review?mode=due` | P0 | Answer due card, inspect events/state/stats. | Answer writes event, state, daily stats. | Before/after probes. |
| `review_weak_session` | `/review?mode=weak` | P0 | Create weak word, answer weak card. | Weak candidates are real state-derived words. | Screenshot and probes. |
| `review_word_focused_session` | `/review?mode=word&slug=dissonance` | P0 | Answer focused card. | Same slug state updates. | Screenshot and probes. |
| `review_hub_session` | `/review?mode=hub&hub=academic-vocabulary&limit=10` | P0 | Answer hub card. | Review evidence exists before progress credit. | Events and pack progress probes. |
| `weak_words_sprint` | `/review/weak-sprint` | P0 | Enter sprint after a wrong answer, answer card. | Sprint uses real weak state and writes evidence. | Screenshot and probes. |
| `pack_preview_start` | `/packs/academic-vocabulary` | P0 | Start preview. | Routes to hub review and records honest preview start. | Screenshot and pack progress probe. |
| `pack_preview_completion` | `/review?mode=hub&hub=academic-vocabulary&limit=10` | P0 | Complete short hub review. | Pack completion is tied to review events. | Events and pack progress probes. |
| `pack_progress_continuation` | `/packs` | P1 | Reopen pack catalog and detail. | Progress matches local evidence. | Screenshots and pack progress probe. |
| `pricing_interest_capture` | `/pricing` | P0 | Click interest CTA, inspect interest/plan state. | No checkout and no entitlement. | Screenshot and probes. |
| `paywall_trigger_save_limit` | `/dashboard` | P1 | Inspect save-limit prompt. | CTA copy is local interest only. | Prompt screenshot and interest probe. |
| `paywall_trigger_review_limit` | `/review` | P1 | Inspect review-limit prompt. | CTA copy is local interest only. | Prompt screenshot and interest probe. |
| `dashboard_mission_counts` | `/dashboard` | P0 | Compare dashboard counts to local state. | Counts are state-derived. | Screenshot and probes. |
| `settings_plan_state_safety` | `/settings` | P0 | Inspect local plan copy and state. | Plan state is not entitlement. | Screenshot and entitlement probe. |
| `mobile_dashboard_review_flow` | `/dashboard` | P0 | Use mobile viewport, start review, answer card. | Mobile review flow is usable and writes evidence. | Mobile screenshots and event probe. |
| `empty_state_review_no_due` | `/review?mode=due` | P1 | Open no-due state. | Empty state is honest and useful. | Screenshot and note. |
| `no_fake_mastery_after_save_only` | `/word/dissonance` | P0 | Save without delayed recall, inspect mastery. | Saved-only word is not Mastered. | Screenshot and mastery probe. |
| `no_paid_entitlement_from_interest` | `/pricing` | P0 | Record interest, inspect plan/interest state. | Interest does not grant access. | Screenshot and entitlement probe. |
| `local_storage_privacy_probe` | `/dashboard` | P0 | List and inspect approved VLX keys. | No secrets, provider tokens, payment data, or raw private payloads. | Key list and redacted notes. |

## Expected Evidence Format

For each scenario, record:

```txt
Scenario:
Route:
Device/browser:
Actions performed:
Expected result:
Actual result:
Status: pass | fail | blocked | needs_retest
Evidence:
- screenshot path or description
- console probe output, redacted if needed
- before/after localStorage observation
Findings:
- severity
- blocker id
- owner decision
```

Do not paste secrets, tokens, full private payloads, payment data, or production
user data into QA notes.

## P0/P1/P2 Findings Model

P0 failures block private paid beta and public paid beta. Stop the launch pass
and fix or explicitly re-run after repair.

P1 failures do not automatically block a controlled private owner-run pass, but
they block public paid beta and must be recorded for Product/UI readiness.

P2 findings are future polish or roadmap items. They do not block the private
owner-run pass when all P0s pass.

## P0 Stop Conditions

Stop private paid beta launch if any of these occur:

- Save does not create review item.
- Review answer does not write review event.
- Review answer does not update review state.
- Due, Weak, or Mastered counts are fake or not state-derived.
- Save-only word appears Mastered.
- Upgrade interest grants paid entitlement.
- Pricing implies real checkout when none exists.
- Pack progress advances without review evidence and is not marked audit-only.
- Weak Sprint uses fake weak words.
- Alias search points to missing slug.
- Extension source save fails.
- localStorage stores secrets, provider tokens, payment data, or raw private
  payloads.
- App crashes on dashboard, review, saved, packs, pricing, settings, or word route.
- Mobile review flow is unusable.
- Keyboard navigation blocks core save/review flow.

## P1 Blockers

Record these as P1:

- Ambiguous CTA copy.
- Incomplete empty/loading/error state.
- Weak mobile layout.
- Pack copy needs polish.
- Pricing outcome copy needs polish.
- Analytics event naming not fully mapped.
- Alias search coverage is too small.
- Extension bridge not yet browser-tested end-to-end.

Escalate weak mobile layout to P0 if it blocks the core save/review flow.
Escalate pricing copy to P0 if it implies real checkout or paid access.

## P2 Blockers

Record these as P2:

- Visual polish.
- More pack categories.
- More detailed streak/calendar.
- Future AI explanation.
- Future multilingual expansion.

## Mobile QA Checklist

- Use a 390x844 viewport.
- Open `/dashboard`.
- Start review from the mission CTA.
- Answer at least one review card.
- Confirm no clipped buttons, overlapping text, unusable answer controls, or
  blocked scroll.
- Record screenshots of dashboard and review.
- Treat unusable mobile review as P0.
- Treat awkward but usable layout as P1.

## Accessibility QA Checklist

- Navigate dashboard, saved, word detail, pricing, settings, and review with
  keyboard only.
- Confirm focus is visible.
- Confirm core save and review controls are reachable.
- Confirm answer controls can be selected and submitted.
- Confirm link/button labels are understandable without pointer hover.
- Treat keyboard-blocked save/review as P0.
- Record contrast, label, and focus issues as P1 unless they block the core flow.

## Privacy/localStorage QA Checklist

- List all `vlx_` keys before and after the full pass.
- Inspect only approved keys.
- Confirm values are local learning state, not account credentials.
- Confirm no provider tokens, API tokens, payment data, raw extension payloads,
  emails, account IDs, or private text payloads are stored.
- Confirm upgrade interest is attribution-only.
- Treat unsafe storage as P0.

## Payment/Entitlement Safety Checklist

- Open `/pricing`.
- Click Lite and Pro interest CTAs if available.
- Confirm no checkout, invoice, subscription, billing portal, payment SDK, or
  paid entitlement appears.
- Inspect `vlx_upgrade_interest_v1` and `vlx_plan_state_v1`.
- Confirm local plan state is not access proof.
- Treat any paid entitlement from interest as P0.

## Pack Readiness QA Checklist

- Open `/packs`.
- Open `/packs/academic-vocabulary`.
- Start preview.
- Answer hub review cards.
- Inspect `vlx_pack_progress_v1`.
- Confirm preview progress is tied to preview start or review answers.
- Confirm planned packs do not show fake progress.
- Record pack copy polish as P1.

## Alias Search QA Checklist

- Use dashboard alias search when available.
- Confirm known alias routes save canonical `dissonance`.
- Confirm unknown aliases do not create fake words.
- Confirm source attribution is `alias_search`.
- Treat missing canonical slug as P0.
- Record insufficient alias coverage as P1.

## Extension Bridge QA Checklist

- Open `/save?slug=dissonance&source=extension`.
- Confirm app-side source save creates saved and review state.
- Confirm no raw extension payload is stored.
- Record lack of true browser-extension end-to-end testing as P1.
- Treat extension source save failure as P0.

## Final Verdict Rules

Private paid beta verdict:

- `pass`: all P0 scenarios pass with evidence, payment stays manual/off-app,
  and owner accepts open P1/P2 findings.
- `blocked`: any P0 scenario fails or lacks required evidence.
- `needs_retest`: a P0 was fixed but the full affected flow has not been rerun.

Public paid beta verdict:

- Always No-Go from this checklist alone.
- Public paid beta cannot become Go until account sync, payment, production
  monitoring, privacy/legal, accessibility, and support gates are cleared in
  later approved PRs.

## Next Recommended PR

Recommended next PR: **#72 Product/UI readiness audit or Manual QA execution report template.**

Do not recommend real API route implementation yet.

## Safety Confirmation

- Docs/contracts/tests only.
- No actual API routes.
- No route handlers.
- No middleware.
- No runtime route/component integration.
- No real auth.
- No database persistence.
- No Supabase, Prisma, Drizzle, Neon, Firebase, Cloudflare D1, provider SDK,
  validation dependency, or logging SDK.
- No network or fetch calls.
- No localStorage execution by the module.
- No payment, billing, checkout, subscription, invoice, or paid entitlement.
- No environment variables or production feature flags.
- No migrations or executable database schema.
- No Webflow, Cloudflare, Vercel, DNS, deployment, secrets, or production data
  changes.
- No fake mastery.
- `npm audit fix` was not run.
