# Billing Rollout Plan

Plan date: 2026-06-11

Scope: Track B billing and entitlement rollout planning only. This plan does
not authorize real payment, provider SDKs, checkout, webhook processing,
subscriptions, payment links, billing portals, secrets, Webflow changes,
Cloudflare Worker changes, DNS changes, production data mutation, or deployment.

## Phase 0: Architecture Only

Goal:

Document billing architecture, data model, provider options, rollout phases, and
release criteria before implementation.

Scope:

- Add billing entitlement architecture docs.
- Link docs from README Production v1 Planning.
- Optionally add disconnected type-only contracts.
- Keep runtime behavior unchanged.

Risks:

- Docs can be mistaken for launch readiness.
- Provider comparison can become stale.
- Placeholder pricing may still look like real paid access if copy is not kept
  clear.

Tests:

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test -- --workers=1`

Exit criteria:

- Docs are linked and explicit that no real billing exists.
- No provider SDK, checkout, webhook, subscription, or payment behavior is
  added.
- Recommended next PR is #44 Production deployment/domain readiness.

Rollback plan:

- Revert documentation, README links, and disconnected type-only contracts.

## Phase 1: Entitlement Typed Contracts And Mocks

Goal:

Define compile-time entitlement vocabulary and mock fixtures without connecting
real billing.

Scope:

- Add pure TypeScript plan IDs, entitlement statuses, subscription statuses,
  pack purchase statuses, billing event types, and snapshot shapes.
- Add mock fixtures only if clearly labeled non-production and disconnected.
- Add tests for pure helpers only if helpers are introduced.

Risks:

- Mocks can be mistaken for production access.
- Types can drift from docs.
- Runtime imports can accidentally change app behavior.

Tests:

- Typecheck and lint.
- Unit tests for pure status derivation if helpers exist.
- Existing Save -> Review -> SRS regression tests.

Exit criteria:

- Contracts compile.
- Mocks are disconnected from app runtime.
- No billing provider, database, auth, or network dependency is imported.

Rollback plan:

- Remove typed contracts/mocks and helper tests.
- Keep planning docs if still accurate.

## Phase 2: Billing Provider Decision

Goal:

Choose a provider strategy only after operational requirements are known.

Scope:

- Re-check official provider docs and terms.
- Decide MoR versus non-MoR ownership.
- Decide subscriptions, one-time packs, refunds, cancellations, failed
  payments, receipts, tax/VAT, support, and Korea/operator fit.
- Produce explicit approval before implementation.

Risks:

- Selecting a provider before account/sync readiness can force unsafe access
  shortcuts.
- MoR assumptions can be wrong or outdated.
- Korea payout/payment-method requirements can block launch late.

Tests:

- No runtime tests unless decision tooling is added.
- Review checklist for provider requirements, tax, refund, support, and legal
  copy.

Exit criteria:

- Provider decision is recorded with owner approval.
- Tax/support/refund/legal responsibilities are assigned.
- No checkout or SDK is added without a separate implementation PR.

Rollback plan:

- Reopen provider decision before implementation.
- Keep no-payment private beta posture.

## Phase 3: Test-Mode Checkout And Webhook Contract Behind Feature Flag

Goal:

Validate provider event contracts in test mode without enabling production
payment.

Scope:

- Add provider test-mode checkout creation only behind an explicit server-side
  feature flag.
- Add webhook signature verification and idempotency.
- Quarantine unmatched provider events.
- Recompute entitlement snapshots from accepted events.
- Keep production checkout disabled by default.

Risks:

- Feature flag mistakes can expose payment UI.
- Webhook retries can duplicate grants.
- Checkout completion can be incorrectly trusted before server events arrive.

Tests:

- Webhook signature tests.
- Idempotency and duplicate event tests.
- Subscription state transition tests.
- Pack purchase transition tests.
- Feature flag disabled tests.

Exit criteria:

- Test-mode events produce correct internal snapshots.
- Duplicate and out-of-order events are safe.
- Production payment remains disabled.

Rollback plan:

- Disable feature flag.
- Stop checkout creation.
- Keep event logs for diagnosis.

## Phase 4: Entitlement QA

Goal:

Prove app surfaces gate from server entitlement snapshots without corrupting
learning state.

Scope:

- Test Guest, Free, Lite, Pro, pack purchase, expired, refunded, canceled,
  failed-payment, and manual grant states.
- Verify saved/review SRS flows still write real events and state.
- Verify localStorage cannot grant paid access.
- Verify account hydration uses server snapshots.

Risks:

- Paid gates can block core review incorrectly.
- Downgrade can hide data instead of only limiting paid surfaces.
- Local cache can override server revocation.

Tests:

- Entitlement selector and route gating tests.
- Save/review regression tests.
- Cross-device entitlement hydration QA.
- Manual golden-flow QA for pricing, paywall, review, packs, and settings.

Exit criteria:

- Entitlement gates match snapshots.
- SRS state remains source of truth for Due, Weak, and Mastered.
- Downgrade/refund preserves learning data.

Rollback plan:

- Disable paid gates.
- Fall back to Free/local beta surfaces.
- Preserve entitlements and learning data for repair.

## Phase 5: Refund, Cancel, And Support QA

Goal:

Validate the operational paths users need after payment.

Scope:

- Test refund, chargeback, cancellation at period end, immediate cancellation,
  failed payment, expired plan, duplicate payment, receipt lookup, and support
  repair.
- Verify audit logs and user-facing support copy.
- Rehearse stop-sales.

Risks:

- User pays but support cannot locate account or receipt.
- Refund does not revoke access or revokes the wrong access.
- Failed-payment policy is unclear.
- Support repairs are unaudited.

Tests:

- Provider sandbox refund/cancel tests.
- Entitlement recomputation tests.
- Audit log tests.
- Manual support runbook rehearsal.

Exit criteria:

- Support owner can resolve access and refund cases.
- All billing support actions are auditable.
- User-facing refund/cancel/support copy is approved.

Rollback plan:

- Stop sales.
- Disable checkout.
- Continue processing refunds/cancellations.
- Repair snapshots from event and audit logs.

## Phase 6: Production Billing Readiness Sign-Off

Goal:

Decide whether production paid billing can be enabled.

Scope:

- Review auth, server SRS sync, billing, entitlement, support, refund, legal,
  analytics, deployment, monitoring, and rollback evidence.
- Record go/no-go decision.
- Confirm production provider configuration, but do not deploy without explicit
  release approval.

Risks:

- Passing billing tests can be mistaken for full production readiness.
- Deployment/domain gaps can still block safe launch.
- Legal/support copy can lag implementation.

Tests:

- Full validation commands.
- Provider sandbox test suite.
- Staging manual QA.
- Stop-sales and rollback rehearsal.
- Monitoring and alert checks.

Exit criteria:

- No P0 gaps remain.
- Owner signs production billing readiness.
- Stop-sales owner and support owner are assigned.
- Production paid launch is still a separate final release decision.

Rollback plan:

- Keep billing disabled.
- Continue no-payment/private beta operation.
- Resolve blockers before re-running sign-off.

## Recommendation

Do not implement real payment or paid launch until auth/account persistence,
server-side SRS sync, billing entitlement architecture, support/refund/legal
copy, and production deployment readiness are validated.
