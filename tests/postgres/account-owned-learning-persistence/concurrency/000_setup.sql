\set ON_ERROR_STOP on

select current_database() = 'vlx_pr_c_concurrency' as disposable_database
\gset

\if :disposable_database
\else
  \echo 'PR C concurrency setup refused a non-disposable database'
  \quit 1
\endif

set vlx.account_persistence_target = 'staging';

select
  'sha256:' || encode(
    extensions.digest(
      'vlx-pr-c-integration-capability-0000000000000001',
      'sha256'
    ),
    'hex'
  ) as pr_c_capability_digest
\gset

set vlx.account_persistence_pr_c_write_capability_digest =
  :'pr_c_capability_digest';
set vlx.account_persistence_pr_c_deployment_sha =
  '1111111111111111111111111111111111111111';
set vlx.account_persistence_pr_c_approved_owner_account_id =
  '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b';

\ir ../../../../src/lib/account-persistence/supabase-staging/sql/002_account_learning_apply_enable.sql

create schema vlx_pr_c_concurrency;

create table vlx_pr_c_concurrency.fixture (
  singleton boolean primary key default true check (singleton),
  saved_at timestamptz not null,
  created_at timestamptz not null,
  check (saved_at <= created_at)
);

insert into vlx_pr_c_concurrency.fixture (
  singleton,
  saved_at,
  created_at
)
select
  true,
  clock_timestamp() - interval '1 second',
  clock_timestamp()
from vlx_account_persistence_private.account_learning_apply_control
where singleton
  and enabled;

create table vlx_pr_c_concurrency.outcomes (
  phase text not null check (phase in ('concurrent_apply', 'held_replay')),
  worker text not null,
  outcome jsonb not null check (jsonb_typeof(outcome) = 'object'),
  primary key (phase, worker)
);

select
  (select count(*) from vlx_pr_c_concurrency.fixture) = 1 and
  (
    select enabled and disabled_at is null
    from vlx_account_persistence_private.account_learning_apply_control
    where singleton
  ) and
  has_function_privilege(
    'authenticated',
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
    'EXECUTE'
  ) as concurrency_fixture_ready
\gset

\if :concurrency_fixture_ready
\else
  \echo 'PR C concurrency fixture was not activated exactly once'
  \quit 1
\endif
