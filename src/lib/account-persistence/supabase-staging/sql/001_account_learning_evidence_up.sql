begin;

do $$
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning evidence migration';
  end if;
end
$$;

create table public.account_saved_words (
  owner_account_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  word text not null,
  image text,
  definition text,
  hub text,
  source text,
  saved_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  primary key (owner_account_id, slug),
  constraint account_saved_words_slug_length
    check (char_length(slug) between 1 and 200),
  constraint account_saved_words_word_length
    check (char_length(word) between 1 and 300),
  constraint account_saved_words_image_length
    check (image is null or char_length(image) <= 2048),
  constraint account_saved_words_definition_length
    check (definition is null or char_length(definition) <= 4000),
  constraint account_saved_words_hub_length
    check (hub is null or char_length(hub) <= 200),
  constraint account_saved_words_source
    check (
      source is null or source in (
        'word_page',
        'hub_page',
        'extension',
        'alias_search',
        'app',
        'exam_pack',
        'manual'
      )
    )
);

create table public.account_review_events (
  owner_account_id uuid not null references auth.users (id) on delete cascade,
  event_id text not null,
  session_id text not null,
  slug text not null,
  word text not null,
  hub text,
  question_type text not null,
  selected text,
  answer text not null,
  result text not null,
  response_ms integer not null,
  used_hint boolean,
  confidence text,
  created_at timestamptz not null,
  box_before smallint not null,
  box_after smallint not null,
  weak_score_before numeric(4, 2) not null,
  weak_score_after numeric(4, 2) not null,
  ingested_at timestamptz not null default now(),
  primary key (owner_account_id, event_id),
  constraint account_review_events_event_id_length
    check (char_length(event_id) between 1 and 200),
  constraint account_review_events_session_id_length
    check (char_length(session_id) between 1 and 200),
  constraint account_review_events_slug_length
    check (char_length(slug) between 1 and 200),
  constraint account_review_events_word_length
    check (char_length(word) between 1 and 300),
  constraint account_review_events_hub_length
    check (hub is null or char_length(hub) <= 200),
  constraint account_review_events_question_type
    check (
      question_type in (
        'image_to_word',
        'definition_to_word',
        'word_to_image',
        'cloze',
        'confusable_pair',
        'saved_review',
        'due_review',
        'weak_review',
        'exam_pack'
      )
    ),
  constraint account_review_events_selected_length
    check (selected is null or char_length(selected) <= 2000),
  constraint account_review_events_answer_length
    check (char_length(answer) between 1 and 2000),
  constraint account_review_events_result
    check (result in ('correct', 'wrong')),
  constraint account_review_events_response_ms
    check (response_ms between 0 and 3600000),
  constraint account_review_events_confidence
    check (confidence is null or confidence in ('knew', 'guessed', 'forgot')),
  constraint account_review_events_box_before
    check (box_before between 0 and 5),
  constraint account_review_events_box_after
    check (box_after between 0 and 5),
  constraint account_review_events_weak_score_before
    check (weak_score_before between 0 and 1),
  constraint account_review_events_weak_score_after
    check (weak_score_after between 0 and 1)
);

create index account_saved_words_owner_saved_at_idx
  on public.account_saved_words (owner_account_id, saved_at, slug);

create index account_review_events_owner_created_at_idx
  on public.account_review_events (owner_account_id, created_at, event_id);

create function public.vlx_reject_account_review_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'account_review_events is append-only';
end;
$$;

create trigger account_review_events_append_only
before update on public.account_review_events
for each row execute function public.vlx_reject_account_review_event_mutation();

alter table public.account_saved_words enable row level security;
alter table public.account_saved_words force row level security;
alter table public.account_review_events enable row level security;
alter table public.account_review_events force row level security;

create policy account_saved_words_owner_select
  on public.account_saved_words
  for select
  to authenticated
  using (
    (select auth.uid()) = owner_account_id
    and (select (auth.jwt() ->> 'is_anonymous')::boolean) is false
  );

create policy account_review_events_owner_select
  on public.account_review_events
  for select
  to authenticated
  using (
    (select auth.uid()) = owner_account_id
    and (select (auth.jwt() ->> 'is_anonymous')::boolean) is false
  );

revoke all on table public.account_saved_words from anon, authenticated;
revoke all on table public.account_review_events from anon, authenticated;
grant select on table public.account_saved_words to authenticated;
grant select on table public.account_review_events to authenticated;

revoke all on function public.vlx_reject_account_review_event_mutation()
  from public, anon, authenticated;

comment on table public.account_saved_words is
  'vlx:migration-owner=001_account_learning_evidence;object=public.account_saved_words';
comment on table public.account_review_events is
  'vlx:migration-owner=001_account_learning_evidence;object=public.account_review_events';
comment on function public.vlx_reject_account_review_event_mutation() is
  'vlx:migration-owner=001_account_learning_evidence;object=public.vlx_reject_account_review_event_mutation()';

commit;
