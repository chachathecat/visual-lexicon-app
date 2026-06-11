# Billing Entitlement Contracts

These files are planning contracts for future Visual Lexicon Track B billing and
entitlements.

They are not production billing. They do not import auth, database, network, or
payment provider SDKs. They do not create checkout, process webhooks, create
subscriptions, grant access, or change runtime app behavior.

Use these contracts to keep future docs, mocks, tests, and implementation PRs
aligned on vocabulary for plan IDs, entitlement status, subscription status,
pack purchase status, billing events, and entitlement snapshots.

Production billing must still wait for account persistence, server-side SRS
sync, provider approval, support/refund/legal copy, and deployment readiness.
