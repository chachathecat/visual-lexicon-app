begin;

do $$
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning evidence rollback';
  end if;
end
$$;

drop table if exists public.account_review_events;
drop table if exists public.account_saved_words;
drop function if exists public.vlx_reject_account_review_event_mutation();

commit;
