# Account-owned Learning Persistence PR A

## Decision

GitHub issue #187 authorizes the first isolated-staging persistence slice. This
PR implements only the schema/RLS and provider-adapter portion of that approval.

## Implemented scope

- `account_saved_words` with primary key `(owner_account_id, slug)`.
- `account_review_events` with primary key `(owner_account_id, event_id)`.
- Review events are append-only through a database trigger.
- Both tables use forced RLS and owner-only `select` policies based on
  `auth.uid()`.
- Anonymous access and authenticated writes are explicitly revoked.
- The Supabase adapter accepts the existing server-principal contract, adds the
  owner filter itself, uses fixed columns and bounded limits, and validates
  database rows before returning domain evidence.
- Up and down SQL scripts fail closed without an explicit staging session
  marker.

## Deliberately blocked

- No `apply` route or any route file.
- No insert, upsert, update, delete, or RPC method in the adapter.
- No runtime connection to the app, browser state, or login flow.
- No production configuration, migration application, data access, or rollout.
- No review-state/mastery import; review events remain the future source of
  truth.
- No billing, payment, subscription, checkout, or paid-access behavior.

`VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED` and
`VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED` both remain compile-time
`false`.

## Verification posture

Automated tests validate SQL invariants, bounded owner filtering, safe mapping,
provider-error redaction, and malformed-row rejection. Live RLS proof still
requires the dedicated staging project and two synthetic test accounts; this PR
does not claim that evidence and does not touch a live database.

## Rollback

The guarded down script removes only the two staging evidence tables and the
append-only trigger function. Because no live migration is applied here, source
rollback is also possible by reverting this PR.
