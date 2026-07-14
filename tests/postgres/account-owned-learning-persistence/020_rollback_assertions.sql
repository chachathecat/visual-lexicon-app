\set ON_ERROR_STOP on

select
  to_regclass('public.account_saved_words') is null and
  to_regclass('public.account_review_events') is null and
  to_regprocedure('public.vlx_reject_account_review_event_mutation()') is null
  as owned_rollback_ok
\gset

\if :owned_rollback_ok
\else
  \echo 'owned rollback left migration objects behind'
  \quit 1
\endif
