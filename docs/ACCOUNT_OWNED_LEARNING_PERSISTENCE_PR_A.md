# Account-owned Learning Persistence PR A

## Decision

GitHub issue #187 authorizes the first isolated-staging persistence slice. This
PR implements only the schema/RLS and provider-adapter portion of that approval.

## Implemented scope

- `account_saved_words` with primary key `(owner_account_id, slug)`.
- `account_review_events` with primary key `(owner_account_id, event_id)`.
- Review-event updates are blocked by a database trigger. Deletes remain
  unavailable to authenticated users through grants/RLS, while the foreign-key
  owner cascade can still remove evidence when `auth.users` deletes an owner.
- Both tables use forced RLS and owner-only `select` policies based on
  `auth.uid()`. Each policy additionally requires the Supabase JWT
  `is_anonymous` claim to be the exact JSON boolean `false`, so anonymous
  sign-ins cannot read account-owned learning evidence even though Supabase
  assigns them the `authenticated` database role. Missing claims and false-like
  strings or numbers are denied without a text-to-boolean cast.
- Unauthenticated (`anon` role) access and authenticated writes are explicitly
  revoked.
- The Supabase adapter derives the owner with `auth.getUser()` from the same
  server Supabase client used for the query, adds the owner filter itself, uses
  fixed columns and bounded limits, and validates database rows before
  returning domain evidence.
- The up script uses plain `CREATE` so object collisions abort the transaction.
- The down script verifies exact migration-owner comments on both tables and
  the trigger function before dropping anything.
- Up and down SQL scripts fail closed without an explicit staging marker.

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

Automated tests validate SQL invariants, authenticated-session owner derivation,
bounded owner filtering, safe mapping, provider-error redaction, and
malformed-row rejection. PostgreSQL 16 fixtures provide a disposable local/CI
proof for RLS, exact JSON boolean handling across false, true, missing,
string-false, and numeric-zero JWT claims, delete denial, update immutability,
owner cascades, owned rollback, and collision failure. Dedicated Supabase
staging evidence still requires two synthetic accounts; this PR does not claim
it or touch a live database.

## Rollback

The guarded down script removes only the two staging evidence tables and the
append-only trigger function after exact ownership-marker verification. Because
no live migration is applied here, source rollback is also possible by
reverting this PR.
