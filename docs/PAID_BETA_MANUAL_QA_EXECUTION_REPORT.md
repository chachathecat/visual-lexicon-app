# Paid Beta Manual QA Execution Report

Report date: 2026-06-15 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/manual-qa-execution-report`  
PR: `#79 Manual QA execution report`  
Scope: Integrated Track B paid beta candidate after PRs #70-#78.

## Executive Summary

The integrated Track B loop is credible enough for a private, owner-run paid
beta only if the owner treats this as a manual operation with explicit oversight.
The app now presents the right product shape:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

The current candidate keeps the core formula visible:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

The learning loop still depends on local browser state, local upgrade-interest
capture, and owner-run operations. It must not be positioned as a public paid
SaaS launch.

Verdict:

- Private paid beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**

North Star Metric remains **Weekly Reviewed Words**. Saved words, pack previews,
pricing interest, and progress copy count only when they support real review
behavior.

## Tested Environment

| Field | Value |
| --- | --- |
| Report date | 2026-06-15 KST |
| Branch | `release/manual-qa-execution-report` |
| Local server port used | `3021` |
| Local base URL | `http://127.0.0.1:3021` |
| Browser smoke scope | Route-load smoke for core paid beta surfaces |
| Manual QA source | Existing Track B local app behavior and static report contract |
| Data boundary | Local browser storage only; no production data |

## Validation Commands

Run before finishing the PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
git diff --check
```

## Browser Smoke Summary

Clean-port smoke target:

```txt
http://127.0.0.1:3021
```

Routes selected for optional browser smoke:

- `/dashboard`
- `/review`
- `/saved`
- `/packs`
- `/pricing`

Result captured for this PR:

| Route | Status | Visible 404 |
| --- | --- | --- |
| `/dashboard` | 200 | No |
| `/review` | 200 | No |
| `/saved` | 200 | No |
| `/packs` | 200 | No |
| `/pricing` | 200 | No |

Console error count: `0`  
Hydration warning count: `0`

This route-load smoke does not replace the full manual golden-flow pass. Before
private paid beta invites, the owner should repeat the save, review, weak,
packs, pricing, mobile, keyboard, and localStorage evidence pass from a clean
browser profile.

## Route-By-Route QA Matrix

| Route | Smoke expectation | Manual QA focus | Beta disposition |
| --- | --- | --- | --- |
| `/` | Loads the Track B home surface without visible 404. | Entry point keeps review loop framing and safe navigation. | Conditional manual-only. |
| `/dashboard` | Loads Today Memory Mission. | Due, Weak, New, Learning, and Mastered values are honest; dashboard does not mutate review state/events. | Conditional manual-only. |
| `/review` | Loads Review Session v2. | Answering a card writes a review event and updates SRS state through the existing review flow. | Conditional manual-only. |
| `/review/due` | Loads due review or honest empty state. | Due cards come from real `nextDueAt` / review state. | Conditional manual-only. |
| `/review/weak` | Loads weak review or honest empty state. | Weak cards come from real mistakes, Weak mastery, or `weakScore`. | Conditional manual-only. |
| `/review/weak-sprint` | Loads weak sprint or honest empty state. | Sprint uses the same SRS records; no fake weak queue. | Conditional manual-only. |
| `/saved` | Loads Saved Library v2. | Due / Weak / New / Learning / Mastered / All tabs exist; page is read-only for review state/events. | Conditional manual-only. |
| `/packs` | Loads Packs v2. | Academic, IELTS, and GRE states are honest; unavailable packs do not fake progress. | Conditional manual-only. |
| `/packs/academic-vocabulary` | Loads Academic Vocabulary detail. | Preview CTAs route to safe review/pricing paths and pack progress is evidence-based. | Conditional manual-only. |
| `/pricing` | Loads Pricing / Paywall v2. | Free/Lite/Pro outcomes are present; no checkout, payment SDK, or entitlement mutation. | Conditional manual-only. |
| `/save?slug=dissonance&source=word_page` | Loads save confirmation. | Creates or preserves saved word and review state through existing save behavior only; no fake mastery. | Conditional manual-only. |
| `/word/dissonance` | Loads existing word detail route. | Memory state panel reflects local review state honestly. | Conditional manual-only. |
| `/word/obfuscate` | Loads existing word detail route. | Weak-state example remains tied to real review state and not fake progress. | Conditional manual-only. |

## localStorage Probe Checklist

| Key | Expected use | QA check | Must not contain |
| --- | --- | --- | --- |
| `vlx_saved_words_v1` | Saved words keyed by slug. | `dissonance` exists after save and source is safe. | Secrets, provider tokens, payment data, raw private payloads. |
| `vlx_review_state_v1` | SRS records for saved/reviewed words. | Save creates or preserves review item; mastery does not jump to Mastered. | Fake mastery, entitlement proof, account tokens. |
| `vlx_review_events_v1` | Review answer events. | Event count increases after an answer. | Payment data, private payloads, production account data. |
| `vlx_daily_stats_v1` | Local daily review counts. | Stats update only after review answers. | Fake Weekly Reviewed Words. |
| `vlx_pack_progress_v1` | Local pack preview/review progress. | Progress ties to preview start or review evidence. | Fake completion, paid access proof. |
| `vlx_upgrade_interest_v1` | Local upgrade interest attribution. | Lite/Pro interest records do not grant access. | Payment data, invoices, subscriptions. |
| `vlx_plan_state_v1` | Local plan preview/debug state only. | Does not become entitlement or subscription proof. | Paid access proof, billing state. |
| `vlx_pending_home_quiz` | Optional transition key. | Does not compete with SRS state or mastery. | Review state replacement, fake mastery. |

## Console / Hydration Error Checklist

- Record console error count on `/dashboard`, `/review`, `/saved`, `/packs`,
  and `/pricing`.
- Record hydration warning count on the same route set.
- Treat visible 404, route crash, hydration mismatch, or persistent console
  errors in the core loop as a P0 private-beta blocker until retested.
- Use a clean port such as `3021` to reduce stale server risk.
- Do not paste secrets, private payloads, production user data, or payment data
  into QA notes.

## Mobile / Keyboard / Accessibility Smoke Checklist

- Use a mobile viewport around `390x844`.
- Open `/dashboard`, start review, and answer at least one card.
- Confirm visible focus states on dashboard, saved, review, packs, pricing, save,
  and word detail surfaces.
- Confirm keyboard navigation can reach core save, review, answer, and pricing
  interest controls.
- Confirm no color-only critical state; Due, Weak, Mastered, and plan states
  need readable text labels.
- Confirm semantic headings exist and mobile text/buttons do not overlap.
- Treat keyboard-blocked save/review or unusable mobile review as P0.

## Paywall Trigger Checklist

- `/pricing` includes Free, Lite, and Pro cards.
- Outcome copy exists:
  - Start remembering your first words
  - Build a daily visual memory habit
  - Fix weak words and prepare for exams
- Save-limit and review-limit prompts remain contextual and safe.
- Upgrade interest can be recorded locally only.
- No checkout, real payment provider SDK, subscription, invoice, billing portal,
  production entitlement, or account mutation is introduced.

## P0 Blockers

These block public paid beta. They allow private paid beta only under the
manual owner-run constraints in this report.

- Real payment/checkout is not implemented.
- Production account sync is not implemented.
- Monitoring/alerting is not implemented.
- Privacy/support/refund final gate is not complete.
- Full accessibility audit is not complete.
- Public paid beta remains No-Go.

## P1 Issues

- Private paid beta can proceed only manually and with owner oversight.
- Account sync preview/digest is still needed.
- Manual payment / entitlement policy is still needed.
- QA evidence should be repeated before any public launch.

## P2 Polish

- Richer pack data for IELTS/GRE.
- Deeper mobile polish.
- Future AI mistake explanation after the SRS loop is stable.
- Future no-watermark/download/export implementation.

## Stop Conditions

Stop and ask for explicit approval before:

- Webflow publishing.
- Cloudflare production Worker changes.
- DNS, deployment, Vercel, or production setting changes.
- Payment, Paddle, Stripe, billing, invoice, checkout, subscription, or
  entitlement implementation.
- Auth, account sync API routes, database providers, migrations, or production
  user data mutation.
- Secrets, API keys, passwords, tokens, billing credentials, or env var changes.
- New route groups beyond the approved Track B route set.

Stop private paid beta execution if:

- Save does not create or preserve a review item.
- Review answers do not write events.
- Review answers do not update memory state.
- Due, Weak, Mastered, pack progress, streaks, or paid access are fake.
- The mobile or keyboard review flow is unusable.
- Console/hydration failures affect the core loop.

## Rollback Notes

This PR is docs/contracts/tests only. Rollback is a normal revert of:

- `docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md`
- `src/lib/paid-beta-manual-qa-execution/*`
- `tests/paid-beta-manual-qa-execution.spec.ts`
- README link additions

No production data, payment settings, auth behavior, Webflow, Cloudflare,
Vercel, DNS, deployment settings, API routes, route handlers, middleware, or
runtime UI behavior are changed by this report.

## Recommended Next PRs

Recommended next PR: **#80 Private beta gate prep**.

Reason: this report keeps private paid beta conditional and manual-only, so the
next safest step is to prepare the owner-run invite gate, manual entitlement
policy, support/privacy/refund checklist, and repeat-QA evidence log without
adding real checkout or account sync.

Alternative #80 if the owner chooses persistence disclosure first:
**Account sync disabled route skeleton**, still without implementing real sync,
auth, payment, billing, or production data writes.

## Safety Confirmation

- Docs/contracts/tests only.
- No runtime UI changes.
- No API routes.
- No route handlers.
- No middleware.
- No auth, database, provider SDK, logging SDK, validation dependency, or
  production persistence implementation.
- No payment, billing, checkout, subscription, invoice, billing portal, or paid
  entitlement.
- No env vars, secrets, production data, Webflow, Cloudflare, Vercel, DNS, or
  deployment settings.
- No fake mastery, fake pack progress, fake streaks, or fake paid access.
- `npm audit fix` was not run.
