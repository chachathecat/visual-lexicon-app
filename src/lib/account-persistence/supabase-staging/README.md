# Supabase Staging Learning Evidence Adapter

This directory is the first owner-approved provider edge for account-owned
learning evidence. It is deliberately narrower than the existing account-sync
planning contracts.

Included:

- two isolated-staging table definitions: `account_saved_words` and
  append-only `account_review_events`;
- owner-inclusive primary keys and owner-first read indexes;
- forced RLS with `auth.uid()` owner-only `select` policies;
- explicit revocation of anonymous access and all authenticated writes;
- a read-only, bounded Supabase adapter that accepts only the existing
  server-principal type and fails closed on malformed provider rows;
- a guarded rollback script for only these two tables and their trigger
  function.

Not included:

- no route files, browser hydration, `apply`, insert/upsert/update/delete/RPC
  adapter methods, runtime wiring, production configuration, or production
  data access;
- no review-state, daily-stat, pack-progress, idempotency, audit, payment, or
  entitlement tables;
- no Zod dependency yet. Request/query validation remains PR B scope at the
  adapter edge; account-sync core remains validator-neutral.

## Staging guard

Both SQL scripts abort unless the database session has explicitly set:

```sql
set vlx.account_persistence_target = 'staging';
```

The marker records operator intent; the operator must still verify the target
is the dedicated isolated staging project. Do not place credentials or project
secrets in this repository. These scripts were not applied to a live database
by this PR.

## Rollback

The rollback removes only the two staging evidence tables and the append-only
trigger function. It is intentionally not a production data rollback and must
not be run against a production project.
