# Packs v2 Contract

Status: contract before implementation.

Scope: Track B `/packs` and `/packs/[packId]` learning-plan surfaces only. This
contract does not authorize runtime UI implementation in the contract PR, new
route groups, account sync, payment, auth, deployment, Webflow, or Cloudflare
Worker changes.

North Star: Weekly Reviewed Words.

Packs v2 exists to move learners into repeat review:

```txt
choose plan -> preview recall -> save/review -> mistakes -> weak review -> continue plan
```

## Product Contract

Packs are learning plans, not a generic catalog. A pack is a guided vocabulary
plan with a goal, a preview, honest availability state, review entry points, and
progress from real local learning evidence.

The Packs v2 surface must help a learner answer:

- What goal does this plan serve?
- What can I preview for free?
- What is locked for Pro or full-pack access?
- What should I review now?
- Where do I continue from my real progress?
- Which weak words came from mistakes inside this pack?

Packs v2 must not exist as a static list of content cards, fake word totals, or
fake completion progress.

## Canonical Packs

The first Packs v2 contract covers these plans:

| Pack | Canonical role | Availability contract |
| --- | --- | --- |
| Academic Vocabulary pack | Academic reading, essays, lectures, and exam vocabulary. | May show word count, free preview count, preview cards, and review CTAs only from resolved pack data. |
| IELTS Writing pack | IELTS Task 1 and Task 2 writing vocabulary. | Placeholder until IELTS word data exists. |
| GRE Verbal pack | GRE Verbal abstract vocabulary and mistake-prone words. | Placeholder until GRE word data exists. |
| Home/Core demo pack | Short demo plan for the first learning loop using resolved Home/Core data. | Must be labelled as a demo and must not imply full-pack coverage. |

Implementation may preserve existing pack IDs during migration, but display copy
must converge on the canonical names above. Any slug or ID change must keep
approved routes under `/packs` and `/packs/[packId]`.

## Free Preview Contract

Every displayed pack must have an explicit free preview state:

- Available packs show `freePreviewCount` only when the count comes from pack
  data or a reviewed implementation constant tied to resolved preview words.
- The free preview count must never exceed the number of real preview cards
  available to the learner.
- Placeholder packs show `Free preview pending`, not a guessed number.
- The Home/Core demo pack may show a demo preview count only for resolved demo
  words and must label it as a demo preview.
- Preview words must be real words with slug, word, definition, and visual
  evidence from the pack reader or approved static app data.

The contract default for unavailable packs is:

```txt
Word count pending
Free preview pending
Pack data is not available yet.
```

## Pro And Full-Pack Locked State

Full-pack access can be shown as locked, but only as a visual product state.

Required behavior:

- Pro/full-pack locked state is allowed for plans whose full content is not
  available to the current local beta learner.
- Locked copy must be honest that payment is not connected.
- Locked state may link to `/pricing` or record local upgrade interest through
  existing placeholder flows.
- Locked state must not grant access, change entitlements, create accounts,
  start checkout, create subscriptions, or mark a learner as paid.

Required locked copy baseline:

```txt
Full pack access is planned for Pro. Payment is not connected in this beta.
```

## Honest Placeholder Copy

Placeholder packs must not impersonate available learning plans.

Required placeholder copy:

```txt
Pack data is not available yet.
Word count pending
Free preview pending
Progress cannot be computed until this pack has word data.
Preview review is unavailable until preview words exist.
```

The UI may add pack-specific context, such as IELTS Writing or GRE Verbal, but
must preserve the meaning of the baseline copy.

## Progress Contract

Pack progress comes from `vlx_pack_progress_v1`.

The progress store is keyed by `packId` and each item must be representable as:

```ts
{
  packId: string;
  startedAt?: string;
  lastOpenedAt?: string;
  previewStartedAt?: string;
  previewCompletedAt?: string;
  lastReviewedAt?: string;
  reviewedCount: number;
  correctCount: number;
  source: "packs_page" | "pack_detail" | "review";
}
```

Packs v2 may read these local storage keys:

```txt
vlx_pack_progress_v1
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Progress rules:

- Pack progress must not be computed from marketing copy, full word count, route
  visits alone, or placeholder state.
- `reviewedCount` and `correctCount` must come from real review completion or
  existing progress records.
- Continue state appears only when `vlx_pack_progress_v1` has visible progress
  for the pack, such as preview started, preview completed, reviewed count, or
  last reviewed time.
- Due, Weak, Strong, and Mastered labels must come from `vlx_review_state_v1`
  for known pack word slugs.
- Review event counts must come from `vlx_review_events_v1` filtered to known
  pack word slugs.
- Missing, malformed, or unavailable progress must fail safe to an honest empty
  state.

No fake pack progress is allowed.

## CTA Contract

Preview review CTA:

- Available preview packs show a preview review CTA.
- The CTA must include `packId` and `source=pack_preview`.
- The review queue must be limited to real preview words for that pack.
- Placeholder packs must not show a preview review CTA.
- Starting a preview may write `previewStartedAt` to `vlx_pack_progress_v1`,
  but must not write review state or review events until the learner answers in
  the review flow.

Continue pack CTA:

- Continue pack CTA appears only from visible `vlx_pack_progress_v1` evidence.
- Continue must route to the safest existing review entry point for that pack or
  to an honest unavailable state if pack-specific review is not ready.
- Continue must not invent progress for packs the learner has not started.

Weak review from pack mistakes:

- A pack weak review CTA appears only when known pack word slugs have real weak
  evidence.
- Weak evidence comes from `vlx_review_state_v1` and `vlx_review_events_v1`,
  including `mastery === "Weak"`, high `weakScore`, repeated wrong answers, or
  wrong-heavy history.
- Weak review must not select arbitrary saved words or random pack words just to
  populate the queue.
- If a filtered pack weak-review route is not implemented yet, the UI must use
  honest copy instead of implying filtered practice exists.

## No Fake Counts

Packs v2 must not fake word counts.

Allowed:

- Show a word count when the resolved pack data contains the word list or an
  authoritative `wordCount`.
- Show preview count when it is backed by real preview cards.
- Show demo count for Home/Core only when labelled as demo.

Blocked:

- Displaying planned totals as real totals.
- Using copy such as `500 words`, `complete pack`, or `full GRE set` without
  data.
- Deriving completion percentage from total word count when review evidence is
  missing.
- Marking pack complete because the preview was opened.

## Safety Boundaries

This contract keeps public paid beta blocked and does not add real payment.

Required safety:

- Docs/tests only for the contract PR.
- No runtime UI implementation in this PR.
- No fake pack progress.
- No fake word counts.
- No fake mastery, due, weak, streak, paid, entitlement, or subscription state.
- No real payment, checkout, invoice, billing portal, payment SDK, or full-pack
  unlock.
- No Webflow, Cloudflare Workers, R2, auth, billing, DNS, deployment settings,
  secrets, production data, real user data, route handlers, middleware, AI
  Tutor, or provider SDK changes.

## Definition Of Done For Implementation PR

The future implementation PR is complete only when:

- Packs are presented as learning plans, not a generic catalog.
- Academic Vocabulary, IELTS Writing, GRE Verbal, and Home/Core demo states are
  represented honestly.
- Free preview count and word count are shown only from real data.
- Pro/full-pack locked state is visual-only and does not add payment.
- Progress is read from `vlx_pack_progress_v1`.
- Continue pack CTA appears only from real progress.
- Preview review CTA routes only to real preview words.
- Weak review comes from pack mistakes.
- Missing and placeholder data fail safe.
- Tests cover changed contracts.
- Manual QA confirms preview, continue, placeholder, lock, and weak-review
  flows.
