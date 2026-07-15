\set ON_ERROR_STOP on

do $$
begin
  if current_database() is distinct from 'vlx_pr_c_concurrency' then
    raise exception 'PR C rollback assertion refused a non-disposable database';
  end if;

  if not exists (
    select 1
    from vlx_account_persistence_private.account_learning_apply_control
    where singleton
      and enabled
      and disabled_at is null
      and approved_owner_account_id =
        '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'::uuid
  ) then
    raise exception 'PR C blocked rollback changed the singleton control';
  end if;

  if (select count(*) from public.account_saved_words) <> 1 or
     (select count(*) from public.account_review_events) <> 1 or
     (
       select count(*)
       from vlx_account_persistence_private.account_learning_apply_receipts
     ) <> 1 then
    raise exception 'PR C blocked rollback changed the 1/1/1 evidence';
  end if;

  if not has_function_privilege(
       'authenticated',
       'public.vlx_account_learning_apply(text,text,text,timestamptz,text,text,timestamptz,integer)',
       'EXECUTE'
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_control_snapshot()',
       'EXECUTE'
     ) or
     not has_function_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.vlx_account_learning_session_is_live(uuid,uuid)',
       'EXECUTE'
     ) or
     not has_table_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.account_learning_apply_receipts',
       'INSERT'
     ) or
     not has_column_privilege(
       'vlx_account_learning_writer',
       'public.account_saved_words',
       'owner_account_id',
       'INSERT'
     ) or
     not has_column_privilege(
       'vlx_account_learning_writer',
       'public.account_review_events',
       'owner_account_id',
       'INSERT'
     ) or
     has_column_privilege(
       'vlx_account_learning_writer',
       'vlx_account_persistence_private.account_learning_apply_control',
       'singleton',
       'UPDATE'
     ) then
    raise exception 'PR C blocked rollback partially revoked writer grants';
  end if;
end
$$;
