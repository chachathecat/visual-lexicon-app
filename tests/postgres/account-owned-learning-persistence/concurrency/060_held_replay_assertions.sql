\set ON_ERROR_STOP on

do $$
declare
  held_replay_outcome jsonb;
  receipt_fingerprint text;
begin
  if current_database() is distinct from 'vlx_pr_c_concurrency' then
    raise exception 'PR C replay assertion refused a non-disposable database';
  end if;

  select outcome
  into held_replay_outcome
  from vlx_pr_c_concurrency.outcomes
  where phase = 'held_replay'
    and worker = 'rollback_blocker';

  select request_fingerprint
  into receipt_fingerprint
  from vlx_account_persistence_private.account_learning_apply_receipts;

  if not found or
     held_replay_outcome ->> 'requestFingerprint' is distinct from
       receipt_fingerprint or
     held_replay_outcome - 'requestFingerprint' is distinct from
       '{"status":"replayed","savedWordsInserted":0,"reviewEventsInserted":0,"duplicateReviewEvents":1,"idempotencyRecordsInserted":0,"learningEvidenceMutated":false}'::jsonb then
    raise exception 'PR C held replay was not an exact idempotent no-op';
  end if;

  if (select count(*) from vlx_pr_c_concurrency.outcomes) <> 3 or
     (select count(*) from public.account_saved_words) <> 1 or
     (select count(*) from public.account_review_events) <> 1 or
     (
       select count(*)
       from vlx_account_persistence_private.account_learning_apply_receipts
     ) <> 1 or
     not exists (
       select 1
       from vlx_account_persistence_private.account_learning_apply_control
       where singleton and enabled and disabled_at is null
     ) then
    raise exception 'PR C held replay changed bounded durable state';
  end if;
end
$$;
