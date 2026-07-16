\set ON_ERROR_STOP on

with expected (
  policy_name,
  relation_oid,
  policy_command
) as (
  values
    (
      'account_saved_words_owner_select',
      'public.account_saved_words'::regclass::oid,
      'r'::"char"
    ),
    (
      'account_review_events_owner_select',
      'public.account_review_events'::regclass::oid,
      'r'::"char"
    )
), inspected as (
  select
    expected.*,
    policy.oid as policy_oid,
    policy.polpermissive,
    policy.polcmd,
    policy.polroles,
    policy.polqual,
    policy.polwithcheck,
    pg_get_expr(policy.polqual, policy.polrelid) as policy_expression
  from expected
  left join pg_policy as policy
    on policy.polrelid = expected.relation_oid
   and policy.polname = expected.policy_name
)
select
  count(*) = 2 and
  bool_and(
    policy_oid is not null and
    polpermissive and
    polcmd = policy_command and
    polroles = array['authenticated'::regrole::oid] and
    polqual is not null and
    polwithcheck is null and
    policy_expression =
      '((( SELECT auth.uid() AS uid) = owner_account_id) AND ((( SELECT auth.jwt() AS jwt) -> ''is_anonymous''::text) = ''false''::jsonb))' and
    (
      select count(*) = 1
      from pg_depend as dependency
      where dependency.classid = 'pg_policy'::regclass
        and dependency.objid = policy_oid
        and dependency.refclassid = 'pg_proc'::regclass
        and dependency.refobjid = 'auth.uid()'::regprocedure::oid
        and dependency.deptype = 'n'
    ) and
    (
      select count(*) = 1
      from pg_depend as dependency
      where dependency.classid = 'pg_policy'::regclass
        and dependency.objid = policy_oid
        and dependency.refclassid = 'pg_proc'::regclass
        and dependency.refobjid = 'auth.jwt()'::regprocedure::oid
        and dependency.deptype = 'n'
    ) and
    not exists (
      select 1
      from pg_depend as dependency
      where dependency.classid = 'pg_policy'::regclass
        and dependency.objid = policy_oid
        and dependency.refclassid = 'pg_proc'::regclass
        and dependency.refobjid =
          'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure::oid
    )
  ) and
  (
    select count(*) = 2
    from pg_policy as policy
    where policy.polrelid in (
      'public.account_saved_words'::regclass,
      'public.account_review_events'::regclass
    )
      and policy.polroles = array['authenticated'::regrole::oid]
  ) as pr_c_authenticated_owner_policies_keep_auth_initplans
from inspected
\gset

\if :pr_c_authenticated_owner_policies_keep_auth_initplans
\else
  \echo 'PR C authenticated owner policies lost their exact auth initplan boundary'
  \quit 1
\endif

with expected (
  policy_name,
  relation_oid,
  policy_command,
  expression_kind
) as (
  values
    (
      'account_learning_apply_receipts_writer_select',
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
      'r'::"char",
      'using'
    ),
    (
      'account_learning_apply_receipts_writer_insert',
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
      'a'::"char",
      'check'
    ),
    (
      'account_saved_words_pr_c_writer_select',
      'public.account_saved_words'::regclass::oid,
      'r'::"char",
      'using'
    ),
    (
      'account_saved_words_pr_c_writer_insert',
      'public.account_saved_words'::regclass::oid,
      'a'::"char",
      'check'
    ),
    (
      'account_review_events_pr_c_writer_select',
      'public.account_review_events'::regclass::oid,
      'r'::"char",
      'using'
    ),
    (
      'account_review_events_pr_c_writer_insert',
      'public.account_review_events'::regclass::oid,
      'a'::"char",
      'check'
    )
), inspected as (
  select
    expected.*,
    policy.oid as policy_oid,
    policy.polpermissive,
    policy.polcmd,
    policy.polroles,
    policy.polqual,
    policy.polwithcheck,
    pg_get_expr(
      case
        when expected.expression_kind = 'using' then policy.polqual
        else policy.polwithcheck
      end,
      policy.polrelid
    ) as policy_expression
  from expected
  left join pg_policy as policy
    on policy.polrelid = expected.relation_oid
   and policy.polname = expected.policy_name
)
select
  count(*) = 6 and
  bool_and(
    policy_oid is not null and
    polpermissive and
    polcmd = policy_command and
    polroles = array['vlx_account_learning_writer'::regrole::oid] and
    case
      when expression_kind = 'using' then
        polqual is not null and polwithcheck is null
      else
        polqual is null and polwithcheck is not null
    end and
    position(
      'vlx_account_persistence_private.vlx_account_learning_request_identity()'
      in lower(policy_expression)
    ) > 0 and
    position('owner_account_id' in lower(policy_expression)) > 0 and
    position('auth.' in lower(policy_expression)) = 0 and
    (
      select count(*) = 1
      from pg_depend as dependency
      where dependency.classid = 'pg_policy'::regclass
        and dependency.objid = policy_oid
        and dependency.refclassid = 'pg_proc'::regclass
        and dependency.refobjid =
          'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure::oid
        and dependency.deptype = 'n'
    ) and
    not exists (
      select 1
      from pg_depend as dependency
      where dependency.classid = 'pg_policy'::regclass
        and dependency.objid = policy_oid
        and dependency.refclassid = 'pg_proc'::regclass
        and dependency.refobjid in (
          'auth.uid()'::regprocedure::oid,
          'auth.jwt()'::regprocedure::oid
        )
    )
  ) and
  (
    select count(*) = 6
    from pg_policy as policy
    where policy.polrelid in (
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass,
      'public.account_saved_words'::regclass,
      'public.account_review_events'::regclass
    )
      and policy.polroles =
        array['vlx_account_learning_writer'::regrole::oid]
  ) as pr_c_writer_policies_use_only_request_identity
from inspected
\gset

\if :pr_c_writer_policies_use_only_request_identity
\else
  \echo 'PR C writer policies retained auth dependencies or lost request identity'
  \quit 1
\endif
