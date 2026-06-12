# Account Sync Schema Payload Contract

This folder defines the design-only schema validation and payload size limits
required before any future account sync API route can exist.

It contains pure TypeScript contracts, static policies, deterministic decision
helpers, and test fixtures. It does not create framework routes, route
handlers, middleware, runtime wiring, real auth, database writes, validation
library integration, payment behavior, browser network helper calls, browser
storage reads, or environment-variable reads.

Final verdict: **design_only, not implementation-ready**.

## Files

- `schema-payload-contract.ts` defines route schema policies, payload ceilings,
  sensitive field rules, malformed payload rejection, and final verdict.
- `fixtures.ts` defines expected route and policy fixtures for contract tests.

## Route Scope

The contract covers the planned preview, apply, digest, and audit routes only.
It does not add actual route files.

Preview and apply must reject malformed payloads before conflict resolution.
Apply must also reject malformed payloads before any future idempotency record
or learning-state write. Digest and audit require bounded query metadata and
bounded responses.

## Safety

Client-provided account ids are never ownership proof. Provider tokens,
production credentials, billing/payment/checkout/subscription data, paid
entitlement grants, fake server mastery claims, and raw sensitive payloads are
forbidden from account sync payloads.

Review event evidence remains the source of truth. Local `Mastered` labels are
client claims only. Pack progress without review event evidence remains
audit-only. Upgrade interest remains attribution-only.
