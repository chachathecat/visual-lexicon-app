\set ON_ERROR_STOP on

select
  current_user = 'postgres' and
  not operator_role.rolsuper and
  operator_role.rolcreaterole and
  operator_role.rolbypassrls and
  writer_role.rolname = 'vlx_account_learning_writer' and
  not writer_role.rolcanlogin and
  not writer_role.rolinherit and
  not writer_role.rolsuper and
  not writer_role.rolbypassrls and
  not writer_role.rolcreaterole
    as hosted_migrations_ran_with_expected_roles
from pg_roles as operator_role
cross join pg_roles as writer_role
where operator_role.rolname = 'postgres'
  and writer_role.rolname = 'vlx_account_learning_writer'
\gset

\if :hosted_migrations_ran_with_expected_roles
\else
  \echo 'Hosted migrations did not retain the operator/writer role boundary'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    membership.admin_option and
    not membership.inherit_option and
    not membership.set_option and
    membership.grantor <> 'postgres'::regrole
  ) as hosted_writer_has_only_external_admin_edge
from pg_auth_members as membership
where membership.roleid = 'vlx_account_learning_writer'::regrole
  and membership.member = 'postgres'::regrole
\gset

\if :hosted_writer_has_only_external_admin_edge
\else
  \echo 'Hosted migration leaked an executable postgres-to-writer membership'
  \quit 1
\endif

select
  helper.proowner = 'postgres'::regrole and
  not helper.prosecdef and
  helper.proretset and
  helper.provolatile = 's' and
  helper.pronargs = 0 and
  helper.proconfig @> array['search_path=""']::text[] and
  pg_get_function_result(helper.oid) =
    'TABLE(owner_account_id uuid, auth_session_id uuid)' and
  obj_description(helper.oid, 'pg_proc') =
    'vlx:migration-owner=004_account_learning_hosted_grantor_compat;object=vlx_account_persistence_private.vlx_account_learning_request_identity()' and
  not has_function_privilege(
    'vlx_account_learning_writer',
    helper.oid,
    'EXECUTE'
  ) and
  not has_function_privilege('authenticated', helper.oid, 'EXECUTE') and
  not has_function_privilege('anon', helper.oid, 'EXECUTE') and
  not has_function_privilege('service_role', helper.oid, 'EXECUTE')
    as hosted_identity_helper_is_disabled_and_invoker_only
from pg_proc as helper
where helper.oid =
  'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure
\gset

\if :hosted_identity_helper_is_disabled_and_invoker_only
\else
  \echo 'Hosted request-identity helper shape or default-disabled ACL drifted'
  \quit 1
\endif

select
  not has_schema_privilege(
    'vlx_account_learning_writer',
    'auth',
    'USAGE'
  ) and
  not has_table_privilege(
    'vlx_account_learning_writer',
    'auth.sessions',
    'SELECT'
  ) and
  not has_column_privilege(
    'vlx_account_learning_writer',
    'auth.sessions',
    'id',
    'SELECT'
  ) and
  not has_column_privilege(
    'vlx_account_learning_writer',
    'auth.sessions',
    'user_id',
    'SELECT'
  ) and
  not has_function_privilege(
    'authenticated',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'anon',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'service_role',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not exists (
    select 1
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as privilege
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) as hosted_default_disabled_surface_is_exact
\gset

\if :hosted_default_disabled_surface_is_exact
\else
  \echo 'Hosted migration leaked auth dependency or executable app RPC'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    privilege.grantor = 'vlx_account_learning_writer'::regrole and
    privilege.is_grantable
  ) as hosted_operator_has_exact_rpc_grant_option
from pg_proc as wrapper
cross join lateral aclexplode(
  coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
) as privilege
where wrapper.oid =
  'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
  and privilege.grantee = 'postgres'::regrole
  and privilege.privilege_type = 'EXECUTE'
\gset

\if :hosted_operator_has_exact_rpc_grant_option
\else
  \echo 'Hosted migration did not predelegate the exact operator RPC grant option'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    not enabled and
    write_capability_digest is null and
    deployment_sha is null and
    approved_owner_account_id is null and
    activated_at is null and
    disabled_at is null
  ) and
  (select count(*) from public.account_saved_words) = 0 and
  (select count(*) from public.account_review_events) = 0 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 0 as hosted_migration_remains_empty_and_disabled
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :hosted_migration_remains_empty_and_disabled
\else
  \echo 'Hosted migration enabled writes or created learning evidence'
  \quit 1
\endif
