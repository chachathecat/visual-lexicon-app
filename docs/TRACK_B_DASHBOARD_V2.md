# Track B Dashboard V2

Branch: `release/dashboard-todays-memory-mission`  
PR: `#74 Dashboard v2: Today's Memory Mission`

## Purpose

Dashboard v2 makes the next best learning action obvious within three seconds.
It rebuilds `/dashboard` around Today, not a list of feature modules.

North Star Metric: **Weekly Reviewed Words**.

Track B mental model:

```txt
Today -> Save -> Review -> Queue -> Early Access
```

Core loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Runtime Scope

Dashboard v2 is superseded by
`docs/DASHBOARD_V3_TODAY_MEMORY_MISSION.md` for the active `/dashboard`
renderer.

This parity pass makes `/dashboard` the canonical Track B app entry.

- `/` redirects to `/dashboard` from `src/app/page.tsx`.
- `/dashboard` uses `TrackBAppShell`, `TrackBMetricCard`, and
  `TrackBEmptyState`.
- `DashboardV2View` remains in the codebase as the previous dashboard renderer.
- The legacy `DashboardView` remains in the codebase but is no longer the root
  entry route.
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
```

It does not mutate review state, review events, daily stats, or saved words.
Review answers remain the only place that should write review events and
advance SRS state.

## Dashboard Structure

1. Track B app shell with desktop top navigation and mobile bottom navigation.
2. Centered 600px Today's Memory Mission card.
3. Three due-word preview rows from real review state with real visual
   thumbnails when due words exist.
4. One full-width coral `Start review` action.
5. Four quiet memory-state cards:
   - Due from `getDueToday`.
   - Weak from `getWeakWords`.
   - New from `getNewSaved`.
   - Mastered from `getMastered`.
6. Secondary `Memory queue` and `Save a word` actions.

The first screen must not show Alias Search, Learning Modules, Hub Progress,
Streak, Packs, Pro promotion, or Saved Library.

## Safety Confirmation

Dashboard v2 does not add payment, checkout, subscription, invoice, billing
portal, auth, API routes, route handlers, middleware, database/provider SDKs,
environment variables, production data writes, Webflow, Cloudflare, Vercel, DNS,
or deployment changes.

It does not fake due counts, weak counts, mastered counts, paid access, or
streaks.

## Follow-up

Recommended next PR: **#75 Review Session v2**.
