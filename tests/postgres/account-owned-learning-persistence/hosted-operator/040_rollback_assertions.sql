\set ON_ERROR_STOP on

set vlx.account_persistence_target = 'staging';
\ir ../../../../src/lib/account-persistence/supabase-staging/sql/002_account_learning_apply_operational_rollback.sql

select
  not enabled and
  write_capability_digest =
    'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518' and
  deployment_sha = '1111111111111111111111111111111111111111' and
  approved_owner_account_id =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
  activated_at is not null and
  disabled_at is not null as hosted_rollback_disabled_without_erasing_binding
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :hosted_rollback_disabled_without_erasing_binding
\else
  \echo 'Hosted rollback erased the binding or failed to disable the control'
  \quit 1
\endif

select
  (select count(*) from public.account_saved_words) = 1 and
  (select count(*) from public.account_review_events) = 1 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 1 and
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
  not has_table_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'INSERT'
  ) and
  not has_column_privilege(
    'vlx_account_learning_writer',
    'public.account_saved_words',
    'owner_account_id',
    'INSERT'
  ) and
  not has_column_privilege(
    'vlx_account_learning_writer',
    'public.account_review_events',
    'owner_account_id',
    'INSERT'
  ) and
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
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_request_identity()',
    'EXECUTE'
  ) as hosted_rollback_preserved_evidence_and_revoked_writer
\gset

\if :hosted_rollback_preserved_evidence_and_revoked_writer
\else
  \echo 'Hosted rollback lost evidence or retained a writer/app capability'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    membership.admin_option and
    not membership.inherit_option and
    not membership.set_option and
    membership.grantor <> 'postgres'::regrole
  ) as hosted_rollback_preserved_external_admin_only_edge
from pg_auth_members as membership
where membership.roleid = 'vlx_account_learning_writer'::regrole
  and membership.member = 'postgres'::regrole
\gset

\if :hosted_rollback_preserved_external_admin_only_edge
\else
  \echo 'Hosted rollback changed the external ADMIN-only writer membership'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(privilege.is_grantable) as hosted_operator_kept_only_rpc_grant_option
from pg_proc as wrapper
cross join lateral aclexplode(
  coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
) as privilege
where wrapper.oid =
  'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
  and privilege.grantee = 'postgres'::regrole
  and privilege.privilege_type = 'EXECUTE'
\gset

\if :hosted_operator_kept_only_rpc_grant_option
\else
  \echo 'Hosted rollback lost or broadened the operator RPC grant option'
  \quit 1
\endif

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

\set ON_ERROR_STOP off
select public.vlx_account_learning_apply(
  'hosted-after-rollback-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  statement_timestamp() - interval '1 minute',
  'hosted-event-after-rollback-0001',
  'hosted-browser-after-rollback-0001',
  statement_timestamp(),
  3000
);
\set hosted_denied_sqlstate :LAST_ERROR_SQLSTATE
\set ON_ERROR_STOP on

reset role;

select
  :'hosted_denied_sqlstate' = '42501' and
  (select count(*) from public.account_saved_words) = 1 and
  (select count(*) from public.account_review_events) = 1 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 1 as hosted_post_rollback_call_denied_without_mutation
\gset

\if :hosted_post_rollback_call_denied_without_mutation
\else
  \echo 'Hosted rollback failed to block a new RPC or changed golden evidence'
  \quit 1
\endif
