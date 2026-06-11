# Next Production Implementation Roadmap

This roadmap shifts Visual Lexicon Track B from production launch planning into
carefully scoped implementation foundations after #47 Public Paid Launch
Decision.

Current decision: No-Go / Not Yet for public production paid SaaS.

Allowed current posture: local/private no-payment beta planning only.

This roadmap is documentation-only. It does not deploy, change runtime
behavior, add auth runtime, add billing runtime, add checkout, add analytics
SDKs, change Vercel settings, change DNS, touch Webflow, touch Cloudflare
Workers, add environment variables, add secrets, or mutate production data.

## Sequencing Principles

- Account ownership comes before payment.
- Server-owned memory state comes before entitlement.
- Entitlement snapshots in test mode come before real billing.
- Real billing comes only after explicit approval.
- Weekly Reviewed Words remains the North Star.
- Due, Weak, and Mastered must remain derived from truthful review state.
- Each implementation PR should be narrow, reversible, and testable.

## Proposed PR Sequence

| PR | Title | Type | Goal | Exit criteria |
| --- | --- | --- | --- | --- |
| #48 | Auth provider decision and account implementation plan | Architecture | Choose the auth direction and define the first safe implementation boundary. | Provider decision, account/session scope, migration risks, no runtime auth added unless explicitly approved. |
| #49 | Account persistence typed contracts and mocks | Implementation | Add typed account-owned data contracts and safe mocks for saved/review ownership. | Types, mock adapters, and tests exist without real provider secrets or production data. |
| #50 | Server SRS sync implementation spike behind feature flag | Implementation | Prototype server-owned SRS reads/writes behind a disabled-by-default flag. | Feature flag off by default, local behavior preserved, sync spike covered by tests. |
| #51 | Guest-to-account migration prototype | Implementation | Prototype migration from local storage MVP state into account-owned records. | Migration rules and rollback path tested with fixtures for saved words, review state, events, stats, and pack progress. |
| #52 | Server-side review event idempotency tests | Implementation | Prove review answer writes cannot duplicate or over-advance memory state. | Retry, duplicate, stale, and conflict cases covered in tests. |
| #53 | Staging deployment audit | QA | Verify staging environment readiness without changing production settings. | Staging inventory, env expectations, smoke checklist, rollback notes, and blockers documented. |
| #54 | Support/refund/legal copy draft | Architecture | Draft support, refund, cancellation, privacy, and billing disclosure copy. | Draft copy reviewed for no overclaims, no unsupported production promises, and owner gaps recorded. |
| #55 | Billing provider final decision | Architecture | Select billing provider and define integration boundaries after account/SRS foundations. | Provider decision, webhook model, entitlement model, failure states, and no runtime billing unless approved. |
| #56 | Test-mode entitlement snapshot prototype | Implementation | Add account-bound entitlement snapshots in test mode before real payment. | Entitlement states are server-owned/test-mode, audited, revocable, and covered by tests. |
| #57 | Production readiness rerun | QA | Re-run production readiness after implementation foundations. | Updated go/no-go evidence, validation, manual QA, blockers, and owner sign-off status. |

## #48 Auth Provider Decision And Account Implementation Plan

Type: architecture.

Goal: choose the auth provider direction and define the first implementation
boundary for account identity, sessions, recovery, and data ownership.

Scope:

- Compare provider options against Track B needs.
- Define account ID, session, recovery, guest, and signed-out behavior.
- Define where saved words, review state, events, daily stats, pack progress,
  and future entitlement state attach to an account.
- Document provider SDK boundaries and secret-handling requirements.
- Keep runtime auth out of scope unless explicitly approved.

Risks:

- Choosing a provider before clarifying account-owned SRS data.
- Introducing secrets or frontend-exposed credentials.
- Changing login/auth behavior before QA coverage exists.

Tests:

- Documentation review only unless implementation is explicitly approved.
- If code contracts are introduced, run typecheck, lint, build, and focused
  contract tests.

Exit criteria:

- Provider recommendation and fallback are documented.
- Account/session/recovery/migration scope is clear.
- Secret and environment variable boundaries are documented.
- Next implementation PR can add typed contracts without choosing payment.

## #49 Account Persistence Typed Contracts And Mocks

Type: implementation.

Goal: add typed contracts and mock adapters for account-owned learning state
without connecting a real auth provider or production database.

Scope:

- Define account-owned saved word, review state, review event, daily stat, pack
  progress, and migration contracts.
- Preserve local storage key contracts.
- Add safe mock adapters/fixtures for tests.
- Keep runtime behavior unchanged unless behind explicit test-only or disabled
  boundaries.

Risks:

- Drifting from existing local MVP state shapes.
- Creating parallel SRS or mastery keys.
- Accidentally implying account sync is live.

Tests:

- Type tests or unit tests for contract compatibility.
- Existing local MVP tests to prove behavior did not regress.
- Validation commands from AGENTS.md.

Exit criteria:

- Typed account persistence contracts exist.
- Mocks cover saved/review/events/stats/progress.
- Local runtime behavior and storage keys are preserved.

## #50 Server SRS Sync Implementation Spike Behind Feature Flag

Type: implementation.

Goal: prototype server-owned saved/review SRS sync while keeping existing local
behavior unchanged by default.

Scope:

- Add a disabled-by-default feature flag or test boundary.
- Prototype read/write interfaces for saved words, review state, review events,
  daily stats, and pack progress.
- Preserve the 5-box SRS rules.
- Avoid real production data, secrets, or billing.

Risks:

- Divergent local and server memory calculations.
- Duplicate review events during retries.
- Feature flag accidentally enabled in normal local flow.

Tests:

- Unit/contract tests for SRS transition parity.
- Tests for disabled-by-default behavior.
- Existing Playwright suite to verify no local MVP regression.

Exit criteria:

- Sync spike can write/read representative state behind the flag.
- Due, Weak, and Mastered remain derived from real state.
- Default app behavior remains local/private MVP.

## #51 Guest-To-Account Migration Prototype

Type: implementation.

Goal: prototype how existing local MVP state migrates into account-owned records.

Scope:

- Migrate `vlx_saved_words_v1`.
- Migrate `vlx_review_state_v1`.
- Migrate `vlx_review_events_v1`.
- Migrate `vlx_daily_stats_v1`.
- Include pack progress if present in the current app state.
- Define conflict rules for local and account state.

Risks:

- Losing weak/mistake history.
- Overwriting newer account state with stale local state.
- Marking mastery without delayed recall.

Tests:

- Fixture-based migration tests.
- Conflict tests for duplicate slugs, stale timestamps, retries, and partial
  migration.
- Rollback/idempotency tests.

Exit criteria:

- Migration can be run more than once without duplicating events.
- Weak score, box, mastery, and due dates remain truthful.
- Failure path preserves local data and reports a recoverable state.

## #52 Server-Side Review Event Idempotency Tests

Type: implementation.

Goal: prove that server-side review answer writes cannot duplicate events or
over-advance SRS state.

Scope:

- Add idempotency keys or equivalent contract tests for review answers.
- Cover retries, duplicate submissions, stale clients, and partial failures.
- Assert `boxAfter`, `weakScoreAfter`, `nextDueAt`, and mastery behavior.

Risks:

- Duplicate correct answers moving a word too far ahead.
- Wrong answers not returning soon enough.
- Event history diverging from review state.

Tests:

- Retry and duplicate event tests.
- Correct fast/no-hint, correct slow, guessed, and wrong answer cases.
- Multi-device conflict fixtures if available.

Exit criteria:

- Duplicate submissions produce one accepted state transition.
- Event log and review state remain consistent.
- Due, Weak, and Mastered selectors remain trustworthy.

## #53 Staging Deployment Audit

Type: QA.

Goal: verify staging readiness without changing production settings.

Scope:

- Inventory staging project, environment, domain, branch, secrets, and runtime
  expectations.
- Identify blockers for auth, sync, billing test mode, analytics, monitoring,
  and rollback.
- Confirm no Webflow, Cloudflare Worker, DNS, or production data changes are
  required by the audit itself.

Risks:

- Discovering staging is not isolated from production.
- Missing env var ownership.
- No reliable rollback target.

Tests:

- Documentation/inspection checks.
- Staging smoke checklist drafted, not executed against production unless
  explicitly approved.

Exit criteria:

- Staging readiness gaps are listed with owners.
- Production settings remain untouched.
- A future smoke run has a concrete target and rollback notes.

## #54 Support/Refund/Legal Copy Draft

Type: architecture.

Goal: draft the operational copy required before any paid beta or production
paid launch.

Scope:

- Support contact and response expectation.
- Refund and cancellation policy draft.
- Billing/subscription disclosure draft.
- Privacy and data handling notes.
- Beta caveats if paid open beta is reconsidered.

Risks:

- Copy overclaims account sync, support coverage, or production readiness.
- Refund/cancellation language conflicts with eventual provider behavior.
- Support owner remains unnamed.

Tests:

- Documentation review.
- Safety review against forbidden claims and unsupported runtime behavior.

Exit criteria:

- Draft copy exists.
- Unsupported claims are removed.
- Owner/sign-off gaps are explicit.

## #55 Billing Provider Final Decision

Type: architecture.

Goal: select the billing provider and define integration boundaries after
account and SRS foundations are underway.

Scope:

- Compare provider fit for subscriptions, refunds, invoices, cancellations,
  failed payments, webhooks, test mode, and support workflows.
- Define plan/product model and entitlement source of truth.
- Define no-secret frontend boundary.
- Keep runtime billing out of scope unless explicitly approved.

Risks:

- Choosing billing before account-owned state is ready.
- Under-specifying refund/cancellation/expired states.
- Accidentally adding payment links or SDKs too early.

Tests:

- Documentation review.
- If schemas are added, contract tests for entitlement states.

Exit criteria:

- Provider decision is documented.
- Webhook and entitlement model is defined.
- Implementation remains gated behind explicit approval.

## #56 Test-Mode Entitlement Snapshot Prototype

Type: implementation.

Goal: prototype account-bound entitlement snapshots in test mode before real
payment is introduced.

Scope:

- Add test-mode entitlement states such as free, trialing, active, expired,
  canceled, refunded, disputed, and revoked.
- Tie entitlement snapshots to account IDs.
- Keep payment provider integration mocked or test-only.
- Add audit fields for source, timestamp, and reason.

Risks:

- Frontend trusting local entitlement state.
- Entitlement not revoking access correctly.
- Test-mode behavior leaking into production claims.

Tests:

- Contract tests for entitlement states and transitions.
- UI/access tests only if runtime surfaces are explicitly added.
- Existing local MVP tests to confirm no checkout or billing behavior changed.

Exit criteria:

- Entitlements are server-owned/test-mode, not local proof of payment.
- Revocation and downgrade behavior are represented.
- No real checkout or billing provider runtime exists without approval.

## #57 Production Readiness Rerun

Type: QA.

Goal: rerun production readiness after implementation foundations and decide
whether the launch posture can move from No-Go to Conditional Go or Go.

Scope:

- Re-run validation commands.
- Re-run manual QA for account, sync, migration, SRS, entitlement, staging,
  support copy, analytics, and rollback.
- Update P0 blocker register.
- Record owner sign-off status.

Risks:

- Treating partial implementation as launch readiness.
- Missing support/legal or analytics owner gaps.
- Launching before rollback is rehearsed.

Tests:

- `npm.cmd run typecheck`.
- `npm.cmd run lint`.
- `npm.cmd run build`.
- `npm.cmd run test -- --workers=1`.
- Manual QA against the approved environment.

Exit criteria:

- Updated go/no-go recommendation is documented.
- P0 gaps are closed or explicitly still blocking.
- Owner sign-offs are present before any paid launch.
