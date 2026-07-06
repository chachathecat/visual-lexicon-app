# Dashboard V3 Today Memory Mission

## Mental Model

Dashboard v3 makes `/dashboard` prioritize the next honest learning action:

```txt
Due review -> Weak practice -> New saved review -> Save/start learning
```

The dashboard supports the North Star metric, Weekly Reviewed Words, by moving
review action above saved-library browsing.

## Primary CTA Decision Tree

1. If due words exist, show `Start due review` and link to `/review/due`.
2. Else if weak words exist, show `Practice weak words` and link to
   `/review/weak`.
3. Else if new saved words exist, show `Review new saved words` and link to
   `/review`.
4. Else show `Save a word to start` and link to `/saved`.

## Read-Only Local State

Dashboard v3 reads these browser-local keys only:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
vlx_pack_progress_v1
```

Dashboard load must not write review state, review events, daily stats, saved
words, or pack progress. Review answers remain the source of review events and
SRS state changes.

## Evidence Rules

- Due Today comes from `getDueToday`.
- Weak Words comes from `getWeakWords`.
- New Saved comes from `getNewSaved`.
- Mastered comes from box 5 plus `Mastered` state via `getMastered`.
- Weekly Reviewed Words comes from review events in the last seven days.
- Continue Pack appears only when `vlx_pack_progress_v1` has visible progress.
- Recent Saved appears only when real saved words exist.

Fake due, weak, mastered, weekly reviewed, or pack-progress counts remain P0
blockers because they would break the SRS trust loop.

## Safety

Dashboard v3 does not add payment, checkout, subscription, invoice, billing
portal, auth, API routes, route handlers, middleware, production data writes,
Webflow, Cloudflare Workers, R2, DNS, secrets, or deployment changes. It does
not unblock public paid beta or mark private/manual beta launched.
