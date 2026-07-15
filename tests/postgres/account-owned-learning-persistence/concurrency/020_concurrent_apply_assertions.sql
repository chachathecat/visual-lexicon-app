\set ON_ERROR_STOP on

do $$
declare
  committed_outcome jsonb;
  replayed_outcome jsonb;
  receipt_fingerprint text;
  fixture_saved_at timestamptz;
  fixture_created_at timestamptz;
begin
  if current_database() is distinct from 'vlx_pr_c_concurrency' then
    raise exception 'PR C concurrency assertion refused a non-disposable database';
  end if;

  if (
    select count(*)
    from vlx_pr_c_concurrency.outcomes
    where phase = 'concurrent_apply'
  ) <> 2 then
    raise exception 'PR C concurrent apply did not record two outcomes';
  end if;

  select outcome
  into committed_outcome
  from vlx_pr_c_concurrency.outcomes
  where phase = 'concurrent_apply'
    and outcome ->> 'status' = 'committed';

  if not found or exists (
    select 1
    from vlx_pr_c_concurrency.outcomes
    where phase = 'concurrent_apply'
      and outcome ->> 'status' = 'committed'
    offset 1
  ) then
    raise exception 'PR C concurrent apply did not produce exactly one commit';
  end if;

  select outcome
  into replayed_outcome
  from vlx_pr_c_concurrency.outcomes
  where phase = 'concurrent_apply'
    and outcome ->> 'status' = 'replayed';

  if not found or exists (
    select 1
    from vlx_pr_c_concurrency.outcomes
    where phase = 'concurrent_apply'
      and outcome ->> 'status' = 'replayed'
    offset 1
  ) then
    raise exception 'PR C concurrent apply did not produce exactly one replay';
  end if;

  if committed_outcome ->> 'requestFingerprint' !~ '^sha256:[0-9a-f]{64}$' or
     replayed_outcome ->> 'requestFingerprint' is distinct from
       committed_outcome ->> 'requestFingerprint' or
     committed_outcome - 'requestFingerprint' is distinct from
       '{"status":"committed","savedWordsInserted":1,"reviewEventsInserted":1,"duplicateReviewEvents":0,"idempotencyRecordsInserted":1,"learningEvidenceMutated":true}'::jsonb or
     replayed_outcome - 'requestFingerprint' is distinct from
       '{"status":"replayed","savedWordsInserted":0,"reviewEventsInserted":0,"duplicateReviewEvents":1,"idempotencyRecordsInserted":0,"learningEvidenceMutated":false}'::jsonb then
    raise exception 'PR C concurrent apply returned an invalid commit/replay pair';
  end if;

  select saved_at, created_at
  into fixture_saved_at, fixture_created_at
  from vlx_pr_c_concurrency.fixture
  where singleton;

  if (select count(*) from public.account_saved_words) <> 1 or
     (select count(*) from public.account_review_events) <> 1 or
     (
       select count(*)
       from vlx_account_persistence_private.account_learning_apply_receipts
     ) <> 1 then
    raise exception 'PR C concurrent apply did not preserve exact 1/1/1 bounds';
  end if;

  if not exists (
    select 1
    from public.account_saved_words
    where owner_account_id =
        '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
      and slug = 'dissonance'
      and word = 'Dissonance'
      and saved_at = fixture_saved_at
  ) or not exists (
    select 1
    from public.account_review_events
    where owner_account_id =
        '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
      and event_id = 'prc-event-owner-a-0001'
      and session_id = 'browser-session-owner-a-0001'
      and slug = 'dissonance'
      and result = 'correct'
      and created_at = fixture_created_at
      and box_before = 0
      and box_after = 1
  ) then
    raise exception 'PR C concurrent apply changed the canonical evidence';
  end if;

  select request_fingerprint
  into receipt_fingerprint
  from vlx_account_persistence_private.account_learning_apply_receipts
  where owner_account_id =
      '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
    and idempotency_key = 'pr-c-owner-a-request-0001'
    and event_id = 'prc-event-owner-a-0001'
    and saved_words_inserted = 1
    and review_events_inserted = 1
    and duplicate_review_events = 0
    and learning_evidence_mutated;

  if not found or receipt_fingerprint is distinct from
      committed_outcome ->> 'requestFingerprint' then
    raise exception 'PR C concurrent apply receipt did not match both outcomes';
  end if;
end
$$;
