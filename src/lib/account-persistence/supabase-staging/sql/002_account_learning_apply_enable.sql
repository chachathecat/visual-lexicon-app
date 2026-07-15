begin;

do $$
declare
  capability_digest text :=
    current_setting(
      'vlx.account_persistence_pr_c_write_capability_digest',
      true
    );
  deployment_sha text :=
    current_setting(
      'vlx.account_persistence_pr_c_deployment_sha',
      true
    );
  approved_owner_account_id text :=
    current_setting(
      'vlx.account_persistence_pr_c_approved_owner_account_id',
      true
    );
  approved_owner_uuid uuid;
  bound_owner_account_id uuid;
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
      'VLX staging guard rejected account learning apply activation';
  end if;

  if not exists (
       select 1
       from pg_roles
       where rolname = 'vlx_account_learning_writer'
         and not rolcanlogin
         and not rolinherit
         and not rolbypassrls
         and not rolsuper
         and not rolcreatedb
         and not rolcreaterole
         and not rolreplication
     ) or exists (
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
      'VLX activation rejected writer role or membership drift';
  end if;

  if capability_digest is null or
     capability_digest !~ '^sha256:[0-9a-f]{64}$' then
    raise exception
      'VLX account learning apply activation requires an exact SHA-256 capability digest';
  end if;

  if deployment_sha is null or
     deployment_sha !~ '^[0-9a-f]{40}$' then
    raise exception
      'VLX account learning apply activation requires an exact deployment SHA';
  end if;

  if approved_owner_account_id is null or
     approved_owner_account_id !~
       '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception
      'VLX account learning apply activation requires one exact existing approved owner UUID';
  end if;

  approved_owner_uuid := approved_owner_account_id::uuid;

  if not exists (
    select 1
    from auth.users as approved_owner
    where approved_owner.id = approved_owner_uuid
  ) then
    raise exception
      'VLX account learning apply activation requires one exact existing approved owner UUID';
  end if;

  if control_object is null or
     obj_description(control_object, 'pg_class') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_control' then
    raise exception
      'VLX activation ownership guard rejected the apply control';
  end if;

  if receipts_object is null or
     obj_description(receipts_object, 'pg_class') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_receipts' then
    raise exception
      'VLX activation ownership guard rejected the apply receipts';
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
         and position(
           'vlx_account_persistence_private.account_learning_apply_control' in
           lower(helper.prosrc)
         ) > 0
     ) then
    raise exception
      'VLX activation ownership guard rejected the control-snapshot helper';
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
      'VLX activation ownership guard rejected the live-session helper';
  end if;

  if internal_function is null or
     obj_description(internal_function, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)' then
    raise exception
      'VLX activation ownership guard rejected the private apply function';
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
      'VLX activation ownership guard rejected the public apply function';
  end if;

  select control.approved_owner_account_id
  into bound_owner_account_id
  from vlx_account_persistence_private.account_learning_apply_control as control
  where control.singleton
  for update;

  if not found then
    raise exception
      'VLX activation could not lock the singleton apply control';
  end if;

  if bound_owner_account_id is not null and
     bound_owner_account_id is distinct from approved_owner_uuid then
    raise exception
      'VLX account learning apply approved owner is immutable after first activation';
  end if;

  if exists (
    select 1
    from vlx_account_persistence_private.account_learning_apply_receipts as receipt
    where receipt.owner_account_id is distinct from approved_owner_uuid
  ) then
    raise exception
      'VLX account learning apply receipt owner conflicts with the approved owner';
  end if;
end
$$;

grant usage on schema auth, extensions, vlx_account_persistence_private
  to vlx_account_learning_writer;

grant execute on function auth.uid(), auth.jwt()
  to vlx_account_learning_writer;
grant execute on function extensions.digest(text, text)
  to vlx_account_learning_writer;

grant execute on function
  vlx_account_persistence_private.vlx_account_learning_session_is_live(
    uuid,
    uuid
  )
  to vlx_account_learning_writer;
grant execute on function
  vlx_account_persistence_private.vlx_account_learning_control_snapshot()
  to vlx_account_learning_writer;

grant select on table
  vlx_account_persistence_private.account_learning_apply_receipts
  to vlx_account_learning_writer;
grant insert on table
  vlx_account_persistence_private.account_learning_apply_receipts
  to vlx_account_learning_writer;
grant select on table public.account_saved_words
  to vlx_account_learning_writer;
grant insert (
  owner_account_id,
  slug,
  word,
  image,
  definition,
  hub,
  source,
  saved_at
) on table public.account_saved_words
  to vlx_account_learning_writer;

grant select on table public.account_review_events
  to vlx_account_learning_writer;
grant insert (
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
  to vlx_account_learning_writer;

grant execute on function public.vlx_account_learning_apply(
  text,
  text,
  text,
  timestamptz,
  text,
  text,
  timestamptz,
  integer
)
to authenticated;

do $$
begin
  if not has_function_privilege(
       'authenticated',
       'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
       'EXECUTE'
     ) or
     has_function_privilege(
       'anon',
       'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
       'EXECUTE'
     ) or
     has_schema_privilege(
       'vlx_account_learning_writer',
       'public',
       'CREATE'
     ) or
     not has_schema_privilege(
       'vlx_account_learning_writer',
       'auth',
       'USAGE'
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'auth.uid()',
       'EXECUTE'
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'auth.jwt()',
       'EXECUTE'
     ) or
     has_column_privilege(
       'vlx_account_learning_writer',
       'auth.sessions',
       'id',
       'SELECT'
     ) or
     has_column_privilege(
       'vlx_account_learning_writer',
       'auth.sessions',
       'user_id',
       'SELECT'
     ) or
     has_table_privilege(
       'vlx_account_learning_writer',
       'auth.sessions',
       'SELECT'
     ) or
     has_column_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.account_learning_apply_control',
       'singleton',
       'UPDATE'
     ) or
     has_table_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.account_learning_apply_control',
       'SELECT'
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
       'EXECUTE'
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
       'EXECUTE'
     ) then
    raise exception
      'VLX activation cannot establish helper-only control/session access; keep PR C disabled';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'auth.sessions'::regclass
      and relrowsecurity
      and not relforcerowsecurity
  ) then
    raise exception
      'VLX activation requires the approved auth.sessions RLS shape';
  end if;

  if not exists (
    select 1
    from pg_roles
    where rolname = 'postgres'
      and rolbypassrls
  ) then
    raise exception
      'VLX activation requires the postgres-owned session helper to retain BYPASSRLS';
  end if;

  if has_table_privilege('anon', 'auth.sessions', 'SELECT') or
     has_table_privilege('authenticated', 'auth.sessions', 'SELECT') or
     has_column_privilege('anon', 'auth.sessions', 'id', 'SELECT') or
     has_column_privilege('anon', 'auth.sessions', 'user_id', 'SELECT') or
     has_column_privilege('authenticated', 'auth.sessions', 'id', 'SELECT') or
     has_column_privilege(
       'authenticated',
       'auth.sessions',
       'user_id',
       'SELECT'
     ) or
     has_function_privilege(
       'anon',
       'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
       'EXECUTE'
     ) or
     has_function_privilege(
       'authenticated',
       'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
       'EXECUTE'
     ) or
     has_function_privilege(
       'anon',
       'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
       'EXECUTE'
     ) or
     has_function_privilege(
       'authenticated',
       'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
       'EXECUTE'
     ) or
     has_schema_privilege(
       'authenticated',
       'vlx_account_persistence_private',
       'USAGE'
     ) or
     has_schema_privilege(
       'anon',
       'vlx_account_persistence_private',
       'USAGE'
     ) or
     has_function_privilege(
       'authenticated',
       'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)',
       'EXECUTE'
     ) or
     has_function_privilege(
       'anon',
       'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)',
       'EXECUTE'
     ) or
     exists (
       select 1
       from pg_policy
       where polrelid = 'auth.sessions'::regclass
         and (
           0::oid = any (polroles) or
           polroles &&
             array['anon'::regrole, 'authenticated'::regrole]::oid[]
         )
     ) then
    raise exception
      'VLX activation found an app-role session-table/helper grant; keep PR C disabled';
  end if;
end
$$;

update vlx_account_persistence_private.account_learning_apply_control
set
  enabled = true,
  write_capability_digest = current_setting(
    'vlx.account_persistence_pr_c_write_capability_digest',
    true
  ),
  deployment_sha = current_setting(
    'vlx.account_persistence_pr_c_deployment_sha',
    true
  ),
  approved_owner_account_id = coalesce(
    approved_owner_account_id,
    current_setting(
      'vlx.account_persistence_pr_c_approved_owner_account_id',
      true
    )::uuid
  ),
  activated_at = clock_timestamp(),
  disabled_at = null,
  updated_at = clock_timestamp()
where singleton;

do $$
begin
  if not exists (
    select 1
    from vlx_account_persistence_private.account_learning_apply_control
    where singleton
      and enabled
      and write_capability_digest = current_setting(
        'vlx.account_persistence_pr_c_write_capability_digest',
        true
      )
      and deployment_sha = current_setting(
        'vlx.account_persistence_pr_c_deployment_sha',
        true
      )
      and approved_owner_account_id = current_setting(
        'vlx.account_persistence_pr_c_approved_owner_account_id',
        true
      )::uuid
  ) then
    raise exception
      'VLX account learning apply activation did not bind its exact controls';
  end if;
end
$$;

commit;
