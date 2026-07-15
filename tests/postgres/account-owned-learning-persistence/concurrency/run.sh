#!/usr/bin/env bash
set -euo pipefail

readonly TEST_DATABASE="vlx_pr_c_concurrency"
readonly HARNESS_DIR="tests/postgres/account-owned-learning-persistence/concurrency"
readonly START_GATE="721501000001"
readonly COMMIT_GATE="721501000002"
readonly REPLAY_GATE="721501000003"
readonly GATE_A_APP="vlx_prc_gate_a"
readonly APPLY_A_APP="vlx_prc_apply_a"
readonly APPLY_B_APP="vlx_prc_apply_b"
readonly GATE_B_APP="vlx_prc_gate_b"
readonly REPLAY_APP="vlx_prc_replay_hold"
readonly ROLLBACK_APP="vlx_prc_rollback_probe"
readonly MAX_POLLS=240

if [[ "${PGDATABASE:-}" != "$TEST_DATABASE" ]]; then
  echo "PR C concurrency harness requires PGDATABASE=$TEST_DATABASE" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
declare -a client_pids=()

psql_test() {
  psql --dbname="$TEST_DATABASE" -X -q -v ON_ERROR_STOP=1 "$@"
}

lock_diagnostics() {
  psql_test -Atc "
    select application_name || '|' || state || '|' ||
      coalesce(wait_event_type, '-') || '|' || coalesce(wait_event, '-') ||
      '|blockers=' || cardinality(pg_blocking_pids(pid))::text
    from pg_stat_activity
    where datname = current_database()
      and application_name = any (array[
        '$GATE_A_APP', '$APPLY_A_APP', '$APPLY_B_APP',
        '$GATE_B_APP', '$REPLAY_APP', '$ROLLBACK_APP'
      ])
    order by application_name;
  " >&2 || true
}

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  set +e

  psql_test -c "
    select pg_terminate_backend(pid)
    from pg_stat_activity
    where datname = current_database()
      and pid <> pg_backend_pid()
      and application_name = any (array[
        '$GATE_A_APP', '$APPLY_A_APP', '$APPLY_B_APP',
        '$GATE_B_APP', '$REPLAY_APP', '$ROLLBACK_APP'
      ]);
  " >/dev/null 2>&1

  exec 9>&-
  exec 8>&-

  for client_pid in "${client_pids[@]}"; do
    wait "$client_pid" >/dev/null 2>&1
  done

  rm -rf -- "$tmp_dir"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

await_sql_true() {
  local description=$1
  local query=$2
  local attempt
  local observed

  for ((attempt = 1; attempt <= MAX_POLLS; attempt += 1)); do
    observed="$(psql_test -Atc "$query")"
    if [[ "$observed" == "t" ]]; then
      return 0
    fi

    # Poll cadence only; every assertion is derived from the lock graph.
    sleep 0.05
  done

  echo "Timed out while observing: $description" >&2
  lock_diagnostics
  return 1
}

start_gate_controller() {
  local application_name=$1
  local fifo=$2
  local output=$3
  local descriptor=$4
  shift 4
  local sql=""
  local gate

  for gate in "$@"; do
    sql+="select pg_advisory_lock(${gate}::bigint);"
  done

  mkfifo "$fifo"
  PGAPPNAME="$application_name" \
    psql_test <"$fifo" >"$output" 2>&1 &
  client_pids+=("$!")

  if [[ "$descriptor" == "9" ]]; then
    exec 9>"$fifo"
    printf '%s\n' "$sql" >&9
  else
    exec 8>"$fifo"
    printf '%s\n' "$sql" >&8
  fi
}

release_gate() {
  local descriptor=$1
  local gate=$2

  if [[ "$descriptor" == "9" ]]; then
    printf 'select pg_advisory_unlock(%s::bigint);\n' "$gate" >&9
  else
    printf 'select pg_advisory_unlock(%s::bigint);\n' "$gate" >&8
  fi
}

finish_gate_controller() {
  local descriptor=$1
  local controller_pid=$2

  if [[ "$descriptor" == "9" ]]; then
    printf '\\q\n' >&9
    exec 9>&-
  else
    printf '\\q\n' >&8
    exec 8>&-
  fi

  if ! wait "$controller_pid"; then
    echo "PR C advisory gate controller failed" >&2
    return 1
  fi
}

psql_test -f tests/postgres/account-owned-learning-persistence/000_bootstrap.sql

PGOPTIONS="-c vlx.account_persistence_target=staging" \
  psql_test \
    -f src/lib/account-persistence/supabase-staging/sql/001_account_learning_evidence_up.sql \
    -f src/lib/account-persistence/supabase-staging/sql/002_account_learning_apply_up.sql \
    -f src/lib/account-persistence/supabase-staging/sql/003_account_learning_auth_rls_initplan_up.sql \
    -f tests/postgres/account-owned-learning-persistence/050_pr_c_default_disabled_assertions.sql \
    -f tests/postgres/account-owned-learning-persistence/055_pr_c_auth_rls_initplan_assertions.sql

psql_test -f "$HARNESS_DIR/000_setup.sql"

gate_a_fifo="$tmp_dir/gate-a.fifo"
gate_a_log="$tmp_dir/gate-a.log"
start_gate_controller \
  "$GATE_A_APP" "$gate_a_fifo" "$gate_a_log" 9 \
  "$START_GATE" "$COMMIT_GATE"
gate_a_pid="${client_pids[-1]}"

await_sql_true "both phase-A gates held by their controller" "
  with controller as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$GATE_A_APP'
  )
  select
    (select count(*) from controller) = 1 and
    (
      select count(*)
      from pg_locks as held_lock
      join controller on controller.pid = held_lock.pid
      where held_lock.locktype = 'advisory'
        and held_lock.granted
    ) = 2;
"

PGAPPNAME="$APPLY_A_APP" \
  psql_test \
    -v worker_id=apply_a \
    -f "$HARNESS_DIR/010_concurrent_apply_worker.sql" \
    >"$tmp_dir/apply-a.log" 2>&1 &
apply_a_pid=$!
client_pids+=("$apply_a_pid")

PGAPPNAME="$APPLY_B_APP" \
  psql_test \
    -v worker_id=apply_b \
    -f "$HARNESS_DIR/010_concurrent_apply_worker.sql" \
    >"$tmp_dir/apply-b.log" 2>&1 &
apply_b_pid=$!
client_pids+=("$apply_b_pid")

await_sql_true "both apply workers blocked behind the shared start gate" "
  with controller as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$GATE_A_APP'
  ), workers as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = any (array['$APPLY_A_APP', '$APPLY_B_APP'])
  )
  select coalesce(
    (select count(*) from controller) = 1 and
    (select count(*) from workers) = 2 and
    (
      select bool_and(
        (select pid from controller) = any (pg_blocking_pids(workers.pid))
      )
      from workers
    ),
    false
  );
"

release_gate 9 "$START_GATE"

await_sql_true "controller-to-winner-to-replay owner-lock chain" "
  with controller as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$GATE_A_APP'
  ), workers as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = any (array['$APPLY_A_APP', '$APPLY_B_APP'])
  )
  select exists (
    select 1
    from controller, workers as committed_worker, workers as replay_worker
    where committed_worker.pid <> replay_worker.pid
      and controller.pid = any (
        pg_blocking_pids(committed_worker.pid)
      )
      and committed_worker.pid = any (
        pg_blocking_pids(replay_worker.pid)
      )
  );
"

release_gate 9 "$COMMIT_GATE"
finish_gate_controller 9 "$gate_a_pid"

if ! wait "$apply_a_pid"; then
  echo "PR C first concurrent apply worker failed" >&2
  exit 1
fi
if ! wait "$apply_b_pid"; then
  echo "PR C second concurrent apply worker failed" >&2
  exit 1
fi

psql_test -f "$HARNESS_DIR/020_concurrent_apply_assertions.sql"

gate_b_fifo="$tmp_dir/gate-b.fifo"
gate_b_log="$tmp_dir/gate-b.log"
start_gate_controller \
  "$GATE_B_APP" "$gate_b_fifo" "$gate_b_log" 8 \
  "$REPLAY_GATE"
gate_b_pid="${client_pids[-1]}"

await_sql_true "phase-B replay gate held by its controller" "
  select count(*) = 1
  from pg_locks as held_lock
  join pg_stat_activity as controller on controller.pid = held_lock.pid
  where controller.datname = current_database()
    and controller.application_name = '$GATE_B_APP'
    and held_lock.locktype = 'advisory'
    and held_lock.granted;
"

PGAPPNAME="$REPLAY_APP" \
  psql_test \
    -f "$HARNESS_DIR/030_held_replay_worker.sql" \
    >"$tmp_dir/replay.log" 2>&1 &
replay_pid=$!
client_pids+=("$replay_pid")

await_sql_true "replay transaction holding FOR SHARE at its test gate" "
  with controller as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$GATE_B_APP'
  ), replay_worker as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$REPLAY_APP'
  )
  select coalesce(
    (select count(*) from controller) = 1 and
    (select count(*) from replay_worker) = 1 and
    (select pid from controller) = any (
      pg_blocking_pids((select pid from replay_worker))
    ),
    false
  );
"

PGAPPNAME="$ROLLBACK_APP" \
PGOPTIONS="-c vlx.account_persistence_target=staging -c lock_timeout=3s" \
  psql_test \
    -f "$HARNESS_DIR/040_rollback_probe.sql" \
    >"$tmp_dir/rollback.log" 2>&1 &
rollback_pid=$!
client_pids+=("$rollback_pid")

await_sql_true "operational rollback blocked by the held replay" "
  with replay_worker as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$REPLAY_APP'
  ), rollback_worker as (
    select pid
    from pg_stat_activity
    where datname = current_database()
      and application_name = '$ROLLBACK_APP'
  )
  select coalesce(
    (select count(*) from replay_worker) = 1 and
    (select count(*) from rollback_worker) = 1 and
    (select pid from replay_worker) = any (
      pg_blocking_pids((select pid from rollback_worker))
    ),
    false
  );
"

if wait "$rollback_pid"; then
  echo "PR C operational rollback unexpectedly bypassed the replay lock" >&2
  exit 1
fi

if ! grep -Eq '55P03' "$tmp_dir/rollback.log"; then
  echo "PR C blocked rollback did not fail with SQLSTATE 55P03" >&2
  exit 1
fi

psql_test -f "$HARNESS_DIR/050_failed_rollback_assertions.sql"

release_gate 8 "$REPLAY_GATE"
finish_gate_controller 8 "$gate_b_pid"

if ! wait "$replay_pid"; then
  echo "PR C held replay worker failed after gate release" >&2
  exit 1
fi

psql_test -f "$HARNESS_DIR/060_held_replay_assertions.sql"

PGOPTIONS="-c vlx.account_persistence_target=staging" \
  psql_test \
    -f tests/postgres/account-owned-learning-persistence/070_pr_c_operational_rollback_assertions.sql

psql_test -f "$HARNESS_DIR/090_teardown.sql"

PGOPTIONS="-c vlx.account_persistence_target=staging -c vlx.account_persistence_disposable_test=true" \
  psql_test \
    -f tests/postgres/account-owned-learning-persistence/080_pr_c_disposable_teardown.sql \
    -f tests/postgres/account-owned-learning-persistence/090_pr_c_disposable_teardown_assertions.sql \
    -f src/lib/account-persistence/supabase-staging/sql/001_account_learning_evidence_down.sql \
    -f tests/postgres/account-owned-learning-persistence/020_rollback_assertions.sql

echo "PR C PostgreSQL concurrency and rollback serialization gate passed."
