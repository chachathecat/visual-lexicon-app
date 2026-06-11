# Server SRS Sync Contracts

This directory contains production v1 planning contracts for server-side saved
words, review events, materialized review state, daily stats, pack progress,
hydration, local queue sync, and selector behavior.

These files are pure TypeScript contracts and helpers only:

- No network calls.
- No live API routes.
- No auth, database, payment, billing, or deployment SDK imports.
- No current app runtime behavior changes.
- No production persistence.

The current local MVP keys remain the migration/cache contract:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- `vlx_pack_progress_v1`

Due, Weak, and Mastered helpers in `selectors.ts` operate only on provided
in-memory review state. They do not read localStorage, static pack metadata,
pricing state, or frontend summary counts.
