begin;

do $$
declare
  control_object regclass := to_regclass(
    'vlx_account_persistence_private.account_learning_apply_control'
  );
  receipts_object regclass := to_regclass(
    'vlx_account_persistence_private.account_learning_apply_receipts'
  );
  control_snapshot_helper regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'
  );
  session_helper regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'
  );
  internal_function regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
  wrapper_function regprocedure := to_regprocedure(
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning apply rollback';
  end if;

  if control_object is null or
     obj_description(control_object, 'pg_class') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_control' then
    raise exception
      'VLX rollback ownership guard rejected the apply control';
  end if;

  if receipts_object is null or
     obj_description(receipts_object, 'pg_class') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_receipts' then
    raise exception
      'VLX rollback ownership guard rejected the apply receipts';
  end if;

  if control_snapshot_helper is null or
     obj_description(control_snapshot_helper, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_control_snapshot()' or
     not exists (
       select 1
       from pg_proc as helper
       where helper.oid = control_snapshot_helper
         and helper.proowner = 'postgres'::regrole
         and helper.prosecdef
         and helper.provolatile = 'v'
         and helper.prorettype =
           'vlx_account_persistence_private.account_learning_apply_control'::regtype
         and helper.pronargs = 0
         and helper.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'sql'
         )
         and helper.proconfig @>
           array['search_path=""', 'row_security=on']::text[]
         and position('for share' in lower(helper.prosrc)) > 0
     ) then
    raise exception
      'VLX rollback ownership guard rejected the control-snapshot helper';
  end if;

  if session_helper is null or
     obj_description(session_helper, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)' or
     not exists (
       select 1
       from pg_proc as helper
       where helper.oid = session_helper
         and helper.proowner = 'postgres'::regrole
         and helper.prosecdef
         and helper.proisstrict
         and helper.provolatile = 's'
         and helper.prorettype = 'boolean'::regtype
         and helper.pronargs = 2
         and helper.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'sql'
         )
         and helper.proconfig @>
           array['search_path=""', 'row_security=on']::text[]
         and position('select exists' in lower(helper.prosrc)) > 0
         and position('from auth.sessions' in lower(helper.prosrc)) > 0
         and position(
           'active_session.id = p_auth_session_id' in lower(helper.prosrc)
         ) > 0
         and position(
           'active_session.user_id = p_owner_account_id' in
           lower(helper.prosrc)
         ) > 0
     ) then
    raise exception
      'VLX rollback ownership guard rejected the live-session helper';
  end if;

  if internal_function is null or
     obj_description(internal_function, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)' then
    raise exception
      'VLX rollback ownership guard rejected the private apply function';
  end if;

  if wrapper_function is null or
     obj_description(wrapper_function, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)' or
     not exists (
       select 1
       from pg_proc as wrapper
       where wrapper.oid = wrapper_function
         and wrapper.proowner = 'vlx_account_learning_writer'::regrole
         and wrapper.prosecdef
         and wrapper.provolatile = 'v'
         and wrapper.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'sql'
         )
         and wrapper.proconfig @>
           array['search_path=""', 'row_security=on']::text[]
     ) then
    raise exception
      'VLX rollback ownership guard rejected the public apply function';
  end if;
end
$$;

update vlx_account_persistence_private.account_learning_apply_control
set
  enabled = false,
  disabled_at = clock_timestamp(),
  updated_at = clock_timestamp()
where singleton;

revoke execute on function public.vlx_account_learning_apply(
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

revoke execute on function
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

revoke usage on schema vlx_account_persistence_private
  from public, anon, authenticated;

revoke insert on table
  vlx_account_persistence_private.account_learning_apply_receipts
  from vlx_account_learning_writer;
revoke insert (
  owner_account_id,
  slug,
  word,
  image,
  definition,
  hub,
  source,
  saved_at
) on table public.account_saved_words
  from vlx_account_learning_writer;
revoke insert (
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
) on table public.account_review_events
  from vlx_account_learning_writer;

revoke execute on function
  vlx_account_persistence_private.vlx_account_learning_session_is_live(
    uuid,
    uuid
  )
  from vlx_account_learning_writer;
revoke execute on function
  vlx_account_persistence_private.vlx_account_learning_control_snapshot()
  from vlx_account_learning_writer;
revoke execute on function auth.uid(), auth.jwt()
  from vlx_account_learning_writer;
revoke usage on schema auth
  from vlx_account_learning_writer;
revoke execute on function extensions.digest(text, text)
  from vlx_account_learning_writer;
revoke usage on schema extensions
  from vlx_account_learning_writer;

commit;
