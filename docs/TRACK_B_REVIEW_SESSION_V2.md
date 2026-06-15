# Track B Review Session v2

Review Session v2 rebuilds the local Track B review flow around one active
recall card at a time.

North Star Metric: **Weekly Reviewed Words**.

Core loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Scope

Routes covered:

```txt
/review
/review/due
/review/weak
/review/weak-sprint
/review?mode=saved
/review?mode=word
/review?mode=hub
```

The rebuild is limited to the existing review session UI and the shared
`ReviewSessionView` component. It does not add route handlers, middleware, API
routes, auth, billing, payment, database SDKs, AI calls, production data access,
or deployment behavior.

## User Flow

1. Read one focused card.
2. Choose an answer from deterministic static choices.
3. Mark confidence:
   - `I knew it`
   - `I guessed`
   - `I forgot`
4. Store the answer through the existing local SRS helper.
5. Show immediate feedback from static card data only.
6. Show box, weak score, and next due consequences from the saved state.
7. End with an honest session summary and route back to Today or real weak
   review.

Review events are still written to `vlx_review_events_v1`, and review state is
still written to `vlx_review_state_v1`.

## Confidence Contract

The SRS engine already supports `confidence`.

- `I knew it` can improve the box when the answer is correct and fast enough.
- `I guessed` records the answer but does not advance the SRS box.
- `I forgot` keeps the card closer to review, especially when the answer is
  wrong.

No mastery is created by the UI. Mastery remains derived from the existing SRS
state and delayed-recall rules.

## Distractor Source

Answer choices are deterministic. The session prefers static confusable and
related candidates from pack data. When a saved word has no pack-level
confusable data, the UI labels the behavior as:

```txt
Static pack fallback candidates
```

This is an honest fallback label. It is not a new random distractor algorithm.

## Empty States

Empty states are intentionally honest:

- no due words means no due words were found in `vlx_review_state_v1`
- no weak words means no weak evidence exists in local review state
- no saved words means the saved library has no local entries

The empty states link to Today, Saved, and Packs without creating fake review
work.

## Safety

This PR does not touch Webflow, Cloudflare Workers, auth, billing, DNS, payment,
secrets, production data, deployment settings, route handlers, middleware, API
routes, AI calls, or provider SDKs.

Dashboard v2 remains read-only. Review answers remain the only place this UI
writes review events and review state.

## Manual QA Notes

Recommended smoke paths:

```txt
/dashboard
/review
/review/due
/review/weak
/review/weak-sprint
```

Golden checks:

- answer choice is keyboard-selectable
- confidence appears before feedback
- guessed correct answer does not advance the box
- feedback shows box, weak score, and next due from stored state
- summary shows reviewed, correct, wrong, improved, and weak remaining
- no empty state invents due, weak, mastered, paid, or streak state

## Rollback

Rollback is local to:

```txt
src/components/views/review-session-view.tsx
src/app/globals.css
tests/review-mode-routes.spec.ts
docs/TRACK_B_REVIEW_SESSION_V2.md
README.md
```

The SRS engine, storage keys, saved-word persistence, pack progress contracts,
auth, billing, and production infrastructure are unchanged.

Recommended next PR: **#76 Saved Library v2**.
