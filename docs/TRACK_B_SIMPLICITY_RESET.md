# Track B Simplicity Reset

Track B has accumulated too many simultaneous surfaces for the paid learning
app. This reset narrows the v0 mental model before the next runtime UI work.

This is a docs, contracts, fixtures, and tests-only decision record. It does
not implement runtime UI, route handlers, middleware, API routes, production
integrations, checkout, billing, auth, Webflow, Cloudflare Workers, Vercel, DNS,
deployment, secrets, environment variable, or production data changes.

## Product Identity

Visual Lexicon turns difficult words users meet online into visual memory
cards, then reviews them before they forget.

North Star: **Weekly Reviewed Words**

Core loop:

```txt
Save -> Review -> Memory state -> Return tomorrow
```

Public paid beta: **No-Go**

Private beta: **owner-controlled/manual-only/conditional**

External participant validation: **Not Started**

## Simplified Mental Model

The product should feel like five things:

1. Today
2. Save
3. Review
4. Queue
5. Upgrade interest

Today is the dominant daily action surface. Save creates the review item.
Review updates memory state. Queue is the learner's honest list of words that
need review. Upgrade interest captures intent only; it does not create access.

## Approved v0 Routes

Only these routes belong in the v0 simplification target:

```txt
/save
/dashboard
/review
/saved
/pricing
```

Existing routes can remain until separately simplified or retired, but this
contract should not authorize adding more route groups.

## Deferred Routes And Features

These routes and features are de-emphasized or deferred for the simplicity
sequence:

- `/review/weak`
- `/review/weak-sprint`
- `/packs`
- `/packs/[packId]`
- AI Tutor
- Mastery Test
- no-watermark export
- real checkout
- external participant beta validation

Weak-word repair remains important, but it should not split the v0 learner
mental model into parallel products. Packs, AI Tutor, Mastery Test, exports,
real checkout, and external validation require separate readiness work.

## Dashboard v0 Rule

The dashboard has one dominant CTA:

```txt
Review 5 words before you forget
```

Supporting stats are limited to:

- Due
- Weak
- New
- Reviewed this week

Do not create a noisy parallel action grid. The dashboard should make Today
obvious and point the learner back into review.

## Save v0 Rule

After save, the learner must understand:

```txt
This word is now in your review queue.
```

Primary CTA:

```txt
Review now
```

Secondary CTA:

```txt
Go to dashboard
```

Save is not a bookmark action. Save creates or preserves a review item.

## Review v0 Rule

A review session should be:

1. one card
2. one question
3. answer
4. confidence: knew / guessed / forgot
5. feedback
6. next card
7. summary

There should be no extra nav noise inside the answer flow. Review answers must
write events and update memory state.

## Saved v0 Rule

Saved is not bookmarks.

Saved is a review queue.

Tabs and filters are secondary. They help learners find Due, Weak, New, and
other queue slices, but they must not become the primary product promise.

## Pricing v0 Rule

Pricing does not create paid access.

- no real checkout
- no fake paid access
- collect upgrade interest only
- Lite = daily memory habit
- Pro = weak-word repair and exam prep

Upgrade interest can inform the owner, but it must not imply a payment intent,
subscription, entitlement, or unlocked feature.

## Explicit Non-Goals

- no external beta claim
- no payment intent claim
- no retention claim
- no agent-mode localhost test dependency
- no new AI feature
- no runtime UI implementation
- no production integration change

This reset does not claim external user validation, retention proof, paid access,
or beta readiness beyond the static contract.

## Forbidden Touchpoints

This reset must not touch:

- Webflow
- Cloudflare Workers
- Vercel settings
- DNS
- deployment settings
- billing
- payment
- checkout
- subscription
- auth runtime
- provider SDKs
- secrets
- env vars
- production data
- API routes
- route handlers
- middleware
- `npm audit fix`

If future work requires any of those touchpoints, stop and get explicit owner
approval first.

## Next Implementation PR Sequence

1. #94 Dashboard v0 simplification
2. #95 Save result page simplification
3. #96 Review session focus pass
4. #97 Saved queue simplification
5. #98 Pricing interest simplification
6. #99 Owner local smoke after simplification

Recommended next PR: **#94 Dashboard v0 simplification**

## Static Contract

The typed contract for this reset lives at:

```txt
src/lib/track-b-simplicity-reset/track-b-simplicity-reset.ts
```

It is static TypeScript data for docs and tests. Runtime app routes and
components should not import it.
