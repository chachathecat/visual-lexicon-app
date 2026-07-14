\set ON_ERROR_STOP on

insert into public.account_saved_words (
  owner_account_id,
  slug,
  word,
  saved_at
)
values
  (
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b',
    'owner-a-word',
    'Owner A word',
    '2026-07-14T06:00:00Z'
  ),
  (
    '74d2da4e-5947-49ef-a24d-659c5e95f08d',
    'owner-b-word',
    'Owner B word',
    '2026-07-14T06:01:00Z'
  );

insert into public.account_review_events (
  owner_account_id,
  event_id,
  session_id,
  slug,
  word,
  question_type,
  answer,
  result,
  response_ms,
  created_at,
  box_before,
  box_after,
  weak_score_before,
  weak_score_after
)
values
  (
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b',
    'owner-a-event',
    'owner-a-session',
    'owner-a-word',
    'Owner A word',
    'saved_review',
    'Owner A word',
    'correct',
    1200,
    '2026-07-14T06:10:00Z',
    0,
    1,
    0.20,
    0.04
  ),
  (
    '74d2da4e-5947-49ef-a24d-659c5e95f08d',
    'owner-b-event',
    'owner-b-session',
    'owner-b-word',
    'Owner B word',
    'saved_review',
    'Owner B word',
    'wrong',
    2400,
    '2026-07-14T06:11:00Z',
    0,
    0,
    0.20,
    0.44
  );

set role authenticated;
set request.jwt.claims = '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false}';

select
  count(*) = 1 and
  bool_and(
    owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
  )
  as saved_words_rls_ok
from public.account_saved_words
\gset

\if :saved_words_rls_ok
\else
  \echo 'two-account saved-word RLS isolation failed'
  \quit 1
\endif

select
  count(*) = 1 and
  bool_and(
    owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
  )
  as review_events_rls_ok
from public.account_review_events
\gset

\if :review_events_rls_ok
\else
  \echo 'two-account review-event RLS isolation failed'
  \quit 1
\endif

set request.jwt.claims = '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":true}';

select count(*) = 0 as anonymous_saved_words_denied
from public.account_saved_words
\gset

\if :anonymous_saved_words_denied
\else
  \echo 'anonymous authenticated JWT could read saved words'
  \quit 1
\endif

select count(*) = 0 as anonymous_review_events_denied
from public.account_review_events
\gset

\if :anonymous_review_events_denied
\else
  \echo 'anonymous authenticated JWT could read review events'
  \quit 1
\endif

set request.jwt.claims = '{"sub":"6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b","is_anonymous":false}';

\set ON_ERROR_STOP off
delete from public.account_saved_words
where owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b';
\set saved_word_delete_sqlstate :LAST_ERROR_SQLSTATE

delete from public.account_review_events
where owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b';
\set review_event_delete_sqlstate :LAST_ERROR_SQLSTATE
\set ON_ERROR_STOP on

select :'saved_word_delete_sqlstate' = '42501' as saved_word_delete_denied
\gset

\if :saved_word_delete_denied
\else
  \echo 'authenticated saved-word delete was not denied'
  \quit 1
\endif

select :'review_event_delete_sqlstate' = '42501' as review_event_delete_denied
\gset

\if :review_event_delete_denied
\else
  \echo 'authenticated review-event delete was not denied'
  \quit 1
\endif

reset role;

\set ON_ERROR_STOP off
update public.account_review_events
set answer = 'tampered'
where owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'
  and event_id = 'owner-a-event';
\set review_event_update_sqlstate :LAST_ERROR_SQLSTATE
\set ON_ERROR_STOP on

select :'review_event_update_sqlstate' = 'P0001' as review_event_update_denied
\gset

\if :review_event_update_denied
\else
  \echo 'review-event update immutability was not enforced'
  \quit 1
\endif

delete from auth.users
where id = '74d2da4e-5947-49ef-a24d-659c5e95f08d';

select count(*) = 0 as owner_cascade_saved_words_ok
from public.account_saved_words
where owner_account_id = '74d2da4e-5947-49ef-a24d-659c5e95f08d'
\gset

\if :owner_cascade_saved_words_ok
\else
  \echo 'owner cascade did not delete saved words'
  \quit 1
\endif

select count(*) = 0 as owner_cascade_review_events_ok
from public.account_review_events
where owner_account_id = '74d2da4e-5947-49ef-a24d-659c5e95f08d'
\gset

\if :owner_cascade_review_events_ok
\else
  \echo 'owner cascade did not delete review events'
  \quit 1
\endif

select
  count(*) = 1 and bool_and(answer = 'Owner A word')
  as owner_a_evidence_untouched
from public.account_review_events
where owner_account_id = '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'
\gset

\if :owner_a_evidence_untouched
\else
  \echo 'denied mutations changed owner A evidence'
  \quit 1
\endif
