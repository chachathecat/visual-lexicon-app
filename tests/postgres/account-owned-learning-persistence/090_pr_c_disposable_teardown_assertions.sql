\set ON_ERROR_STOP on

select
  to_regnamespace('vlx_account_persistence_private') is null and
  to_regrole('vlx_account_learning_writer') is null and
  to_regprocedure(
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'
  ) is null and
  to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'
  ) is null and
  to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'
  ) is null and
  to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_request_identity()'
  ) is null and
  to_regclass('public.account_saved_words') is not null and
  to_regclass('public.account_review_events') is not null and
  (
    select count(*)
    from public.account_saved_words
    where owner_account_id =
      '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
      and slug = 'dissonance'
  ) = 1 and
  (
    select count(*)
    from public.account_review_events
    where owner_account_id =
      '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
      and event_id = 'prc-event-owner-a-0001'
  ) = 1 as pr_c_disposable_teardown_scoped
\gset

\if :pr_c_disposable_teardown_scoped
\else
  \echo 'PR C disposable teardown escaped its 002-owned object boundary'
  \quit 1
\endif
