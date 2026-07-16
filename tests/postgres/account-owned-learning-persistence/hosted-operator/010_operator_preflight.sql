\set ON_ERROR_STOP on

select
  current_user = 'postgres' and
  session_user = 'postgres' and
  current_setting('server_version_num')::integer between 170000 and 179999 and
  not operator_role.rolsuper and
  operator_role.rolcreaterole and
  operator_role.rolbypassrls and
  database_owner.rolname = 'postgres' and
  auth_namespace.nspowner = 'supabase_admin'::regrole and
  has_schema_privilege(
    'supabase_auth_admin',
    'auth',
    'USAGE'
  ) and
  has_schema_privilege(
    'supabase_auth_admin',
    'auth',
    'CREATE'
  ) and
  not has_schema_privilege('postgres', 'auth', 'CREATE') and
  not has_schema_privilege('authenticated', 'auth', 'CREATE') and
  users_table.relowner = 'supabase_auth_admin'::regrole and
  sessions_table.relowner = 'supabase_auth_admin'::regrole and
  jwt_function.proowner = 'supabase_auth_admin'::regrole and
  uid_function.proowner = 'supabase_auth_admin'::regrole
    as hosted_operator_and_auth_owners_are_split
from pg_roles as operator_role
join pg_database as database_record
  on database_record.datname = current_database()
join pg_roles as database_owner
  on database_owner.oid = database_record.datdba
join pg_namespace as auth_namespace
  on auth_namespace.nspname = 'auth'
join pg_class as users_table
  on users_table.oid = 'auth.users'::regclass
join pg_class as sessions_table
  on sessions_table.oid = 'auth.sessions'::regclass
join pg_proc as jwt_function
  on jwt_function.oid = 'auth.jwt()'::regprocedure
join pg_proc as uid_function
  on uid_function.oid = 'auth.uid()'::regprocedure
where operator_role.rolname = 'postgres'
\gset

\if :hosted_operator_and_auth_owners_are_split
\else
  \echo 'Hosted fixture did not split bootstrap, operator, and auth ownership'
  \quit 1
\endif

select
  has_schema_privilege('postgres', 'auth', 'USAGE') and
  has_function_privilege('postgres', 'auth.jwt()', 'EXECUTE') and
  has_function_privilege('postgres', 'auth.uid()', 'EXECUTE') and
  has_table_privilege('postgres', 'auth.users', 'SELECT') and
  has_table_privilege('postgres', 'auth.sessions', 'SELECT') and
  not exists (
    select 1
    from pg_namespace as namespace
    cross join lateral aclexplode(
      coalesce(
        namespace.nspacl,
        acldefault('n', namespace.nspowner)
      )
    ) as acl_entry
    where namespace.oid = 'auth'::regnamespace
      and acl_entry.grantee = 'postgres'::regrole
      and acl_entry.privilege_type = 'USAGE'
      and acl_entry.is_grantable
  ) and
  (
    select count(*) = 2
    from pg_proc as auth_function
    cross join lateral aclexplode(
      coalesce(
        auth_function.proacl,
        acldefault('f', auth_function.proowner)
      )
    ) as acl_entry
    where auth_function.oid in (
      'auth.jwt()'::regprocedure,
      'auth.uid()'::regprocedure
    )
      and acl_entry.grantee = 0
      and acl_entry.privilege_type = 'EXECUTE'
      and not acl_entry.is_grantable
  ) and
  not exists (
    select 1
    from pg_proc as auth_function
    cross join lateral aclexplode(
      coalesce(
        auth_function.proacl,
        acldefault('f', auth_function.proowner)
      )
    ) as acl_entry
    where auth_function.oid in (
      'auth.jwt()'::regprocedure,
      'auth.uid()'::regprocedure
    )
      and acl_entry.grantee = 'postgres'::regrole
      and acl_entry.privilege_type = 'EXECUTE'
  ) as hosted_operator_auth_privileges_are_not_delegable
\gset

\if :hosted_operator_auth_privileges_are_not_delegable
\else
  \echo 'Hosted fixture accidentally gave postgres a delegable auth privilege'
  \quit 1
\endif

set request.jwt.claim =
  '{"sub":"74d2da4e-5947-49ef-a24d-659c5e95f08d"}';
set request.jwt.claim.sub =
  '74d2da4e-5947-49ef-a24d-659c5e95f08d';
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b"}';

select
  auth.jwt() ->> 'sub' =
    '74d2da4e-5947-49ef-a24d-659c5e95f08d' and
  auth.uid() =
    '74d2da4e-5947-49ef-a24d-659c5e95f08d'::uuid
    as hosted_auth_legacy_claims_take_precedence
\gset

\if :hosted_auth_legacy_claims_take_precedence
\else
  \echo 'Hosted auth fixture did not preserve singular/legacy claim precedence'
  \quit 1
\endif

reset request.jwt.claim;
reset request.jwt.claim.sub;

select
  auth.jwt() ->> 'sub' =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b' and
  auth.uid() =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
    as hosted_auth_plural_claims_fallback
\gset

\if :hosted_auth_plural_claims_fallback
\else
  \echo 'Hosted auth fixture did not preserve plural claims fallback'
  \quit 1
\endif

reset request.jwt.claims;

create role vlx_hosted_operator_grant_probe
  nologin
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

-- PostgreSQL warns and grants nothing when a non-owner has the privilege but
-- lacks GRANT OPTION. This reproduces the hosted activation failure that a
-- superuser-only CI service cannot expose.
grant usage on schema auth to vlx_hosted_operator_grant_probe;
grant execute on function auth.jwt(), auth.uid()
  to vlx_hosted_operator_grant_probe;

select
  not has_schema_privilege(
    'vlx_hosted_operator_grant_probe',
    'auth',
    'USAGE'
  ) and
  has_function_privilege(
    'vlx_hosted_operator_grant_probe',
    'auth.jwt()',
    'EXECUTE'
  ) and
  has_function_privilege(
    'vlx_hosted_operator_grant_probe',
    'auth.uid()',
    'EXECUTE'
  ) and
  not exists (
    select 1
    from pg_proc as auth_function
    cross join lateral aclexplode(
      coalesce(
        auth_function.proacl,
        acldefault('f', auth_function.proowner)
      )
    ) as acl_entry
    where auth_function.oid in (
      'auth.jwt()'::regprocedure,
      'auth.uid()'::regprocedure
    )
      and acl_entry.grantee =
        'vlx_hosted_operator_grant_probe'::regrole
      and acl_entry.privilege_type = 'EXECUTE'
  ) as hosted_operator_cannot_redelegate_auth
\gset

\if :hosted_operator_cannot_redelegate_auth
\else
  \echo 'Hosted fixture failed to reproduce non-delegable auth privileges'
  \quit 1
\endif

drop role vlx_hosted_operator_grant_probe;
