\set ON_ERROR_STOP on

select
  not control.enabled and
  control.write_capability_digest is null and
  control.deployment_sha is null and
  control.approved_owner_account_id is null and
  has_function_privilege(
    'service_role',
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
  ) and
  (
    select count(*) = 1 and bool_and(
      privilege.grantor = 'vlx_account_learning_writer'::regrole and
      not privilege.is_grantable
    )
    from pg_proc as wrapper
    cross join lateral aclexplode(
      coalesce(wrapper.proacl, acldefault('f', wrapper.proowner))
    ) as privilege
    where wrapper.oid =
      'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
      and privilege.grantee = 'service_role'::regrole
      and privilege.privilege_type = 'EXECUTE'
  ) as hosted_wrapper_matches_live_pre_004_acl
from vlx_account_persistence_private.account_learning_apply_control as control
where control.singleton
\gset

\if :hosted_wrapper_matches_live_pre_004_acl
\else
  \echo 'Hosted fixture did not reproduce the direct service_role wrapper ACL'
  \quit 1
\endif
