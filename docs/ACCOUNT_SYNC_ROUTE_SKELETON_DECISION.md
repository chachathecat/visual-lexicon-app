# Account Sync Route Skeleton Decision

## Purpose

This document defines PR #69: a design-only account sync route skeleton
decision.

It decides the future conditions under which disabled account sync route
skeleton files may be proposed. It does not create the skeleton files.

Final verdict: `design_only`, no route skeleton created.

## Non-Goals

This PR does not add actual API routes, route handlers, middleware, runtime
route or component integration, real auth, database persistence, Supabase,
Prisma, Drizzle, Neon, Firebase, Cloudflare D1, provider SDKs, validation
dependencies, logging or observability provider SDKs, network calls, browser
storage access, environment variables, feature flags, billing, payment,
checkout, invoice, subscription, paid entitlement grants, production data
access, migrations, executable schemas, Webflow changes, Cloudflare Worker
changes, Vercel or deployment setting changes, DNS changes, secrets, or
`npm audit fix`.

It does not grant paid access, fake mastery, server-side account persistence,
or production account sync behavior.

## Relationship To #58-#68

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
| #68 | Disabled/mock-gated implementation spike plan | The next step became a route skeleton decision, not route file creation. |

PR #69 preserves the No-Go gate. It defines only the approval and safety bar
for a possible future route skeleton PR.

## Current Decision

Current phase: `design_only`.

Actual route files created in this PR: false.
Future skeleton allowed now: false.
Future route skeleton may be proposed only in a separate PR with explicit owner
approval.

This PR is docs, contracts, and tests only. It changes no production app
behavior.

## Planned Future Route Skeleton Paths

These paths are future planned paths only. They are not created in PR #69.

| Route | Method | Future planned file |
| --- | --- | --- |
| `/api/account/sync/preview` | `POST` | `src/app/api/account/sync/preview/route.ts` |
| `/api/account/sync/apply` | `POST` | `src/app/api/account/sync/apply/route.ts` |
| `/api/account/sync/digest` | `GET` | `src/app/api/account/sync/digest/route.ts` |
| `/api/account/sync/audit` | `GET` | `src/app/api/account/sync/audit/route.ts` |

No route file for any of these paths is created in PR #69.

## Explicit Owner Approval Requirement

A future route skeleton PR is allowed only if the owner explicitly approves
route file creation before that PR is opened or merged.

The future PR body must include the approval evidence and the exact approved
file scope. The approved scope must match the planned preview, apply, digest,
and audit skeleton paths above.

If approval is missing, the PR must not create route files.

## Disabled-By-Default Policy

Any future route skeleton must be disabled by default. Disabled status must not
serve production traffic, read production account data, write learning state,
call provider services, grant entitlement, or change app behavior.

The future skeleton PR must include tests proving each route stays disabled by
default.

## Mock-Gated Policy

Any future route skeleton must be mock-gated before provider integration. Mock
interfaces may prove shape and disable behavior only.

The future skeleton PR must not import provider SDKs, DB provider SDKs,
validation dependencies, logging provider SDKs, or payment SDKs.

Provider-specific auth, DB, validator, logging, and payment code must remain
outside account sync core.

## Apply Hard-Disabled Policy

Apply must remain hard-disabled until every required gate is satisfied:

- kill switch
- auth
- validator
- DB
- idempotency
- audit
- monitoring
- rollback
- manual QA
- explicit owner approval

Future apply skeleton tests must prove apply cannot mutate saved words, review
events, review state, daily stats, pack progress, audit records, entitlement,
billing state, or production data while disabled.

## Preview Read-Only Policy

Preview must remain read-only. A future preview skeleton may describe conflict
preview shape only after approval, but it must not write review events, review
state, saved words, daily stats, pack progress, audit records, entitlement,
billing state, or production data.

Future preview skeleton tests must prove preview is read-only.

## Digest/Audit Policy

Digest and audit must remain owner-only, bounded, and redacted.

They must not expose full account state, raw guest snapshots, raw server
payloads, provider tokens, production secrets, billing payloads, payment
payloads, checkout payloads, subscription payloads, paid entitlement payloads,
or unbounded audit history.

Future digest/audit skeleton tests must prove owner-only, bounded, redacted
behavior.

## Provider SDK Non-Goals

This PR adds no provider SDKs. Future route skeleton work must not import auth,
database, logging, observability, payment, or provider-specific SDKs.

Auth provider-specific code remains outside account sync core. DB
provider-specific code remains behind a persistence adapter. Validator-specific
code remains behind a normalized validation adapter.

## DB, Validator, And Logging Non-Goals

This PR adds no database persistence, DB provider SDK, migration, executable
schema, runtime validator dependency, validator adapter, logging provider SDK,
observability provider SDK, audit writer, or monitoring integration.

A future route skeleton PR must stay disabled and mock-gated. DB, validator,
audit writer, logging, and monitoring work require separate owner-approved PRs.

## Paid Entitlement Boundary

Account sync cannot grant paid entitlement. Upgrade interest remains
attribution-only and cannot become plan state, entitlement state, checkout
state, subscription state, invoice state, or billing state.

Future route skeleton tests must preserve the paid entitlement boundary.

## Billing And Payment Boundary

Billing, payment, checkout, invoice, subscription, and billing portal behavior
remain outside account sync.

Future routes must reject or ignore those payload families at the sync boundary
and must not include payment provider logic.

## Fake Mastery Blocking

Fake mastery remains blocked. Review events remain the SRS source of truth.
Server mastery cannot come from imported local labels or unsupported client
claims; it requires delayed recall evidence.

Future route skeleton work must preserve fake mastery blocking.

## Client AccountId Non-Trust Policy

Client-provided `accountId` is never ownership proof. It may not authorize a
read, write, preview, apply, digest, or audit response.

Future route skeleton work must preserve the server-session ownership boundary
from the auth ownership contract.

## Future Separate PR Requirements

A future route skeleton PR must:

- be separate from PR #69
- include explicit owner approval in the PR body
- limit file scope to the approved skeleton paths
- keep every route disabled by default
- keep every route mock-gated
- keep apply hard-disabled
- prove apply cannot mutate
- prove preview is read-only
- prove digest and audit are owner-only, bounded, and redacted
- avoid provider SDK imports
- avoid DB provider SDK imports
- avoid validation dependency imports
- avoid logging provider SDK imports
- avoid production data access
- avoid paid entitlement grants
- avoid billing, payment, checkout, invoice, and subscription logic
- preserve fake mastery blocking
- preserve client account id non-trust
- require manual QA before production enablement
- preserve the route readiness No-Go gate until explicit owner approval changes it

## Stop Conditions

Stop this PR or stop before future route skeleton work if any of these occur:

- route files are created without explicit owner approval
- route handlers are created in PR #69
- middleware is added
- runtime route or component integration is added
- production enablement is attempted
- apply can mutate before all gates pass
- preview can mutate
- digest or audit are unbounded or unredacted
- a client-provided account id is trusted as ownership proof
- provider SDKs are imported
- DB provider SDKs are imported
- validation dependencies are imported
- logging provider SDKs are imported
- production data is accessed
- fake mastery is accepted
- paid entitlement is granted
- billing or payment boundaries are crossed

Resuming after any P0 stop condition requires explicit owner decision and a
separate PR.

## Final Verdict

Final verdict: `design_only`, no route skeleton created.

PR #69 does not authorize actual API routes, route handlers, middleware,
runtime integration, provider integrations, database persistence, validators,
production data access, paid entitlement, billing, payment, or production
enablement.

## Next Recommended PR

#70 Account sync disabled route skeleton PR only if owner explicitly approves
route file creation.

If owner does not approve route file creation, continue with product-side paid
beta readiness instead.
