# Track B Dashboard V2

Branch: `release/dashboard-todays-memory-mission`  
PR: `#74 Dashboard v2: Today's Memory Mission`

## Purpose

Dashboard v2 makes the next best learning action obvious within three seconds.
It rebuilds `/dashboard` around Today, not a list of feature modules.

North Star Metric: **Weekly Reviewed Words**.

Track B mental model:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

Core loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Runtime Scope

This PR changes `/dashboard` only.

- `/dashboard` now uses `TrackBAppShell`, `TrackBPageHeader`,
  `TrackBPrimaryActionCard`, `TrackBMetricCard`, `TrackBEmptyState`, and
  `TrackBUpgradeNudge`.
- The existing root route remains on the older dashboard view so this PR does
  not unintentionally rebuild `/`.
- Review Session, Saved Library, Packs pages, Pricing, SRS engine behavior,
  route handlers, middleware, auth, billing, and provider integrations are not
  changed.

## State Contract

Dashboard v2 reads existing local state only:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
vlx_pack_progress_v1
```

It does not mutate review state, review events, daily stats, saved words, or pack
progress. Review answers remain the only place that should write review events
and advance SRS state.

## Dashboard Structure

1. Track B app shell.
2. Page header titled `Today`.
3. Today's Memory Mission hero with a primary `Start due review` action.
4. Memory status row:
   - Due from `getDueToday`.
   - Weak from `getWeakWords`.
   - New from `getNewSaved`.
   - Learning from review state items with `mastery === "Learning"`.
   - Mastered from `getMastered`.
5. Continue section:
   - Shows active pack progress only when `vlx_pack_progress_v1` has visible
     local progress.
   - Otherwise shows preview links without claimed progress.
6. Existing alias search support:
   - Preserved as a safe way to find canonical word cards and save words into
     the review loop.
   - Does not create multilingual pages or generate new route groups.
7. Weak spotlight:
   - Shows weak candidates only when the weak selector returns real candidates.
   - Otherwise shows an educational empty state.
8. Recently saved:
   - Shows recent saved words from local saved state.
   - Saved-only entries do not receive fake box or mastery labels.
9. Contextual upgrade nudge:
   - Visual only.
   - Links to the existing `/pricing` route.
   - Does not grant paid access or introduce entitlement logic.

## Safety Confirmation

Dashboard v2 does not add payment, checkout, subscription, invoice, billing
portal, auth, API routes, route handlers, middleware, database/provider SDKs,
environment variables, production data writes, Webflow, Cloudflare, Vercel, DNS,
or deployment changes.

It does not fake due counts, weak counts, mastered counts, pack progress, paid
access, or streaks.

## Follow-up

Recommended next PR: **#75 Review Session v2**.
