\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema auth;

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
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.jwt() to authenticated;
grant execute on function auth.uid() to authenticated;

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
