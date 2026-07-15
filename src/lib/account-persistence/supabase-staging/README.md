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

PR C adds a separate, additive `002` layer. It does not edit or replace `001`:

- a default-disabled database control bound to one SHA-256 write-capability
  digest, one exact deployment SHA, and one immutable approved synthetic-owner
  UUID;
- a `NOLOGIN NOINHERIT NOBYPASSRLS` writer role;
- forced-RLS private control and idempotency-receipt tables with no app-role
  table grants;
- a public writer-owned, empty-search-path, row-security-on `SECURITY DEFINER`
  RPC wrapper. It is the only app-callable surface; app roles never receive
  private-schema usage or private-function execution;
- live-session binding from the exact UUID JWT `session_id` to
  `auth.sessions(id, user_id)` through a `postgres`-owned, strict,
  fixed-search-path boolean helper. The writer and both app roles receive zero
  direct `auth.sessions` table privileges;
- a separate `postgres`-owned control-snapshot helper whose single qualified
  `SELECT ... FOR SHARE` makes kill-switch rollback serialize after any
  in-flight apply without granting the writer control-table access;
- one atomic canonical `dissonance` save plus one caller-ID-preserving
  `saved_review` event. Box `0 -> 1` and weak score `0 -> 0` are DB constants,
  never caller parameters;
- a DB-derived SHA-256 request fingerprint, owner-level advisory lock, one
  global receipt backstop, same-key replay no-op, same-key/different-fingerprint
  conflict, different-key rejection, and full pre-receipt event-collision
  comparison;
- finite first-commit timestamps bounded to the activation and server-now
  windows, with a maximum five-minute save-to-review interval. Receipt replay
  is evaluated before that freshness window so it remains idempotent later;
- a separate activation script and a data-preserving operational rollback.

The additive `003_account_learning_auth_rls_initplan_up.sql` migration hardens
exactly seven `auth.jwt()` predicates for the Supabase performance advisor: the
two `001` authenticated owner-select policies, the `002` receipt writer-insert
policy, and the four PR C saved-word/review-event writer select/insert policies.
It changes `(select auth.jwt() -> 'is_anonymous')` to
`((select auth.jwt()) -> 'is_anonymous')` without changing policy roles,
commands, owner checks, or exact JSON-boolean semantics. The migration accepts
only the exact legacy or already-hardened policy shape, so it is idempotent and
fails closed on a missing, reassigned, or altered target. It uses only
`ALTER POLICY`; `001` and `002` remain immutable historical migrations.

Still not included:

- no production configuration or production data access;
- no review-state, daily-stat, pack-progress, general audit, payment, or
  entitlement tables; the only new durable metadata is the narrow PR C
  idempotency receipt;
- PR B adds Zod 4.4.3 at the separate `read-only-preview-digest` adapter edge;
  account-sync core remains validator-neutral. The actual preview/digest route
  exports remain hard default-disabled.

## Staging guard

Every migration, activation, and operational-rollback SQL script aborts unless
the database session has explicitly set:

```sql
set vlx.account_persistence_target = 'staging';
```

The marker records operator intent; the operator must still verify the target
is the dedicated isolated staging project. PR C objects use plain `CREATE`, so
an existing role, schema, table, policy, or function collision aborts the
transaction instead of being adopted or replaced. The shared `extensions`
schema and `pgcrypto` dependency alone use `IF NOT EXISTS`, followed by an
exact `extensions.digest(text,text)` preflight. Do not place credentials or
project secrets in this repository.

`002_account_learning_apply_up.sql` creates the write layer disabled and with
no callable app-role RPC. For a fresh live Track B staging run, apply `002`,
then `003_account_learning_auth_rls_initplan_up.sql`, then run
`050_pr_c_default_disabled_assertions.sql` and
`055_pr_c_auth_rls_initplan_assertions.sql`. Activation is a separate
transaction:

```sql
set vlx.account_persistence_target = 'staging';
set vlx.account_persistence_pr_c_write_capability_digest =
  'sha256:<64 lowercase hex characters>';
set vlx.account_persistence_pr_c_deployment_sha =
  '<40 lowercase hex characters>';
set vlx.account_persistence_pr_c_approved_owner_account_id =
  '<one lowercase permanent-user UUID>';
\i 002_account_learning_apply_enable.sql
```

Only the digest is supplied to or stored by PostgreSQL; the plaintext
capability remains server-only. The first activation binds the exact approved
owner permanently; later activation with another UUID aborts. Supabase
documents `session_id` as the JWT UUID correlated to `auth.sessions`. Because
the managed table has RLS and is owned by the Auth service, the narrow
`postgres`-owned helper performs only the qualified `(id, user_id)` existence
check. The writer receives `EXECUTE` on that helper while active, never table
`SELECT`; `anon` and `authenticated` receive neither.

The writer-owned public wrapper switches to the same least-privilege identity
as the private apply function. While active, `authenticated` receives only
wrapper `EXECUTE`. Capability, deployment, immutable owner, live session,
timestamp, input-scope, idempotency, RLS, and collision checks remain inside
the private implementation, but app roles cannot call or even resolve that
private path. Operational rollback first waits on the control row lock, flips
the kill switch off, then revokes wrapper and writer-helper execution in the
same transaction.

## PostgreSQL 16 integration gate

Disposable-database fixtures live under
`tests/postgres/account-owned-learning-persistence`. In addition to the `001`
gate, the fresh CI sequence applies `002`, applies `003`, runs `050` and `055`,
then proceeds through `060`, `070`, `080`, and `090`. It proves `002`
default-disable, the exact seven-policy initplan hardening, role/ACL shape,
exact session binding, canonical round-trip, atomic replay/conflict/collision
behavior, timestamp rejection, immutable-owner and cross-account denial,
helper-only ACLs, rollback preservation, and a separately guarded
disposable-only teardown. The fixtures emulate the relevant `auth.sessions`
RLS boundary and must never point at a live database.

## Rollback

The rollback removes only the two staging evidence tables and the append-only
trigger function. It aborts if any object is missing or its exact ownership
marker differs. It is intentionally not a production data rollback and must
not be run against a production project.

PR C uses
`002_account_learning_apply_operational_rollback.sql`, not the `001` destructive
rollback. It atomically flips the DB kill switch off and revokes app execution,
writer insert privileges, and the writer's two helper-execution capabilities.
It preserves both learning-evidence tables, all rows, every idempotency
receipt, and the last capability digest/deployment binding for incident
evidence. Only the explicitly guarded disposable PostgreSQL fixture removes
`002` objects, and that fixture still leaves `001` evidence rows intact for its
scope assertion.
