\set ON_ERROR_STOP on

select
  obj_description(to_regclass('public.account_saved_words'), 'pg_class') =
    'collision-sentinel' and
  exists (
    select 1
    from public.account_saved_words
    where collision_sentinel = 'must-survive'
  )
  as collision_sentinel_preserved
\gset

\if :collision_sentinel_preserved
\else
  \echo 'collision guard replaced the sentinel table'
  \quit 1
\endif

select
  to_regclass('public.account_review_events') is null and
  to_regprocedure('public.vlx_reject_account_review_event_mutation()') is null
  as collision_rollback_ok
\gset

\if :collision_rollback_ok
\else
  \echo 'collision guard did not roll back partial objects'
  \quit 1
\endif
