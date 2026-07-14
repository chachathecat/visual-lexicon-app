# Account Persistence Contracts

Most of this directory is pure TypeScript planning and contract code for future
Visual Lexicon Track B account persistence. The owner-approved
`supabase-staging` directory is the first isolated-staging, read-only provider
edge. The owner-approved `read-only-preview-digest` boundary adds default-off
route files and an authenticated read path. Actual route exports can connect
only through the exact preview/project/branch/HMAC gate and distributed IP and
owner rate limits; mutations remain absent.

The planning core does not implement real auth or import provider SDKs. The
staging adapter reuses the existing Supabase client type only at the provider
edge and can make bounded reads when explicitly called by a future server
boundary. There is still no browser storage write, mutating account sync, or
production persistence. Without every isolated-staging control, both routes
return a generic disabled or unavailable response before evidence reads.

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
- `supabase-staging/` contains guarded staging-only schema/RLS/rollback assets
  and a bounded read-only provider adapter. Mutations and runtime wiring are
  hard-disabled.
- `read-only-preview-digest/` contains the Zod edge, permanent-session check,
  bounded marker adapter, redacted response builder, fail-closed staging
  activation gate, and distributed read throttling approved by issue #187.
  `apply` and `audit` remain absent.
