# Production Decision Changelog

This changelog summarizes the production v1 planning chain that led to #47
Public Paid Launch Decision.

Scope: documentation-only summary for Visual Lexicon Track B. This does not
deploy, change runtime behavior, add auth, add billing, add analytics SDKs,
touch Webflow, touch Cloudflare Workers, change DNS, change Vercel settings,
add environment variables, add secrets, mutate production data, or change
payment behavior.

## Chronological Summary

| PR | Planning item | Purpose | Decision impact | Remaining gaps |
| --- | --- | --- | --- | --- |
| #40 | Production v1 Gap Audit | Audited the local/private beta MVP against the bar for full production paid SaaS. | Established that the app is strong as a local MVP but No-Go for production paid SaaS without P0 systems. | Auth, server SRS sync, cross-device progress, billing, entitlement, deployment, analytics, support/legal, QA, and owner sign-off. |
| #41 | Auth/account persistence architecture | Defined the account ownership and persistence direction needed before paid launch. | Confirmed account persistence is a P0 blocker and should precede payment. | Runtime auth, sessions, recovery, account IDs, guest migration, and account-owned learning state are not implemented. |
| #42 | Server-side saved/review SRS sync contracts | Defined server-side saved words, review state, review events, sync, conflict, and test expectations. | Confirmed truthful memory state must be server-owned before production paid launch. | Server sync runtime, idempotent writes, migration, retry behavior, and cross-device QA remain unimplemented. |
| #43 | Billing/entitlement architecture | Defined billing, plan, webhook, entitlement, refund, cancellation, and safety boundaries. | Confirmed billing should not be added before account persistence and server SRS sync. | Provider selection, runtime billing, checkout, webhooks, invoices, refunds, cancellation handling, and entitlement enforcement remain unimplemented. |
| #44 | Production deployment/domain readiness | Documented deployment, domain, environment, monitoring, and rollback readiness needs. | Confirmed production/domain readiness is a launch blocker. | Staging/production verification, domain/DNS/TLS checks, monitoring, deployment owner, rollback rehearsal, and smoke evidence remain incomplete. |
| #45 | Production analytics/reporting | Defined trusted reporting needs centered on Weekly Reviewed Words. | Confirmed analytics/reporting must measure actual review behavior, not just traffic or saves. | Trusted production event pipeline, dashboards, cohort reporting, error/support metrics, and privacy-reviewed rollout remain unimplemented. |
| #46 | Production release QA package | Packaged validation commands, manual QA templates, route/storage checks, and no-accidental-auth/billing/deployment checks. | Confirmed local validation can support the MVP but cannot prove production paid launch readiness. | Production staging/smoke QA, auth/sync/billing/entitlement/support/analytics QA, rollback rehearsal, and owner sign-off remain incomplete. |
| #47 | Public paid launch decision | Records the final go/no-go for public production paid SaaS after the planning chain. | No-Go / Not Yet. Continue only as local/private no-payment beta planning until P0 systems are implemented and verified. | Move next to implementation foundations: auth provider decision, account persistence contracts, server SRS sync spike, migration, idempotency tests, staging audit, support/legal copy, billing decision, test-mode entitlement, and readiness rerun. |

## #40 Production V1 Gap Audit

Purpose: establish the production launch bar and compare the current app
against it.

Decision impact: recommended against a full paid SaaS launch. The app was
recognized as strong for local/private beta because Save -> Review -> SRS
state/events -> Due/Weak/Mastered exists, but insufficient for paid production
because P0 systems were missing.

Remaining gaps:

- Account persistence.
- Server-side SRS sync.
- Cross-device progress.
- Billing and entitlement.
- Deployment/domain readiness.
- Analytics/reporting.
- Support/refund/legal operations.
- Production QA and owner sign-off.

## #41 Auth/Account Persistence Architecture

Purpose: define how users should own learning state through accounts, sessions,
recovery, and migration.

Decision impact: account persistence became the first implementation foundation
before payment. Paid users need durable ownership of saved words, review state,
events, daily stats, pack progress, and future entitlements.

Remaining gaps:

- Provider decision.
- Runtime auth implementation.
- Account model and account IDs.
- Session and recovery flows.
- Guest-to-account migration.
- Account-owned persistence and QA.

## #42 Server-Side Saved/Review SRS Sync Contracts

Purpose: define how saved words, review state, review events, daily stats, pack
progress, sync, idempotency, and conflicts should work server-side.

Decision impact: confirmed that memory state is the product moat and must remain
truthful. Due, Weak, and Mastered cannot be derived from local-only or fake
state in a paid production product.

Remaining gaps:

- Server sync implementation.
- Idempotent review writes.
- Conflict handling.
- Cross-device hydration.
- Migration from local storage.
- Retry/failure recovery.
- Production QA for SRS consistency.

## #43 Billing/Entitlement Architecture

Purpose: define payment, plan, provider, webhook, entitlement, refund,
cancellation, invoice, and support boundaries.

Decision impact: confirmed payment should not be added before account
persistence and server-side SRS sync. Billing state must attach to accounts and
server-owned entitlement, not local storage.

Remaining gaps:

- Billing provider final decision.
- Runtime checkout.
- Webhooks.
- Subscription and invoice state.
- Refund/cancellation/failed-payment handling.
- Server-side entitlement snapshots and enforcement.
- Support workflow integration.

## #44 Production Deployment/Domain Readiness

Purpose: define what must be true before `app.visuallexicon.org` can be treated
as a production paid SaaS environment.

Decision impact: confirmed deployment/domain readiness is a production launch
blocker. Local validation does not prove DNS, TLS, environment, monitoring,
rollback, or release ownership.

Remaining gaps:

- Staging environment verification.
- Production domain/DNS/TLS verification.
- Vercel/project setting review.
- Environment inventory.
- Monitoring and error reporting.
- Rollback rehearsal.
- Production smoke evidence.

## #45 Production Analytics/Reporting

Purpose: define trusted production reporting around Weekly Reviewed Words,
activation, retention, weak-word recovery, pack progress, paid conversion, and
error/support rates.

Decision impact: confirmed that production analytics must measure review
behavior and memory outcomes, not only page traffic, saves, or pricing clicks.

Remaining gaps:

- Trusted event collection.
- Server-side analytics or durable event model.
- Dashboard/reporting implementation.
- Cohort metrics.
- Error/support metrics.
- Privacy and data safety rollout.

## #46 Production Release QA

Purpose: define validation commands, manual QA checklists, route/storage checks,
and safety checks for no accidental auth, billing, checkout, deployment, or
production data changes.

Decision impact: confirmed that the local MVP can be validated, but production
paid launch requires QA across systems that do not yet exist.

Remaining gaps:

- Account QA.
- Server SRS sync QA.
- Cross-device QA.
- Billing and entitlement QA.
- Support/refund/legal QA.
- Analytics/reporting QA.
- Staging/production smoke QA.
- Rollback rehearsal.

## #47 Public Paid Launch Decision

Purpose: record the final decision after the planning chain.

Decision impact: No-Go / Not Yet for public production paid SaaS. Continue only
as local/private no-payment beta planning until P0 systems are implemented and
verified.

Remaining gaps:

- Start implementation foundations with auth provider decision and account
  persistence.
- Do not add payment before account persistence and server-side SRS sync.
- Re-run production readiness only after implementation and verification.
