# Track B World-Class Product Quality Bar

## Executive Summary

Visual Lexicon Track B is not trying to be a feature collection. It must become
a Visual Memory Engine: a calm, credible learning system that turns difficult
words into memorable review habits.

The North Star is Weekly Reviewed Words. Saved words, pack previews, and
upgrade interest matter only when they support repeat review behavior.

Public paid beta remains No-Go. Private/manual beta remains
gate-review-required. This document does not launch beta, unblock public paid
beta, grant paid entitlement, or enable payment, checkout, billing, auth,
deployment, production data, Webflow, or Cloudflare Worker changes. Owner
approval remains required for beta movement.

## Product Identity

Visual Lexicon turns difficult words into visual memory cards. The app should
help learners move words from discovery into an inspectable memory loop:

- Saved words become review items.
- Reviews update memory state.
- Memory state is the moat.

Track B must feel like a focused learning app, not a generic dictionary, quiz
toy, or content catalog. It earns trust when the learner can see that every
learning status came from real review evidence.

## North Star And Product Formula

North Star: Weekly Reviewed Words.

Formula:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

Every product surface should strengthen that sequence.

## Non-Negotiable Product Principles

- Save is not enough; saved words must become review items.
- Review is not enough; review must update state/events.
- Do not fake mastery.
- Due/Weak/Mastered must be evidence-based.
- Weak Sprint must use real weak evidence.
- Pack progress must come from real progress/review evidence.
- Pro sells memory management, not just more quizzes.
- AI comes after the SRS loop works.
- Distractors must be meaningful, not random/easy.
- Public paid beta remains No-Go.

## World-Class UX Criteria

- One primary action per screen, with secondary actions visually quieter.
- Dashboard should prioritize Today's Memory Mission, then Start Review,
  Practice Weak Words, and Continue Deck.
- Review should be a one-card focus mode built around active recall, answer
  commitment, feedback, and the next best step.
- Saved should behave like a memory queue, not just a library.
- Packs should behave like learning plans, not just a catalog.
- Pricing should sell outcomes, not feature volume.
- AI should be contextual after mistakes, not a generic chatbox first.

## Release Gates

Core learning loop:

- Save creates or preserves a review item.
- Review answers create events and update memory state.
- Due, Weak, and Mastered are derived from real review state.

SRS truthfulness:

- Box, mastery, weakScore, nextDueAt, and review counts are grounded in review
  evidence.
- Mastered is not shown unless delayed recall evidence supports it.

Accessibility:

- Keyboard, focus, semantics, screen reader status, reduced motion, mobile
  ergonomics, and no keyboard trap are checked before release.

Performance:

- Review-critical paths stay responsive and avoid unnecessary blocking client
  scripts.

Pricing/paywall clarity:

- Upgrade copy explains the memory outcome.
- No real payment, checkout, billing, payment SDK, or real paid entitlement is
  introduced by this PR.

Private beta safety:

- Private/manual beta remains gate-review-required and owner approval remains
  required.

Public beta No-Go:

- Public paid beta remains No-Go until the required account sync, monitoring,
  privacy, accessibility, support, refund, rollback, and owner approval gates
  pass.

## Accessibility Gate

Before a runtime rebuild can pass the world-class bar, each approved app surface
must verify:

- Keyboard navigation reaches every meaningful control in a predictable order.
- Visible focus state is present for interactive controls.
- Semantic labels describe buttons, links, form fields, cards, review feedback,
  and navigation landmarks.
- Screen reader status messages announce review answer feedback, save state,
  queue completion, errors, and async changes.
- Reduced motion is respected for animated transitions and progress feedback.
- Mobile one-hand review usability supports answer selection, confidence
  marking, and next-card movement without awkward reach.
- No keyboard trap exists in menus, dialogs, review cards, or paywall surfaces.

## Performance Gate

The product bar uses these budgets for release-critical app surfaces:

- LCP <= 2.5s.
- INP <= 200ms.
- CLS <= 0.1.
- No unnecessary blocking client scripts on review-critical paths.

## Analytics Gate

The learning funnel must expose these required events before public paid beta
can move from No-Go:

- `vlx_save_word_click`
- `vlx_quiz_start`
- `vlx_quiz_answer`
- `vlx_quiz_complete`
- `vlx_review_state_update`
- `vlx_due_review_start`
- `vlx_weak_review_start`
- `vlx_pack_preview_start`
- `vlx_pack_preview_complete`
- `vlx_paywall_view`
- `vlx_upgrade_click`

## Monetization Gate

- Guest/Free value must appear before any paywall.
- Lite/Pro must explain the memory outcome: remembering difficult words,
  managing weak words, and building a repeat review habit.
- No real payment in this PR.
- No checkout in this PR.
- No payment SDK in this PR.
- No real paid entitlement in this PR.
- Public paid beta remains No-Go.
- Private/manual beta requires owner approval.

## Screen-Specific Quality Bar

Dashboard:

- Leads with Today's Memory Mission.
- Shows Due, Weak, and Mastered only from real state.
- Makes Start Review the primary action.

Review:

- Uses one-card focus mode.
- Requires active recall before feedback.
- Writes review events and updates memory state for every committed answer.

Saved:

- Behaves like a memory queue.
- Preserves existing progress on duplicate saves.
- Makes the next review action clearer than passive browsing.

Packs:

- Behave like learning plans.
- Show progress only from real preview, completion, and review evidence.
- Do not pretend paid pack access exists.

Pricing:

- Sells memory outcomes, not feature volume.
- Clearly states beta/payment limits.
- Does not introduce checkout, billing, payment SDKs, or real paid entitlement.

Word page:

- Turns discovery into save and review.
- Keeps visual metaphor, definition, and recall path tightly connected.
- Does not treat Save as the end of the journey.

Settings:

- Explains local data boundaries honestly.
- Does not expose secrets or production controls.
- Keeps account, billing, and entitlement claims aligned with actual enabled
  behavior.

## P0/P1/P2 Classification

P0 examples:

- Save does not create review item.
- Review does not update state/events.
- Due/Weak/Mastered become fake or misleading.
- Weak Sprint uses fake weak evidence.
- Pack progress is fake.
- Public paid beta is unblocked.
- Payment/checkout/billing route appears without approval.
- Fake mastery or fake paid entitlement appears.

P1 examples:

- Primary CTA hierarchy is unclear.
- Pricing copy is feature-heavy instead of outcome-based.
- Accessibility smoke coverage is incomplete.
- Analytics event coverage has gaps.
- Mobile review ergonomics need polish.

P2 examples:

- Visual polish.
- Future AI mistake explanation.
- Future export/download polish.
- Future multilingual concept graph.
- Future richer IELTS/GRE content.

## Recommended UI Rebuild Sequence

1. Dashboard v3 Today Memory Mission.
2. Review Session v3 Focus Mode.
3. Saved Library v3 Memory Queue.
4. Packs v3 30-Day Plan Surface.
5. Pricing / Paywall v3 Outcome Copy.
6. Accessibility and Performance Release Gate.
7. Analytics Learning Funnel Dashboard.
