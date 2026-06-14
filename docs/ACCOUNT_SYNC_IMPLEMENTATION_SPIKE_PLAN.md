# Account Sync Implementation Spike Plan

## Purpose

This document defines PR #68: a disabled and mock-gated implementation spike
plan for future account sync API work.

The goal is to make the next implementation sequence explicit without creating
real API routes, route handlers, middleware, runtime integration, provider
integrations, database persistence, validator dependencies, production
configuration, or production behavior.

Final verdict: `design_only`; real routes still blocked.

## Non-Goals

This PR does not add real account sync routes, route handlers, middleware,
runtime route or component integration, real auth, database persistence,
provider SDKs, validation packages, logging or observability providers, network
helper calls, browser storage access, environment configuration, billing,
payment, checkout, invoice, subscription, billing portal behavior, paid
entitlement grants, production data access, migrations, executable schemas,
Webflow changes, Cloudflare Worker changes, DNS changes, Vercel or deployment
setting changes, secrets, or `npm audit fix`.

It does not grant paid access, fake mastery, server-side account persistence,
or production account sync behavior.

## Relationship To #58-#67

| PR | Gate | Relationship |
| --- | --- | --- |
| #58 | Route readiness audit and No-Go gate | Real account sync API routes remained blocked. |
| #59 | Auth ownership boundary | Owner-only access must come from a server-derived session boundary. |
| #60 | Durable idempotency and persistence storage design | Apply needs account-scoped idempotency and replay safety before mutation. |
| #61 | Schema validation and payload size limits contract | Future routes need validation before conflict resolution, idempotency, or writes. |
| #62 | Audit logging and privacy redaction policy | Digest, audit, validation errors, metrics, and audit summaries must be redacted. |
| #63 | Monitoring, rollout, rollback, and kill-switch gate | Enablement requires monitoring, rollback, kill switch, and manual QA evidence. |
| #64 | Final implementation readiness review | Real routes stayed No-Go and needed provider, DB, and validator decisions first. |
| #65 | Auth provider final decision | Auth provider-specific code must stay outside account sync core. |
| #66 | DB persistence provider decision | DB provider-specific code must stay behind an owner-scoped persistence adapter. |
| #67 | Runtime validator decision | Validator-specific code must stay behind a normalized validation adapter. |

These prior PRs define the gates. PR #68 does not satisfy them with runtime
implementation.

## Current Phase

Current phase: `design_only`.

Implementation allowed: false.
Real routes allowed: false.
Production enabled: false.

This PR is docs, contracts, and tests only. It creates no route files and
changes no production app behavior.

## Future Route Plan

| Route | Method | Policy |
| --- | --- | --- |
| `/api/account/sync/preview` | `POST` | Future-only, disabled by default, mock-gated, read-only, owner-only, bounded, redacted. |
| `/api/account/sync/apply` | `POST` | Future-only, disabled by default, mock-gated, mutating only after every gate and explicit owner approval. |
| `/api/account/sync/digest` | `GET` | Future-only, disabled by default, mock-gated, owner-only, bounded, redacted, no full sensitive state. |
| `/api/account/sync/audit` | `GET` | Future-only, disabled by default, mock-gated, owner-only, bounded, redacted summaries only. |

No route file for any of these paths is created in PR #68.

## Disabled-By-Default Policy

Any future route skeleton must start disabled by default. A disabled skeleton
must not serve production traffic, read production account data, write learning
state, call provider services, grant entitlement, or change app behavior.

Disabled status cannot be relaxed by default configuration. Owner approval and
documented gate evidence are required before preview, shadow, or apply stages.

## Mock-Gated Policy

Any future spike must be mock-gated before provider integration. Mock-only
interfaces must prove route shape, validation flow, idempotency behavior,
redaction, and stop conditions before real auth, DB, validator, monitoring, or
audit providers are integrated.

Provider-specific auth, DB, and validator code must remain outside account sync
core. Account sync core may receive only normalized principal, persistence, and
validation decisions.

## Implementation Sequence

1. Reconfirm owner approval and No-Go-to-Go criteria.
2. Add provider-neutral route skeleton only in a future separate PR.
3. Keep route skeleton disabled and mock-only.
4. Add runtime validator adapter in a future separate PR after dependency approval.
5. Add auth adapter in a future separate PR after provider approval.
6. Add persistence adapter in a future separate PR after DB/provider approval.
7. Add durable idempotency storage in a future separate PR.
8. Add audit redaction writer in a future separate PR.
9. Add monitoring and kill switch in a future separate PR.
10. Run internal/staff-only QA.
11. Run shadow mode with no mutation.
12. Enable preview read-only only after gates.
13. Enable apply only after explicit owner approval.

Every step above is future work. None of these implementation steps are
performed in PR #68.

## Stop Conditions

Stop before route work or disable apply if any of these occur:

- Auth ambiguity.
- Cross-account risk.
- Validation leakage.
- Raw payload exposure.
- Idempotency conflict acceptance.
- Fake mastery acceptance.
- Paid entitlement mutation.
- Billing or payment boundary crossing.
- Missing rollback.
- Missing kill switch.
- Production data access.
- Monitoring failure.
- Provider-specific code entering sync core.
- Shadow mode mutation.

Resuming after any P0 stop condition requires explicit owner decision and a
separate PR.

## Apply Disable Policy

Apply remains explicitly disabled. It cannot mutate saved words, review events,
review state, daily stats, pack progress, audit records, entitlement, billing,
or production data in PR #68.

Future apply can only be enabled after auth, DB, validator, idempotency, audit,
monitoring, rollback, kill-switch, manual QA, production data safety, and owner
approval gates are satisfied.

## Preview Read-Only Policy

Preview must be read-only. It may plan conflicts in a future route, but it must
not write review events, review state, saved words, daily stats, pack progress,
audit records, entitlement, billing state, or production data.

## Digest/Audit Policy

Digest and audit must be owner-only, bounded, and redacted. They must not expose
full account state, raw guest snapshots, raw server payloads, provider tokens,
production secrets, billing payloads, payment payloads, or paid entitlement
state.

Audit returns summaries only. Digest returns account-state metadata only.

## Kill-Switch Requirement

Apply must have a kill switch before any real mutation. The kill switch must
disable mutating apply without disabling safe owner-only, bounded, redacted
diagnostics.

Missing kill switch is a P0 stop condition.

## Monitoring Requirement

Monitoring must exist before route enablement. Future work must track preview,
apply, digest, audit, rejection categories, idempotency conflicts, fake mastery
blocks, paid entitlement boundary attempts, billing boundary attempts, latency,
error rate, and kill-switch activation.

Monitoring output must be owner-scoped and must not contain raw payloads.

## Rollback Requirement

Rollback must be defined before apply enablement. The first rollback action is
to disable mutating apply. Rollback must preserve idempotency records, audit
summaries, review events, review state, saved words, daily stats, and pack
evidence.

Rollback must not delete production learning evidence. Replay after rollback
must not advance SRS twice.

## Manual QA Requirement

Manual QA with real authenticated sessions is required before production
enablement. QA must cover:

- Preview read-only behavior.
- Apply disabled behavior.
- Digest owner-only bounded reads.
- Audit owner-only redacted summaries.
- Shadow mode with no mutation.
- Idempotency replay.
- Same-key/different-fingerprint conflicts.
- Kill switch behavior.
- Rollback behavior.
- Fake mastery blocking.
- Paid entitlement boundary.
- Billing/payment boundary.
- Production data safety.

No production-enabled route can ship without these notes.

## Auth Adapter Boundary

Auth provider-specific code must remain outside account sync core. Future auth
work must normalize provider-specific session data into a server-derived owner
principal before sync core runs.

Client-provided account ids are never ownership proof.

## DB Adapter Boundary

DB provider-specific code must remain outside account sync core. Future DB work
must use an owner-scoped persistence port and must preserve transaction-like
apply semantics.

No database provider SDK, migration, executable schema, or production data
change is added in PR #68.

## Validator Adapter Boundary

Runtime validator-specific code must remain behind a validation adapter
boundary. Future validation work must normalize failures into safe paths, codes,
expected kinds, and size classes before sync core sees them.

No validation dependency is added in PR #68.

## Idempotency Policy

Apply requires durable account-scoped idempotency before mutation. Same account,
same route, same key, and same request fingerprint may replay the stored
outcome without mutation. Same key with a different request fingerprint must be
rejected.

Duplicate review event replay must not advance SRS twice.

## Audit Redaction Policy

Audit and diagnostics must use redacted summaries only. They may include route
ids, safe reason codes, safe counts, bounded summary metadata, and timestamps.

They must not include raw guest snapshots, raw account state, raw validation
values, provider tokens, production secrets, billing payloads, payment payloads,
checkout payloads, subscription payloads, paid entitlement payloads, or full
account state.

## Fake Mastery Blocking

Fake mastery remains blocked. Review events remain the SRS source of truth.
Server mastery cannot come from imported local labels or unsupported client
claims; it requires delayed recall evidence.

## Paid Entitlement Boundary

Account sync cannot grant paid entitlement. Upgrade interest remains
attribution-only and cannot become plan state, entitlement state, checkout
state, subscription state, or billing state.

## Billing And Payment Boundary

Billing, payment, checkout, invoice, subscription, and billing portal behavior
remain outside account sync. Future routes must reject those payload families
at the sync boundary.

## Production Data Safety

PR #68 touches no production data. Any future disabled or mock-gated spike must
also avoid production data until explicit owner approval covers access,
retention, rollback, privacy, deletion, and QA.

Production data access during a disabled/mock spike is a P0 stop condition.

## Final Verdict

Final verdict: `design_only`; real routes still blocked.

PR #68 defines a future implementation sequence and safety boundary only. It
does not authorize real API routes.

## Next Recommended PR

#69 Account sync route skeleton decision, still disabled/mock-gated and
requiring explicit owner approval before any route files are created.

Do not implement real API route files in #68.
