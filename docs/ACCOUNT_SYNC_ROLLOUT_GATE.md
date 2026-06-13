# Account Sync Rollout Gate

## Purpose

This document defines the monitoring, rollout, rollback, incident response, and
kill-switch gate required before any future account sync API route can exist.
It is a design-only contract for Track B account sync readiness.

Current rollout phase: `design_only`.

Final verdict: `design_only`, not implementation-ready.

## Non-Goals

This PR does not create API routes, route handlers, middleware, runtime
components, real auth, database persistence, provider SDKs, logging SDKs,
validation dependencies, payment behavior, billing behavior, environment
configuration, deployment/provider integration, or production data changes.

This PR does not touch Webflow, Cloudflare Workers, DNS, Vercel settings,
deployment settings, secrets, billing, checkout, subscriptions, production user
data, or paid entitlement state.

## Relationship To Prior Gates

- PR #58 defined the route readiness audit and No-Go gate.
- PR #59 defined the auth ownership boundary contract.
- PR #60 defined durable idempotency and persistence storage design.
- PR #61 defined schema validation and payload size limit contracts.
- PR #62 defined audit logging and privacy redaction policy.

This gate depends on all of them. It does not supersede any P0 blocker from
#58 through #62. Future production enablement remains blocked until those P0
gates are satisfied and this rollout gate is implemented in a separate approved
workstream.

## Production Enablement Checklist

Production enablement is blocked until all P0 gates are satisfied:

- Route readiness P0 gates from #58 are closed.
- Auth ownership boundary from #59 is implemented and owner approved.
- Durable idempotency storage and transaction-like persistence from #60 are
  implemented.
- Schema validation and payload size limits from #61 are implemented.
- Audit redaction, retention, digest, and audit visibility policies from #62
  are implemented.
- Monitoring metrics and owner escalation alerts are integrated.
- Emergency kill switch can disable mutating apply.
- Rollback and replay procedures preserve idempotency records, audit summaries,
  and production learning evidence.
- Manual QA covers preview, apply, digest, audit, kill switch, rollback,
  idempotency replay, blocked plans, fake mastery, paid entitlement and billing
  boundaries, and privacy redaction.
- Owner approval is recorded after all evidence exists.

## Kill-Switch Policy

The apply route must have an emergency kill switch before any production or
limited mutating rollout. The kill switch must:

- Disable mutating apply independently from the rest of the app.
- Prevent learning-state writes while active.
- Allow safe read-only diagnostics only when owner-only, bounded, and redacted.
- Exclude raw guest snapshots, raw server payloads, provider tokens, production
  secrets, billing payloads, and full account state from diagnostics.
- Emit a kill-switch-active monitoring signal in a future implementation.

## Apply Disable Modes

- `apply_route_not_created`: the current state for this PR.
- `mutating_apply_disabled`: apply exists in a future route but refuses
  mutation.
- `shadow_mode_no_mutation`: future apply plans may be evaluated without
  writing learning state.
- `read_only_diagnostics_only`: only bounded owner-only digest and audit
  diagnostics remain available.
- `full_account_sync_disabled`: all account sync surfaces are disabled.

## Rollout Phase Table

| Phase | Mutating apply | Production traffic | Policy |
| --- | --- | --- | --- |
| `design_only` | No | No | Static docs/contracts/tests only. |
| `local_contracts` | No | No | Local contracts can expand without route handlers. |
| `mocked_handler_harness` | No | No | Non-production mocks only. |
| `internal_preview_only` | No | No | Read-only preview after auth, schema, payload, and rate-limit gates. |
| `staff_only_apply_disabled` | No | No | Staff diagnostics only with apply disabled. |
| `limited_apply_shadow_mode` | No | No | Apply plans are evaluated but do not mutate learning state. |
| `limited_apply_enabled` | Yes | No | Requires kill switch, rollback, replay, monitoring, QA, and owner approval. |
| `production_enabled` | Yes | Yes | Requires every P0 gate and manual QA requirement. |
| `rollback_required` | No | No | Apply is disabled while recovery and replay checks run. |
| `disabled` | No | No | Diagnostics may remain only if safe, bounded, redacted, and owner-only. |

## Monitoring Metric Taxonomy

Future monitoring must cover:

- Preview: `account_sync_preview_requested`,
  `account_sync_preview_rejected`.
- Apply: `account_sync_apply_requested`, `account_sync_apply_accepted`,
  `account_sync_apply_replayed`, `account_sync_apply_blocked`,
  `account_sync_apply_rejected`, `account_sync_apply_conflict`.
- Validation and ownership: `account_sync_schema_rejected`,
  `account_sync_payload_too_large`, `account_sync_ownership_rejected`.
- Idempotency: `account_sync_idempotency_conflict`.
- Safety boundaries: `account_sync_fake_mastery_blocked`,
  `account_sync_paid_entitlement_ignored`,
  `account_sync_billing_payload_rejected`.
- Diagnostics: `account_sync_digest_requested`,
  `account_sync_digest_rejected`, `account_sync_audit_requested`,
  `account_sync_audit_rejected`.
- Operations: `account_sync_latency_p95`, `account_sync_error_rate`,
  `account_sync_kill_switch_active`.

Metrics must be owner scoped, must not contain raw payloads, and must not imply
approval to integrate a logging provider in this PR.

## Alert Severity Policy

- `SEV0`: suspected learning-state corruption, privacy exposure, cross-account
  access, fake mastery acceptance, paid entitlement mutation, or billing/payment
  mutation. Activate the kill switch and escalate to product engineering and the
  founder/operator.
- `SEV1`: apply rejection spike, idempotency conflict spike, replay anomaly,
  route error-rate spike, or missing kill-switch signal. Activate the kill
  switch when apply may be unsafe.
- `SEV2`: sustained preview, digest, audit, or latency failures during a
  controlled rollout. Escalate to product engineering and document the incident.
- `SEV3`: informational rollout telemetry that does not affect users or safety
  boundaries.

## Incident Response Policy

During any account sync incident:

1. Activate the apply kill switch when mutation integrity is uncertain.
2. Confirm mutating apply cannot write learning state.
3. Keep diagnostics available only if owner-only, bounded, and redacted.
4. Inspect preview, apply, digest, audit, rejection, latency, and error metrics.
5. Preserve idempotency records and redacted audit summaries.
6. Verify no production review events, review state, saved words, daily stats,
   or pack evidence were deleted.
7. Verify idempotency replay returns stored outcomes and cannot advance SRS
   twice.
8. Escalate fake mastery, privacy, paid entitlement, billing, and cross-account
   incidents as `SEV0`.
9. Record owner approval before any re-enable attempt.
10. Require a separate readiness review before leaving `rollback_required` or
    `disabled`.

## Rollback Policy

Rollback must begin by disabling mutating apply. It must preserve:

- Durable idempotency records.
- Redacted audit summaries.
- Accepted review events.
- Review state derived from event evidence.
- Saved words.
- Daily stats.
- Pack evidence and audit-only pack markers.

Rollback must not delete production user learning evidence. Replay after
rollback must use stored idempotency outcomes and must not advance SRS twice.

## Recovery Runbook

The recovery runbook is:

1. Activate emergency apply disablement.
2. Freeze mutating apply.
3. Confirm read-only diagnostics are owner-only, bounded, and redacted.
4. Inspect operational metrics and rejection categories.
5. Preserve idempotency and audit records.
6. Verify learning evidence was not deleted.
7. Replay idempotency without mutation.
8. Classify privacy, entitlement, billing, fake mastery, or cross-account
   incidents.
9. Document owner approval.
10. Prepare a separate re-enablement review.

## Manual QA Checklist

Manual QA must cover:

- Preview rejects malformed, oversized, cross-account, paid entitlement,
  billing, and fake mastery inputs without mutation.
- Apply writes only after auth, schema, payload, idempotency, and blocked-plan
  gates pass.
- Digest remains owner-only, bounded, redacted, and summary-only.
- Audit returns redacted summaries only.
- Kill switch disables mutating apply while safe diagnostics remain bounded and
  owner-only.
- Rollback preserves idempotency records, audit summaries, and production
  learning evidence.
- Idempotency replay after rollback returns stored outcomes without advancing
  SRS twice.
- Blocked plans stop before learning-state writes.
- Fake mastery cannot become server mastery.
- Paid entitlement, checkout, billing, invoice, and subscription payloads do
  not mutate account sync state.
- Privacy redaction excludes raw snapshots, raw server payloads, provider
  tokens, production secrets, and full account state.

## Shadow Mode Policy

Shadow mode may compare proposed apply plans and expected audit summaries, but
it must not mutate saved words, review events, review state, daily stats, pack
progress, entitlement state, billing state, or production data. Shadow mode
must not create a path where local Mastered claims become server Mastered state.

## Fake Mastery Incident Policy

Any accepted server mastery claim that does not come from review-event evidence
and delayed recall is a `SEV0` incident. Apply must be disabled, affected
idempotency and audit summaries must be preserved, and re-enablement must wait
for owner approval and a separate readiness review.

## Paid Entitlement And Billing Boundary Incident Policy

Account sync must not grant paid entitlement, create checkout, mutate billing
state, open a billing portal, create invoices, process subscriptions, or store
payment payloads. Any attempt that crosses this boundary is a `SEV0` incident
and must activate the apply kill switch.

## Privacy Incident Policy

Digest, audit, metrics, alerts, and incident notes must exclude raw guest
snapshots, raw server payloads, provider tokens, production secrets, billing
payloads, and full account state. Any cross-account read or raw payload exposure
is a `SEV0` incident.

## P0 Blockers Still Remaining

- No real API route implementation is approved.
- No real auth ownership boundary is implemented.
- No database persistence adapter is implemented.
- No durable idempotency store is implemented.
- No transaction or rollback mechanism is implemented.
- No production schema validation or payload limit enforcement is implemented.
- No route rate limiting is implemented.
- No production audit retention, redaction, or owner-only read path is
  implemented.
- No monitoring provider integration is implemented.
- No kill switch exists in runtime code.
- No production rollout, rollback, replay, or incident response evidence exists.
- No manual QA evidence exists for future account sync routes.

## Final Verdict

Account sync remains `design_only` and not implementation-ready. Production
enablement and real route implementation are blocked until all P0 gates from
#58 through #63 are satisfied in separate approved work.

## Next Recommended PR

PR #64 should be Account sync final implementation readiness review, still
docs/contracts/tests only. Do not begin real API route implementation yet.
