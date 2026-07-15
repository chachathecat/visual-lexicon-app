# PR C PostgreSQL concurrency gate

This harness runs only against the disposable `vlx_pr_c_concurrency` database.
It proves two lock graphs without relying on timing delays:

1. Two identical applies wait behind a shared-start advisory gate. After the
   gate opens, the committed worker is held behind a second gate, making the
   other worker visibly wait on the PR C implementation's owner advisory lock.
2. A replay transaction returns from the RPC (and therefore retains the
   control snapshot helper's `FOR SHARE` row lock) before waiting behind a
   test-only gate. The real operational rollback must be blocked by that replay
   transaction and fail atomically with SQLSTATE `55P03` under a three-second
   `lock_timeout`.

`run.sh` observes both relationships through `pg_blocking_pids`, releases the
gates, reuses the normal operational rollback assertions, and tears down the
disposable schema. Cleanup targets only backends in this database with the
explicit application names owned by this harness. A short bounded polling
cadence prevents connection churn; elapsed time is never accepted as evidence.
