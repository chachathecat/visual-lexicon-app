\set ON_ERROR_STOP on

select current_database() = 'vlx_pr_c_concurrency' as disposable_database
\gset

\if :disposable_database
\else
  \echo 'PR C concurrency teardown refused a non-disposable database'
  \quit 1
\endif

drop table vlx_pr_c_concurrency.outcomes;
drop table vlx_pr_c_concurrency.fixture;
drop schema vlx_pr_c_concurrency;
