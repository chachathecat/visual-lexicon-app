# Account Sync Audit Redaction

This folder defines the design-only audit logging, privacy redaction,
sensitive payload exclusion, and owner-only digest/audit visibility policy
required before any future account sync API route can exist.

It contains pure TypeScript contracts, static policies, deterministic decision
helpers, and test fixtures. It does not create framework routes, route
handlers, middleware, runtime wiring, real auth, database writes, provider SDK
integration, logging provider integration, payment behavior, browser network
helper calls, browser storage reads, or environment-variable reads.

Final verdict: **design_only, not implementation-ready**.

## Files

- `audit-redaction-policy.ts` defines audit event taxonomy, redacted summary
  shape, sensitive field classifications, write/read policies, retention, and
  owner-only access policy.
- `fixtures.ts` defines deterministic event, forbidden-field, and decision
  fixtures for contract tests.

## Safety

Audit summaries are owner-scoped, bounded, and redacted. Raw guest snapshots,
raw server payloads, full review event bodies, provider tokens, production
secrets, billing/payment payloads, and full account state are forbidden.

Preview audit is response-local by default. Apply audit may write redacted
summaries only after the future ownership, schema, payload, and idempotency
gates. Digest and audit reads are owner-only bounded summaries.

Fake local `Mastered` state is logged only as blocked or client-claim evidence.
Pack progress without review-event evidence remains audit-only. Upgrade
interest remains attribution-only, and audit logging cannot grant paid
entitlement.
