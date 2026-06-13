# Account Sync Final Readiness Review

## Purpose

This document is the final implementation readiness review for account sync
after PRs #58 through #63. It consolidates every design, contract, test, safety,
rollout, rollback, and monitoring gate and decides whether real account sync
API route implementation may begin.

Final verdict: **no_go_for_real_api_routes**.

Current implementation phase: **design_only**.

Real API route implementation remains blocked.

## Non-Goals

This review does not add a real backend. It does not add API routes, route
handlers, middleware, runtime route or component integration, real auth,
database persistence, provider SDKs, logging SDKs, validation dependencies,
network calls, browser storage access, environment variable reads, checkout,
billing, subscriptions, entitlement grants, Webflow changes, Cloudflare
Workers, DNS changes, Vercel settings, deployment settings, secrets,
production data access, or `npm audit fix`.

It does not choose an auth provider, database provider, validation library, log
provider, deployment mechanism, or production rollout owner. It does not grant
paid entitlement, sync billing state, or accept local mastery claims as server
mastery.

## Relationship To #58-#63

| PR | Gate added | Current result |
| --- | --- | --- |
| #58 | Route readiness audit and No-Go gate | Design contract complete; real routes still blocked. |
| #59 | Auth ownership boundary | Design contract complete; real auth provider still outstanding. |
| #60 | Durable idempotency and persistence storage design | Design contract complete; real DB and persistence still outstanding. |
| #61 | Schema validation and payload limits | Design contract complete; runtime validator and enforcement still outstanding. |
| #62 | Audit logging and privacy redaction | Design contract complete; production audit/logging implementation still outstanding. |
| #63 | Monitoring, rollout, rollback, and kill switch | Design contract complete; production monitoring, rollback, kill switch, and QA still outstanding. |

These gates define what future implementation must prove. They do not authorize
real route implementation.

## Consolidated Gate Matrix

| Gate group | Source | Status | Severity | Blocks real routes? |
| --- | --- | --- | --- | --- |
| route_readiness | #58 | completed_design_contract | P0 | Yes |
| auth_ownership | #59 | completed_design_contract | P0 | Yes |
| durable_idempotency | #60 | completed_design_contract | P0 | Yes |
| persistence_storage | #60 | completed_design_contract | P0 | Yes |
| schema_validation | #61 | completed_design_contract | P0 | Yes |
| payload_size_limits | #61 | completed_design_contract | P0 | Yes |
| audit_logging | #62 | completed_design_contract | P0 | Yes |
| privacy_redaction | #62 | completed_design_contract | P0 | Yes |
| monitoring_alerting | #63 | completed_design_contract | P0 | Yes |
| rollout_rollback | #63 | completed_design_contract | P0 | Yes |
| kill_switch | #63 | completed_design_contract | P0 | Yes |
| manual_qa | #63 | not_started | P0 | Yes |
| provider_decision | #59 | outstanding_decision | P0 | Yes |
| database_decision | #60 | outstanding_decision | P0 | Yes |
| deployment_decision | #63 | outstanding_decision | P0 | Yes |
| billing_payment_boundary | #58-#63 | completed_design_contract | P0 | Yes |
| paid_entitlement_boundary | #58-#63 | completed_design_contract | P0 | Yes |
| fake_mastery_block | #58-#63 | completed_design_contract | P0 | Yes |
| production_data_safety | #58, #62, #63 | requires_owner_approval | P0 | Yes |

## Completed Design, Contract, And Test Gates

The following design gates are now specified in docs, TypeScript contracts, and
tests:

- Planned account sync route inventory and No-Go gate.
- Server-session ownership boundary and cross-account rejection policy.
- Durable idempotency, replay safety, and duplicate SRS advancement prevention.
- Persistence storage groups and transaction-like apply sequencing.
- Schema validation and payload size limit contract.
- Audit logging taxonomy, privacy redaction, and owner-only digest/audit
  visibility policy.
- Monitoring, alerting, rollout, rollback, incident response, and kill-switch
  design.
- Billing/payment boundary, paid entitlement boundary, fake mastery block, and
  production data safety policy.

## Outstanding Implementation Blockers

Real route implementation is still blocked because:

- No real auth provider integration is selected or implemented in this PR.
- No real database or persistence implementation is selected or implemented in
  this PR.
- No real route handlers exist.
- No runtime schema validator exists.
- No production rate limiting exists.
- No real deployment or rollback mechanism exists.
- No production monitoring provider is integrated.
- No manual QA with authenticated real sessions has been executed.

Each blocker is P0 and must be closed before route handler work begins.

## Final Go/No-Go Verdict

Verdict: **No-Go for real API routes**.

The design/contracts/tests gates are well-defined, but implementation is not
ready. The only approved phase is **design_only**.

## Why Real API Routes Remain Blocked

Real account sync routes would touch owner identity, learning state,
idempotency, audit visibility, and rollback safety. Those are product-critical
boundaries. Without a selected auth provider, selected database provider,
runtime validator, rate limiting, monitoring, rollback evidence, and
authenticated manual QA, implementation would create avoidable integrity and
privacy risk.

The future apply route is especially sensitive because it will mutate review
events, review state, daily stats, saved words, pack progress, idempotency
records, and audit summaries. That route must not exist until the owner
approves the provider, database, and runtime plan.

## Safe Next PR Options

Recommended next PR: **#65 Auth provider final decision and mock integration
boundary**.

Exact recommendation: #65 Auth provider final decision and mock integration boundary.

Other safe #65 options:

- Database persistence provider decision and table design.
- Runtime validator selection and dependency decision.

Do not implement real API routes in #65 unless the owner explicitly approves a
provider, database, runtime validation, rate limit, monitoring, deployment, and
QA plan first.

## Recommended Implementation Sequence

1. Choose the auth provider and define the mock integration boundary.
2. Choose the database provider and approve table, transaction, and migration
   design.
3. Choose the runtime validation library and approve dependency scope.
4. Define production rate limits and abuse response behavior.
5. Implement provider-backed auth/session ownership in a mock or disabled
   boundary.
6. Implement provider-backed persistence behind disabled contracts.
7. Implement runtime schema and payload enforcement.
8. Add monitoring, alerting, rollback, and kill-switch runtime wiring.
9. Execute authenticated manual QA with real sessions and safe test accounts.
10. Run a separate readiness review before any production or limited mutating
    rollout.

## Explicit Warning

Do not implement real account sync routes until the owner approves the provider,
database, and runtime plan. Route files, route handlers, middleware, provider
SDKs, database persistence, validation dependencies, logging integrations,
deployment settings, production data access, and runtime sync integration remain
out of scope.

## Safety Boundaries Recap

- Fake local `Mastered` state must not become server mastery.
- Review events remain the source of truth for SRS state.
- Replay and duplicate review events must not advance SRS twice.
- Account sync must not grant paid entitlement.
- Billing, payment, checkout, invoice, subscription, and billing portal
  behavior stay outside sync.
- Digest, audit, metrics, and alerts must not expose raw payloads, provider
  tokens, production secrets, or full account state.
- Client-provided account ids are not ownership proof.
- Cross-account preview, apply, digest, and audit access must be rejected.
- Blocked plans must stop before learning-state writes.

## Production QA Prerequisites

Before any production or limited mutating rollout, manual QA must prove:

- Authenticated preview rejects malformed, oversized, cross-account, paid
  entitlement, billing, and fake mastery inputs without mutation.
- Authenticated apply writes only after auth ownership, schema, payload,
  idempotency, and blocked-plan gates pass.
- Digest remains owner-only, bounded, redacted, and metadata-only.
- Audit returns redacted summaries only.
- Kill switch disables mutating apply while safe diagnostics remain bounded and
  owner-only.
- Rollback preserves idempotency records, audit summaries, review events,
  review state, saved words, daily stats, and pack evidence.
- Idempotency replay returns stored outcomes and cannot advance SRS twice.
- Monitoring and alerting cover preview, apply, digest, audit, rejection
  categories, latency, error rate, and kill-switch activation.
