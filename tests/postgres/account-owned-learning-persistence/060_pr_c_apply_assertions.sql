\set ON_ERROR_STOP on

set vlx.account_persistence_target = 'staging';
set vlx.account_persistence_pr_c_write_capability_digest =
  'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518';
set vlx.account_persistence_pr_c_deployment_sha =
  '1111111111111111111111111111111111111111';
set vlx.account_persistence_pr_c_approved_owner_account_id =
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b';

\ir ../../../src/lib/account-persistence/supabase-staging/sql/002_account_learning_apply_enable.sql

select
  enabled and
  write_capability_digest =
    'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518' and
  write_capability_digest not like
    '%vlx-pr-c-integration-capability-0000000000000001%' and
  deployment_sha = '1111111111111111111111111111111111111111' and
  approved_owner_account_id =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
  activated_at is not null and
  disabled_at is null as pr_c_exact_control_binding
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :pr_c_exact_control_binding
\else
  \echo 'PR C activation did not store only the expected digest and deployment SHA'
  \quit 1
\endif

\set ON_ERROR_STOP off
update vlx_account_persistence_private.account_learning_apply_control
set approved_owner_account_id =
  '74d2da4e-5947-49ef-a24d-659c5e95f08d'::uuid
where singleton;
\set owner_rebind_sqlstate :LAST_ERROR_SQLSTATE
\set ON_ERROR_STOP on

select
  :'owner_rebind_sqlstate' = '23514' and
  approved_owner_account_id =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 0 and
  (select count(*) from public.account_saved_words) = 0 and
  (select count(*) from public.account_review_events) = 0
  as pr_c_approved_owner_rebind_aborted_without_writes
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :pr_c_approved_owner_rebind_aborted_without_writes
\else
  \echo 'PR C allowed its approved synthetic owner to be rebound'
  \quit 1
\endif

select
  activated_at as pr_c_activated_at
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

select
  statement_timestamp() - interval '1 minute' as pr_c_valid_saved_at,
  statement_timestamp() as pr_c_valid_created_at
\gset

select
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
    'auth.sessions',
    'created_at',
    'SELECT'
  ) and
  not has_table_privilege(
    'vlx_account_learning_writer',
    'auth.sessions',
    'SELECT'
  ) and
  not has_schema_privilege(
    'vlx_account_learning_writer',
    'auth',
    'USAGE'
  ) and
  not has_column_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_control',
    'singleton',
    'UPDATE'
  ) and
  has_function_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
    'EXECUTE'
  ) and
  has_function_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
    'EXECUTE'
  ) and
  has_function_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_request_identity()',
    'EXECUTE'
  ) and
  exists (
    select 1
    from pg_proc as identity_helper
    cross join lateral aclexplode(
      coalesce(
        identity_helper.proacl,
        acldefault('f', identity_helper.proowner)
      )
    ) as acl
    where identity_helper.oid =
      'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure
      and acl.grantee = 'vlx_account_learning_writer'::regrole
      and acl.grantor = 'postgres'::regrole
      and acl.privilege_type = 'EXECUTE'
      and not acl.is_grantable
  ) and
  not exists (
    select 1
    from pg_proc as identity_helper
    cross join lateral aclexplode(
      coalesce(
        identity_helper.proacl,
        acldefault('f', identity_helper.proowner)
      )
    ) as acl
    where identity_helper.oid =
      'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure
      and acl.privilege_type = 'EXECUTE'
      and acl.grantee <> identity_helper.proowner
      and (
        acl.grantee <> 'vlx_account_learning_writer'::regrole or
        acl.grantor <> 'postgres'::regrole or
        acl.is_grantable
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
      and acl.grantee <> wrapper.proowner
      and not (
        (
          acl.grantee = 'postgres'::regrole and
          acl.grantor = 'vlx_account_learning_writer'::regrole and
          acl.privilege_type = 'EXECUTE' and
          acl.is_grantable
        ) or (
          acl.grantee = 'authenticated'::regrole and
          acl.grantor = 'postgres'::regrole and
          acl.privilege_type = 'EXECUTE' and
          not acl.is_grantable
        )
      )
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
  ) and
  not has_function_privilege(
    'anon',
    'vlx_account_persistence_private.vlx_account_learning_request_identity()',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'authenticated',
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
  not has_table_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_control',
    'SELECT'
  ) and
  not has_schema_privilege(
    'vlx_account_learning_writer',
    'public',
    'CREATE'
  ) and
  not has_column_privilege('anon', 'auth.sessions', 'id', 'SELECT') and
  not has_column_privilege(
    'authenticated',
    'auth.sessions',
    'id',
    'SELECT'
  ) as pr_c_session_grant_is_exact
\gset

\if :pr_c_session_grant_is_exact
\else
  \echo 'PR C identity/session/control helpers were not writer-only with zero direct table access'
  \quit 1
\endif

select
  not has_table_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.account_learning_apply_control',
    'UPDATE'
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
  enabled and
  write_capability_digest =
    'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518' and
  deployment_sha = '1111111111111111111111111111111111111111' and
  approved_owner_account_id =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
  disabled_at is null as pr_c_writer_control_state_unchanged
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :pr_c_writer_control_state_unchanged
\else
  \echo 'PR C writer obtained direct control-table UPDATE access'
  \quit 1
\endif

select
  wrapper.proowner = 'vlx_account_learning_writer'::regrole and
  wrapper.prosecdef and
  wrapper.provolatile = 'v' and
  wrapper.proconfig @>
    array['search_path=""', 'row_security=on']::text[]
  as pr_c_wrapper_security_shape_exact
from pg_proc as wrapper
where wrapper.oid =
  'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
\gset

\if :pr_c_wrapper_security_shape_exact
\else
  \echo 'PR C public wrapper is not the exact writer-owned definer boundary'
  \quit 1
\endif

select
  has_function_privilege(
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
  exists (
    select 1
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as acl
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and acl.grantee = 'authenticated'::regrole
      and acl.grantor = 'postgres'::regrole
      and acl.privilege_type = 'EXECUTE'
      and not acl.is_grantable
  ) and
  not exists (
    select 1
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as acl
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and acl.grantee = 'authenticated'::regrole
      and acl.privilege_type = 'EXECUTE'
      and (
        acl.grantor <> 'postgres'::regrole or
        acl.is_grantable
      )
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
  not has_table_privilege(
    'authenticated',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'SELECT'
  ) and
  not has_table_privilege(
    'authenticated',
    'vlx_account_persistence_private.account_learning_apply_receipts',
    'INSERT'
  ) as pr_c_rpc_only_app_grant
\gset

\if :pr_c_rpc_only_app_grant
\else
  \echo 'PR C activation exposed more than the authenticated RPC surface'
  \quit 1
\endif

select
  pg_get_function_arguments(
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
  ) !~* '(owner|account|master|box|weak|pack|bill|payment|entitle)' as pr_c_rpc_has_no_forbidden_parameter
\gset

\if :pr_c_rpc_has_no_forbidden_parameter
\else
  \echo 'PR C RPC accepted an owner, mastery, box, pack, billing, or entitlement parameter'
  \quit 1
\endif

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-wrong-capability',
  'wrong-capability-that-is-long-enough-0000000000000000',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-wrong-capability',
  'browser-session-wrong-capability',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as wrong_capability_outcome
\gset

select
  :'wrong_capability_outcome'::jsonb = '{"status":"disabled"}'::jsonb
  as pr_c_wrong_capability_disabled
\gset

\if :pr_c_wrong_capability_disabled
\else
  \echo 'PR C accepted a write capability whose digest did not match'
  \quit 1
\endif

set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false}';

select public.vlx_account_learning_apply(
  'pr-c-missing-session',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-missing-session',
  'browser-session-missing-session',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as missing_session_outcome
\gset

select
  :'missing_session_outcome'::jsonb = '{"status":"auth_required"}'::jsonb
  as pr_c_missing_session_denied
\gset

\if :pr_c_missing_session_denied
\else
  \echo 'PR C accepted a JWT without a session_id claim'
  \quit 1
\endif

set request.jwt.claim.sub =
  '74d2da4e-5947-49ef-a24d-659c5e95f08d';
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-legacy-sub-disagreement',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-legacy-sub-disagreement',
  'browser-session-legacy-sub-disagreement',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as legacy_sub_disagreement_outcome
\gset

select
  :'legacy_sub_disagreement_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb
  as pr_c_legacy_sub_disagreement_denied
\gset

\if :pr_c_legacy_sub_disagreement_denied
\else
  \echo 'PR C accepted disagreeing legacy and JSON subject claims'
  \quit 1
\endif

set request.jwt.claim.sub =
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b';
set request.jwt.claims =
  '{"is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-legacy-only-subject',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-legacy-only-subject',
  'browser-session-legacy-only-subject',
  :'pr_c_valid_created_at'::timestamptz,
  5001
) as legacy_only_subject_outcome
\gset

select
  :'legacy_only_subject_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb
  as pr_c_legacy_only_subject_denied
\gset

\if :pr_c_legacy_only_subject_denied
\else
  \echo 'PR C accepted a legacy subject without a matching claims subject'
  \quit 1
\endif

reset request.jwt.claim.sub;
set request.jwt.claim =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';
set request.jwt.claims =
  '{"sub":"74d2da4e-5947-49ef-a24d-659c5e95f08d","is_anonymous":false,"session_id":"22222222-2222-4222-8222-222222222222"}';

select public.vlx_account_learning_apply(
  'pr-c-singular-claims-precedence',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-singular-claims-precedence',
  'browser-session-singular-claims-precedence',
  :'pr_c_valid_created_at'::timestamptz,
  5001
) as singular_claims_precedence_outcome
\gset

select
  :'singular_claims_precedence_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb
  as pr_c_singular_claims_precedence_denied
\gset

\if :pr_c_singular_claims_precedence_denied
\else
  \echo 'PR C ignored a disagreeing singular claims payload'
  \quit 1
\endif

reset request.jwt.claim;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":true,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-anonymous-identity',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-anonymous-identity',
  'browser-session-anonymous-identity',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as anonymous_identity_outcome
\gset

select
  :'anonymous_identity_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb
  as pr_c_anonymous_identity_denied
\gset

\if :pr_c_anonymous_identity_denied
\else
  \echo 'PR C accepted an anonymous request identity'
  \quit 1
\endif

\set ON_ERROR_STOP off
select vlx_account_persistence_private.vlx_account_learning_apply_internal(
  'pr-c-private-missing-session',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-private-missing-session',
  'browser-session-private-missing-session',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as forbidden_private_outcome;
\set private_call_sqlstate :LAST_ERROR_SQLSTATE
\set ON_ERROR_STOP on

select
  :'private_call_sqlstate' = '42501'
  as pr_c_private_function_not_callable
\gset

\if :pr_c_private_function_not_callable
\else
  \echo 'authenticated could call the private apply function directly'
  \quit 1
\endif

set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"not-a-uuid"}';

select public.vlx_account_learning_apply(
  'pr-c-malformed-session',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-malformed-session',
  'browser-session-malformed-session',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as malformed_session_outcome
\gset

select
  :'malformed_session_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb
  as pr_c_malformed_session_denied
\gset

\if :pr_c_malformed_session_denied
\else
  \echo 'PR C accepted a non-UUID JWT session_id claim'
  \quit 1
\endif

set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"22222222-2222-4222-8222-222222222222"}';

select public.vlx_account_learning_apply(
  'pr-c-mismatched-session',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-mismatched-session',
  'browser-session-mismatched-session',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as mismatched_session_outcome
\gset

select
  :'mismatched_session_outcome'::jsonb = '{"status":"auth_required"}'::jsonb
  as pr_c_mismatched_session_denied
\gset

\if :pr_c_mismatched_session_denied
\else
  \echo 'PR C accepted a session that belonged to another account'
  \quit 1
\endif

set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-wrapper-scope-gate',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-wrapper-scope-gate',
  'browser-session-wrapper-scope-gate',
  :'pr_c_valid_created_at'::timestamptz,
  5001
) as wrapper_scope_outcome
\gset

select
  :'wrapper_scope_outcome'::jsonb = '{"status":"scope_conflict"}'::jsonb
  as pr_c_wrapper_enforces_scope_gate
\gset

\if :pr_c_wrapper_enforces_scope_gate
\else
  \echo 'PR C public wrapper bypassed the bounded input scope gate'
  \quit 1
\endif

select public.vlx_account_learning_apply(
  'pr-c-past-timestamp',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_activated_at'::timestamptz - interval '6 minutes',
  'prc-event-past-timestamp',
  'browser-session-past-timestamp',
  :'pr_c_activated_at'::timestamptz - interval '5 minutes',
  3000
) as past_timestamp_outcome
\gset

select public.vlx_account_learning_apply(
  'pr-c-future-timestamp',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  statement_timestamp() + interval '6 minutes',
  'prc-event-future-timestamp',
  'browser-session-future-timestamp',
  statement_timestamp() + interval '7 minutes',
  3000
) as future_timestamp_outcome
\gset

select public.vlx_account_learning_apply(
  'pr-c-infinite-timestamp',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  '-infinity'::timestamptz,
  'prc-event-infinite-timestamp',
  'browser-session-infinite-timestamp',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as infinite_timestamp_outcome
\gset

select
  :'past_timestamp_outcome'::jsonb =
    '{"status":"scope_conflict"}'::jsonb and
  :'future_timestamp_outcome'::jsonb =
    '{"status":"scope_conflict"}'::jsonb and
  :'infinite_timestamp_outcome'::jsonb =
    '{"status":"scope_conflict"}'::jsonb
  as pr_c_untrusted_timestamp_windows_rejected
\gset

\if :pr_c_untrusted_timestamp_windows_rejected
\else
  \echo 'PR C accepted a stale, future, or infinite synthetic timestamp'
  \quit 1
\endif

reset role;

select
  (select count(*) from public.account_saved_words) = 0 and
  (select count(*) from public.account_review_events) = 0 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 0 as pr_c_timestamp_rejections_left_no_writes
\gset

\if :pr_c_timestamp_rejections_left_no_writes
\else
  \echo 'PR C timestamp rejection left a partial write'
  \quit 1
\endif

insert into public.account_review_events (
  owner_account_id,
  event_id,
  session_id,
  slug,
  word,
  hub,
  question_type,
  selected,
  answer,
  result,
  response_ms,
  used_hint,
  confidence,
  created_at,
  box_before,
  box_after,
  weak_score_before,
  weak_score_after
)
values (
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b',
  'prc-event-fake-mastery',
  'browser-session-fake-mastery',
  'dissonance',
  'Dissonance',
  'academic-vocabulary',
  'saved_review',
  'Dissonance',
  'Dissonance',
  'correct',
  3000,
  false,
  'knew',
  :'pr_c_valid_created_at'::timestamptz,
  0,
  5,
  0,
  0
);

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-fake-mastery-collision',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-fake-mastery',
  'browser-session-fake-mastery',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as fake_mastery_collision_outcome
\gset

select
  :'fake_mastery_collision_outcome'::jsonb =
    '{"status":"scope_conflict"}'::jsonb
  as pr_c_fake_mastery_collision_rejected
\gset

\if :pr_c_fake_mastery_collision_rejected
\else
  \echo 'PR C accepted a preseeded fake-mastery event collision'
  \quit 1
\endif

reset role;

select
  (select count(*) from public.account_saved_words) = 0 and
  (
    select count(*) = 1 and bool_and(box_after = 5)
    from public.account_review_events
    where owner_account_id =
      '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
      and event_id = 'prc-event-fake-mastery'
  ) and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 0 as pr_c_fake_mastery_rejection_was_atomic
\gset

\if :pr_c_fake_mastery_rejection_was_atomic
\else
  \echo 'PR C fake-mastery collision changed durable evidence'
  \quit 1
\endif

delete from public.account_review_events
where owner_account_id =
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
  and event_id = 'prc-event-fake-mastery';

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-owner-a-0001',
  'browser-session-owner-a-0001',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as committed_outcome
\gset

select
  (:'committed_outcome'::jsonb ->> 'status') = 'committed' and
  (:'committed_outcome'::jsonb ->> 'requestFingerprint') ~
    '^sha256:[0-9a-f]{64}$' and
  (:'committed_outcome'::jsonb ->> 'savedWordsInserted')::integer = 1 and
  (:'committed_outcome'::jsonb ->> 'reviewEventsInserted')::integer = 1 and
  (:'committed_outcome'::jsonb ->> 'duplicateReviewEvents')::integer = 0 and
  (:'committed_outcome'::jsonb ->> 'idempotencyRecordsInserted')::integer = 1 and
  (:'committed_outcome'::jsonb ->> 'learningEvidenceMutated')::boolean
  as pr_c_committed_once
\gset

\if :pr_c_committed_once
\else
  \echo 'PR C did not atomically commit one saved word, event, and receipt'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
    slug = 'dissonance' and
    word = 'Dissonance' and
    image = 'https://cdn.visuallexicon.org/images/dissonance.webp' and
    definition = 'A clash between sounds, ideas, or feelings.' and
    hub = 'academic-vocabulary' and
    source = 'word_page' and
    saved_at = :'pr_c_valid_saved_at'::timestamptz
  ) as pr_c_saved_word_round_tripped
from public.account_saved_words
where slug = 'dissonance'
\gset

\if :pr_c_saved_word_round_tripped
\else
  \echo 'PR C canonical saved word did not round-trip exactly'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
    event_id = 'prc-event-owner-a-0001' and
    session_id = 'browser-session-owner-a-0001' and
    slug = 'dissonance' and
    word = 'Dissonance' and
    hub = 'academic-vocabulary' and
    question_type = 'saved_review' and
    selected = 'Dissonance' and
    answer = 'Dissonance' and
    result = 'correct' and
    response_ms = 3000 and
    used_hint = false and
    confidence = 'knew' and
    created_at = :'pr_c_valid_created_at'::timestamptz and
    box_before = 0 and
    box_after = 1 and
    weak_score_before = 0 and
    weak_score_after = 0
  ) as pr_c_review_event_round_tripped
from public.account_review_events
where event_id = 'prc-event-owner-a-0001'
\gset

\if :pr_c_review_event_round_tripped
\else
  \echo 'PR C canonical saved_review event did not round-trip exactly'
  \quit 1
\endif

select public.vlx_account_learning_apply(
  'pr-c-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-owner-a-0001',
  'browser-session-owner-a-0001',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as replay_outcome
\gset

select
  (:'replay_outcome'::jsonb ->> 'status') = 'replayed' and
  (:'replay_outcome'::jsonb ->> 'requestFingerprint') =
    (:'committed_outcome'::jsonb ->> 'requestFingerprint') and
  (:'replay_outcome'::jsonb ->> 'savedWordsInserted')::integer = 0 and
  (:'replay_outcome'::jsonb ->> 'reviewEventsInserted')::integer = 0 and
  (:'replay_outcome'::jsonb ->> 'duplicateReviewEvents')::integer = 1 and
  (:'replay_outcome'::jsonb ->> 'idempotencyRecordsInserted')::integer = 0 and
  not (:'replay_outcome'::jsonb ->> 'learningEvidenceMutated')::boolean
  as pr_c_replay_is_noop
\gset

\if :pr_c_replay_is_noop
\else
  \echo 'PR C same-fingerprint replay was not an idempotent no-op'
  \quit 1
\endif

select public.vlx_account_learning_apply(
  'pr-c-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-owner-a-0001',
  'browser-session-owner-a-0001',
  :'pr_c_valid_created_at'::timestamptz,
  3001
) as idempotency_conflict_outcome
\gset

select
  :'idempotency_conflict_outcome'::jsonb = '{"status":"conflict"}'::jsonb
  as pr_c_same_key_different_fingerprint_conflicts
\gset

\if :pr_c_same_key_different_fingerprint_conflicts
\else
  \echo 'PR C reused idempotency key accepted a different request fingerprint'
  \quit 1
\endif

select public.vlx_account_learning_apply(
  'pr-c-owner-a-request-0002',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-owner-a-0001',
  'browser-session-owner-a-0001',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as different_key_outcome
\gset

select
  :'different_key_outcome'::jsonb = '{"status":"scope_conflict"}'::jsonb
  as pr_c_different_key_cannot_create_second_pair
\gset

\if :pr_c_different_key_cannot_create_second_pair
\else
  \echo 'PR C accepted a second idempotency key for the one-shot owner'
  \quit 1
\endif

reset role;

select
  (select count(*) from public.account_saved_words) = 1 and
  (select count(*) from public.account_review_events) = 1 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 1 as pr_c_different_key_preserved_exact_global_bound
\gset

\if :pr_c_different_key_preserved_exact_global_bound
\else
  \echo 'PR C different-key rejection did not preserve exact 1/1/1 evidence'
  \quit 1
\endif

set role authenticated;

set request.jwt.claims =
  '{"sub":"74d2da4e-5947-49ef-a24d-659c5e95f08d","is_anonymous":false,"session_id":"22222222-2222-4222-8222-222222222222"}';

select public.vlx_account_learning_apply(
  'pr-c-owner-b-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-owner-b-0001',
  'browser-session-owner-b-0001',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as cross_account_apply_outcome
\gset

select
  :'cross_account_apply_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb
  as pr_c_cross_account_apply_denied
\gset

\if :pr_c_cross_account_apply_denied
\else
  \echo 'account B passed the immutable approved-owner mutation gate'
  \quit 1
\endif

select
  count(*) = 0 as pr_c_cross_account_saved_word_denied
from public.account_saved_words
where slug = 'dissonance'
\gset

\if :pr_c_cross_account_saved_word_denied
\else
  \echo 'account B could read account A PR C saved-word evidence'
  \quit 1
\endif

select
  count(*) = 0 as pr_c_cross_account_review_event_denied
from public.account_review_events
where event_id = 'prc-event-owner-a-0001'
\gset

\if :pr_c_cross_account_review_event_denied
\else
  \echo 'account B could read account A PR C review-event evidence'
  \quit 1
\endif

reset role;

select
  (select count(*) from public.account_saved_words) = 1 and
  (select count(*) from public.account_review_events) = 1 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 1 and
  not exists (
    select 1
    from public.account_saved_words
    where owner_account_id =
      '74d2da4e-5947-49ef-a24d-659c5e95f08d'::uuid
  ) and
  not exists (
    select 1
    from public.account_review_events
    where owner_account_id =
      '74d2da4e-5947-49ef-a24d-659c5e95f08d'::uuid
  ) as pr_c_cross_account_apply_preserved_global_singleton
\gset

\if :pr_c_cross_account_apply_preserved_global_singleton
\else
  \echo 'account B mutation attempt changed the exact 1/1/1 evidence bound'
  \quit 1
\endif

delete from auth.sessions
where id = '33333333-3333-4333-8333-333333333333';

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"33333333-3333-4333-8333-333333333333"}';

select public.vlx_account_learning_apply(
  'pr-c-deleted-session',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'pr_c_valid_saved_at'::timestamptz,
  'prc-event-deleted-session',
  'browser-session-deleted-session',
  :'pr_c_valid_created_at'::timestamptz,
  3000
) as deleted_session_outcome
\gset

select
  :'deleted_session_outcome'::jsonb = '{"status":"auth_required"}'::jsonb
  as pr_c_deleted_session_denied
\gset

\if :pr_c_deleted_session_denied
\else
  \echo 'PR C accepted a JWT whose auth.sessions row was deleted'
  \quit 1
\endif

reset role;

select
  (select count(*) from public.account_saved_words where slug = 'dissonance') = 1 and
  (
    select count(*)
    from public.account_review_events
    where event_id = 'prc-event-owner-a-0001'
  ) = 1 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 1 as pr_c_failed_paths_left_no_partial_writes
\gset

\if :pr_c_failed_paths_left_no_partial_writes
\else
  \echo 'PR C failed, replayed, or conflicting paths changed durable row counts'
  \quit 1
\endif

select
  position(
    'vlx-pr-c-integration-capability-0000000000000001' in
    row_to_json(receipt)::text
  ) = 0 as pr_c_receipt_contains_no_capability
from vlx_account_persistence_private.account_learning_apply_receipts as receipt
\gset

\if :pr_c_receipt_contains_no_capability
\else
  \echo 'PR C durable receipt stored plaintext write capability material'
  \quit 1
\endif
