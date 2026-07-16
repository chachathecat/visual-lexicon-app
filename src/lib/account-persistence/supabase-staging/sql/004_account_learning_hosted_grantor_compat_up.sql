begin;

do $preflight$
declare
  v_receipt_select_expression constant text :=
    '(( SELECT auth.uid() AS uid) = owner_account_id)';
  v_hardened_expression constant text :=
    '((( SELECT auth.uid() AS uid) = owner_account_id) AND ((( SELECT auth.jwt() AS jwt) -> ''is_anonymous''::text) = ''false''::jsonb))';
  v_internal regprocedure := to_regprocedure(
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
  v_wrapper regprocedure := to_regprocedure(
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'
  );
begin
  if current_setting('vlx.account_persistence_target', true)
       is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected hosted grantor compatibility repair';
  end if;

  if current_user is distinct from 'postgres' then
    raise exception
      'VLX hosted grantor compatibility repair requires the postgres operator';
  end if;

  if to_regrole('service_role') is null or
     to_regrole('vlx_account_learning_writer') is null then
    raise exception
      'VLX hosted grantor compatibility repair requires exact staging roles';
  end if;

  if to_regprocedure(
       'vlx_account_persistence_private.vlx_account_learning_request_identity()'
     ) is not null then
    raise exception
      'VLX hosted grantor compatibility repair is additive and immutable';
  end if;

  if not exists (
       select 1
       from pg_roles as writer
       where writer.rolname = 'vlx_account_learning_writer'
         and not writer.rolcanlogin
         and not writer.rolinherit
         and not writer.rolbypassrls
         and not writer.rolsuper
         and not writer.rolcreatedb
         and not writer.rolcreaterole
         and not writer.rolreplication
         and shobj_description(writer.oid, 'pg_authid') is not distinct from
           'vlx:migration-owner=002_account_learning_apply;object=role.vlx_account_learning_writer'
     ) or exists (
       select 1
       from pg_auth_members as membership
       where membership.member = 'vlx_account_learning_writer'::regrole
     ) or (
       exists (
         select 1
         from pg_roles as operator
         where operator.rolname = 'postgres'
           and operator.rolsuper
       ) and (
         select count(*)
         from pg_auth_members as membership
         where membership.roleid = 'vlx_account_learning_writer'::regrole
       ) <> 0
     ) or (
       not exists (
         select 1
         from pg_roles as operator
         where operator.rolname = 'postgres'
           and operator.rolsuper
       ) and (
         (
           select count(*)
           from pg_auth_members as membership
           where membership.roleid = 'vlx_account_learning_writer'::regrole
         ) <> 1 or not exists (
           select 1
           from pg_auth_members as membership
           where membership.roleid = 'vlx_account_learning_writer'::regrole
             and membership.member = 'postgres'::regrole
             and membership.admin_option
             and not membership.inherit_option
             and not membership.set_option
         )
       )
     ) then
    raise exception
      'VLX hosted grantor compatibility repair rejected writer membership drift';
  end if;

  if not exists (
       select 1
       from pg_namespace as private_schema
       where private_schema.oid =
         'vlx_account_persistence_private'::regnamespace
         and private_schema.nspowner = 'postgres'::regrole
         and obj_description(private_schema.oid, 'pg_namespace')
           is not distinct from
             'vlx:migration-owner=002_account_learning_apply;object=schema.vlx_account_persistence_private'
     ) or
     has_schema_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private',
       'CREATE'
     ) or
     not has_schema_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private',
       'USAGE'
     ) or
     has_schema_privilege(
       'vlx_account_learning_writer',
       'auth',
       'USAGE'
     ) then
    raise exception
      'VLX hosted grantor compatibility repair rejected schema ownership or grants';
  end if;

  if not exists (
       select 1
       from pg_class as saved_words
       where saved_words.oid = 'public.account_saved_words'::regclass
         and saved_words.relkind = 'r'
         and saved_words.relowner = 'postgres'::regrole
         and saved_words.relrowsecurity
         and saved_words.relforcerowsecurity
         and obj_description(saved_words.oid, 'pg_class') is not distinct from
           'vlx:migration-owner=001_account_learning_evidence;object=public.account_saved_words'
     ) or not exists (
       select 1
       from pg_class as review_events
       where review_events.oid = 'public.account_review_events'::regclass
         and review_events.relkind = 'r'
         and review_events.relowner = 'postgres'::regrole
         and review_events.relrowsecurity
         and review_events.relforcerowsecurity
         and obj_description(review_events.oid, 'pg_class') is not distinct from
           'vlx:migration-owner=001_account_learning_evidence;object=public.account_review_events'
     ) or not exists (
       select 1
       from pg_class as receipts
       where receipts.oid =
         'vlx_account_persistence_private.account_learning_apply_receipts'::regclass
         and receipts.relkind = 'r'
         and receipts.relowner = 'postgres'::regrole
         and receipts.relrowsecurity
         and receipts.relforcerowsecurity
         and obj_description(receipts.oid, 'pg_class') is not distinct from
           'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_receipts'
     ) or not exists (
       select 1
       from pg_class as control
       where control.oid =
         'vlx_account_persistence_private.account_learning_apply_control'::regclass
         and control.relkind = 'r'
         and control.relowner = 'postgres'::regrole
         and control.relrowsecurity
         and control.relforcerowsecurity
         and obj_description(control.oid, 'pg_class') is not distinct from
           'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_control'
     ) then
    raise exception
      'VLX hosted grantor compatibility repair rejected target ownership';
  end if;

  if (
       select count(*)
       from vlx_account_persistence_private.account_learning_apply_control
     ) <> 1 or not exists (
       select 1
       from vlx_account_persistence_private.account_learning_apply_control
       where singleton
         and not enabled
     ) then
    raise exception
      'VLX hosted grantor compatibility repair requires a disabled singleton';
  end if;

  if v_internal is null or
     obj_description(v_internal, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)' or
     not exists (
       select 1
       from pg_proc as internal
       where internal.oid = v_internal
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
         and octet_length(internal.prosrc) = 15376
         and encode(
           extensions.digest(internal.prosrc, 'sha256'),
           'hex'
         ) =
           '61e8959b7359d26a8a12679c51fd891fc4b1a0ceefe24c19857f33f94f524840'
     ) or exists (
       select 1
       from pg_proc as internal
       cross join lateral aclexplode(
         coalesce(internal.proacl, acldefault('f', internal.proowner))
       ) as acl
       where internal.oid = v_internal
         and acl.privilege_type = 'EXECUTE'
         and acl.grantee <> internal.proowner
     ) then
    raise exception
      'VLX hosted grantor compatibility repair rejected private function drift';
  end if;

  if v_wrapper is null or
     obj_description(v_wrapper, 'pg_proc') is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)' or
     not exists (
       select 1
       from pg_proc as wrapper
       where wrapper.oid = v_wrapper
         and wrapper.proowner = 'vlx_account_learning_writer'::regrole
         and wrapper.prokind = 'f'
         and wrapper.prosecdef
         and wrapper.provolatile = 'v'
         and not wrapper.proisstrict
         and wrapper.prorettype = 'jsonb'::regtype
         and wrapper.pronargs = 8
         and wrapper.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'sql'
         )
         and wrapper.proconfig @>
           array['search_path=""', 'row_security=on']::text[]
         and cardinality(wrapper.proconfig) = 2
         and octet_length(wrapper.prosrc) = 238
         and encode(
           extensions.digest(wrapper.prosrc, 'sha256'),
           'hex'
         ) =
           'a6e1679da2e1834deee08e9fb28b9bc20cf1b124ab2bc8867c7182d6f212b536'
     ) or exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid = v_wrapper
         and acl.grantee <> wrapper.proowner
         and (
           acl.grantor <> 'vlx_account_learning_writer'::regrole or
           acl.grantee <> 'service_role'::regrole or
           acl.privilege_type <> 'EXECUTE' or
           acl.is_grantable
         )
     ) or (
       select count(*)
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid = v_wrapper
         and acl.grantor = 'vlx_account_learning_writer'::regrole
         and acl.grantee = 'service_role'::regrole
         and acl.privilege_type = 'EXECUTE'
         and not acl.is_grantable
     ) > 1 then
    raise exception
      'VLX hosted grantor compatibility repair rejected wrapper drift';
  end if;

  if not exists (
       select 1
       from pg_proc as helper
       where helper.oid =
         'vlx_account_persistence_private.vlx_account_learning_control_snapshot()'::regprocedure
         and helper.proowner = 'postgres'::regrole
         and helper.prokind = 'f'
         and helper.prosecdef
         and helper.provolatile = 'v'
         and helper.prorettype =
           'vlx_account_persistence_private.account_learning_apply_control'::regtype
         and octet_length(helper.prosrc) = 139
         and encode(
           extensions.digest(helper.prosrc, 'sha256'),
           'hex'
         ) =
           '10d697531ff48638756d1de61ece393bd193161aa99575c6fefe235f1d885010'
         and obj_description(helper.oid, 'pg_proc') is not distinct from
           'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_control_snapshot()'
     ) or not exists (
       select 1
       from pg_proc as helper
       where helper.oid =
         'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'::regprocedure
         and helper.proowner = 'postgres'::regrole
         and helper.prokind = 'f'
         and helper.prosecdef
         and helper.proisstrict
         and helper.provolatile = 's'
         and helper.prorettype = 'boolean'::regtype
         and octet_length(helper.prosrc) = 179
         and encode(
           extensions.digest(helper.prosrc, 'sha256'),
           'hex'
         ) =
           '269c7d121edc9031a755c3cc1eb9f1294a7e760263894cb71acecb003edb7e43'
         and obj_description(helper.oid, 'pg_proc') is not distinct from
           'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)'
     ) then
    raise exception
      'VLX hosted grantor compatibility repair rejected helper drift';
  end if;

  if (
    with expected (
      policy_name,
      relation_oid,
      policy_command,
      policy_role,
      expression_kind,
      expected_expression
    ) as (
      values
        (
          'account_learning_apply_receipts_writer_select',
          'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
          'r'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'using',
          v_receipt_select_expression
        ),
        (
          'account_learning_apply_receipts_writer_insert',
          'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
          'a'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'check',
          v_hardened_expression
        ),
        (
          'account_saved_words_pr_c_writer_select',
          'public.account_saved_words'::regclass::oid,
          'r'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'using',
          v_hardened_expression
        ),
        (
          'account_saved_words_pr_c_writer_insert',
          'public.account_saved_words'::regclass::oid,
          'a'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'check',
          v_hardened_expression
        ),
        (
          'account_review_events_pr_c_writer_select',
          'public.account_review_events'::regclass::oid,
          'r'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'using',
          v_hardened_expression
        ),
        (
          'account_review_events_pr_c_writer_insert',
          'public.account_review_events'::regclass::oid,
          'a'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'check',
          v_hardened_expression
        )
    )
    select count(*)
    from expected
    join pg_policy as policy
      on policy.polrelid = expected.relation_oid
     and policy.polname = expected.policy_name
     and policy.polpermissive
     and policy.polcmd = expected.policy_command
     and policy.polroles = array[expected.policy_role]
     and (
       (
         expected.expression_kind = 'using'
         and policy.polqual is not null
         and policy.polwithcheck is null
         and pg_get_expr(policy.polqual, policy.polrelid) =
           expected.expected_expression
       ) or (
         expected.expression_kind = 'check'
         and policy.polqual is null
         and policy.polwithcheck is not null
         and pg_get_expr(policy.polwithcheck, policy.polrelid) =
           expected.expected_expression
       )
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
      'VLX hosted grantor compatibility repair refused policy drift';
  end if;
end
$preflight$;

create function
  vlx_account_persistence_private.vlx_account_learning_request_identity()
returns table (
  owner_account_id uuid,
  auth_session_id uuid
)
language plpgsql
stable
security invoker
set search_path = ''
as $identity$
declare
  v_claims_text text;
  v_claims jsonb;
  v_plural_claims_text text;
  v_plural_claims jsonb;
  v_legacy_owner_account_id_text text;
  v_selected_owner_account_id_text text;
  v_uid_candidate_text text;
  v_auth_session_id_text text;
begin
  begin
    v_plural_claims_text := nullif(
      current_setting('request.jwt.claims', true),
      ''
    );
    v_claims_text := coalesce(
      nullif(current_setting('request.jwt.claim', true), ''),
      v_plural_claims_text
    );

    if v_claims_text is null then
      return;
    end if;

    v_claims := v_claims_text::jsonb;
    v_plural_claims := case
      when v_plural_claims_text is null then null
      else v_plural_claims_text::jsonb
    end;

    if jsonb_typeof(v_claims) is distinct from 'object' or
       (
         v_plural_claims is not null and
         jsonb_typeof(v_plural_claims) is distinct from 'object'
       ) or
       v_claims -> 'is_anonymous' is distinct from 'false'::jsonb then
      return;
    end if;

    v_legacy_owner_account_id_text := nullif(
      current_setting('request.jwt.claim.sub', true),
      ''
    );
    v_selected_owner_account_id_text := nullif(v_claims ->> 'sub', '');
    v_uid_candidate_text := coalesce(
      v_legacy_owner_account_id_text,
      nullif(v_plural_claims ->> 'sub', '')
    );
    v_auth_session_id_text := nullif(v_claims ->> 'session_id', '');

    if v_selected_owner_account_id_text is null or
       v_selected_owner_account_id_text !~
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
       v_uid_candidate_text is null or
       v_uid_candidate_text !~
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
       v_selected_owner_account_id_text is distinct from
         v_uid_candidate_text or
       v_auth_session_id_text is null or
       v_auth_session_id_text !~
         '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return;
    end if;

    owner_account_id := v_uid_candidate_text::uuid;
    auth_session_id := v_auth_session_id_text::uuid;

    if owner_account_id::text is distinct from v_uid_candidate_text or
       auth_session_id::text is distinct from v_auth_session_id_text then
      owner_account_id := null;
      auth_session_id := null;
      return;
    end if;

    return next;
  exception
    when others then
      owner_account_id := null;
      auth_session_id := null;
      return;
  end;
end
$identity$;

revoke all on function
  vlx_account_persistence_private.vlx_account_learning_request_identity()
from public, anon, authenticated, service_role, vlx_account_learning_writer;

comment on function
  vlx_account_persistence_private.vlx_account_learning_request_identity()
is
  'vlx:migration-owner=004_account_learning_hosted_grantor_compat;object=vlx_account_persistence_private.vlx_account_learning_request_identity()';

alter policy account_learning_apply_receipts_writer_select
  on vlx_account_persistence_private.account_learning_apply_receipts
  using (
    (
      select request_identity.owner_account_id
      from
        vlx_account_persistence_private.vlx_account_learning_request_identity()
          as request_identity
    ) = owner_account_id
  );

alter policy account_learning_apply_receipts_writer_insert
  on vlx_account_persistence_private.account_learning_apply_receipts
  with check (
    (
      select request_identity.owner_account_id
      from
        vlx_account_persistence_private.vlx_account_learning_request_identity()
          as request_identity
    ) = owner_account_id
  );

alter policy account_saved_words_pr_c_writer_select
  on public.account_saved_words
  using (
    (
      select request_identity.owner_account_id
      from
        vlx_account_persistence_private.vlx_account_learning_request_identity()
          as request_identity
    ) = owner_account_id
  );

alter policy account_saved_words_pr_c_writer_insert
  on public.account_saved_words
  with check (
    (
      select request_identity.owner_account_id
      from
        vlx_account_persistence_private.vlx_account_learning_request_identity()
          as request_identity
    ) = owner_account_id
  );

alter policy account_review_events_pr_c_writer_select
  on public.account_review_events
  using (
    (
      select request_identity.owner_account_id
      from
        vlx_account_persistence_private.vlx_account_learning_request_identity()
          as request_identity
    ) = owner_account_id
  );

alter policy account_review_events_pr_c_writer_insert
  on public.account_review_events
  with check (
    (
      select request_identity.owner_account_id
      from
        vlx_account_persistence_private.vlx_account_learning_request_identity()
          as request_identity
    ) = owner_account_id
  );

grant create on schema vlx_account_persistence_private
  to vlx_account_learning_writer;

grant vlx_account_learning_writer to postgres
  with inherit false, set true
  granted by postgres;

set local role vlx_account_learning_writer;

create or replace function vlx_account_persistence_private.vlx_account_learning_apply_internal(
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
  v_owner_account_id uuid;
  v_auth_session_id uuid;
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

  select
    request_identity.owner_account_id,
    request_identity.auth_session_id
  into
    v_owner_account_id,
    v_auth_session_id
  from
    vlx_account_persistence_private.vlx_account_learning_request_identity()
      as request_identity;

  if not found or
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
from public, anon, authenticated, service_role, postgres;

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
to postgres
with grant option;

reset role;

revoke create on schema vlx_account_persistence_private
  from vlx_account_learning_writer;

do $membership_cleanup$
begin
  if exists (
    select 1
    from pg_auth_members as membership
    where membership.roleid = 'vlx_account_learning_writer'::regrole
      and membership.member = 'postgres'::regrole
      and membership.grantor <> 'postgres'::regrole
      and membership.admin_option
      and not membership.inherit_option
      and not membership.set_option
  ) or not exists (
    select 1
    from pg_auth_members as membership
    where membership.roleid = 'vlx_account_learning_writer'::regrole
      and membership.member = 'postgres'::regrole
      and membership.grantor = 'postgres'::regrole
      and membership.admin_option
  ) then
    execute
      'revoke vlx_account_learning_writer from postgres granted by postgres';
  else
    execute
      'revoke set option for vlx_account_learning_writer from postgres granted by postgres';
  end if;
end
$membership_cleanup$;

do $postcondition$
declare
  v_identity regprocedure :=
    'vlx_account_persistence_private.vlx_account_learning_request_identity()'::regprocedure;
  v_internal regprocedure :=
    'vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure;
  v_wrapper regprocedure :=
    'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)'::regprocedure;
begin
  if not exists (
       select 1
       from pg_proc as identity_helper
       where identity_helper.oid = v_identity
         and identity_helper.proowner = 'postgres'::regrole
         and identity_helper.prokind = 'f'
         and not identity_helper.prosecdef
         and identity_helper.provolatile = 's'
         and not identity_helper.proisstrict
         and identity_helper.proretset
         and identity_helper.prorettype = 'record'::regtype
         and identity_helper.pronargs = 0
         and identity_helper.proallargtypes =
           array['uuid'::regtype::oid, 'uuid'::regtype::oid]
         and identity_helper.proargmodes = array['t'::"char", 't'::"char"]
         and identity_helper.proargnames =
           array['owner_account_id', 'auth_session_id']::text[]
         and identity_helper.prolang = (
           select language.oid
           from pg_language as language
           where language.lanname = 'plpgsql'
         )
         and identity_helper.proconfig =
           array['search_path=""']::text[]
         and octet_length(identity_helper.prosrc) = 2450
         and encode(
           extensions.digest(identity_helper.prosrc, 'sha256'),
           'hex'
         ) =
           'f25c2dad95890745c3f0fbc3807e7a415f48829425a8660f08c2163a88967267'
         and position(
           'request.jwt.claim' in identity_helper.prosrc
         ) > 0
         and position(
           'request.jwt.claims' in identity_helper.prosrc
         ) > 0
         and position(
           'request.jwt.claim.sub' in identity_helper.prosrc
         ) > 0
         and position('auth.' in lower(identity_helper.prosrc)) = 0
         and obj_description(identity_helper.oid, 'pg_proc') is not distinct from
           'vlx:migration-owner=004_account_learning_hosted_grantor_compat;object=vlx_account_persistence_private.vlx_account_learning_request_identity()'
     ) or (
       select count(*)
       from pg_proc as identity_helper
       cross join lateral aclexplode(
         coalesce(
           identity_helper.proacl,
           acldefault('f', identity_helper.proowner)
         )
       ) as acl
       where identity_helper.oid = v_identity
         and acl.privilege_type = 'EXECUTE'
         and acl.grantee <> identity_helper.proowner
     ) <> 0 then
    raise exception
      'VLX hosted grantor compatibility identity-helper postcondition failed';
  end if;

  if not exists (
       select 1
       from pg_proc as internal
       where internal.oid = v_internal
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
         and position('auth.uid()' in lower(internal.prosrc)) = 0
         and position('auth.jwt()' in lower(internal.prosrc)) = 0
         and position(
           'vlx_account_persistence_private.vlx_account_learning_request_identity()'
           in lower(internal.prosrc)
         ) > 0
         and encode(
           extensions.digest(internal.prosrc, 'sha256'),
           'hex'
         ) = 'f3f25dc5a8278862e356f2c93d130589674942d8b6fc50963b2d8475b0c838fd'
         and obj_description(internal.oid, 'pg_proc') is not distinct from
           'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.vlx_account_learning_apply_internal(text,text,text,timestamptz,text,text,timestamptz,integer)'
     ) or exists (
       select 1
       from pg_proc as internal
       cross join lateral aclexplode(
         coalesce(internal.proacl, acldefault('f', internal.proowner))
       ) as acl
       where internal.oid = v_internal
         and acl.privilege_type = 'EXECUTE'
         and acl.grantee <> internal.proowner
     ) then
    raise exception
      'VLX hosted grantor compatibility internal-function postcondition failed';
  end if;

  if not exists (
       select 1
       from pg_proc as wrapper
       cross join lateral aclexplode(wrapper.proacl) as acl
       where wrapper.oid = v_wrapper
         and wrapper.proowner = 'vlx_account_learning_writer'::regrole
         and wrapper.prokind = 'f'
         and wrapper.prosecdef
         and wrapper.provolatile = 'v'
         and octet_length(wrapper.prosrc) = 238
         and encode(
           extensions.digest(wrapper.prosrc, 'sha256'),
           'hex'
         ) =
           'a6e1679da2e1834deee08e9fb28b9bc20cf1b124ab2bc8867c7182d6f212b536'
         and acl.grantor = 'vlx_account_learning_writer'::regrole
         and acl.grantee = 'postgres'::regrole
         and acl.privilege_type = 'EXECUTE'
         and acl.is_grantable
     ) or (
       select count(*)
       from pg_proc as wrapper
       cross join lateral aclexplode(
         coalesce(
           wrapper.proacl,
           acldefault('f', wrapper.proowner)
         )
       ) as acl
       where wrapper.oid = v_wrapper
         and acl.privilege_type = 'EXECUTE'
         and acl.grantee <> wrapper.proowner
     ) <> 1 then
    raise exception
      'VLX hosted grantor compatibility wrapper ACL postcondition failed';
  end if;

  if exists (
       select 1
       from pg_auth_members as membership
       where membership.member = 'vlx_account_learning_writer'::regrole
     ) or (
       exists (
         select 1
         from pg_roles as operator
         where operator.rolname = 'postgres'
           and operator.rolsuper
       ) and (
         select count(*)
         from pg_auth_members as membership
         where membership.roleid = 'vlx_account_learning_writer'::regrole
       ) <> 0
     ) or (
       not exists (
         select 1
         from pg_roles as operator
         where operator.rolname = 'postgres'
           and operator.rolsuper
       ) and (
         (
           select count(*)
           from pg_auth_members as membership
           where membership.roleid = 'vlx_account_learning_writer'::regrole
         ) <> 1 or not exists (
           select 1
           from pg_auth_members as membership
           where membership.roleid = 'vlx_account_learning_writer'::regrole
             and membership.member = 'postgres'::regrole
             and membership.admin_option
             and not membership.inherit_option
             and not membership.set_option
         )
       )
     ) or
     has_schema_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private',
       'CREATE'
     ) or
     has_schema_privilege(
       'vlx_account_learning_writer',
       'auth',
       'USAGE'
     ) then
    raise exception
      'VLX hosted grantor compatibility least-privilege postcondition failed';
  end if;

  if (
    with expected (
      policy_name,
      relation_oid,
      policy_command,
      expression_kind
    ) as (
      values
        (
          'account_learning_apply_receipts_writer_select',
          'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
          'r'::"char",
          'using'
        ),
        (
          'account_learning_apply_receipts_writer_insert',
          'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
          'a'::"char",
          'check'
        ),
        (
          'account_saved_words_pr_c_writer_select',
          'public.account_saved_words'::regclass::oid,
          'r'::"char",
          'using'
        ),
        (
          'account_saved_words_pr_c_writer_insert',
          'public.account_saved_words'::regclass::oid,
          'a'::"char",
          'check'
        ),
        (
          'account_review_events_pr_c_writer_select',
          'public.account_review_events'::regclass::oid,
          'r'::"char",
          'using'
        ),
        (
          'account_review_events_pr_c_writer_insert',
          'public.account_review_events'::regclass::oid,
          'a'::"char",
          'check'
        )
    )
    select count(*)
    from expected
    join pg_policy as policy
      on policy.polrelid = expected.relation_oid
     and policy.polname = expected.policy_name
     and policy.polpermissive
     and policy.polcmd = expected.policy_command
     and policy.polroles =
       array['vlx_account_learning_writer'::regrole::oid]
     and (
       (
         expected.expression_kind = 'using'
         and policy.polqual is not null
         and policy.polwithcheck is null
       ) or (
         expected.expression_kind = 'check'
         and policy.polqual is null
         and policy.polwithcheck is not null
       )
     )
     and position(
       'vlx_account_persistence_private.vlx_account_learning_request_identity()'
       in lower(
         pg_get_expr(
           case
             when expected.expression_kind = 'using' then policy.polqual
             else policy.polwithcheck
           end,
           policy.polrelid
         )
       )
     ) > 0
     and position(
       'owner_account_id'
       in lower(
         pg_get_expr(
           case
             when expected.expression_kind = 'using' then policy.polqual
             else policy.polwithcheck
           end,
           policy.polrelid
         )
       )
     ) > 0
     and position(
       'auth.'
       in lower(
         pg_get_expr(
           case
             when expected.expression_kind = 'using' then policy.polqual
             else policy.polwithcheck
           end,
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
         and dependency.refobjid = v_identity::oid
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
      'VLX hosted grantor compatibility policy postcondition failed';
  end if;

  if (
       select count(*)
       from vlx_account_persistence_private.account_learning_apply_control
     ) <> 1 or not exists (
       select 1
       from vlx_account_persistence_private.account_learning_apply_control
       where singleton
         and not enabled
     ) then
    raise exception
      'VLX hosted grantor compatibility unexpectedly enabled writes';
  end if;
end
$postcondition$;

commit;
