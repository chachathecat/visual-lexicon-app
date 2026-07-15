# Account-owned learning persistence PR C

Status: implementation and isolated-staging verification only. Merge is
blocked until every live-evidence item in this document is complete.

## Authorized slice

PR C is intentionally one fixed vertical slice:

- one canonical `dissonance` saved word;
- one synthetic `saved_review` event whose SRS transition is fixed by the
  server and database to box `0 -> 1`, weak score `0 -> 0`;
- one idempotency receipt;
- bounded hydration of that pair into a clean second browser, with review state
  and daily stats derived by replaying the event through the existing SRS
  engine.

It does not enable Production, billing, payment, subscription, paid
entitlement, pack progress, public signup, public beta, generalized account
sync, or caller-supplied mastery.

## Three independent gates

The write path opens only when all three layers agree:

1. The Vercel request is an exact non-`main` Preview deployment of the
   canonical repository, branch, and 40-character commit SHA, running in the
   hard-pinned dedicated Track B staging Vercel project, wired to the isolated
   Supabase project and not the Production project.
2. Server-only mode, capability, kill-switch, approved-owner, and rate-limit
   controls are present. No capability or owner identifier is returned to the
   browser.
3. PostgreSQL is enabled for the same deployment SHA, capability digest, and
   immutable approved synthetic owner. The database starts disabled.

Hydration remains read-only and may stay available after the application and
database write kill switches are off. The hidden
`/staging/account-learning` operator page is no-index, is absent from public
navigation, returns 404 outside the exact staging gate or approved session, and
requires an explicit user action. It never auto-hydrates.

## Server-only staging configuration

No values belong in source control or evidence logs. The isolated Preview must
provide all existing PR B read gates plus:

- `VLX_ACCOUNT_LEARNING_HYDRATE_MODE=staging_dissonance_vertical_slice`
- `VLX_ACCOUNT_LEARNING_WRITE_MODE=staging_dissonance_vertical_slice`
- `VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH=allow_reviewed_staging_sha`
- `VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY=<server-only random value>`
- `VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID=<approved synthetic UUID>`

The expected branch and expected SHA must equal the actual Vercel metadata.
The Vercel system values `VERCEL_PROJECT_ID` and `VERCEL_DEPLOYMENT_ID` must be
present; runtime rejects any project other than the independently verified
dedicated Track B staging project. Changing only an app environment variable
cannot bypass the runtime or database gates.

## Database sequence

All SQL runs only after the operator independently verifies the dedicated
Track B staging project. Every script also requires:

```sql
set vlx.account_persistence_target = 'staging';
```

The sequence is:

1. Apply `002_account_learning_apply_up.sql`. It creates disabled objects and
   exposes no callable app-role write RPC.
2. Apply `003_account_learning_auth_rls_initplan_up.sql`. It alters exactly
   seven existing policies: the two `001` authenticated owner-select policies,
   the `002` receipt writer-insert policy, and the four PR C writer
   select/insert policies across saved words and review events. Each
   anonymous-claim predicate changes from
   `(select auth.jwt() -> 'is_anonymous')` to
   `((select auth.jwt()) -> 'is_anonymous')`; policy roles, commands,
   owner-account checks, and exact JSON-boolean denial semantics are unchanged.
3. Run `050_pr_c_default_disabled_assertions.sql`, then
   `055_pr_c_auth_rls_initplan_assertions.sql`, before activation.
4. Supply the capability digest, exact deployment SHA, and approved owner to
   `002_account_learning_apply_enable.sql` in a private operator session.
5. Run the live golden flow.
6. Immediately run `002_account_learning_apply_operational_rollback.sql`.
   This disables and revokes writes while preserving the one saved word, one
   event, and one receipt as evidence.

Migration `003` is staging-guarded, transactional, and idempotent. It accepts
only the exact legacy or already-hardened shape for those seven owned policies
and aborts on a missing, reassigned, or otherwise changed target. It is an
additive `ALTER POLICY` migration; never rewrite the historical `001` or `002`
migration to obtain this advisor hardening.

The fresh PostgreSQL CI sequence likewise applies `003` immediately after
`002`, then runs `050_pr_c_default_disabled_assertions.sql` and
`055_pr_c_auth_rls_initplan_assertions.sql` before the activating `060`
fixture. The concurrency gate uses the same ordering.

The destructive `080_pr_c_disposable_teardown.sql` is CI-fixture-only and
requires an additional disposable-test guard. It must never run against the
live staging project.

## Golden flow

The live test is implemented in
`tests/account-persistence-staging-golden.e2e.spec.ts`. It consumes an
uncommitted, local Playwright storage-state file and never prints its cookies.
That auth file must live outside the repository or under the ignored
`.playwright-auth/` directory; the test rejects any other in-repository path.
It must run against the exact Preview URL with two independent browser
contexts carrying the same approved account session. An explicit
`VLX_PR_C_GOLDEN_TARGET=isolated_track_b_staging_preview` attestation is
required; a partial configuration, non-HTTPS URL, credential-bearing URL, or
hostname outside the dedicated staging Vercel project fails before navigation.
With no golden variables configured, the test is collected and safely skipped.
The operator also supplies one stable non-secret run UUID and its initial UTC
saved-at timestamp, plus the final checkout SHA and immutable Vercel deployment
ID. The test compares the expected SHA to local `git rev-parse HEAD`, then
requires every successful apply/hydrate response to attest that same SHA and
deployment ID. This prevents a mutable branch alias from silently moving the
golden run to a different deployment.

Keep the run UUID and timestamp locally until rollback. If a run fails after
commit, do not blindly rerun the normal golden command: its first assertion
intentionally requires `committed` and will stop on `replayed`. Retain the same
values for controlled DB/replay inspection, collect the existing `1/1/1`
receipt evidence, and follow rollback recovery. A fresh authoritative golden
run requires a clean dedicated staging fixture.

The live command receives these only from the local operator environment:

```sh
VLX_PR_C_GOLDEN_TARGET=isolated_track_b_staging_preview \
VLX_PR_C_GOLDEN_BASE_URL=<exact-preview-origin> \
VLX_PR_C_GOLDEN_STORAGE_STATE=<uncommitted-cookie-state-path> \
VLX_PR_C_GOLDEN_RUN_ID=<stable-run-uuid> \
VLX_PR_C_GOLDEN_SAVED_AT=<initial-current-utc-iso-timestamp> \
VLX_PR_C_GOLDEN_EXPECTED_SHA=<git-rev-parse-head> \
VLX_PR_C_GOLDEN_EXPECTED_DEPLOYMENT_ID=<immutable-vercel-dpl-id> \
npm run test:account-learning:pr-c:golden
```

Expected evidence:

1. Browser A read-only preflight: HTTP 200, exact final SHA/deployment-ID
   attestation, and baseline counts `0/0`. No mutation is attempted before this
   passes.
2. Browser A apply: HTTP 200, `committed`, counts `1/1/0/1`.
3. Browser A same-key replay: HTTP 200, `replayed`, no mutation.
4. Browser A same-key changed fingerprint: HTTP 409
   `IDEMPOTENCY_CONFLICT`.
5. Browser A caller-supplied mastery: HTTP 422
   `FAKE_MASTERY_REJECTED`, before persistence.
6. Separate cross-account proof, not Browser B: the route boundary performs
   zero storage adapter calls for an unapproved account; disposable SQL and
   live Track B DB/RLS checks prove RPC denial and zero direct-table rows.
7. Clean same-account Browser B: explicit hydration produces exactly one saved
   word, one event, `Learning`/box 1, and the exact replay-derived daily-stat
   fields. Pack, plan, and upgrade-interest sentinels remain byte-identical.
8. A controlled same-page hydration replay is a byte-identical zero-write
   no-op. A pre-existing or externally changed Browser B baseline fails closed.
9. Operational rollback revokes app and writer mutation privileges, blocks new
   calls, and preserves database counts `1/1/1`.

## Merge gate

Do not merge until all are true:

- typecheck, lint, production build, focused PR C tests, full regression suite,
  and PostgreSQL CI are green on the final SHA;
- Supabase security and performance advisors have been re-run after DDL;
- live RLS/grant/session-binding queries pass on isolated staging;
- the exact Preview deployment is Ready and the two-context golden flow passes;
- the application write kill switch and database write gate are off afterward;
- post-rollback counts remain exactly one saved word, one event, one receipt;
- the latest PR review and required GitHub checks contain no blocker.

Production promotion, Production aliases, billing, entitlement, pack-progress,
and public-beta changes are explicitly outside this PR.
