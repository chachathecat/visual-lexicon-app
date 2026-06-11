# Production P0 Blocker Register

Register date: 2026-06-11

Scope: Production v1 launch blockers for Visual Lexicon Track B. This document
is documentation-only and does not implement auth, sync, billing, deployment,
analytics, support, or production data changes.

## P0 Blockers

| Blocker | Why it blocks paid launch | Current status | Required owner | Required PR or future work | Go/no-go impact |
| --- | --- | --- | --- | --- | --- |
| Real auth/account persistence not implemented | Paying learners need durable account ownership, recovery, and sessions for saved words, review state, pack progress, and support. | Architecture documented; runtime not implemented. | Auth/account owner | Implement auth provider, account model, sessions, recovery, and local-to-account migration. | No-Go until complete and tested. |
| Server-side saved/review SRS sync not implemented | Browser local storage can be lost, reset, or split across devices; paid progress needs durable account state. | Sync architecture and contracts documented; runtime not implemented. | Learning platform/SRS owner | Implement saved words, review events, review state, daily stats, pack progress, idempotency, retries, and conflict handling. | No-Go until complete and tested. |
| Cross-device progress not implemented | Paid users expect progress, due queues, weak state, and mastery to follow the account across devices. | Planned only. | Auth/SRS owner | Implement account hydration, sync queue, merge policy, and cross-device QA. | No-Go until complete and tested. |
| Billing/provider integration not implemented | The app cannot safely create subscriptions, invoices, refunds, cancellations, or payment states. | Billing architecture documented; no provider or runtime behavior added. | Billing owner | Choose provider, add approved server integration, checkout, webhooks, plan records, receipts, refunds, and cancellation handling. | No-Go until explicitly authorized, complete, and tested. |
| Server-side entitlement enforcement not implemented | Local plan state can preview UI but cannot grant, revoke, audit, or support paid access. | Architecture documented; enforcement not implemented. | Billing/entitlement owner | Implement account-bound entitlement snapshots, server checks, downgrade/revoke states, and audit log. | No-Go until complete and tested. |
| Production deployment/domain not verified | `app.visuallexicon.org` is not proven for domain ownership, DNS, TLS, environment separation, monitoring, or rollback. | Deployment readiness docs exist; no deployment or domain verification performed by this PR. | Deployment/release owner | Verify Vercel project, domain/DNS, staging, production env inventory, monitoring, rollback, and smoke-test plan. | No-Go until verified. |
| Analytics/reporting not implemented with trusted events | Weekly Reviewed Words and production funnels cannot be trusted from local/client-only events. | Analytics architecture documented; production pipeline not implemented. | Analytics owner | Implement trusted event collection, reporting models, dashboards, cohort metrics, and incident/error reporting. | No-Go until launch metrics are reliable. |
| Support/refund/legal copy not finalized | Users cannot be charged without clear support, refund, cancellation, legal, privacy, and billing disclosures. | Requirements documented; final copy and owner sign-off missing. | Support/legal owner | Finalize support path, refund/cancellation policy, terms, privacy, billing disclosure, and support macros. | No-Go until signed off. |
| Production release smoke test not executed on staging/production | Local validation does not prove the app works in the production runtime or target domain. | Smoke-test plan exists; no staging/production execution in this PR. | QA/release owner | Execute smoke tests on staging and production after approved deployment, with evidence and issue owners. | No-Go until passing or accepted by owner. |
| No final launch owner sign-off | A paid launch needs an accountable owner accepting validation, risks, rollback, support, and stop-sales duties. | Missing. | Launch owner | Complete #47 public paid launch decision with owner names, validation results, manual QA, P0 gaps, stop-sales triggers, rollback, and final recommendation. | No-Go until signed off. |

## Required Order Of Work

Recommended order before any paid production launch:

1. Auth/account persistence.
2. Server-side saved/review SRS sync.
3. Cross-device progress and migration QA.
4. Billing provider and entitlement enforcement.
5. Support/refund/legal copy.
6. Trusted analytics/reporting.
7. Staging and production deployment/domain verification.
8. Staging and production smoke QA.
9. Final launch decision and owner sign-off.

## Current Launch Impact

Current decision: No-Go for production paid SaaS.

The app can continue as a local/private no-payment beta candidate. Public paid
production launch remains blocked until every P0 blocker is implemented,
verified, and accepted by the named owner.
