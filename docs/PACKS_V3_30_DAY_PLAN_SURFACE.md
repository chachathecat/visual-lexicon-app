# Packs v3 30-Day Plan Surface

Packs v3 reframes `/packs` and `/packs/[packId]` as 30-day visual learning
plans, not decorative catalog cards. The surface exists to move learners from a
pack preview into active recall, mistake evidence, weak-word repair, and repeat
review.

## Mental Model

```txt
choose plan -> start preview -> review answers -> pack progress -> weak repair -> continue plan
```

The initial plan set is:

- Academic Vocabulary
- IELTS Writing
- GRE Visual Verbal

Academic Vocabulary can be actionable when resolved pack data exists. IELTS
Writing and GRE Visual Verbal stay planned/private-beta copy until real preview
words exist.

## Progress Derivation

The packs surface may read:

- `vlx_pack_progress_v1`
- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`

The packs page and pack detail pages must not write `vlx_pack_progress_v1` on
load. Pack progress may be written only after an explicit learner action, such
as starting a preview from a CTA, or after the existing review flow completes
real pack review answers.

Pack-level `reviewedCount` and `correctCount` come only from
`vlx_pack_progress_v1`. Due, Weak, Mastered, and pack weak-word lists come only
from known pack word slugs mapped to existing review state and event evidence.

## Primary CTA

The `/packs` primary CTA uses this decision tree:

```txt
visible pack progress exists -> Continue learning plan -> most recent active pack detail
no visible pack progress -> Start Academic preview -> /packs/academic-vocabulary
```

Visible pack progress means `vlx_pack_progress_v1` has evidence such as
`previewStartedAt`, `previewCompletedAt`, `lastReviewedAt`, `reviewedCount`, or
`startedAt`.

## P0 Truth Rule

Fake pack progress is a P0 blocker because pack progress is part of the memory
state moat. The UI must not create progress from page views, planned pack copy,
marketing totals, word-count guesses, or placeholder states.

## Safety

Packs v3 does not add checkout, billing, payment routes, payment SDKs, real
entitlements, auth changes, Webflow changes, Cloudflare Worker changes, DNS
changes, deployment setting changes, secrets, production data changes, R2
changes, or real user data changes. Owner approval remains required before any
private/manual beta launch claim.
