# PostgreSQL 16 integration gate

These fixtures exercise the migration in a disposable PostgreSQL 16 database.
They emulate only the Supabase roles, `auth.users`, RLS-enabled
`auth.sessions`, `auth.uid()`, and `auth.jwt()` boundary needed by this
migration. They do not connect to Supabase or any live project.

The gate proves:

- two-account RLS isolation for both evidence tables;
- access only for an exact JSON boolean `is_anonymous: false` claim;
- denial for boolean true, a missing claim, string `"false"`, and numeric `0`;
- authenticated delete denial;
- update immutability for review events;
- `auth.users` owner deletion cascading to both evidence tables;
- successful rollback when all exact migration-owner comments match; and
- transaction rollback without replacing a pre-existing colliding object.

The additive PR C fixtures also prove:

- migration `002` starts disabled, with neither authenticated execution nor a
  plaintext write capability in PostgreSQL;
- migration `003` changes exactly seven owner/writer policy predicates from
  `(select auth.jwt() -> 'is_anonymous')` to
  `((select auth.jwt()) -> 'is_anonymous')`, while preserving every policy
  role, command, owner check, and exact JSON-boolean boundary;
- `003` is staging-guarded and idempotent, accepts only the exact legacy or
  already-hardened policy shape, and fails closed rather than adopting a
  missing, reassigned, or altered policy. It does not rewrite `001` or `002`;
- migration `004` requires the database to remain disabled, normalizes only
  request owner/session identity through a private stable `SECURITY INVOKER`
  helper, removes direct managed-`auth` resolution from all six writer
  policies and the internal apply function, and delegates only the exact
  public-wrapper grant option to hosted `postgres`;
- the private control/receipt tables are forced-RLS and have no app-role table
  grants;
- the writer is `NOLOGIN NOINHERIT NOBYPASSRLS`, receives zero direct
  `auth.sessions` or apply-control table access, and can only execute the three
  narrowly scoped `postgres`-owned request-identity, control-snapshot, and
  live-session helpers while activated;
- the writer-owned public definer wrapper is the sole authenticated grant;
  neither app role receives private-schema usage or private-function execution;
- missing, malformed, cross-account, and deleted JWT sessions fail closed;
- one canonical `dissonance` saved word and caller event/session/timestamp
  `saved_review` event commit atomically with DB-derived box/weak fields;
- finite current-window timestamps are required for a first commit, while later
  exact replay remains a no-op; stale, future, and infinite values write
  nothing;
- a changed same-key fingerprint, a different idempotency key, and a real
  pre-receipt fake-mastery event collision are rejected without partial writes;
- the approved owner cannot be rebound, and account B can neither read account
  A's PR C evidence nor invoke a mutation;
- operational rollback revokes writes but preserves evidence, control history,
  and receipts; and
- destructive object cleanup requires the extra
  `vlx.account_persistence_disposable_test=true` guard and leaves `001`
  evidence intact.

The collision command is expected to fail. A CI shell must treat a successful
collision migration as the test failure, then run `040_collision_assertions.sql`
to prove that the sentinel survived and no partial object escaped the failed
transaction.

Run the PR C sequence in its own freshly bootstrapped disposable database. This
avoids coupling it to `010_rls_and_integrity_assertions.sql`, whose owner-cascade
case intentionally deletes the second fixture user. The sequence is:

1. `000_bootstrap.sql`
2. `001_account_learning_evidence_up.sql`
3. `002_account_learning_apply_up.sql`
4. `003_account_learning_auth_rls_initplan_up.sql`
5. `004_account_learning_hosted_grantor_compat_up.sql`
6. `050_pr_c_default_disabled_assertions.sql`
7. `055_pr_c_auth_rls_initplan_assertions.sql`
8. `060_pr_c_apply_assertions.sql` (activates with fixture-only controls)
9. `070_pr_c_operational_rollback_assertions.sql`
10. `080_pr_c_disposable_teardown.sql` with both staging and disposable guards
11. `090_pr_c_disposable_teardown_assertions.sql`
12. `001_account_learning_evidence_down.sql`
13. `020_rollback_assertions.sql`

Never run `080_pr_c_disposable_teardown.sql` against a live project. The
operational rollback is the only PR C rollback intended for isolated staging.
