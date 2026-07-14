# Supabase Staging Learning Evidence Adapter

This directory is the first owner-approved provider edge for account-owned
learning evidence. It is deliberately narrower than the existing account-sync
planning contracts.

Included:

- two isolated-staging table definitions: `account_saved_words` and
  append-only `account_review_events`;
- owner-inclusive primary keys and owner-first read indexes;
- forced RLS with owner-only `select` policies that require both a matching
  `auth.uid()` and the exact JSON boolean `is_anonymous: false`; missing or
  non-boolean false-like claims are denied without text-to-boolean casts;
- explicit revocation of unauthenticated `anon`-role access and all
  authenticated writes;
- a read-only, bounded Supabase adapter that derives the owner from
  `client.auth.getUser()` on the same server Supabase client used for the read
  and fails closed on malformed provider rows;
- exact migration-owner comments on both tables and the trigger function;
- a guarded rollback script that removes only those objects after verifying
  every exact migration-owner comment.

Not included:

- no route files, browser hydration, `apply`, insert/upsert/update/delete/RPC
  adapter methods, runtime wiring, production configuration, or production
  data access;
- no review-state, daily-stat, pack-progress, idempotency, audit, payment, or
  entitlement tables;
- PR B adds Zod 4.4.3 at the separate `read-only-preview-digest` adapter edge;
  account-sync core remains validator-neutral. The actual preview/digest route
  exports remain hard default-disabled.

## Staging guard

Both SQL scripts abort unless the database session has explicitly set:

```sql
set vlx.account_persistence_target = 'staging';
```

The marker records operator intent; the operator must still verify the target
is the dedicated isolated staging project. All migration objects use plain
`CREATE`, so an existing object collision aborts the transaction instead of
being adopted or replaced. Do not place credentials or project secrets in this
repository. These scripts were not applied to a live database by this PR.

## PostgreSQL 16 integration gate

Disposable-database fixtures live under
`tests/postgres/account-owned-learning-persistence`. They prove two-account RLS,
exact JSON-boolean permanent-user access, denial of true, missing, string-false,
and numeric-zero anonymous claims, authenticated delete denial, review-event
update immutability, owner deletion cascades, an owned rollback, and collision
failure. They emulate only the Supabase database roles and auth functions
required for the migration and must never point at a live database.

## Rollback

The rollback removes only the two staging evidence tables and the append-only
trigger function. It aborts if any object is missing or its exact ownership
marker differs. It is intentionally not a production data rollback and must
not be run against a production project.
