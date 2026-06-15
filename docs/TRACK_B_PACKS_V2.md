# Track B Packs v2

Packs v2 rebuilds `/packs` and `/packs/[packId]` as guided visual vocabulary
plans for the paid learning app.

Header copy:

```txt
Packs
Guided visual vocabulary plans for goals and exams.
```

## Product Role

Packs support the Track B loop:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

They are a learning-plan and monetization surface, not a static catalog. The
primary job is to help learners choose a plan, preview words honestly, and enter
existing review flows.

## Featured Plans

The first featured plans are:

- Academic Vocabulary
- IELTS Writing Vocabulary
- GRE Visual Verbal

Academic Vocabulary is backed by current academic pack data and can show word
counts, free preview count, plan length, preview cards, and local state-derived
progress. IELTS Writing Vocabulary and GRE Visual Verbal remain clearly marked
as pending when no pack words exist.

## Data Rules

Packs v2 may read:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- `vlx_pack_progress_v1`
- static pack preview data from the existing pack reader

Packs v2 does not write review state or review events. Review answer writes stay
inside the existing review session flow. Packs can continue preserving the local
pack progress contract when a preview is opened or started.

Due, Weak, Reviewed, and Mastered counts are computed only for known pack word
slugs. Mastered means existing review state has box 5 and `Mastered`.

## Monetization

Upgrade messaging is visual-only. Packs v2 links to `/pricing` and does not add
checkout, payment SDKs, billing routes, entitlement logic, account sync, or paid
access grants.

## Safety

This PR stays local to Track B app code, tests, and docs. It does not touch
Webflow, Cloudflare Workers, auth, billing, DNS, payment settings, secrets,
production data, deployment settings, route handlers, API routes, middleware,
database providers, or AI calls.

Recommended next PR: **#78 Pricing / Paywall v2**.
