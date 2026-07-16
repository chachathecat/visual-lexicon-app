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
  control_object regclass;
  receipts_object regclass;
  control_snapshot_helper regprocedure;
  session_helper regprocedure;
  request_identity_helper regprocedure;
  internal_function regprocedure;
  wrapper_function regprocedure;
  wrapper_authenticated_grantor oid;
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning apply activation';
  end if;

  if current_user is distinct from 'postgres' then
    raise exception
      'VLX account learning apply activation requires the postgres operator';
  end if;

  -- Resolve private objects only after the operator guard. A deliberately
  -- unprivileged wrong-operator probe must fail with the stable operator error,
  -- not while PL/pgSQL evaluates a schema-protected declaration initializer.
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
     ) or not exists (
       select 1
       from pg_roles
       where rolname = 'postgres'
     ) or (
       exists (
         select 1
         from pg_roles
         where rolname = 'postgres'
           and not rolsuper
       ) and not exists (
         select 1
         from pg_auth_members as membership
         where membership.roleid = 'vlx_account_learning_writer'::regrole
           and membership.member = 'postgres'::regrole
           and membership.admin_option
           and not membership.inherit_option
           and not membership.set_option
       )
     ) or (
       exists (
         select 1
         from pg_roles
         where rolname = 'postgres'
           and rolsuper
       ) and exists (
         select 1
         from pg_auth_members as membership
         where membership.roleid = 'vlx_account_learning_writer'::regrole
       )
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

  select case
    -- PostgreSQL records object grants made by a superuser as the object
    -- owner. Hosted Supabase uses the non-superuser branch and therefore
    -- must retain postgres as the external authenticated grantor.
    when operator.rolsuper then 'vlx_account_learning_writer'::regrole::oid
    else operator.oid
  end
  into wrapper_authenticated_grantor
  from pg_roles as operator
  where operator.rolname = 'postgres';

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
         and octet_length(helper.prosrc) = 139
         and encode(
           extensions.digest(helper.prosrc, 'sha256'),
           'hex'
         ) =
           '10d697531ff48638756d1de61ece393bd193161aa99575c6fefe235f1d885010'
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
      'VLX activation ownership guard rejected the live-session helper';
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
      'VLX activation ownership guard rejected the request-identity helper';
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
      'VLX activation ownership guard rejected the private apply function';
  end if;

  if (
       select count(*)
       from pg_policy as policy
       where policy.polrelid in (
         'vlx_account_persistence_private.account_learning_apply_receipts'::regclass,
         'public.account_saved_words'::regclass,
         'public.account_review_events'::regclass
       )
         and policy.polname in (
           'account_learning_apply_receipts_writer_select',
           'account_learning_apply_receipts_writer_insert',
           'account_saved_words_pr_c_writer_select',
           'account_saved_words_pr_c_writer_insert',
           'account_review_events_pr_c_writer_select',
           'account_review_events_pr_c_writer_insert'
         )
         and policy.polpermissive
         and policy.polroles =
           array['vlx_account_learning_writer'::regrole::oid]
         and (
           (
             policy.polcmd = 'r' and
             policy.polqual is not null and
             policy.polwithcheck is null
           ) or (
             policy.polcmd = 'a' and
             policy.polqual is null and
             policy.polwithcheck is not null
           )
         )
         and position(
           'vlx_account_persistence_private.vlx_account_learning_request_identity()'
           in lower(
             pg_get_expr(
               coalesce(policy.polqual, policy.polwithcheck),
               policy.polrelid
             )
           )
         ) > 0
         and position(
           'auth.' in lower(
             pg_get_expr(
               coalesce(policy.polqual, policy.polwithcheck),
               policy.polrelid
             )
           )
         ) = 0
         and exists (
           select 1
           from pg_depend as dependency
           where dependency.classid = 'pg_policy'::regclass
             and dependency.objid = policy.oid
             and dependency.refclassid = 'pg_proc'::regclass
             and dependency.refobjid = request_identity_helper::oid
             and dependency.deptype = 'n'
         )
     ) <> 6 or (
       select count(*)
       from pg_policy as policy
       where policy.polrelid in (
         'vlx_account_persistence_private.account_learning_apply_receipts'::regclass,
         'public.account_saved_words'::regclass,
         'public.account_review_events'::regclass
       )
         and policy.polroles =
           array['vlx_account_learning_writer'::regrole::oid]
     ) <> 6 then
    raise exception
      'VLX activation requires the exact auth-free writer RLS policies';
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
      'VLX activation ownership guard rejected the public apply function';
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
     ) or exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid = wrapper_function
         and acl.grantee <> wrapper.proowner
         and not (
           (
             acl.grantee = 'postgres'::regrole and
             acl.grantor = 'vlx_account_learning_writer'::regrole and
             acl.privilege_type = 'EXECUTE' and
             acl.is_grantable
           ) or (
             acl.grantee = 'authenticated'::regrole and
             acl.grantor = wrapper_authenticated_grantor and
             acl.privilege_type = 'EXECUTE' and
             not acl.is_grantable
           )
         )
     ) then
    raise exception
      'VLX activation requires the exact predelegated operator grant option';
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

grant usage on schema extensions, vlx_account_persistence_private
  to vlx_account_learning_writer;

grant execute on function extensions.digest(text, text)
  to vlx_account_learning_writer;

grant execute on function
  vlx_account_persistence_private.vlx_account_learning_request_identity()
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
to authenticated
granted by postgres;

do $$
declare
  request_identity_helper regprocedure :=
    'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure;
  wrapper_authenticated_grantor oid;
begin
  select case
    when operator.rolsuper then 'vlx_account_learning_writer'::regrole::oid
    else operator.oid
  end
  into wrapper_authenticated_grantor
  from pg_roles as operator
  where operator.rolname = 'postgres';

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
     has_schema_privilege(
       'vlx_account_learning_writer',
       'auth',
       'USAGE'
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
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_request_identity()',
       'EXECUTE'
     ) or not exists (
       select 1
       from pg_proc as identity_helper
       cross join lateral aclexplode(
         coalesce(
           identity_helper.proacl,
           acldefault('f', identity_helper.proowner)
         )
       ) as acl
       where identity_helper.oid = request_identity_helper
         and acl.grantee = 'vlx_account_learning_writer'::regrole
         and acl.grantor = 'postgres'::regrole
         and acl.privilege_type = 'EXECUTE'
         and not acl.is_grantable
     ) or exists (
       select 1
       from pg_proc as identity_helper
       cross join lateral aclexplode(
         coalesce(
           identity_helper.proacl,
           acldefault('f', identity_helper.proowner)
         )
       ) as acl
       where identity_helper.oid = request_identity_helper
         and acl.privilege_type = 'EXECUTE'
         and acl.grantee <> identity_helper.proowner
         and (
           acl.grantee <> 'vlx_account_learning_writer'::regrole or
           acl.grantor <> 'postgres'::regrole or
           acl.is_grantable
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
         and acl.grantee <> wrapper.proowner
         and not (
           (
             acl.grantee = 'postgres'::regrole and
             acl.grantor = 'vlx_account_learning_writer'::regrole and
             acl.privilege_type = 'EXECUTE' and
             acl.is_grantable
           ) or (
             acl.grantee = 'authenticated'::regrole and
             acl.grantor = wrapper_authenticated_grantor and
             acl.privilege_type = 'EXECUTE' and
             not acl.is_grantable
           )
         )
     ) then
    raise exception
      'VLX activation cannot establish helper-only identity/control/session access; keep PR C disabled';
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
     has_function_privilege(
       'anon',
       'vlx_account_persistence_private.vlx_account_learning_request_identity()',
       'EXECUTE'
     ) or
     has_function_privilege(
       'authenticated',
       'vlx_account_persistence_private.vlx_account_learning_request_identity()',
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
      'VLX activation found an app-role identity/session/control grant; keep PR C disabled';
  end if;

  if exists (
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
     ) or exists (
       select 1
       from pg_roles as app_role
       where app_role.rolname = 'service_role'
         and has_function_privilege(
           app_role.oid,
           'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure,
           'EXECUTE'
         )
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
         and acl.grantee = 'authenticated'::regrole
         and acl.grantor = wrapper_authenticated_grantor
         and acl.privilege_type = 'EXECUTE'
         and not acl.is_grantable
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
         and acl.grantee = 'authenticated'::regrole
         and acl.privilege_type = 'EXECUTE'
         and (
           acl.grantor <> wrapper_authenticated_grantor or
           acl.is_grantable
         )
     ) then
    raise exception
      'VLX activation could not establish the exact operator-granted RPC surface';
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
