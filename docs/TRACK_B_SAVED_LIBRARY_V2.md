# Track B Saved Library v2

Branch: `release/saved-library-v2`  
PR: `#76 Saved Library v2`

## Purpose

Saved Library v2 rebuilds `/saved` as a Memory queue, not a bookmark list.

North Star Metric: **Weekly Reviewed Words**.

Track B mental model:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

Core loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

Page subcopy:

```txt
Saved words become review cards.
```

## Runtime Scope

This PR changes the Saved Library surface only:

```txt
/saved
src/components/views/saved-library-view.tsx
```

It reuses the Track B app shell, status badges, metric cards, empty state, and
visual-only upgrade nudge. Dashboard v2, Review Session v2, Packs, Pricing,
SRS engine behavior, local storage key names, route handlers, middleware, auth,
billing, payments, provider SDKs, and production infrastructure are unchanged.

## State Contract

Saved Library v2 reads existing local state:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
```

It does not write saved words, review state, review events, daily stats, pack
progress, plan state, or upgrade interest. Review answers remain the only place
that should write review events and advance SRS state.

## Page Structure

1. Track B app shell with Saved active.
2. Page header:
   - `Memory queue`
   - `Saved is a review queue, not bookmarks.`
3. Summary cards:
   - Due now
   - Weak words
   - New saved
   - Learning
   - Mastered
4. Status tabs:
   - Due
   - Weak
   - New
   - Learning
   - Mastered
   - All
5. Word cards:
   - visual thumbnail or honest placeholder
   - word and available definition
   - status badge with text, not color alone
   - box, weak score, next due, source, saved date, and review counts only when
     available from local state
   - safe links to existing review routes or the word detail route
6. Empty states for no saved words, no due words, no weak words, no new saved
   words, no learning words, and no mastered words.
7. Contextual upgrade nudge:
   - visual only
   - links to existing `/pricing`
   - does not grant paid access or add entitlement logic

## Queue Rules

Due, Weak, New, Learning, Mastered, and All are derived without fake state.

- Due uses `getDueToday(review_state)` and only shows saved words.
- Weak uses `getWeakWords(review_state)` and only shows saved words that are not
  already mastered.
- New uses `getNewSaved(saved_words, review_state)`.
- Learning shows saved words with existing review state that are not new, weak,
  or mastered and have `Learning` or `Strong` mastery.
- Mastered uses `getMastered(review_state)` and requires both `box === 5` and
  `mastery === "Mastered"`.
- All uses saved words sorted by saved date when available.

Saved-only words never receive a fake box, weak score, due date, or Mastered
label. If a field is unavailable, the UI omits it or shows an honest neutral
state such as `No review state yet`.

## Accessibility

- Semantic page and section headings.
- Native button tabs with `role="tablist"`, `role="tab"`, `aria-selected`, and
  arrow/Home/End keyboard handling.
- Visible focus states for tabs, panels, and links.
- Status is communicated with text labels, not color alone.
- Mobile card layout uses stable image and card dimensions.
- Reduced-motion CSS applies to Saved v2 transitions.

## Safety Confirmation

Saved Library v2 does not add payment, checkout, subscription, invoice, billing
portal, auth, API routes, route handlers, middleware, database/provider SDKs,
environment variables, production data writes, Webflow, Cloudflare, Vercel, DNS,
AI calls, or deployment changes.

It does not fake due counts, weak counts, mastered counts, streaks, paid access,
or pack progress.

## Manual QA Notes

Recommended smoke paths:

```txt
/dashboard
/review
/saved
```

Golden checks:

- `/saved` loads inside the Track B app shell.
- Due, Weak, New, Learning, Mastered, and All tabs are keyboard reachable.
- Due cards come only from due review state.
- Weak cards come only from weak review evidence.
- Mastered cards require box 5 and Mastered state.
- Saved-only cards show `No review state yet` and no box, weak score, due date,
  or Mastered label.
- Card CTAs link to `/review/due`, `/review/weak`, `/review?mode=saved`, or
  `/word/[slug]`.
- Opening `/saved` does not mutate `vlx_review_state_v1` or
  `vlx_review_events_v1`.

## Rollback

Rollback is local to:

```txt
src/app/saved/page.tsx
src/components/views/saved-library-view.tsx
src/app/globals.css
tests/saved-library.spec.ts
docs/TRACK_B_SAVED_LIBRARY_V2.md
README.md
```

The SRS engine, storage keys, review session, dashboard, packs, auth, billing,
and production infrastructure are unchanged.

Recommended next PR: **#77 Packs v2**.
