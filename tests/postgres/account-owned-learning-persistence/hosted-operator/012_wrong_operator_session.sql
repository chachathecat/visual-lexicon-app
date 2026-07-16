\set ON_ERROR_STOP on

select
  current_user = 'vlx_wrong_operator' and
  session_user = 'vlx_wrong_operator' and
  not wrong_operator.rolsuper and
  not wrong_operator.rolcreaterole and
  not wrong_operator.rolbypassrls as hosted_wrong_operator_session_is_real
from pg_roles as wrong_operator
where wrong_operator.rolname = 'vlx_wrong_operator'
\gset

\if :hosted_wrong_operator_session_is_real
\else
  \echo 'Hosted wrong-operator probe did not establish the expected session'
  \quit 1
\endif
