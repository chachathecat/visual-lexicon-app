\set ON_ERROR_STOP on

select
  count(*) = 1 and
  bool_and(
    not enabled and
    write_capability_digest is null and
    deployment_sha is null and
    approved_owner_account_id is null and
    activated_at is null
  ) as pr_c_default_disabled
from vlx_account_persistence_private.account_learning_apply_control
\gset

\if :pr_c_default_disabled
\else
  \echo 'PR C control was not default-disabled without capability material'
  \quit 1
\endif

select
  not rolcanlogin and
  not rolinherit and
  not rolbypassrls and
  not rolsuper and
  not rolcreatedb and
  not rolcreaterole and
  not rolreplication and
  not has_schema_privilege(
    'vlx_account_learning_writer',
    'public',
    'CREATE'
  ) and not exists (
    select 1
    from pg_auth_members as membership
    where membership.member = 'vlx_account_learning_writer'::regrole
       or (
         membership.roleid = 'vlx_account_learning_writer'::regrole and
         (
           membership.member <> 'postgres'::regrole or
           membership.inherit_option or
           membership.set_option or
           not membership.admin_option
         )
       )
  ) and (
    select count(*)
    from pg_auth_members as membership
    where membership.roleid = 'vlx_account_learning_writer'::regrole
  ) <= 1 as pr_c_writer_is_least_privilege
from pg_roles
where rolname = 'vlx_account_learning_writer'
\gset

\if :pr_c_writer_is_least_privilege
\else
  \echo 'PR C writer role is missing a least-privilege role attribute'
  \quit 1
\endif

select
  bool_and(relrowsecurity and relforcerowsecurity) as pr_c_private_rls_forced
from pg_class
where oid in (
  'vlx_account_persistence_private.account_learning_apply_control'::regclass,
  'vlx_account_persistence_private.account_learning_apply_receipts'::regclass
)
\gset

\if :pr_c_private_rls_forced
\else
  \echo 'PR C private control or receipt table is not forced-RLS'
  \quit 1
\endif

select
  not has_table_privilege(
    'anon',
    'vlx_account_persistence_private.account_learning_apply_control',
    'SELECT'
  ) and
  not has_table_privilege(
    'authenticated',
    'vlx_account_persistence_private.account_learning_apply_control',
    'SELECT'
  ) and
  not has_table_privilege(
    'anon',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'SELECT'
  ) and
  not has_table_privilege(
    'authenticated',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'SELECT'
  ) and
  not has_table_privilege(
    'anon',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'INSERT'
  ) and
  not has_table_privilege(
    'authenticated',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'INSERT'
  ) as pr_c_private_tables_have_no_app_grants
\gset

\if :pr_c_private_tables_have_no_app_grants
\else
  \echo 'PR C private table leaked a grant to an app role'
  \quit 1
\endif

select
  internal.prosecdef and
  internal.proowner = 'vlx_account_learning_writer'::regrole and
  control_snapshot.prosecdef and
  control_snapshot.proowner = 'postgres'::regrole and
  control_snapshot.provolatile = 'v' and
  control_snapshot.prolang = (
    select language.oid
    from pg_language as language
    where language.lanname = 'sql'
  ) and
  control_snapshot.prorettype =
    'vlx_account_persistence_private.account_learning_apply_control'::regtype and
  helper.prosecdef and
  helper.proowner = 'postgres'::regrole and
  helper.proisstrict and
  helper.provolatile = 's' and
  helper.prorettype = 'boolean'::regtype and
  helper.pronargs = 2 and
  helper.prolang = (
    select language.oid
    from pg_language as language
    where language.lanname = 'sql'
  ) and
  wrapper.prosecdef and
  wrapper.proowner = 'vlx_account_learning_writer'::regrole and
  wrapper.provolatile = 'v' and
  wrapper.prolang = (
    select language.oid
    from pg_language as language
    where language.lanname = 'sql'
  ) and
  obj_description(control_snapshot.oid, 'pg_proc') =
    'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_control_snapshot()' and
  obj_description(wrapper.oid, 'pg_proc') =
    'vlx:migration-owner=002_account_learning_apply;object=public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)' and
  internal.proconfig @> array['search_path=""', 'row_security=on']::text[] and
  control_snapshot.proconfig @>
    array['search_path=""', 'row_security=on']::text[] and
  helper.proconfig @> array['search_path=""', 'row_security=on']::text[] and
  wrapper.proconfig @>
    array['search_path=""', 'row_security=on']::text[] and
  position(
    'for share' in lower(pg_get_functiondef(control_snapshot.oid))
  ) > 0 and
  position(
    'vlx_account_persistence_private.account_learning_apply_control' in
    lower(pg_get_functiondef(control_snapshot.oid))
  ) > 0 and
  position(
    'pg_advisory_xact_lock' in lower(pg_get_functiondef(internal.oid))
  ) > 0 and
  position('from auth.sessions' in lower(pg_get_functiondef(helper.oid))) > 0 and
  position(
    'active_session.id = p_auth_session_id' in
    lower(pg_get_functiondef(helper.oid))
  ) > 0 and
  position(
    'active_session.user_id = p_owner_account_id' in
    lower(pg_get_functiondef(helper.oid))
  ) > 0 and
  position('execute ' in lower(pg_get_functiondef(helper.oid))) = 0
  as pr_c_function_security_shape
from pg_proc as internal
cross join pg_proc as wrapper
cross join pg_proc as control_snapshot
cross join pg_proc as helper
where internal.oid =
  'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
  and wrapper.oid =
  'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
  and control_snapshot.oid =
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'::regprocedure
  and helper.oid =
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'::regprocedure
\gset

\if :pr_c_function_security_shape
\else
  \echo 'PR C wrapper/private function security shape is invalid'
  \quit 1
\endif

select
  (
    select count(*) = 1
    from pg_constraint
    where conrelid =
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass
      and conname = 'account_learning_apply_receipts_one_per_owner'
      and contype = 'u'
  ) and
  (
    select count(*) = 1
    from pg_constraint
    where conrelid =
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass
      and conname = 'account_learning_apply_receipts_one_total'
      and contype = 'u'
  ) and
  (
    select count(*) = 1
    from pg_constraint
    where conrelid =
      'vlx_account_persistence_private.account_learning_apply_control'::regclass
      and conname = 'account_learning_apply_control_approved_owner'
      and contype = 'c'
  ) and
  (
    select count(*) = 1
    from pg_policy
    where polrelid =
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass
      and polname = 'account_learning_apply_receipts_operator_select'
      and polroles = array['postgres'::regrole]::oid[]
  ) and
  (
    select count(*) = 1
    from pg_trigger
    where tgrelid =
      'vlx_account_persistence_private.account_learning_apply_control'::regclass
      and tgname = 'account_learning_apply_control_owner_immutable'
      and not tgisinternal
  ) as pr_c_single_owner_and_rollback_serialization_backstops
\gset

\if :pr_c_single_owner_and_rollback_serialization_backstops
\else
  \echo 'PR C one-owner constraints or rollback-serialization evidence is missing'
  \quit 1
\endif

select
  not has_schema_privilege(
    'anon',
    'vlx_account_persistence_private',
    'USAGE'
  ) and
  not has_schema_privilege(
    'authenticated',
    'vlx_account_persistence_private',
    'USAGE'
  ) and
  not has_function_privilege(
    'anon',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'authenticated',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'anon',
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'authenticated',
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) as pr_c_default_execute_revoked
\gset

\if :pr_c_default_execute_revoked
\else
  \echo 'PR C public RPC was executable before operational activation'
  \quit 1
\endif

select
  (
    select relrowsecurity and not relforcerowsecurity
    from pg_class
    where oid = 'auth.sessions'::regclass
  ) and
  not exists (
    select 1
    from pg_policy
    where polrelid = 'auth.sessions'::regclass
      and (
        0::oid = any (polroles) or
        polroles && array['anon'::regrole, 'authenticated'::regrole]::oid[]
      )
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
  not has_column_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_control',
    'singleton',
    'UPDATE'
  ) and
  not has_function_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'anon',
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'authenticated',
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'anon',
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'authenticated',
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
    'EXECUTE'
  ) as pr_c_default_session_grants_absent
\gset

\if :pr_c_default_session_grants_absent
\else
  \echo 'PR C writer/app role received session or control-helper access before activation'
  \quit 1
\endif
