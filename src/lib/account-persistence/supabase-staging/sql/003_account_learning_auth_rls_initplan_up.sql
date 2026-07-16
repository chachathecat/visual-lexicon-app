begin;

do $$
begin
  if current_setting('vlx.account_persistence_target', true) is distinct from 'staging' then
    raise exception
      'VLX staging guard rejected account learning auth RLS initplan hardening';
  end if;
end
$$;

do $$
declare
  v_legacy_expression constant text :=
    '((( SELECT auth.uid() AS uid) = owner_account_id) AND (( SELECT (auth.jwt() -> ''is_anonymous''::text)) = ''false''::jsonb))';
  v_hardened_expression constant text :=
    '((( SELECT auth.uid() AS uid) = owner_account_id) AND ((( SELECT auth.jwt() AS jwt) -> ''is_anonymous''::text) = ''false''::jsonb))';
begin
  if obj_description('public.account_saved_words'::regclass, 'pg_class') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.account_saved_words' or
     obj_description('public.account_review_events'::regclass, 'pg_class') is distinct from
       'vlx:migration-owner=001_account_learning_evidence;object=public.account_review_events' or
     obj_description(
       'vlx_account_persistence_private.account_learning_apply_receipts'::regclass,
       'pg_class'
     ) is distinct from
       'vlx:migration-owner=002_account_learning_apply;object=vlx_account_persistence_private.account_learning_apply_receipts' then
    raise exception
      'VLX auth RLS initplan hardening refused an unowned target table';
  end if;

  if exists (
    with expected (
      policy_name,
      relation_oid,
      policy_command,
      policy_role,
      expression_kind
    ) as (
      values
        (
          'account_saved_words_owner_select',
          'public.account_saved_words'::regclass::oid,
          'r'::"char",
          'authenticated'::regrole::oid,
          'using'
        ),
        (
          'account_review_events_owner_select',
          'public.account_review_events'::regclass::oid,
          'r'::"char",
          'authenticated'::regrole::oid,
          'using'
        ),
        (
          'account_learning_apply_receipts_writer_insert',
          'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
          'a'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'check'
        ),
        (
          'account_saved_words_pr_c_writer_select',
          'public.account_saved_words'::regclass::oid,
          'r'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'using'
        ),
        (
          'account_saved_words_pr_c_writer_insert',
          'public.account_saved_words'::regclass::oid,
          'a'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'check'
        ),
        (
          'account_review_events_pr_c_writer_select',
          'public.account_review_events'::regclass::oid,
          'r'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'using'
        ),
        (
          'account_review_events_pr_c_writer_insert',
          'public.account_review_events'::regclass::oid,
          'a'::"char",
          'vlx_account_learning_writer'::regrole::oid,
          'check'
        )
    )
    select 1
    from expected
    left join pg_policy as policy
      on policy.polrelid = expected.relation_oid and
         policy.polname = expected.policy_name
    where policy.oid is null or
      not policy.polpermissive or
      policy.polcmd <> expected.policy_command or
      policy.polroles <> array[expected.policy_role] or
      (
        expected.expression_kind = 'using' and
        (
          policy.polqual is null or
          policy.polwithcheck is not null or
          pg_get_expr(policy.polqual, policy.polrelid) not in (
            v_legacy_expression,
            v_hardened_expression
          )
        )
      ) or
      (
        expected.expression_kind = 'check' and
        (
          policy.polqual is not null or
          policy.polwithcheck is null or
          pg_get_expr(policy.polwithcheck, policy.polrelid) not in (
            v_legacy_expression,
            v_hardened_expression
          )
        )
      )
  ) then
    raise exception
      'VLX auth RLS initplan hardening refused an unexpected policy shape';
  end if;
end
$$;

alter policy account_saved_words_owner_select
  on public.account_saved_words
  using (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

alter policy account_review_events_owner_select
  on public.account_review_events
  using (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

alter policy account_learning_apply_receipts_writer_insert
  on vlx_account_persistence_private.account_learning_apply_receipts
  with check (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

alter policy account_saved_words_pr_c_writer_select
  on public.account_saved_words
  using (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

alter policy account_saved_words_pr_c_writer_insert
  on public.account_saved_words
  with check (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

alter policy account_review_events_pr_c_writer_select
  on public.account_review_events
  using (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

alter policy account_review_events_pr_c_writer_insert
  on public.account_review_events
  with check (
    (select auth.uid()) = owner_account_id
    and ((select auth.jwt()) -> 'is_anonymous') = 'false'::jsonb
  );

do $$
declare
  v_hardened_expression constant text :=
    '((( SELECT auth.uid() AS uid) = owner_account_id) AND ((( SELECT auth.jwt() AS jwt) -> ''is_anonymous''::text) = ''false''::jsonb))';
begin
  if (
    select count(*)
    from pg_policy as policy
    where (
      policy.polrelid,
      policy.polname,
      policy.polcmd,
      policy.polroles,
      pg_get_expr(
        case
          when policy.polcmd = 'r' then policy.polqual
          else policy.polwithcheck
        end,
        policy.polrelid
      )
    ) in (
      (
        'public.account_saved_words'::regclass::oid,
        'account_saved_words_owner_select',
        'r'::"char",
        array['authenticated'::regrole::oid],
        v_hardened_expression
      ),
      (
        'public.account_review_events'::regclass::oid,
        'account_review_events_owner_select',
        'r'::"char",
        array['authenticated'::regrole::oid],
        v_hardened_expression
      ),
      (
        'vlx_account_persistence_private.account_learning_apply_receipts'::regclass::oid,
        'account_learning_apply_receipts_writer_insert',
        'a'::"char",
        array['vlx_account_learning_writer'::regrole::oid],
        v_hardened_expression
      ),
      (
        'public.account_saved_words'::regclass::oid,
        'account_saved_words_pr_c_writer_select',
        'r'::"char",
        array['vlx_account_learning_writer'::regrole::oid],
        v_hardened_expression
      ),
      (
        'public.account_saved_words'::regclass::oid,
        'account_saved_words_pr_c_writer_insert',
        'a'::"char",
        array['vlx_account_learning_writer'::regrole::oid],
        v_hardened_expression
      ),
      (
        'public.account_review_events'::regclass::oid,
        'account_review_events_pr_c_writer_select',
        'r'::"char",
        array['vlx_account_learning_writer'::regrole::oid],
        v_hardened_expression
      ),
      (
        'public.account_review_events'::regclass::oid,
        'account_review_events_pr_c_writer_insert',
        'a'::"char",
        array['vlx_account_learning_writer'::regrole::oid],
        v_hardened_expression
      )
    )
  ) <> 7 then
    raise exception
      'VLX auth RLS initplan hardening postcondition failed';
  end if;
end
$$;

commit;
