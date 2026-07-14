\set ON_ERROR_STOP on

create table public.account_saved_words (
  collision_sentinel text not null
);

comment on table public.account_saved_words is 'collision-sentinel';

insert into public.account_saved_words (collision_sentinel)
values ('must-survive');
