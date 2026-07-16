begin;

do $$
declare
  control_object regclass;
  receipts_object regclass;
  control_snapshot_helper regprocedure;
  session_helper regprocedure;
  request_identity_helper regprocedure;
  internal_function regprocedure;
  wrapper_function regprocedure;
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning apply rollback';
  end if;

  if current_user is distinct from 'postgres' then
    raise exception
      'VLX account learning apply rollback requires the postgres operator';
  end if;

  -- Resolve private objects only after the operator guard so the negative
  -- operator probe cannot fail early on protected-schema name resolution.
  control_object := to_regclass(
    'vlx_account_persistence_private.account_learning_apply_control'
  );
  receipts_object := to_regclass(
    'vlx_account_persistence_private.account_learning_apply_receipts'
  );
  control_snapshot_helper := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'
  );
  session_helper := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'
  );
  request_identity_helper := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_request_identity()'
  );
  internal_function := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
  wrapper_function := to_regprocedure(
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );

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
         and octet_length(helper.prosrc) = 139
         and encode(
           extensions.digest(helper.prosrc, 'sha256'),
           'hex'
         ) =
           '10d697531ff48638756d1de61ece393bd193161aa99575c6fefe235f1d885010'
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
         and octet_length(helper.prosrc) = 179
         and encode(
           extensions.digest(helper.prosrc, 'sha256'),
           'hex'
         ) =
           '269c7d121edc9031a755c3cc1eb9f1294a7e760263894cb71acecb003edb7e43'
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

  if request_identity_helper is null or
     obj_description(request_identity_helper, 'pg_proc') is distinct from
       'vlx:migration-owner=004_account_learning_hosted_grantor_compat;object=vlx_account_persistence_private.vlx_account_learning_request_identity()' or
     not exists (
       select 1
       from pg_proc as helper
       where helper.oid = request_identity_helper
         and helper.proowner = 'postgres'::regrole
         and helper.prokind = 'f'
         and not helper.prosecdef
         and not helper.proisstrict
         and helper.proretset
         and helper.prorettype = 'record'::regtype
         and helper.provolatile = 's'
         and helper.pronargs = 0
         and helper.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'plpgsql'
         )
         and helper.proconfig = array['search_path=""']::text[]
         and pg_get_function_result(helper.oid) =
           'TABLE(owner_account_id uuid, auth_session_id uuid)'
         and octet_length(helper.prosrc) = 2450
         and encode(
           extensions.digest(helper.prosrc, 'sha256'),
           'hex'
         ) =
           'f25c2dad95890745c3f0fbc3807e7a415f48829425a8660f08c2163a88967267'
         and position('request.jwt.claim' in helper.prosrc) > 0
         and position('request.jwt.claims' in helper.prosrc) > 0
         and position('request.jwt.claim.sub' in helper.prosrc) > 0
         and position('auth.' in lower(helper.prosrc)) = 0
     ) then
    raise exception
      'VLX rollback ownership guard rejected the request-identity helper';
  end if;

  if internal_function is null or
     obj_description(internal_function, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)' or
     not exists (
       select 1
       from pg_proc as internal
       where internal.oid = internal_function
         and internal.proowner = 'vlx_account_learning_writer'::regrole
         and internal.prokind = 'f'
         and internal.prosecdef
         and internal.provolatile = 'v'
         and not internal.proisstrict
         and internal.prorettype = 'jsonb'::regtype
         and internal.pronargs = 8
         and internal.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'plpgsql'
         )
         and internal.proconfig @>
           array[
             'search_path=""',
             'row_security=on',
             'TimeZone=UTC'
           ]::text[]
         and cardinality(internal.proconfig) = 3
         and octet_length(internal.prosrc) = 14817
         and encode(
           extensions.digest(internal.prosrc, 'sha256'),
           'hex'
         ) =
           'f3f25dc5a8278862e356f2c93d130589674942d8b6fc50963b2d8475b0c838fd'
         and position('auth.uid()' in lower(internal.prosrc)) = 0
         and position('auth.jwt()' in lower(internal.prosrc)) = 0
         and position(
           'vlx_account_persistence_private.vlx_account_learning_request_identity()'
           in lower(internal.prosrc)
         ) > 0
     ) or exists (
       select 1
       from pg_proc as internal
       cross join lateral aclexplode(
         coalesce(internal.proacl, acldefault('f', internal.proowner))
       ) as acl
       where internal.oid = internal_function
         and acl.privilege_type = 'EXECUTE'
         and acl.grantee <> internal.proowner
     ) then
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
         and octet_length(wrapper.prosrc) = 238
         and encode(
           extensions.digest(wrapper.prosrc, 'sha256'),
           'hex'
         ) =
           'a6e1679da2e1834deee08e9fb28b9bc20cf1b124ab2bc8867c7182d6f212b536'
     ) then
    raise exception
      'VLX rollback ownership guard rejected the public apply function';
  end if;

  if not exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid = wrapper_function
         and acl.grantee = 'postgres'::regrole
         and acl.grantor = 'vlx_account_learning_writer'::regrole
         and acl.privilege_type = 'EXECUTE'
         and acl.is_grantable
     ) then
    raise exception
      'VLX rollback requires the exact predelegated operator grant option';
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
from public, anon, authenticated
granted by postgres;

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
  vlx_account_persistence_private.vlx_account_learning_request_identity()
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
revoke execute on function extensions.digest(text, text)
  from vlx_account_learning_writer;
revoke usage on schema extensions
  from vlx_account_learning_writer;

do $$
begin
  if has_function_privilege(
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
       'auth',
       'USAGE'
     ) or
     has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_request_identity()',
       'EXECUTE'
     ) or
     has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
       'EXECUTE'
     ) or
     has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
       'EXECUTE'
     ) or exists (
       select 1
       from pg_roles as app_role
       where app_role.rolname = 'service_role'
         and has_function_privilege(
           app_role.oid,
           'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure,
           'EXECUTE'
         )
     ) or exists (
       select 1
       from pg_roles as app_role
       where app_role.rolname = 'service_role'
         and has_function_privilege(
           app_role.oid,
           'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure,
           'EXECUTE'
         )
     ) or exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid =
         'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
         and acl.grantee = 0
         and acl.privilege_type = 'EXECUTE'
     ) or not exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid =
         'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
         and acl.grantee = 'postgres'::regrole
         and acl.grantor = 'vlx_account_learning_writer'::regrole
         and acl.privilege_type = 'EXECUTE'
         and acl.is_grantable
     ) or exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid =
         'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure
         and acl.grantee <> wrapper.proowner
         and not (
           acl.grantee = 'postgres'::regrole and
           acl.grantor = 'vlx_account_learning_writer'::regrole and
           acl.privilege_type = 'EXECUTE' and
           acl.is_grantable
         )
     ) then
    raise exception
      'VLX rollback could not restore the exact disabled grant surface';
  end if;
end
$$;

commit;
