# Account Sync Runtime Validator Decision

## Purpose

This document records the runtime validator strategy and dependency boundary
for future account sync routes. PR #67 remains docs/contracts/tests only. It
does not add a validator dependency, implement runtime validation, create API
routes, or create route handlers.

Final verdict: `design_only`, not implementation-ready.

## Non-Goals

This PR does not add Zod, Valibot, Yup, ArkType, AJV, Superstruct, or any other
validator dependency. It does not implement real validation in routes, route
handlers, middleware, runtime route or component integration, auth, database
persistence, Supabase, Prisma, Drizzle, Neon, Firebase, Cloudflare D1, provider
SDKs, logging or observability SDKs, network/fetch calls, local storage access,
environment variables, feature flags, billing, payment, checkout,
subscriptions, paid entitlement grants, Webflow changes, Cloudflare Workers,
DNS changes, Vercel or deployment settings, secrets, production data access,
migrations, executable schemas, or `npm audit fix`.

## Relationship To #58-#66

| PR | Gate | Relationship |
| --- | --- | --- |
| #58 | Route readiness audit and No-Go gate | Real account sync API routes remain blocked. |
| #59 | Auth ownership boundary | Runtime validation cannot trust client-provided `accountId` as ownership proof. |
| #60 | Durable idempotency and persistence storage design | Apply validation must pass before idempotency record creation or persistence writes. |
| #61 | Schema validation and payload size limits contract | This PR chooses the future validator strategy and adapter boundary for that contract. |
| #62 | Audit logging and privacy redaction | Validation failures must be structured and redacted before audit or client visibility. |
| #63 | Monitoring, rollout, rollback, and kill-switch gate | Real validator integration still needs rollout, rollback, alert, and QA evidence. |
| #64 | Final implementation readiness review | Real routes remained No-Go and required provider, DB, and validator decisions first. |
| #65 | Auth provider final decision | Runtime validation must preserve the server-session ownership boundary. |
| #66 | DB persistence provider decision | Runtime validation must reject malformed apply before DB idempotency or learning-state writes. |

These gates do not authorize real account sync routes.

## Runtime Validator Candidate Matrix

| Candidate | Decision | Structured typed failures | Sync core can import library? | Dependency in this PR? | Notes |
| --- | --- | --- | --- | --- | --- |
| `zod` | Preferred future adapter | Yes | No | No | Preferred Zod-compatible adapter strategy for typed parsing and normalized issues. |
| `valibot` | Compatible future candidate | Yes | No | No | Acceptable only if owner later selects it behind the same port. |
| `arktype` | Compatible future candidate | Yes | No | No | Future candidate; issue normalization must be proven. |
| `ajv_json_schema` | Deferred | Yes | No | No | JSON Schema portability may help, but typed route contracts still need mapping. |
| `superstruct` | Deferred | Yes | No | No | Future candidate only if redacted issue mapping is approved. |
| `custom_no_dependency_validator` | Deferred | Yes, with more maintenance risk | No | No | Possible fallback, but not implemented here. |
| `type_guards_only` | Rejected for now | Weak | No | No | Insufficient for rich, structured, redacted validation failures. |
| `mock_only_no_runtime_validator` | Mock only | No | No | No | Acceptable only for disabled fixtures or future mock-gated spikes. |

## Selected Strategy

The selected strategy is:

- `zod_compatible_future_adapter`
- `validator_neutral_sync_core`
- `no_validator_dependency_in_this_pr`
- `separate_owner_approved_dependency_pr_required`
- `runtime_validation_before_idempotency_or_writes`
- `redacted_structured_validation_errors`

In plain terms, account sync core stays runtime-validator-neutral. A
Zod-compatible future adapter is preferred, but the dependency must be added
only in a separate owner-approved PR. If the owner later chooses another
validator, it must still satisfy the same normalized validation port and
redaction contract.

## Provider-Neutral Validation Adapter Boundary

Future validator-specific code may live only at the adapter edge. Account sync
core must receive a normalized decision object and must not import
validator-library types, schemas, errors, or issue details.

The adapter boundary must normalize native validator output into:

- `ok`
- route id
- safe failure reasons
- safe issue paths
- safe issue codes
- expected kind
- size class
- redaction metadata

It must not pass raw request bodies, raw field values, provider payloads,
tokens, secrets, billing/payment payloads, or full account state through the
failure shape.

## Validation Port Contract

The future validation port input is an unknown request body, query/cursor
object, or response summary candidate. The output is a typed, structured,
redacted validation decision.

The port must guarantee:

- validator-native issues are normalized before sync core sees them
- sync core receives only validator-neutral decisions
- request size ceilings run before deep validation
- preview and apply validate request shape before conflict resolution
- apply validates before idempotency record creation
- apply validates before review-event or learning-state writes
- digest and audit validate bounded query/cursor params
- digest and audit validate bounded response shape before returning
- no validator dependency is imported in this PR

## Route-By-Route Validation Order

| Route | Order |
| --- | --- |
| `preview` | Size ceiling -> schema parse -> redacted failure decision -> conflict resolution |
| `apply` | Size ceiling -> schema parse -> redacted failure decision -> conflict resolution -> idempotency record creation -> learning-state write |
| `digest` | Size ceiling -> query/cursor parse -> redacted failure decision -> bounded response return |
| `audit` | Size ceiling -> query/cursor parse -> redacted failure decision -> bounded response return |

Apply must require `idempotencyKey` and an explicit safe apply intent or client
confirmation. Missing either rejects before conflict resolution, idempotency,
or writes.

## Malformed Payload Rejection Policy

Malformed preview and apply payloads reject before conflict resolution.
Malformed apply payloads cannot create idempotency records and cannot create
partial learning state.

Malformed digest and audit query/cursor params reject before owner-only reads
return a response. Digest and audit response summaries must be bounded and
validated before returning.

## Payload Size Before Deep Validation Policy

Payload size ceilings must run before deep validation. Oversized request
bodies, cursors, response summaries, review event collections, saved word
collections, pack progress collections, and upgrade-interest collections reject
before a future validator performs deep parsing.

This prevents costly parse work and prevents malformed oversized apply payloads
from reaching conflict resolution, idempotency storage, or learning-state
writes.

## Redacted Validation Failure Shape

Validation failures may include only:

- safe issue `path`
- safe issue `code`
- safe `expectedKind`
- safe `sizeClass`

Validation failures must not echo raw payloads, raw field values, provider
tokens, production secrets, billing/payment payloads, checkout payloads,
subscription payloads, paid entitlement payloads, raw snapshots, or full
account state.

Example redacted issue shape:

```ts
{
  path: "$.idempotencyKey",
  code: "missing_idempotency_key",
  expectedKind: "string",
  rawValueIncluded: false,
  rawPayloadEchoed: false,
  safeForClient: true,
  safeForAudit: true
}
```

## Sensitive Field Exclusion Policy

Runtime validation must reject or strip these payload families before sync
logic continues:

- provider tokens and raw provider payloads
- production secrets and credentials
- billing, payment, checkout, invoice, subscription, and billing portal data
- paid entitlement grant attempts
- raw sensitive payloads
- fake server mastery claims

Client-provided `accountId` is never ownership proof. It may not authorize a
read, write, preview, apply, digest, or audit response.

## Fake Mastery Blocking

Fake local `Mastered` state and fake server mastery claims must be rejected or
downgraded to client claim only. Review events remain the SRS source of truth.
Server mastery requires delayed recall evidence.

## Paid Entitlement Boundary

Account sync runtime validation must reject paid entitlement grant attempts.
Upgrade interest remains attribution-only and cannot become plan state,
entitlement state, checkout state, or billing state.

## Billing And Payment Boundary

Billing, payment, checkout, invoice, subscription, and billing portal payloads
stay outside account sync. Runtime validation must reject those payload
families with redacted failure decisions.

## Dependency Non-Goals

This PR adds no validator dependency and changes no package files. A future
dependency PR must be explicit, owner-approved, and limited to the selected
validator adapter work. Pre-existing transitive packages used by tooling do not
select or authorize an account sync validator.

The future adapter must keep sync core validator-neutral even after a package
is approved.

## Manual QA Requirements For Future Real Validator Integration

Before production, manual QA must prove:

- preview rejects malformed, oversized, sensitive, fake mastery, and
  client-account ownership inputs without mutation
- apply rejects malformed inputs before idempotency record creation
- apply rejects malformed inputs before review events, review state, saved
  words, daily stats, or pack progress writes
- apply rejects missing `idempotencyKey`
- apply rejects missing safe apply intent or client confirmation
- digest and audit reject unbounded query/cursor params
- digest and audit reject unbounded response summaries before returning
- validation failures expose only redacted paths, codes, expected kinds, and
  size classes
- provider tokens, production secrets, paid entitlement, and billing/payment
  payloads never appear in client or audit failures
- no paid entitlement, billing, checkout, invoice, subscription, or payment
  mutation occurs

## Remaining Blockers

Real account sync routes remain blocked by:

- owner-approved validator dependency selection
- real validator adapter implementation in a separate PR
- normalized redacted issue mapping
- auth ownership runtime integration
- persistence adapter implementation
- idempotency store implementation
- monitoring, rollout, rollback, and kill-switch implementation
- manual authenticated QA evidence
- production data safety approval

## Final Verdict

Final verdict: `design_only`, not implementation-ready.

No real account sync API route implementation should begin from this PR.

## Next Recommended PR

#68 Disabled/mock-gated account sync implementation spike plan, still
docs/contracts/tests only.

Do not implement real API routes yet.
