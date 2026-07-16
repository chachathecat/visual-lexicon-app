\set ON_ERROR_STOP on

begin;

select pg_advisory_lock_shared(721501000001::bigint);
select pg_advisory_unlock_shared(721501000001::bigint);

select saved_at, created_at
from vlx_pr_c_concurrency.fixture
where singleton
\gset

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false,"session_id":"11111111-1111-4111-8111-111111111111"}';

select public.vlx_account_learning_apply(
  'pr-c-owner-a-request-0001',
  'vlx-pr-c-integration-capability-0000000000000001',
  '1111111111111111111111111111111111111111',
  :'saved_at'::timestamptz,
  'prc-event-owner-a-0001',
  'browser-session-owner-a-0001',
  :'created_at'::timestamptz,
  3000
) as outcome
\gset

reset role;

insert into vlx_pr_c_concurrency.outcomes (phase, worker, outcome)
values ('concurrent_apply', :'worker_id', :'outcome'::jsonb);

select pg_advisory_lock_shared(721501000002::bigint);
select pg_advisory_unlock_shared(721501000002::bigint);

commit;
