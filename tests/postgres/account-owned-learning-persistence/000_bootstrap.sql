\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;

create schema auth;

create table auth.users (
  id uuid primary key
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

insert into auth.users (id)
values
  ('6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b'),
  ('74d2da4e-5947-49ef-a24d-659c5e95f08d');
