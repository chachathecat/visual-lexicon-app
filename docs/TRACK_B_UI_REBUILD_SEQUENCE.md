# Track B UI Rebuild Sequence

## Purpose

This sequence converts the post-PR #154 Track B app into a stricter Visual
Memory Engine without implementing runtime UI changes in the audit PR.

North Star:

```txt
Weekly Reviewed Words
```

Core formula:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

This document is sequencing guidance only. It does not authorize payment,
billing, account sync, production deployment, middleware, route handlers,
provider integrations, FCT-070, ACC-010, auto-merge, public paid beta launch,
or roadmap status changes.

## Guardrails

- Preserve the approved Track B route set.
- Preserve existing local storage keys and do not invent competing SRS keys.
- Save must create or preserve review state.
- Review answers must create events and update review state and daily stats.
- Due, Weak, and Mastered must come from real review state.
- Weekly Reviewed Words must come from review events.
- Pack progress must come from preview/review activity, not planned pack copy.
- Pricing and paywall surfaces must not imply real checkout until billing is
  explicitly approved.
- `vlx_plan_state_v1` is never paid-access proof.
- `vlx_upgrade_interest_v1` is attribution-only and never entitlement.

## Sequence

| Step | PR theme | Goal | Main acceptance checks |
| --- | --- | --- | --- |
| 1 | Track B App Shell / Design Tokens | Establish calm, premium, responsive Track B foundations before rebuilding screens. | Shared shell covers approved Track B surfaces; focus, spacing, typography, navigation, mobile constraints, and visual tokens are consistent; no new large route groups. |
| 2 | Dashboard v2 - Today's Memory Mission | Make `/dashboard` the daily command center for memory work. | Start Review is primary; Due/Weak/New/Mastered are real-state-backed; Saved Library supports the mission instead of dominating it. |
| 3 | Review Session v2 - focused memory loop | Make `/review`, `/review/due`, `/review/weak`, and `/review/weak-sprint` one-card active recall flows. | Answer, confidence, feedback, event write, state update, next due, and summary are clear on mobile and keyboard. |
| 4 | Saved Library v2 - Due/Weak/New/Mastered queue | Make `/saved` a review queue, not a bookmark list. | Queue sections/tabs derive from selectors; no fake mastery; saved words clearly become review items. |
| 5 | Packs v2 - 30-day plan/product cards | Reframe `/packs` and `/packs/[packId]` as learning plans. | Academic Vocabulary has a real preview/review path; IELTS/GRE stay honest until content exists; progress is not fabricated. |
| 6 | Pricing / Paywall v2 - outcome-based conversion | Make `/pricing` and paywall prompts sell learning outcomes while staying no-payment safe. | Copy reconciles with canonical plan data; no checkout implication; upgrade interest remains local/attribution-only. |
| 7 | Manual QA Execution Report | Run current golden flows and record evidence. | Save, alias, extension, due, weak, weak sprint, packs, pricing, settings, word detail, mobile, keyboard, storage, and no-payment safety are checked. |
| 8 | Private Beta Gate | Decide whether external manual invite beta can start. | P0 private blockers are zero; support/refund/privacy/local-storage disclosures are filled; public paid beta remains No-Go. |

Historical lowercase labels preserved for older doc checks:

- Pricing/Paywall v2 - outcome-based conversion.
- Manual QA execution report.
- Private beta gate.

## Step Notes

### 1. Track B App Shell / Design Tokens

The app shell and design tokens should make Track B feel calm, premium,
minimal, warm, credible, and learning-focused before surface-specific rebuilds.

Center:

- Approved navigation only.
- Shared spacing, typography, buttons, focus states, empty states, and cards.
- Stable mobile constraints for review, dashboard, saved, packs, pricing, word
  detail, and settings.
- Accessibility foundations: skip link, landmarks, focus visibility,
  responsive reflow, and readable contrast.

Avoid:

- Decorative complexity.
- One-off page shells.
- New route groups.
- Runtime claims about billing, auth, account sync, or paid access.

### 2. Dashboard v2 - Today's Memory Mission

The first viewport should answer one question: what memory work should the
learner do today?

Center:

- Due now.
- Weak words.
- New saved words.
- Mastered count from delayed recall state.
- Continue current pack.
- One primary Start Review action.

Avoid:

- Saved count as the success metric.
- Fake streaks or fake progress.
- Upgrade prompts disconnected from review behavior.

### 3. Review Session v2 - Focused Memory Loop

Review must stay short, focused, and state-writing.

Center:

- One visual/definition/word recall prompt.
- One answer action.
- Confidence action.
- Immediate feedback.
- Review event append.
- Review state update.
- Honest next due.
- Mobile thumb ergonomics and keyboard flow.

Avoid:

- Random easy distractors as the main quiz method.
- AI explanations before the SRS loop is stable.
- Mode switching that competes with answering.

### 4. Saved Library v2 - Memory Queue

Saved Library should make saved words become review items.

Center:

- Due.
- Weak.
- New.
- Learning.
- Mastered.
- All.

Avoid:

- Bookmark-list framing.
- Static sample words in saved state.
- Mastery labels without review state.

### 5. Packs v2 - 30-Day Plan/Product Cards

Packs should feel like a learning plan, not a catalog.

Center:

- Academic Vocabulary as the current real path.
- IELTS Writing and GRE Visual Verbal clearly unavailable/planned until content
  exists.
- Preview-to-review route.
- Progress from pack activity and review events.
- Paid value framed as outcomes, not inventory.

Avoid:

- Paid claims for missing packs.
- Fake pack completion.
- Mock/static data presented as production content.

### 6. Pricing / Paywall v2 - Outcome-Based Conversion

Pricing must remain honest until billing is approved.

Center:

- Free: start remembering your first words.
- Lite: build a daily visual memory habit.
- Pro: fix weak words and prepare for exams.
- Canonical price/capability reconciliation before public paid beta.
- No-payment beta safety copy while checkout is absent.

Avoid:

- "Beta - pricing TBD" once canonical catalog values are being used for
  release.
- Checkout implication before billing approval.
- Client plan state as paid access.

### 7. Manual QA Execution Report

Manual QA should use `docs/PAID_BETA_MANUAL_QA.md` and
`docs/golden_user_flows.md`.

Required checks:

- `/dashboard`
- `/save?slug=dissonance&source=word_page`
- `/save?slug=dissonance&source=alias_search`
- `/save?slug=dissonance&source=extension`
- `/review`
- `/review?mode=due` and `/review/due`
- `/review?mode=weak` and `/review/weak`
- `/review/weak-sprint`
- `/saved`
- `/packs` and `/packs/academic-vocabulary`
- `/pricing`
- `/settings`
- `/word/dissonance`
- Local storage probes for all learning/beta keys
- No real payment, no fake paid entitlement, no fake mastery

### 8. Private Beta Gate

Private/manual beta can move forward only if:

- P0 private blockers are zero.
- No real checkout or billing behavior is exposed.
- Support/refund/privacy/local-storage disclosures are filled.
- Manual QA evidence is current after PR #154.
- Owner accepts browser-local learning state as a beta limitation.

Public paid beta remains No-Go until account persistence, payment/provider
policy, monitoring, privacy, support/refund, accessibility, content, analytics,
and production safety gates pass.

## Explicit Non-Goals

This sequence does not implement:

- FCT-070.
- ACC-010.
- Auto-merge.
- Runtime API routes.
- Middleware changes.
- Real account sync.
- Real payment, checkout, billing, subscription, invoice, or billing portal.
- Real payment SDKs or provider integrations.
- Production deployment settings.
- Webflow changes.
- Cloudflare Worker changes.
- R2 production object changes.
- DNS changes.
- Secrets or production data changes.
- Roadmap status changes.
