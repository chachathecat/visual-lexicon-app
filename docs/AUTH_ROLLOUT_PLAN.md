# Auth Rollout Plan

Plan date: 2026-06-11

Scope: Track B auth/account persistence rollout planning only. This plan does
not authorize real auth implementation, provider SDKs, login/signup behavior,
database credentials, migrations requiring secrets, billing, deployment,
Webflow, Cloudflare production Worker changes, or production data mutation.

## Phase 0: Architecture Only

Goal:

Document account persistence, data model, sync behavior, privacy requirements,
and rollout gates before implementation.

Scope:

- Add architecture, data model, sync contract, and rollout docs.
- Link docs from README Production v1 Planning.
- Keep runtime behavior unchanged.
- Do not add auth provider code, server persistence, billing, or deployment
  changes.

Risks:

- Docs can imply production readiness if not clearly scoped.
- Missing conflict rules can lead future implementation toward unsafe shortcuts.

Tests:

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test -- --workers=1`

Exit criteria:

- Docs are reviewed and linked.
- Scope explicitly says no real auth or runtime sync exists.
- Recommended next PR is server-side saved/review SRS sync architecture or
  contracts.

Rollback plan:

- Revert documentation and README link changes only.

## Phase 1: Typed Contracts And Mocks

Goal:

Create compile-time contracts and mock sync adapters that make the future
implementation testable without connecting real auth or persistence.

Scope:

- Add TypeScript-only account sync types for users, saved words, review state,
  review events, daily stats, pack progress, upgrade interest, alias events,
  extension events, and entitlement snapshots.
- Add mock sync fixtures and contract tests.
- Keep mocks disconnected from production runtime unless feature-flagged test
  paths require them.

Risks:

- Types can drift from docs or current localStorage contracts.
- Mocks can be mistaken for production server behavior.
- Runtime imports can accidentally change app behavior.

Tests:

- Typecheck and lint.
- Unit tests for contract validation and idempotency shapes.
- No-browser-behavior-change regression tests.

Exit criteria:

- Contracts compile.
- Mocks are clearly labeled non-production.
- Existing Save -> Review -> SRS tests still pass.
- No auth provider, database, or billing SDK is present.

Rollback plan:

- Remove typed contracts and mock-only tests.
- Keep architecture docs if still accurate.

## Phase 2: Server Persistence Behind Feature Flag

Goal:

Persist account-bound saved/review data on the server in a disabled-by-default
or internal-only path.

Scope:

- Add server persistence for saved words, review events, materialized review
  state, daily stats, and pack progress.
- Add idempotent write handling for save and review answers.
- Keep localStorage as fallback/cache during rollout.
- Gate behavior behind an explicit feature flag and non-production environment
  controls.

Risks:

- Duplicate events can over-advance SRS boxes.
- Stale local state can overwrite newer server state.
- Feature flag mistakes can expose unfinished sync.
- Server writes can fail during review and create confusing pending state.

Tests:

- Unit tests for server SRS reducer and selectors.
- Integration tests for save -> review -> event -> review state updates.
- Idempotency tests for duplicate saves and duplicate review answers.
- Failure/retry tests with server unavailable.
- Existing local MVP regression tests.

Exit criteria:

- Feature flag defaults are safe.
- Server persistence is idempotent.
- Due, Weak, and Mastered remain derived from real review state.
- No paid launch or entitlement claim depends on this phase.

Rollback plan:

- Disable the feature flag.
- Continue using localStorage fallback.
- Preserve server data for diagnosis without deleting production records.

## Phase 3: Account Hydration

Goal:

Hydrate account state after sign-in and make cross-device reads reliable before
full migration.

Scope:

- Add account state hydration for saved words, review state, daily stats, pack
  progress, and entitlement snapshots.
- Add local pending queue replay after hydration.
- Add clear pending/synced/error states.
- Add signed-out behavior that stops server writes and preserves local queue.

Risks:

- Hydration can mask pending local answers.
- Device clock drift can corrupt due dates if trusted blindly.
- Account UI can imply server freshness when hydration failed.
- New device state can omit archived or weak words if selectors are incomplete.

Tests:

- New-device hydration tests.
- Stale-device hydration plus pending replay tests.
- Cross-device due/weak/mastered selector tests.
- Session-expired and signed-out fallback tests.
- Clock-drift tests.

Exit criteria:

- Account reads are consistent across devices in staging/internal QA.
- Pending local writes survive hydration.
- Failed hydration has safe UI fallback.
- No local-only paid entitlement is treated as real account access.

Rollback plan:

- Disable account hydration flag.
- Keep local cache and queued writes.
- Rehydrate from server after fix without deleting local fallback state.

## Phase 4: Migration/Merge QA

Goal:

Prove guest-to-account migration and logged-in conflict handling before public
production auth claims.

Scope:

- Test guest local state merge into new and existing accounts.
- Test duplicate saves, duplicate review events, archived saves, pack progress,
  upgrade interest, alias events, and extension events.
- Test account export/delete support paths.
- Record manual QA notes for golden flows.

Risks:

- Guest merge can duplicate saved words or lose weak-word history.
- Imported review state can fake mastery.
- Delete/export can miss derived or event records.
- Support repair paths can mutate audit history unsafely.

Tests:

- Automated migration tests from representative localStorage snapshots.
- Manual golden-flow QA across guest, free account, and paid-preview account.
- Export/delete dry runs in staging/internal data.
- Regression tests for local MVP behavior.

Exit criteria:

- Migration is idempotent.
- Mastered status requires delayed recall evidence.
- Export/delete requirements are verified.
- Residual risks are documented with owner and mitigation.

Rollback plan:

- Stop new migrations with a flag.
- Preserve unmerged local data.
- Re-run migration batches after repair using migration batch IDs.

## Phase 5: Production Auth Readiness Sign-Off

Goal:

Decide whether auth/account persistence is ready to support the next production
v1 launch gates.

Scope:

- Review account persistence, sync, privacy, export/delete, support, and QA
  evidence.
- Confirm no open P0 issues for account-owned learning state.
- Confirm billing/entitlement work remains separate unless explicitly approved.
- Produce go/no-go sign-off for auth readiness only, not full paid launch.

Risks:

- Auth readiness can be confused with paid SaaS readiness.
- Server-side sync can pass happy paths while failure paths remain weak.
- Support and deletion procedures can be under-tested.

Tests:

- Full validation commands.
- Staging account create/sign-in/sign-out/recovery smoke tests when auth exists.
- Cross-device SRS sync QA.
- Migration/merge QA.
- Export/delete QA.
- Incident and rollback rehearsal.

Exit criteria:

- Account persistence P0s are closed.
- Cross-device saved/review state works in staging.
- Privacy/export/delete paths are documented and tested.
- Remaining risks are P1/P2 or explicitly accepted.
- Next launch gate owner agrees billing and production launch are still not
  authorized by auth readiness alone.

Rollback plan:

- Keep auth disabled or internal-only.
- Stop account migration.
- Use local-only beta behavior until sync/auth issues are resolved.
- Communicate clearly that production account persistence is not available.

## Recommendation

Do not implement billing or paid launch before auth/account persistence and
server-side SRS sync are designed, tested, and validated. Account ownership and
memory-state correctness are prerequisites for a credible paid learning habit.
