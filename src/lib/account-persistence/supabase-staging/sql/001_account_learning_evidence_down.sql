begin;

do $$
declare
  saved_words_object regclass := to_regclass('public.account_saved_words');
  review_events_object regclass := to_regclass('public.account_review_events');
  review_mutation_function regprocedure :=
    to_regprocedure('public.vlx_reject_account_review_event_mutation()');
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning evidence rollback';
  end if;

  if saved_words_object is null or
     obj_description(saved_words_object, 'pg_class') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.account_saved_words' then
    raise exception
      'VLX rollback ownership guard rejected public.account_saved_words';
  end if;

  if review_events_object is null or
     obj_description(review_events_object, 'pg_class') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.account_review_events' then
    raise exception
      'VLX rollback ownership guard rejected public.account_review_events';
  end if;

  if review_mutation_function is null or
     obj_description(review_mutation_function, 'pg_proc') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.vlx_reject_account_review_event_mutation()' then
    raise exception
      'VLX rollback ownership guard rejected public.vlx_reject_account_review_event_mutation()';
  end if;
end
$$;

drop table public.account_review_events;
drop table public.account_saved_words;
drop function public.vlx_reject_account_review_event_mutation();

commit;
