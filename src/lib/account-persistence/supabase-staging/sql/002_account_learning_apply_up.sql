begin;

do $$
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning apply migration';
  end if;
end
$$;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regprocedure('extensions.digest(text,text)') is null then
    raise exception
      'VLX account learning apply requires extensions.digest(text,text)';
  end if;
end
$$;

create role vlx_account_learning_writer
  nologin
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

create schema vlx_account_persistence_private;
revoke all on schema vlx_account_persistence_private
  from public, anon, authenticated;
grant usage on schema vlx_account_persistence_private
  to vlx_account_learning_writer;

create table vlx_account_persistence_private.account_learning_apply_control (
  singleton boolean primary key default true,
  enabled boolean not null default false,
  write_capability_digest text,
  deployment_sha text,
  approved_owner_account_id uuid,
  activated_at timestamptz,
  disabled_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint account_learning_apply_control_singleton
    check (singleton),
  constraint account_learning_apply_control_capability_digest
    check (
      write_capability_digest is null or
      write_capability_digest ~ '^sha256:[0-9a-f]{64}$'
    ),
  constraint account_learning_apply_control_deployment_sha
    check (
      deployment_sha is null or
      deployment_sha ~ '^[0-9a-f]{40}$'
    ),
  constraint account_learning_apply_control_approved_owner
    check (not enabled or approved_owner_account_id is not null),
  constraint account_learning_apply_control_enabled_configuration
    check (
      not enabled or
      (
        write_capability_digest is not null and
        deployment_sha is not null and
        approved_owner_account_id is not null and
        activated_at is not null and
        disabled_at is null
      )
    )
);

create table vlx_account_persistence_private.account_learning_apply_receipts (
  receipt_singleton boolean not null default true,
  owner_account_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key text not null,
  request_fingerprint text not null,
  event_id text not null,
  deployment_sha text not null,
  saved_words_inserted smallint not null,
  review_events_inserted smallint not null,
  duplicate_review_events smallint not null,
  learning_evidence_mutated boolean not null,
  created_at timestamptz not null default now(),
  primary key (owner_account_id, idempotency_key),
  constraint account_learning_apply_receipts_singleton
    check (receipt_singleton),
  constraint account_learning_apply_receipts_one_total
    unique (receipt_singleton),
  constraint account_learning_apply_receipts_one_per_owner
    unique (owner_account_id),
  constraint account_learning_apply_receipts_idempotency_key
    check (
      char_length(idempotency_key) between 8 and 128 and
      idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
    ),
  constraint account_learning_apply_receipts_fingerprint
    check (request_fingerprint ~ '^sha256:[0-9a-f]{64}$'),
  constraint account_learning_apply_receipts_event_id
    check (
      char_length(event_id) between 1 and 200 and
      event_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
    ),
  constraint account_learning_apply_receipts_deployment_sha
    check (deployment_sha ~ '^[0-9a-f]{40}$'),
  constraint account_learning_apply_receipts_saved_count
    check (saved_words_inserted between 0 and 1),
  constraint account_learning_apply_receipts_event_count
    check (review_events_inserted between 0 and 1),
  constraint account_learning_apply_receipts_duplicate_count
    check (duplicate_review_events between 0 and 1),
  constraint account_learning_apply_receipts_event_outcome
    check (review_events_inserted + duplicate_review_events = 1),
  constraint account_learning_apply_receipts_mutation_flag
    check (
      learning_evidence_mutated =
        (saved_words_inserted = 1 or review_events_inserted = 1)
  )
);

create function
  vlx_account_persistence_private.reject_account_learning_apply_owner_rebind()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if old.approved_owner_account_id is not null and
     new.approved_owner_account_id is distinct from
       old.approved_owner_account_id then
    raise exception using
      errcode = '23514',
      message =
        'VLX account learning apply approved owner is immutable after first activation';
  end if;

  return new;
end;
$$;

create trigger account_learning_apply_control_owner_immutable
before update of approved_owner_account_id
on vlx_account_persistence_private.account_learning_apply_control
for each row
execute function
  vlx_account_persistence_private.reject_account_learning_apply_owner_rebind();

revoke all on function
  vlx_account_persistence_private.reject_account_learning_apply_owner_rebind()
from public, anon, authenticated, vlx_account_learning_writer;

create index account_learning_apply_receipts_owner_created_at_idx
  on vlx_account_persistence_private.account_learning_apply_receipts (
    owner_account_id,
    created_at,
    idempotency_key
  );

insert into vlx_account_persistence_private.account_learning_apply_control (
  singleton,
  enabled
)
values (true, false);

alter table vlx_account_persistence_private.account_learning_apply_control
  enable row level security;
alter table vlx_account_persistence_private.account_learning_apply_control
  force row level security;
alter table vlx_account_persistence_private.account_learning_apply_receipts
  enable row level security;
alter table vlx_account_persistence_private.account_learning_apply_receipts
  force row level security;

create policy account_learning_apply_control_operator_select
  on vlx_account_persistence_private.account_learning_apply_control
  for select
  to postgres
  using (true);

create policy account_learning_apply_control_operator_update
  on vlx_account_persistence_private.account_learning_apply_control
  for update
  to postgres
  using (true)
  with check (true);

create policy account_learning_apply_receipts_writer_select
  on vlx_account_persistence_private.account_learning_apply_receipts
  for select
  to vlx_account_learning_writer
  using ((select auth.uid()) = owner_account_id);

create policy account_learning_apply_receipts_writer_insert
  on vlx_account_persistence_private.account_learning_apply_receipts
  for insert
  to vlx_account_learning_writer
  with check (
    (select auth.uid()) = owner_account_id and
    (select auth.jwt() -> 'is_anonymous') = 'false'::jsonb
  );

create policy account_learning_apply_receipts_operator_select
  on vlx_account_persistence_private.account_learning_apply_receipts
  for select
  to postgres
  using (true);

create policy account_saved_words_pr_c_writer_select
  on public.account_saved_words
  for select
  to vlx_account_learning_writer
  using (
    (select auth.uid()) = owner_account_id and
    (select auth.jwt() -> 'is_anonymous') = 'false'::jsonb
  );

create policy account_saved_words_pr_c_writer_insert
  on public.account_saved_words
  for insert
  to vlx_account_learning_writer
  with check (
    (select auth.uid()) = owner_account_id and
    (select auth.jwt() -> 'is_anonymous') = 'false'::jsonb
  );

create policy account_review_events_pr_c_writer_select
  on public.account_review_events
  for select
  to vlx_account_learning_writer
  using (
    (select auth.uid()) = owner_account_id and
    (select auth.jwt() -> 'is_anonymous') = 'false'::jsonb
  );

create policy account_review_events_pr_c_writer_insert
  on public.account_review_events
  for insert
  to vlx_account_learning_writer
  with check (
    (select auth.uid()) = owner_account_id and
    (select auth.jwt() -> 'is_anonymous') = 'false'::jsonb
  );

create function
  vlx_account_persistence_private.vlx_account_learning_control_snapshot()
returns vlx_account_persistence_private.account_learning_apply_control
language sql
volatile
security definer
set search_path = ''
set row_security = 'on'
as $$
  select control.*
  from vlx_account_persistence_private.account_learning_apply_control as control
  where control.singleton
  for share
$$;

revoke all on function
  vlx_account_persistence_private.vlx_account_learning_control_snapshot()
from public, anon, authenticated, vlx_account_learning_writer;

create function
  vlx_account_persistence_private.vlx_account_learning_session_is_live(
    p_auth_session_id uuid,
    p_owner_account_id uuid
  )
returns boolean
language sql
stable
strict
security definer
set search_path = ''
set row_security = 'on'
as $$
  select exists (
    select 1
    from auth.sessions as active_session
    where active_session.id = p_auth_session_id
      and active_session.user_id = p_owner_account_id
  )
$$;

revoke all on function
  vlx_account_persistence_private.vlx_account_learning_session_is_live(
    uuid,
    uuid
  )
from public, anon, authenticated, vlx_account_learning_writer;

create function vlx_account_persistence_private.vlx_account_learning_apply_internal(
  p_idempotency_key text,
  p_write_capability text,
  p_deployment_sha text,
  p_saved_at timestamptz,
  p_event_id text,
  p_session_id text,
  p_created_at timestamptz,
  p_response_ms integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
set row_security = 'on'
set timezone = 'UTC'
as $$
declare
  control_row vlx_account_persistence_private.account_learning_apply_control%rowtype;
  v_jwt_claims jsonb;
  v_owner_account_id uuid;
  v_owner_account_id_text text;
  v_auth_session_id uuid;
  v_auth_session_id_text text;
  v_request_fingerprint text;
  v_receipt_exists boolean := false;
  v_existing_idempotency_key text;
  v_existing_fingerprint text;
  v_existing_event_id text;
  v_existing_deployment_sha text;
  v_saved_word_count bigint := 0;
  v_review_event_count bigint := 0;
  v_saved_word_exists boolean := false;
  v_saved_word_matches boolean := false;
  v_review_event_exists boolean := false;
  v_review_event_matches boolean := false;
  v_saved_words_inserted integer := 0;
  v_review_events_inserted integer := 0;
  v_duplicate_review_events integer := 0;
  v_learning_evidence_mutated boolean := false;
  v_outcome jsonb;
begin
  if p_write_capability is null or
     octet_length(p_write_capability) not between 32 and 1024 or
     p_deployment_sha is null or
     p_deployment_sha !~ '^[0-9a-f]{40}$' then
    return jsonb_build_object('status', 'disabled');
  end if;

  select snapshot.*
  into control_row
  from vlx_account_persistence_private.vlx_account_learning_control_snapshot()
    as snapshot;

  if not found or
     not control_row.enabled or
     control_row.write_capability_digest is null or
     control_row.approved_owner_account_id is null or
     control_row.deployment_sha is distinct from p_deployment_sha or
     control_row.write_capability_digest is distinct from
       'sha256:' || encode(
         extensions.digest(p_write_capability, 'sha256'),
         'hex'
       ) then
    return jsonb_build_object('status', 'disabled');
  end if;

  v_jwt_claims := auth.jwt();
  v_owner_account_id_text := v_jwt_claims ->> 'sub';
  v_auth_session_id_text := v_jwt_claims ->> 'session_id';

  if v_jwt_claims -> 'is_anonymous' is distinct from 'false'::jsonb or
     v_owner_account_id_text is null or
     v_owner_account_id_text !~
       '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
     v_auth_session_id_text is null or
     v_auth_session_id_text !~
       '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('status', 'auth_required');
  end if;

  v_owner_account_id := v_owner_account_id_text::uuid;
  v_auth_session_id := v_auth_session_id_text::uuid;

  if auth.uid() is distinct from v_owner_account_id or
     not vlx_account_persistence_private.vlx_account_learning_session_is_live(
       v_auth_session_id,
       v_owner_account_id
     ) then
    return jsonb_build_object('status', 'auth_required');
  end if;

  if v_owner_account_id is distinct from
     control_row.approved_owner_account_id then
    return jsonb_build_object('status', 'auth_required');
  end if;

  v_request_fingerprint := 'sha256:' || encode(
    extensions.digest(
      jsonb_build_object(
        'fixture', 'dissonance_saved_review_v1',
        'savedAt', p_saved_at,
        'eventId', p_event_id,
        'sessionId', p_session_id,
        'createdAt', p_created_at,
        'responseMs', p_response_ms,
        'slug', 'dissonance',
        'word', 'Dissonance',
        'image', 'https://cdn.visuallexicon.org/images/dissonance.webp',
        'definition', 'A clash between sounds, ideas, or feelings.',
        'hub', 'academic-vocabulary',
        'source', 'word_page',
        'questionType', 'saved_review',
        'selected', 'Dissonance',
        'answer', 'Dissonance',
        'result', 'correct',
        'usedHint', false,
        'confidence', 'knew',
        'boxBefore', 0,
        'boxAfter', 1,
        'weakScoreBefore', 0,
        'weakScoreAfter', 0
      )::text,
      'sha256'
    ),
    'hex'
  );

  perform pg_advisory_xact_lock(
    hashtextextended(
      'vlx-pr-c-owner' || chr(31) || v_owner_account_id::text,
      0
    )
  );

  select
    receipt.idempotency_key,
    receipt.request_fingerprint,
    receipt.event_id,
    receipt.deployment_sha
  into
    v_existing_idempotency_key,
    v_existing_fingerprint,
    v_existing_event_id,
    v_existing_deployment_sha
  from vlx_account_persistence_private.account_learning_apply_receipts as receipt
  where receipt.owner_account_id = v_owner_account_id;

  v_receipt_exists := found;

  if v_receipt_exists then
    if v_existing_idempotency_key is distinct from p_idempotency_key then
      return jsonb_build_object('status', 'scope_conflict');
    end if;

    if v_existing_fingerprint is distinct from v_request_fingerprint then
      return jsonb_build_object('status', 'conflict');
    end if;

    if v_existing_event_id is distinct from p_event_id or
       v_existing_deployment_sha is distinct from p_deployment_sha then
      return jsonb_build_object('status', 'scope_conflict');
    end if;
  end if;

  if not v_receipt_exists and (
    p_idempotency_key is null or
    char_length(p_idempotency_key) not between 8 and 128 or
    octet_length(p_idempotency_key) > 128 or
    p_idempotency_key !~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$' or
    p_event_id is null or
    char_length(p_event_id) not between 1 and 200 or
    octet_length(p_event_id) > 200 or
    p_event_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$' or
    p_session_id is null or
    char_length(p_session_id) not between 1 and 200 or
    octet_length(p_session_id) > 200 or
    p_session_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$' or
    p_saved_at is null or
    p_created_at is null or
    p_response_ms is null or
    p_response_ms not between 1 and 5000
  ) then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  if not v_receipt_exists and (
    not isfinite(p_saved_at) or
    not isfinite(p_created_at)
  ) then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  if not v_receipt_exists and (
    p_saved_at < control_row.activated_at - interval '5 minutes' or
    p_saved_at < statement_timestamp() - interval '5 minutes' or
    p_saved_at > p_created_at or
    p_created_at - p_saved_at > interval '5 minutes' or
    p_created_at > statement_timestamp() + interval '5 minutes'
  ) then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  select count(*)
  into v_saved_word_count
  from public.account_saved_words as saved_word
  where saved_word.owner_account_id = v_owner_account_id;

  select count(*)
  into v_review_event_count
  from public.account_review_events as review_event
  where review_event.owner_account_id = v_owner_account_id;

  if v_saved_word_count > 1 or v_review_event_count > 1 then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  select
    true,
    saved_word.word is not distinct from 'Dissonance' and
    saved_word.image is not distinct from
      'https://cdn.visuallexicon.org/images/dissonance.webp' and
    saved_word.definition is not distinct from
      'A clash between sounds, ideas, or feelings.' and
    saved_word.hub is not distinct from 'academic-vocabulary' and
    saved_word.source is not distinct from 'word_page' and
    saved_word.saved_at is not distinct from p_saved_at
  into v_saved_word_exists, v_saved_word_matches
  from public.account_saved_words as saved_word
  where saved_word.owner_account_id = v_owner_account_id
    and saved_word.slug = 'dissonance';

  v_saved_word_exists := found;

  if v_saved_word_count = 1 and not v_saved_word_exists then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  if v_saved_word_exists and v_saved_word_matches is not true then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  select
    true,
    review_event.session_id is not distinct from p_session_id and
    review_event.slug is not distinct from 'dissonance' and
    review_event.word is not distinct from 'Dissonance' and
    review_event.hub is not distinct from 'academic-vocabulary' and
    review_event.question_type is not distinct from 'saved_review' and
    review_event.selected is not distinct from 'Dissonance' and
    review_event.answer is not distinct from 'Dissonance' and
    review_event.result is not distinct from 'correct' and
    review_event.response_ms is not distinct from p_response_ms and
    review_event.used_hint is not distinct from false and
    review_event.confidence is not distinct from 'knew' and
    review_event.created_at is not distinct from p_created_at and
    review_event.box_before is not distinct from 0 and
    review_event.box_after is not distinct from 1 and
    review_event.weak_score_before is not distinct from 0 and
    review_event.weak_score_after is not distinct from 0
  into v_review_event_exists, v_review_event_matches
  from public.account_review_events as review_event
  where review_event.owner_account_id = v_owner_account_id
    and review_event.event_id = p_event_id;

  v_review_event_exists := found;

  if v_review_event_count = 1 and not v_review_event_exists then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  if v_review_event_exists and v_review_event_matches is not true then
    return jsonb_build_object('status', 'scope_conflict');
  end if;

  if v_receipt_exists then
    if v_saved_word_count <> 1 or
       v_review_event_count <> 1 or
       not v_saved_word_exists or
       v_saved_word_matches is not true or
       not v_review_event_exists or
       v_review_event_matches is not true then
      return jsonb_build_object('status', 'scope_conflict');
    end if;

    return jsonb_build_object(
      'status', 'replayed',
      'requestFingerprint', v_request_fingerprint,
      'savedWordsInserted', 0,
      'reviewEventsInserted', 0,
      'duplicateReviewEvents', 1,
      'idempotencyRecordsInserted', 0,
      'learningEvidenceMutated', false
    );
  end if;

  begin
    insert into public.account_saved_words (
      owner_account_id,
      slug,
      word,
      image,
      definition,
      hub,
      source,
      saved_at
    )
    values (
      v_owner_account_id,
      'dissonance',
      'Dissonance',
      'https://cdn.visuallexicon.org/images/dissonance.webp',
      'A clash between sounds, ideas, or feelings.',
      'academic-vocabulary',
      'word_page',
      p_saved_at
    )
    on conflict (owner_account_id, slug) do nothing;

    get diagnostics v_saved_words_inserted = row_count;

    if v_saved_words_inserted = 0 then
      select
        saved_word.word is not distinct from 'Dissonance' and
        saved_word.image is not distinct from
          'https://cdn.visuallexicon.org/images/dissonance.webp' and
        saved_word.definition is not distinct from
          'A clash between sounds, ideas, or feelings.' and
        saved_word.hub is not distinct from 'academic-vocabulary' and
        saved_word.source is not distinct from 'word_page' and
        saved_word.saved_at is not distinct from p_saved_at
      into v_saved_word_matches
      from public.account_saved_words as saved_word
      where saved_word.owner_account_id = v_owner_account_id
        and saved_word.slug = 'dissonance';

      if not found or v_saved_word_matches is not true then
        raise exception using
          errcode = 'P0S01',
          message = 'VLX saved-word scope collision';
      end if;
    end if;

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
      v_owner_account_id,
      p_event_id,
      p_session_id,
      'dissonance',
      'Dissonance',
      'academic-vocabulary',
      'saved_review',
      'Dissonance',
      'Dissonance',
      'correct',
      p_response_ms,
      false,
      'knew',
      p_created_at,
      0,
      1,
      0,
      0
    )
    on conflict (owner_account_id, event_id) do nothing;

    get diagnostics v_review_events_inserted = row_count;

    if v_review_events_inserted = 0 then
      v_duplicate_review_events := 1;

      select
        review_event.session_id is not distinct from p_session_id and
        review_event.slug is not distinct from 'dissonance' and
        review_event.word is not distinct from 'Dissonance' and
        review_event.hub is not distinct from 'academic-vocabulary' and
        review_event.question_type is not distinct from 'saved_review' and
        review_event.selected is not distinct from 'Dissonance' and
        review_event.answer is not distinct from 'Dissonance' and
        review_event.result is not distinct from 'correct' and
        review_event.response_ms is not distinct from p_response_ms and
        review_event.used_hint is not distinct from false and
        review_event.confidence is not distinct from 'knew' and
        review_event.created_at is not distinct from p_created_at and
        review_event.box_before is not distinct from 0 and
        review_event.box_after is not distinct from 1 and
        review_event.weak_score_before is not distinct from 0 and
        review_event.weak_score_after is not distinct from 0
      into v_review_event_matches
      from public.account_review_events as review_event
      where review_event.owner_account_id = v_owner_account_id
        and review_event.event_id = p_event_id;

      if not found or v_review_event_matches is not true then
        raise exception using
          errcode = 'P0S02',
          message = 'VLX review-event scope collision';
      end if;
    end if;

    v_learning_evidence_mutated :=
      v_saved_words_inserted = 1 or v_review_events_inserted = 1;

    select count(*)
    into v_saved_word_count
    from public.account_saved_words as saved_word
    where saved_word.owner_account_id = v_owner_account_id;

    select count(*)
    into v_review_event_count
    from public.account_review_events as review_event
    where review_event.owner_account_id = v_owner_account_id;

    if v_saved_word_count <> 1 or v_review_event_count <> 1 then
      raise exception using
        errcode = 'P0S03',
        message = 'VLX bounded owner evidence collision';
    end if;

    v_outcome := jsonb_build_object(
      'status', 'committed',
      'requestFingerprint', v_request_fingerprint,
      'savedWordsInserted', v_saved_words_inserted,
      'reviewEventsInserted', v_review_events_inserted,
      'duplicateReviewEvents', v_duplicate_review_events,
      'idempotencyRecordsInserted', 1,
      'learningEvidenceMutated', v_learning_evidence_mutated
    );

    insert into vlx_account_persistence_private.account_learning_apply_receipts (
      owner_account_id,
      idempotency_key,
      request_fingerprint,
      event_id,
      deployment_sha,
      saved_words_inserted,
      review_events_inserted,
      duplicate_review_events,
      learning_evidence_mutated
    )
    values (
      v_owner_account_id,
      p_idempotency_key,
      v_request_fingerprint,
      p_event_id,
      p_deployment_sha,
      v_saved_words_inserted,
      v_review_events_inserted,
      v_duplicate_review_events,
      v_learning_evidence_mutated
    );

    return v_outcome;
  exception
    when sqlstate 'P0S01' or sqlstate 'P0S02' or sqlstate 'P0S03' then
      return jsonb_build_object('status', 'scope_conflict');
  end;
end;
$$;

grant create on schema vlx_account_persistence_private
  to vlx_account_learning_writer;
grant vlx_account_learning_writer to postgres
  with inherit false, set true;
alter function vlx_account_persistence_private.vlx_account_learning_apply_internal(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
) owner to vlx_account_learning_writer;
revoke create on schema vlx_account_persistence_private
  from vlx_account_learning_writer;

create function public.vlx_account_learning_apply(
  p_idempotency_key text,
  p_write_capability text,
  p_deployment_sha text,
  p_saved_at timestamptz,
  p_event_id text,
  p_session_id text,
  p_created_at timestamptz,
  p_response_ms integer
)
returns jsonb
language sql
volatile
security definer
set search_path = ''
set row_security = 'on'
as $$
  select vlx_account_persistence_private.vlx_account_learning_apply_internal(
    p_idempotency_key,
    p_write_capability,
    p_deployment_sha,
    p_saved_at,
    p_event_id,
    p_session_id,
    p_created_at,
    p_response_ms
  )
$$;

grant create on schema public
  to vlx_account_learning_writer;
alter function public.vlx_account_learning_apply(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
) owner to vlx_account_learning_writer;
revoke create on schema public
  from vlx_account_learning_writer;

do $$
begin
  if has_schema_privilege(
    'vlx_account_learning_writer',
    'public',
    'CREATE'
  ) then
    raise exception
      'VLX writer retained CREATE on public after ownership transfer';
  end if;
end
$$;

revoke all on table
  vlx_account_persistence_private.account_learning_apply_control,
  vlx_account_persistence_private.account_learning_apply_receipts
  from public, anon, authenticated, vlx_account_learning_writer;

-- SET_OPTION authorizes this explicit switch; NOINHERIT keeps writer authority
-- unavailable to postgres outside this owner-only ACL/comment block.
set local role vlx_account_learning_writer;

revoke all on function
  vlx_account_persistence_private.vlx_account_learning_apply_internal(
    text,
    text,
    text,
    timestamptz,
    text,
    text,
    timestamptz,
    integer
  )
  from public, anon, authenticated;

revoke all on function public.vlx_account_learning_apply(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
)
from public, anon, authenticated;

comment on function vlx_account_persistence_private.vlx_account_learning_apply_internal(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
) is
  'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)';
comment on function public.vlx_account_learning_apply(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
) is
  'vlx:migration-owner=002_account_learning_apply;object=public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)';

reset role;

comment on role vlx_account_learning_writer is
  'vlx:migration-owner=002_account_learning_apply;object=role.vlx_account_learning_writer';
comment on schema vlx_account_persistence_private is
  'vlx:migration-owner=002_account_learning_apply;object=schema.vlx_account_persistence_private';
comment on table vlx_account_persistence_private.account_learning_apply_control is
  'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_control';
comment on table vlx_account_persistence_private.account_learning_apply_receipts is
  'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_receipts';
comment on function
  vlx_account_persistence_private.reject_account_learning_apply_owner_rebind()
is
  'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.reject_account_learning_apply_owner_rebind()';
comment on function
  vlx_account_persistence_private.vlx_account_learning_control_snapshot()
is
  'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_control_snapshot()';
comment on function
  vlx_account_persistence_private.vlx_account_learning_session_is_live(
    uuid,
    uuid
  )
is
  'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)';

revoke vlx_account_learning_writer from postgres;

do $$
begin
  if exists (
    select 1
    from pg_auth_members as membership
    where membership.member = 'vlx_account_learning_writer'::regrole
       or (
         membership.roleid = 'vlx_account_learning_writer'::regrole and
         (
           membership.member <> 'postgres'::regrole or
           membership.inherit_option or
           membership.set_option or
           not membership.admin_option
         )
       )
  ) or (
    select count(*)
    from pg_auth_members as membership
    where membership.roleid = 'vlx_account_learning_writer'::regrole
  ) > 1 then
    raise exception
      'VLX writer retained an unexpected or executable role membership';
  end if;
end
$$;

commit;
