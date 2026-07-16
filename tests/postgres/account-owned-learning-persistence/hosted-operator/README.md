# Hosted-operator PostgreSQL fixture

This fixture closes the gap between the ordinary PR C PostgreSQL job and a
hosted Supabase project:

- `vlx_bootstrap` is the real PostgreSQL superuser used only for bootstrap.
- `postgres` is a separate non-superuser operator with `CREATEROLE` and
  `BYPASSRLS`, matching the capabilities the migrations require.
- `supabase_admin` owns the `auth` schema, while `supabase_auth_admin` owns its
  tables and identity functions.
- Auth functions retain their hosted PUBLIC execute ACL, but `postgres` has
  non-delegable schema usage. The writer therefore cannot resolve any auth
  object, even though catalog-only function privilege checks include PUBLIC.
- A `postgres` default privilege gives `service_role` the same direct execute
  prestate seen on newly-created hosted public functions; migration 004 must
  remove it before the wrapper is considered safely disabled.
- A separate unprivileged login proves activation and rollback both reject the
  wrong database operator before changing control state or ACLs.

The CI job runs all PR C migrations and activation/rollback checks as the
non-superuser `postgres` role. The bootstrap connection is not reused for any
migration or activation step.
