\set ON_ERROR_STOP on

-- Model hosted Supabase with a real bootstrap superuser and a separate,
-- non-superuser `postgres` operator. Auth objects deliberately belong to a
-- different owner so the operator can use them but cannot delegate them.
do $$
begin
  if current_user <> 'vlx_bootstrap' or not exists (
    select 1
    from pg_roles
    where rolname = current_user
      and rolsuper
  ) then
    raise exception
      'Hosted-operator bootstrap must run as the vlx_bootstrap superuser';
  end if;
end
$$;

create role postgres
  login
  password 'postgres'
  noinherit
  bypassrls
  nosuperuser
  createdb
  createrole
  noreplication;

create role supabase_admin
  nologin
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

create role supabase_auth_admin
  nologin
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

create role anon
  nologin
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

create role authenticated
  nologin
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

create role service_role
  nologin
  noinherit
  bypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

create role vlx_wrong_operator
  login
  password 'vlx_wrong_operator'
  noinherit
  nobypassrls
  nosuperuser
  nocreatedb
  nocreaterole
  noreplication;

-- Hosted Supabase gives service_role a direct execute ACL on newly-created
-- public functions. Migration 004 must remove that inherited prestate from the
-- PR C wrapper before any activation can occur.
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;

do $$
begin
  execute format(
    'alter database %I owner to postgres',
    current_database()
  );
end
$$;

create schema auth authorization supabase_admin;

set role supabase_admin;

grant usage, create on schema auth to supabase_auth_admin;
grant usage on schema auth to postgres, authenticated;

reset role;

set role supabase_auth_admin;

create table auth.users (
  id uuid primary key
);

create table auth.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table auth.sessions enable row level security;

create function auth.jwt()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb
$$;

create function auth.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

insert into auth.users (id)
values
  ('6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'),
  ('74d2da4e-5947-49ef-a24d-659c5e95f08d');

insert into auth.sessions (id, user_id)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '74d2da4e-5947-49ef-a24d-659c5e95f08d'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'
  );

-- The hosted operator receives only ordinary privileges from the auth owner.
-- In particular, none of these grants carries GRANT OPTION.
grant select on table auth.users, auth.sessions to postgres;
grant references (id) on table auth.users to postgres;

reset role;

-- The fixture's operator must be able to exercise app-role RLS paths without
-- inheriting either app role in its normal session.
grant anon, authenticated to postgres
  with inherit false, set true;
