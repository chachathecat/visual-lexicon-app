\set ON_ERROR_STOP on

select count(*) as saved_words_before_rollback
from public.account_saved_words
\gset

select count(*) as review_events_before_rollback
from public.account_review_events
\gset

select count(*) as receipts_before_rollback
from vlx_account_persistence_private.account_learning_apply_receipts
\gset

select
  :saved_words_before_rollback = 1 and
  :review_events_before_rollback = 1 and
  :receipts_before_rollback = 1 as pr_c_golden_rows_exist_before_rollback
\gset

\if :pr_c_golden_rows_exist_before_rollback
\else
  \echo 'PR C rollback fixture did not begin with exact 1/1/1 golden evidence'
  \quit 1
\endif

set vlx.account_persistence_target = 'staging';
\ir ../../../src/lib/account-persistence/supabase-staging/sql/002_account_learning_apply_operational_rollback.sql

select
  not enabled and
  write_capability_digest =
    'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518' and
  deployment_sha = '1111111111111111111111111111111111111111' and
  approved_owner_account_id =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
  activated_at is not null and
  disabled_at is not null as pr_c_rollback_disabled_without_erasing_control
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :pr_c_rollback_disabled_without_erasing_control
\else
  \echo 'PR C operational rollback erased controls or failed to disable writes'
  \quit 1
\endif

select
  (select count(*) from public.account_saved_words) =
    :saved_words_before_rollback and
  (
    select count(*)
    from public.account_review_events
  ) = :review_events_before_rollback and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = :receipts_before_rollback as pr_c_rollback_preserved_all_evidence
\gset

\if :pr_c_rollback_preserved_all_evidence
\else
  \echo 'PR C operational rollback deleted learning evidence or receipts'
  \quit 1
\endif

select
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
  not exists (
    select 1
    from pg_roles as app_role
    where app_role.rolname = 'service_role'
      and has_function_privilege(
        app_role.oid,
        'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure,
        'EXECUTE'
      )
  ) and
  not exists (
    select 1
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as acl
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) and
  not has_function_privilege(
    'authenticated',
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'anon',
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_schema_privilege(
    'authenticated',
    'vlx_account_persistence_private',
    'USAGE'
  ) and
  not has_schema_privilege(
    'anon',
    'vlx_account_persistence_private',
    'USAGE'
  ) as pr_c_rollback_revoked_rpc_execution
\gset

\if :pr_c_rollback_revoked_rpc_execution
\else
  \echo 'PR C operational rollback left a write RPC executable'
  \quit 1
\endif

select
  not exists (
    select 1
    from information_schema.column_privileges
    where grantee = 'vlx_account_learning_writer'
      and table_schema = 'public'
      and table_name in ('account_saved_words', 'account_review_events')
      and privilege_type = 'INSERT'
  ) and
  not has_table_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'INSERT'
  ) and
  not has_schema_privilege(
    'vlx_account_learning_writer',
    'auth',
    'USAGE'
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
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_request_identity()',
    'EXECUTE'
  ) and
  not exists (
    select 1
    from pg_roles as app_role
    where app_role.rolname = 'service_role'
      and has_function_privilege(
        app_role.oid,
        'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure,
        'EXECUTE'
      )
  ) and
  not has_column_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_control',
    'singleton',
    'UPDATE'
  ) and
  not has_table_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_control',
    'SELECT'
  ) as pr_c_rollback_revoked_writer_capabilities
\gset

\if :pr_c_rollback_revoked_writer_capabilities
\else
  \echo 'PR C operational rollback left a writer mutation/session capability'
  \quit 1
\endif

select
  position(
    'for share' in lower(
      pg_get_functiondef(
        'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'::regprocedure
      )
    )
  ) > 0 and
  exists (
    select 1
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as acl
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and acl.grantee = 'postgres'::regrole
      and acl.grantor = 'vlx_account_learning_writer'::regrole
      and acl.privilege_type = 'EXECUTE'
      and acl.is_grantable
  ) and
  not exists (
    select 1
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as acl
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and acl.grantee <> wrapper.proowner
      and not (
        acl.grantee = 'postgres'::regrole and
        acl.grantor = 'vlx_account_learning_writer'::regrole and
        acl.privilege_type = 'EXECUTE' and
        acl.is_grantable
      )
  ) and
  (
    (
      (select rolsuper from pg_roles where rolname = 'postgres') and
      (
        select count(*) = 0
        from pg_auth_members as membership
        where membership.roleid = 'vlx_account_learning_writer'::regrole
      )
    ) or (
      not (select rolsuper from pg_roles where rolname = 'postgres') and
      (
        select count(*) = 1 and
          bool_and(
            membership.member = 'postgres'::regrole and
            membership.admin_option and
            not membership.inherit_option and
            not membership.set_option
          )
        from pg_auth_members as membership
        where membership.roleid = 'vlx_account_learning_writer'::regrole
      )
    )
  ) and
  exists (
    select 1
    from pg_constraint
    where conrelid =
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass
      and conname = 'account_learning_apply_receipts_one_total'
      and contype = 'u'
  ) and
  (
    select
      wrapper.proowner = 'vlx_account_learning_writer'::regrole and
      wrapper.prosecdef and
      wrapper.provolatile = 'v' and
      wrapper.proconfig @>
        array['search_path=""', 'row_security=on']::text[]
    from pg_proc as wrapper
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
  ) as pr_c_rollback_serialization_and_singleton_evidence_remain
\gset

\if :pr_c_rollback_serialization_and_singleton_evidence_remain
\else
  \echo 'PR C rollback lost its serialization or singleton backstop evidence'
  \quit 1
\endif

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

\set ON_ERROR_STOP off
select public.vlx_account_learning_apply(
  'pr-c-after-rollback',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-after-rollback',
  'browser-session-after-rollback',
  :'pr_c_valid_created_at'::timestamptz,
  3000
);
\set rollback_call_sqlstate :LAST_ERROR_SQLSTATE
\set ON_ERROR_STOP on

select :'rollback_call_sqlstate' = '42501' as pr_c_rollback_blocks_new_calls
\gset

\if :pr_c_rollback_blocks_new_calls
\else
  \echo 'PR C operational rollback did not block a new authenticated call'
  \quit 1
\endif

reset role;

select
  (select count(*) from public.account_saved_words) =
    :saved_words_before_rollback and
  (
    select count(*)
    from public.account_review_events
  ) = :review_events_before_rollback and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = :receipts_before_rollback as pr_c_denied_call_preserved_evidence
\gset

\if :pr_c_denied_call_preserved_evidence
\else
  \echo 'PR C post-rollback denied call changed evidence'
  \quit 1
\endif
