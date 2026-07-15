\set ON_ERROR_STOP on

with expected (
  policy_name,
  relation_oid,
  policy_command,
  policy_role,
  expression_kind
) as (
  values
    (
      'account_saved_words_owner_select',
      'public.account_saved_words'::regclass::oid,
      'r'::"char",
      'authenticated'::regrole::oid,
      'using'
    ),
    (
      'account_review_events_owner_select',
      'public.account_review_events'::regclass::oid,
      'r'::"char",
      'authenticated'::regrole::oid,
      'using'
    ),
    (
      'account_learning_apply_receipts_writer_insert',
      'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
      'a'::"char",
      'vlx_account_learning_writer'::regrole::oid,
      'check'
    ),
    (
      'account_saved_words_pr_c_writer_select',
      'public.account_saved_words'::regclass::oid,
      'r'::"char",
      'vlx_account_learning_writer'::regrole::oid,
      'using'
    ),
    (
      'account_saved_words_pr_c_writer_insert',
      'public.account_saved_words'::regclass::oid,
      'a'::"char",
      'vlx_account_learning_writer'::regrole::oid,
      'check'
    ),
    (
      'account_review_events_pr_c_writer_select',
      'public.account_review_events'::regclass::oid,
      'r'::"char",
      'vlx_account_learning_writer'::regrole::oid,
      'using'
    ),
    (
      'account_review_events_pr_c_writer_insert',
      'public.account_review_events'::regclass::oid,
      'a'::"char",
      'vlx_account_learning_writer'::regrole::oid,
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
    on policy.polrelid = expected.relation_oid and
       policy.polname = expected.policy_name
)
select
  count(*) = 7 and
  bool_and(
    policy_oid is not null and
    polpermissive and
    polcmd = policy_command and
    polroles = array[policy_role] and
    case
      when expression_kind = 'using' then
        polqual is not null and polwithcheck is null
      else
        polqual is null and polwithcheck is not null
    end and
    policy_expression =
      '((( SELECT auth.uid() AS uid) = owner_account_id) AND ((( SELECT auth.jwt() AS jwt) -> ''is_anonymous''::text) = ''false''::jsonb))'
  ) as pr_c_auth_rls_initplan_hardened
from inspected
\gset

\if :pr_c_auth_rls_initplan_hardened
\else
  \echo 'PR C auth RLS policies did not retain the exact hardened owner boundary'
  \quit 1
\endif
