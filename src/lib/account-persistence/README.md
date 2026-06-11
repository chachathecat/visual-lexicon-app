# Account Persistence Contracts

This directory is pure TypeScript planning and contract code for future Visual
Lexicon Track B account persistence.

It does not implement real auth. It imports no provider SDK and makes no network
calls. It has no runtime route or component integration, does not read
`localStorage`, does not write browser storage, and does not provide production
persistence.

Existing local/private beta storage remains the source of truth until real
account persistence is implemented:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- `vlx_pack_progress_v1`
- `vlx_upgrade_interest_v1`

Files:

- `types.ts` defines account, guest snapshot, merge batch, export/delete, and
  result contracts.
- `local-snapshot.ts` creates and summarizes snapshots from caller-provided
  in-memory stores only.
- `merge-contracts.ts` creates preview-only merge plans and conflict categories.
- `mock-adapter.ts` is a clearly labeled non-production in-memory adapter for
  contract tests. It is not production auth or persistence.
