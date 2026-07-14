# PostgreSQL 16 integration gate

These fixtures exercise the migration in a disposable PostgreSQL 16 database.
They emulate only the Supabase roles, `auth.users`, and `auth.uid()` boundary
needed by this migration. They do not connect to Supabase or any live project.

The gate proves:

- two-account RLS isolation for both evidence tables;
- authenticated delete denial;
- update immutability for review events;
- `auth.users` owner deletion cascading to both evidence tables;
- successful rollback when all exact migration-owner comments match; and
- transaction rollback without replacing a pre-existing colliding object.

The collision command is expected to fail. A CI shell must treat a successful
collision migration as the test failure, then run `040_collision_assertions.sql`
to prove that the sentinel survived and no partial object escaped the failed
transaction.
