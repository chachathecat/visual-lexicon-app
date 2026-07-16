\set ON_ERROR_STOP on

set vlx.account_persistence_target = 'staging';
set vlx.account_persistence_pr_c_write_capability_digest =
  'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518';
set vlx.account_persistence_pr_c_deployment_sha =
  '1111111111111111111111111111111111111111';
set vlx.account_persistence_pr_c_approved_owner_account_id =
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b';

\ir ../../../../src/lib/account-persistence/supabase-staging/sql/002_account_learning_apply_enable.sql

select
  enabled and
  write_capability_digest =
    'sha256:89228d479955b4faa37880d337d82301a3d5e1333a6445f283f3bed844c8d518' and
  deployment_sha = '1111111111111111111111111111111111111111' and
  approved_owner_account_id =
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
  activated_at is not null and
  disabled_at is null as hosted_activation_bound_exactly_once,
  activated_at as hosted_activated_at
from vlx_account_persistence_private.account_learning_apply_control
where singleton
\gset

\if :hosted_activation_bound_exactly_once
\else
  \echo 'Hosted operator did not activate the exact reviewed control binding'
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
  not has_function_privilege(
    'service_role',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) and
  not has_schema_privilege(
    'vlx_account_learning_writer',
    'auth',
    'USAGE'
  ) and
  has_function_privilege(
    'vlx_account_learning_writer',
    'vlx_account_persistence_private.vlx_account_learning_request_identity()',
    'EXECUTE'
  ) and
  not has_function_privilege(
    'service_role',
    'vlx_account_persistence_private.vlx_account_learning_request_identity()',
    'EXECUTE'
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
  ) as hosted_activation_exposed_only_authenticated_rpc
\gset

\if :hosted_activation_exposed_only_authenticated_rpc
\else
  \echo 'Hosted activation exposed an app/service/auth surface outside the RPC'
  \quit 1
\endif

select
  statement_timestamp() - interval '1 minute' as hosted_saved_at,
  statement_timestamp() as hosted_created_at
\gset

set role authenticated;
set request.jwt.claims =
  '{"sub":"74d2da4e-5947-49ef-a24d-659c5e95f08d","is_anonymous":false,"session_id":"22222222-2222-4222-8222-222222222222"}';

select public.vlx_account_learning_apply(
  'hosted-cross-account-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'hosted_saved_at'::timestamptz,
  'hosted-event-cross-account-0001',
  'hosted-browser-cross-account-0001',
  :'hosted_created_at'::timestamptz,
  3000
) as hosted_cross_account_outcome
\gset

reset role;

select
  :'hosted_cross_account_outcome'::jsonb =
    '{"status":"auth_required"}'::jsonb and
  (select count(*) from public.account_saved_words) = 0 and
  (select count(*) from public.account_review_events) = 0 and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 0 as hosted_cross_account_denied_without_writes
\gset

\if :hosted_cross_account_denied_without_writes
\else
  \echo 'Hosted RPC accepted a different authenticated account or wrote evidence'
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
  'hosted-event-fake-mastery-0001',
  'hosted-browser-fake-mastery-0001',
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
  :'hosted_created_at'::timestamptz,
  0,
  5,
  0,
  0
);

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'hosted-fake-mastery-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'hosted_saved_at'::timestamptz,
  'hosted-event-fake-mastery-0001',
  'hosted-browser-fake-mastery-0001',
  :'hosted_created_at'::timestamptz,
  3000
) as hosted_fake_mastery_outcome
\gset

reset role;

select
  :'hosted_fake_mastery_outcome'::jsonb =
    '{"status":"scope_conflict"}'::jsonb and
  (select count(*) from public.account_saved_words) = 0 and
  (
    select count(*) = 1 and bool_and(box_after = 5)
    from public.account_review_events
    where owner_account_id =
      '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
      and event_id = 'hosted-event-fake-mastery-0001'
  ) and
  (
    select count(*)
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) = 0 as hosted_fake_mastery_rejected_atomically
\gset

\if :hosted_fake_mastery_rejected_atomically
\else
  \echo 'Hosted RPC accepted or partially persisted fake mastery evidence'
  \quit 1
\endif

delete from public.account_review_events
where owner_account_id =
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
  and event_id = 'hosted-event-fake-mastery-0001';

set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'hosted-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'hosted_saved_at'::timestamptz,
  'hosted-event-owner-a-0001',
  'hosted-browser-owner-a-0001',
  :'hosted_created_at'::timestamptz,
  3000
) as hosted_committed_outcome
\gset

select public.vlx_account_learning_apply(
  'hosted-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'hosted_saved_at'::timestamptz,
  'hosted-event-owner-a-0001',
  'hosted-browser-owner-a-0001',
  :'hosted_created_at'::timestamptz,
  3000
) as hosted_replayed_outcome
\gset

select public.vlx_account_learning_apply(
  'hosted-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'hosted_saved_at'::timestamptz,
  'hosted-event-owner-a-0001',
  'hosted-browser-owner-a-0001',
  :'hosted_created_at'::timestamptz,
  3001
) as hosted_conflict_outcome
\gset

reset role;

select
  (:'hosted_committed_outcome'::jsonb ->> 'status') = 'committed' and
  (:'hosted_committed_outcome'::jsonb ->> 'savedWordsInserted')::integer = 1 and
  (:'hosted_committed_outcome'::jsonb ->> 'reviewEventsInserted')::integer = 1 and
  (:'hosted_committed_outcome'::jsonb ->> 'duplicateReviewEvents')::integer = 0 and
  (:'hosted_committed_outcome'::jsonb ->> 'idempotencyRecordsInserted')::integer = 1 and
  (:'hosted_committed_outcome'::jsonb ->> 'learningEvidenceMutated')::boolean and
  (:'hosted_replayed_outcome'::jsonb ->> 'status') = 'replayed' and
  (:'hosted_replayed_outcome'::jsonb ->> 'savedWordsInserted')::integer = 0 and
  (:'hosted_replayed_outcome'::jsonb ->> 'reviewEventsInserted')::integer = 0 and
  (:'hosted_replayed_outcome'::jsonb ->> 'duplicateReviewEvents')::integer = 1 and
  (:'hosted_replayed_outcome'::jsonb ->> 'idempotencyRecordsInserted')::integer = 0 and
  not (:'hosted_replayed_outcome'::jsonb ->> 'learningEvidenceMutated')::boolean and
  (:'hosted_replayed_outcome'::jsonb ->> 'requestFingerprint') =
    (:'hosted_committed_outcome'::jsonb ->> 'requestFingerprint') and
  :'hosted_conflict_outcome'::jsonb = '{"status":"conflict"}'::jsonb
    as hosted_commit_replay_and_conflict_exact
\gset

\if :hosted_commit_replay_and_conflict_exact
\else
  \echo 'Hosted RPC commit, replay, or idempotency conflict outcome drifted'
  \quit 1
\endif

select
  (
    select count(*) = 1 and bool_and(
      owner_account_id =
        '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
      slug = 'dissonance' and
      word = 'Dissonance' and
      saved_at = :'hosted_saved_at'::timestamptz
    )
    from public.account_saved_words
  ) and
  (
    select count(*) = 1 and bool_and(
      owner_account_id =
        '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
      event_id = 'hosted-event-owner-a-0001' and
      question_type = 'saved_review' and
      box_before = 0 and
      box_after = 1 and
      weak_score_before = 0 and
      weak_score_after = 0
    )
    from public.account_review_events
  ) and
  (
    select count(*) = 1 and bool_and(
      owner_account_id =
        '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid and
      idempotency_key = 'hosted-owner-a-request-0001' and
      event_id = 'hosted-event-owner-a-0001'
    )
    from vlx_account_persistence_private.account_learning_apply_receipts
  ) as hosted_golden_evidence_is_exactly_one_one_one
\gset

\if :hosted_golden_evidence_is_exactly_one_one_one
\else
  \echo 'Hosted RPC did not leave exact 1/1/1 bounded golden evidence'
  \quit 1
\endif

-- Model a bounded second-browser hydration for the approved owner, then prove
-- that the same authenticated read surface returns no rows to another account.
set role authenticated;
set request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"33333333-3333-4333-8333-333333333333"}';

select
  (select count(*) from public.account_saved_words) = 1 and
  (select count(*) from public.account_review_events) = 1
    as hosted_second_browser_hydration_is_bounded
\gset

\if :hosted_second_browser_hydration_is_bounded
\else
  \echo 'Hosted approved-owner hydration did not return exact 1/1 evidence'
  \quit 1
\endif

set request.jwt.claims =
  '{"sub":"74d2da4e-5947-49ef-a24d-659c5e95f08d","is_anonymous":false,"session_id":"22222222-2222-4222-8222-222222222222"}';

select
  (select count(*) from public.account_saved_words) = 0 and
  (select count(*) from public.account_review_events) = 0
    as hosted_cross_account_hydration_is_denied
\gset

\if :hosted_cross_account_hydration_is_denied
\else
  \echo 'Hosted cross-account hydration exposed another owner evidence'
  \quit 1
\endif

reset role;
