# Visual Lexicon World-Class Bar

## Product Identity

Visual Lexicon turns difficult words users meet online into visual memory cards,
then reviews them before they forget.

Track A is the public discovery layer on `visuallexicon.org`. Track B is the
paid learning app on `app.visuallexicon.org`. This operating system is for
Track B and must not change Track A production behavior.

The product is not a generic dictionary. It is a memory product: words move from
discovery to saved cards, from saved cards to active recall, and from recall to
truthful memory state.

## North Star

Weekly Reviewed Words.

The primary measure is the number of words a learner actually reviews in a
week. Traffic, saves, upgrade clicks, and pack previews matter only when they
support repeat review behavior.

## Core Formula

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

Every major product decision should strengthen this loop.

## Non-Negotiables

- Saved words must become review items.
- Review answers must create review events.
- Review events must update review state.
- Due, Weak, and Mastered surfaces must be derived from real review state.
- Mastery must reflect delayed recall, not a single easy answer.
- Mistakes must be recorded and visible to the learning loop.
- Paywall and pricing surfaces must be honest about beta and payment status.
- App work must not touch Webflow, Cloudflare Workers, DNS, billing, secrets,
  auth, payment settings, or production user data unless a task explicitly
  authorizes that exact scope.

## Paid Beta Bar

Paid beta readiness means the local learning loop is coherent, inspectable, and
safe for a no-real-payment beta.

Required:

- Word page, alias search, and extension save sources create the same review
  item contract.
- Duplicate saves preserve existing progress.
- Due review and weak review answer events update SRS state.
- Weak sprint uses real weak words and writes real review events.
- Dashboard memory mission reports real due, weak, and mastered counts.
- Academic pack preview records preview progress without pretending to unlock a
  paid pack.
- Lite and Pro CTAs collect local or configured external interest only.
- The app has no checkout route, payment SDK, billing write, or subscription
  claim.
- Manual QA can prove the golden flows against local storage.

## World-Class Bar

World-class means Visual Lexicon earns trust as a calm, premium learning system.

Required:

- The save path is one click from discovery and always lands in review.
- Review sessions are short, focused, and built around active recall.
- Distractors are plausible and educational, not random easy choices.
- The learner can understand why a word is Due, Weak, Strong, or Mastered.
- Metrics are useful because they are true.
- Pack progress reflects actual review and completion events.
- The interface is quiet, warm, minimal, and credible.
- Upgrade prompts appear at meaningful learning moments and never block the MVP
  memory loop dishonestly.
- Privacy boundaries are obvious: local MVP data stays local, extension inputs
  are minimized, and no secret appears in browser code.
- Future AI supports mistake explanation after the SRS loop works; it does not
  replace the loop.

## P0/P1/P2 Interpretation

P0 means the product cannot safely ship or continue beta hardening.

Examples:

- Save does not create review state.
- Review answers do not create events.
- SRS state is fake, random, or not persisted.
- Dashboard shows fabricated Due, Weak, or Mastered counts.
- Pricing creates or implies real payment when payment is not enabled.
- A change touches Webflow, Cloudflare production Workers, billing, DNS,
  secrets, auth, payment settings, or production data without explicit approval.

P1 means the core loop works, but a meaningful beta promise is weak or confusing.

Examples:

- Pack progress is incomplete or hard to verify.
- Alias search misses an important safe path or has unclear empty states.
- Manual QA steps are incomplete.
- Paywall copy is vague about beta/payment status.
- Dashboard hierarchy makes review less prominent than saved library browsing.

P2 means polish, maintainability, or local quality should improve but does not
block a safe beta.

Examples:

- Copy can be tighter.
- UI spacing can be calmer.
- Docs can better cross-link.
- Tests could be more focused for a narrow edge case.

## Anti-Goals

- Do not make another dictionary.
- Do not optimize for saved word count without review.
- Do not fake mastery, streaks, pack completion, or learner progress.
- Do not add AI Tutor functionality before the SRS loop is reliable.
- Do not add real payment in beta-hardening documentation PRs.
- Do not generate multilingual pages as part of Track B hardening.
- Do not route app logic through Webflow.
- Do not expose API tokens in frontend code.
- Do not expand route groups or product features in agent-ops documentation PRs.
