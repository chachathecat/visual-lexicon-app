\set ON_ERROR_STOP on

begin;

do $$
declare
  private_schema oid := to_regnamespace('vlx_account_persistence_private');
  writer_role oid := to_regrole('vlx_account_learning_writer');
  control_object regclass := to_regclass(
    'vlx_account_persistence_private.account_learning_apply_control'
  );
  receipts_object regclass := to_regclass(
    'vlx_account_persistence_private.account_learning_apply_receipts'
  );
  owner_rebind_guard regprocedure := to_regprocedure(
    'vlx_account_persistence_private.reject_account_learning_apply_owner_rebind()'
  );
  control_snapshot_helper regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'
  );
  session_helper regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'
  );
  saved_words_object regclass := to_regclass('public.account_saved_words');
  review_events_object regclass := to_regclass('public.account_review_events');
  internal_function regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
  wrapper_function regprocedure := to_regprocedure(
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' or
     current_setting('vlx.account_persistence_disposable_test', true) is distinct from 'true' then
    raise exception
      'VLX destructive PR C teardown is restricted to a disposable staging test database';
  end if;

  if private_schema is null or
     obj_description(private_schema, 'pg_namespace') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=schema.vlx_account_persistence_private' then
    raise exception
      'VLX disposable teardown ownership guard rejected the private schema';
  end if;

  if writer_role is null or
     shobj_description(writer_role, 'pg_authid') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=role.vlx_account_learning_writer' then
    raise exception
      'VLX disposable teardown ownership guard rejected the writer role';
  end if;

  if control_object is null or
     obj_description(control_object, 'pg_class') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_control' then
    raise exception
      'VLX disposable teardown ownership guard rejected the apply control';
  end if;

  if receipts_object is null or
     obj_description(receipts_object, 'pg_class') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_receipts' then
    raise exception
      'VLX disposable teardown ownership guard rejected the apply receipts';
  end if;

  if owner_rebind_guard is null or
     obj_description(owner_rebind_guard, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.reject_account_learning_apply_owner_rebind()' then
    raise exception
      'VLX disposable teardown ownership guard rejected the owner-rebind guard';
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
      'VLX disposable teardown ownership guard rejected the control-snapshot helper';
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
      'VLX disposable teardown ownership guard rejected the live-session helper';
  end if;

  if internal_function is null or
     obj_description(internal_function, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)' then
    raise exception
      'VLX disposable teardown ownership guard rejected the private RPC';
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
      'VLX disposable teardown ownership guard rejected the public RPC';
  end if;

  if saved_words_object is null or
     obj_description(saved_words_object, 'pg_class') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.account_saved_words' or
     review_events_object is null or
     obj_description(review_events_object, 'pg_class') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.account_review_events' then
    raise exception
      'VLX disposable teardown ownership guard rejected the 001 evidence tables';
  end if;

  if (
    select count(*)
    from pg_policy
    where polrelid in (saved_words_object, review_events_object)
      and polname in (
        'account_saved_words_pr_c_writer_insert',
        'account_saved_words_pr_c_writer_select',
        'account_review_events_pr_c_writer_insert',
        'account_review_events_pr_c_writer_select'
      )
      and polroles = array[writer_role]::oid[]
  ) <> 4 then
    raise exception
      'VLX disposable teardown ownership guard rejected the PR C evidence policies';
  end if;
end
$$;

drop function public.vlx_account_learning_apply(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
);

drop policy account_saved_words_pr_c_writer_insert
  on public.account_saved_words;
drop policy account_saved_words_pr_c_writer_select
  on public.account_saved_words;
drop policy account_review_events_pr_c_writer_insert
  on public.account_review_events;
drop policy account_review_events_pr_c_writer_select
  on public.account_review_events;

drop function
  vlx_account_persistence_private.vlx_account_learning_apply_internal(
    text,
    text,
    text,
    timestamptz,
    text,
    text,
    timestamptz,
    integer
  );

drop function
  vlx_account_persistence_private.vlx_account_learning_control_snapshot();

drop table vlx_account_persistence_private.account_learning_apply_receipts;
drop table vlx_account_persistence_private.account_learning_apply_control;
drop function
  vlx_account_persistence_private.reject_account_learning_apply_owner_rebind();
drop function
  vlx_account_persistence_private.vlx_account_learning_session_is_live(
    uuid,
    uuid
  );
drop schema vlx_account_persistence_private;

revoke all on table public.account_saved_words
  from vlx_account_learning_writer;
revoke all on table public.account_review_events
  from vlx_account_learning_writer;
revoke all on table auth.sessions
  from vlx_account_learning_writer;
revoke all on function auth.uid(), auth.jwt()
  from vlx_account_learning_writer;
revoke all on function extensions.digest(text, text)
  from vlx_account_learning_writer;
revoke all on schema auth, extensions
  from vlx_account_learning_writer;

drop role vlx_account_learning_writer;

commit;
