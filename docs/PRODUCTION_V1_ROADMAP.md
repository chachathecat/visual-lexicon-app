# Production v1 Roadmap

Roadmap date: 2026-06-11

Scope: Track B production planning only. This roadmap does not authorize
checkout, payment SDKs, subscription behavior, Webflow publishing, Cloudflare
production Worker changes, auth implementation, DNS changes, deployment changes,
secrets, production data mutation, AI Tutor functionality, or multilingual page
generation.

## Roadmap Summary

Visual Lexicon Track B should not launch as a full paid SaaS until production
foundations exist. The local learning MVP is strong enough to guide the next
phase, but the next phase must be account persistence, server-side SRS sync,
billing/entitlement design, deployment readiness, analytics/reporting, and
launch QA.

Recommended issue/PR sequence:

1. #41 Auth/account persistence architecture
2. #42 Server-side saved/review SRS sync
3. #43 Billing/entitlement architecture
4. #44 Production deployment/domain readiness
5. #45 Production analytics/reporting
6. #46 Production release QA
7. #47 Public paid launch decision

## Phase 1: Account Persistence

Goal:

Define how a learner owns an account and how local progress becomes durable
account progress.

Scope:

- Select and document the auth/account architecture.
- Define user/account IDs, session model, and recovery model.
- Define guest-to-account migration for existing local storage progress.
- Define signed-out behavior and account deletion/export support path.
- Keep implementation planning separate from real auth rollout unless explicitly
  approved.

Files likely touched:

- `docs/PRODUCTION_V1_GAP_AUDIT.md`
- `docs/PRODUCTION_V1_ROADMAP.md`
- `docs/PRODUCTION_V1_RELEASE_CRITERIA.md`
- Future auth architecture docs.
- Future account data model docs.
- Future tests under `tests/` only when implementation begins.

Risks:

- Progress ownership can become ambiguous between browser local storage and
  account state.
- Recovery and migration can accidentally duplicate review state.
- Account wording can imply production sync before sync exists.

Tests:

- Documentation phase: validation commands only.
- Implementation phase: auth session tests, guest migration tests, signed-out
  access tests, and account recovery smoke tests.

Exit criteria:

- Account architecture is documented and reviewed.
- Guest-to-account migration behavior is specified.
- No buyer-facing copy promises sync before it exists.
- Next phase has enough account identifiers to design server-side SRS state.

## Phase 2: Server-Side SRS Sync

Goal:

Move saved words, review state, review events, daily stats, and pack progress
from browser-only ownership to durable server-side account state while
preserving SRS truth.

Scope:

- Define server-side schema for saved words, review state, events, daily stats,
  and pack progress.
- Preserve the existing required review state and review event fields.
- Define local-to-server migration and retry behavior.
- Define conflict handling across devices.
- Ensure Due, Weak, and Mastered selectors derive from server state.
- Keep local storage as a migration/cache surface only if the architecture
  explicitly allows it.

Files likely touched:

- Future server/data layer modules.
- Future SRS storage and sync modules.
- Existing SRS contract files under `src/lib/`.
- Existing review/save/dashboard views only as needed to read/write server
  state.
- Tests covering SRS selectors, review writes, migration, and idempotency.
- Docs describing storage keys and account-state contracts.

Risks:

- Duplicate review events can over-advance SRS boxes.
- Offline or stale local state can overwrite newer server state.
- Mastered status can become fake if delayed recall rules are not preserved.
- Server failures can block review unless retry/error states are designed.

Tests:

- Unit tests for SRS reducer and selectors.
- Integration tests for save -> review -> server state/event writes.
- Idempotency tests for duplicate answer submission.
- Cross-device sync tests for due, weak, and mastered state.
- Migration tests from local storage to account state.

Exit criteria:

- Server-side SRS source of truth is documented and implemented.
- Save and review writes are durable and idempotent.
- Due, Weak, and Mastered remain derived from real server state.
- Existing local MVP regression tests still pass or have intentional server-side
  replacements.

## Phase 3: Billing And Entitlement

Goal:

Design and implement paid access in a way that is auditable, revocable, and tied
to account state.

Scope:

- Select billing provider and document integration boundaries.
- Define product, price, plan, subscription, trial, refund, and cancellation
  states.
- Define webhook processing and entitlement state transitions.
- Define frontend entitlement reads from server-side account state.
- Define support and refund handling for billing edge cases.
- Add checkout or payment SDK only after explicit approval for real payment
  work.

Files likely touched:

- Future billing architecture docs.
- Future entitlement server modules.
- Future webhook route or worker only if explicitly approved.
- Existing local entitlement modules when replacing local-only plan state.
- Pricing/settings UI only after product/legal copy is approved.
- Tests for entitlement state and billing events.

Risks:

- Frontend-only entitlement checks can be bypassed.
- Failed, refunded, canceled, or disputed payments can leave paid access active.
- Pricing copy can overpromise features not yet launched.
- Billing implementation can accidentally touch secrets or production settings.

Tests:

- Entitlement state machine tests.
- Webhook signature and idempotency tests.
- Checkout initiation tests when authorized.
- Refund/cancel/expired-plan tests.
- UI tests for free, paid, expired, and refunded states.
- No-secret and no-client-token exposure checks.

Exit criteria:

- Billing architecture is approved.
- Entitlement records are server-side and account-bound.
- Refund/cancellation/failed-payment behavior is tested.
- Pricing copy is reviewed for allowed claims.
- No real payment is launched without final go/no-go approval.

## Phase 4: Production Deployment Readiness

Goal:

Prepare the production runtime, domain posture, monitoring, rollback, and
release ownership needed for public paid launch.

Scope:

- Define staging and production environments.
- Confirm domain plan for `app.visuallexicon.org`.
- Inventory environment variables and secret ownership.
- Add monitoring/error reporting plan.
- Define rollback and incident procedures.
- Confirm separation from Track A Webflow and Cloudflare production Workers.

Files likely touched:

- Deployment readiness docs.
- Release checklist docs.
- Environment variable documentation.
- Monitoring/runbook docs.
- App configuration files only if explicitly approved for deployment work.

Risks:

- Production and staging can drift.
- Secrets can leak into frontend code or docs.
- Deployment changes can accidentally affect Track A.
- Rollback can be unclear during a billing or sync incident.

Tests:

- Build and smoke checks in staging.
- Environment variable validation.
- Production-domain smoke test plan.
- Rollback rehearsal.
- Monitoring alert test.

Exit criteria:

- Staging and production responsibilities are documented.
- Rollback owner and procedure are explicit.
- Monitoring covers app health, review writes, sync writes, billing webhooks,
  pack loading, and key funnel failures.
- Track A and Track B boundaries are confirmed.

## Phase 5: Launch QA

Goal:

Prove the production system works end to end before any public paid launch
claim.

Scope:

- Execute golden flows across account, save, review, SRS sync, billing,
  entitlement, analytics, content, support, and deployment.
- Validate support/refund/cancellation paths.
- Validate production claims and prohibited claims.
- Record residual risks, rollback, and launch owner sign-off.

Files likely touched:

- `docs/golden_user_flows.md`
- `docs/release_checklist.md`
- Future production QA docs.
- Tests under `tests/`.
- Release notes and launch sign-off docs.

Risks:

- Local MVP tests can pass while production sync or entitlement flows fail.
- Manual QA can miss account state edges unless seeded accounts are prepared.
- Analytics can overcount events due to retry or client duplication.
- Support and refund workflows can be untested until real users are affected.

Tests:

- Required validation commands.
- Browser QA on staging.
- Account migration and cross-device QA.
- Server-side SRS sync QA.
- Billing webhook and entitlement QA.
- Analytics reporting QA.
- Legal/support/refund copy review.
- Rollback rehearsal.

Exit criteria:

- No P0 launch blockers remain.
- P1 risks are either fixed or explicitly accepted by the owner.
- Support/refund/legal copy is published and reviewed.
- Validation results and manual QA notes are recorded.
- Launch recommendation is documented as go, no-go, or conditional go.

## Phase 6: Public Paid Launch

Goal:

Launch Visual Lexicon Track B as a real paid SaaS only after production systems
and operational support are ready.

Scope:

- Final go/no-go decision.
- Confirm pricing, plan claims, refund/cancellation copy, support path, and
  launch monitoring.
- Enable public paid access only after explicit approval.
- Monitor activation, Weekly Reviewed Words, errors, support volume, refunds,
  and cancellations.
- Prepare post-launch review and rollback window.

Files likely touched:

- Launch decision doc.
- Release notes.
- Support/refund/legal docs.
- Production monitoring/reporting docs.
- Runtime billing/deployment files only if already approved and implemented in
  earlier phases.

Risks:

- Users can pay before account persistence or entitlement behavior is reliable.
- Public copy can create expectations that the product cannot support.
- Early failures can damage trust if support and rollback are not ready.
- Launch metrics can focus on payment conversion instead of weekly review
  behavior.

Tests:

- Final required validation commands.
- Final staging smoke.
- Production smoke after deployment.
- Payment test mode or approved low-risk payment verification.
- Support/refund workflow dry run.
- Analytics dashboard verification for launch cohort.

Exit criteria:

- Public paid launch decision is approved and recorded.
- Account, SRS sync, billing, entitlement, deployment, analytics, support,
  refund, legal, content, and QA gates are satisfied.
- Rollback and stop-sales criteria are ready.
- Product claims match implemented systems.
- Launch is monitored against Weekly Reviewed Words and support burden, not only
  revenue.
