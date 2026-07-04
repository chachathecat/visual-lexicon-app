# Visual Lexicon App

Track B app scaffold for `app.visuallexicon.org`.

This repository is for the learning app only. It does not include Webflow
publishing, Cloudflare Worker changes, payment, Account Sync, production data
writes, or production deployment settings. Track B has a minimal Supabase Magic
Link session flow for private unpaid dogfood only.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

App entry:

```txt
/ redirects to /dashboard
/dashboard is the canonical Track B app entry
```

Optional static pack source:

```txt
NEXT_PUBLIC_VLX_PACK_BASE_URL=https://static.example.com
```

When no static pack base URL is configured, the app uses local mock pack
data. The pack reader expects public JSON files only; do not put API tokens in
pack URLs or browser-exposed environment variables.

Optional paid beta upgrade placeholders:

```txt
NEXT_PUBLIC_LITE_PAYMENT_URL=https://example.com/lite-beta
NEXT_PUBLIC_PRO_PAYMENT_URL=https://example.com/pro-beta
NEXT_PUBLIC_PAID_BETA_FORM_URL=https://example.com/paid-beta-interest
```

These URLs are placeholders only. When a Lite or Pro URL is configured, upgrade
CTAs render as external links and append `plan` and `source` query parameters.
When no URL is configured, the app stays local, records interest in
`vlx_upgrade_interest_v1`, and shows: `Paid beta interest noted locally. Billing
is not connected.` No checkout route, payment SDK, billing setting, or real
subscription is created by this app.

Optional private dogfood auth configuration:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3006
```

These values enable existing-user Supabase email Magic Link login only. Public
signup remains disabled through `shouldCreateUser:false`, and no Account Sync,
learning-data upload, entitlement, checkout, or billing behavior is added.

## Verification

Run the static health checks:

```bash
npm run typecheck
npm run lint
npm run build
```

Start the app for browser checks:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3006
```

Then run the focused MVP checks in another terminal:

```bash
npm run test:mvp
npm run test:review
npm run test:packs
```

The Playwright checks expect the app to be running on `http://127.0.0.1:3006`
unless `PLAYWRIGHT_BASE_URL` is set.

## Paid Beta Readiness

Audit and manual QA docs:

```txt
docs/BETA_READINESS_AUDIT.md
docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md
docs/TRACK_B_UI_REBUILD_SEQUENCE.md
docs/TRACK_B_SALMON_BRAND_TOKENS.md
docs/TRACK_B_CORE_SURFACE_VISUAL_POLISH.md
docs/TRACK_B_APP_SHELL_V2.md
docs/TRACK_B_SHELL_NAVIGATION_CLEANUP.md
docs/TRACK_B_REVIEW_SHELL_CONSISTENCY.md
docs/TRACK_B_DASHBOARD_V2.md
docs/TRACK_B_REVIEW_SESSION_V2.md
docs/REVIEW_SESSION_V2_CONTRACT.md
docs/REVIEW_SESSION_V2_IMPLEMENTATION_SEQUENCE.md
docs/TRACK_B_REVIEW_RELIABILITY_GATE.md
docs/TRACK_B_ANALYTICS_RETENTION_GATE.md
docs/TRACK_B_SAVED_LIBRARY_V2.md
docs/TRACK_B_PACKS_V2.md
docs/PACKS_V2_CONTRACT.md
docs/PACKS_V2_IMPLEMENTATION_SEQUENCE.md
docs/TRACK_B_PRICING_PAYWALL_V2.md
docs/PRICING_PAYWALL_V2_CONTRACT.md
docs/PRICING_PAYWALL_V2_IMPLEMENTATION_SEQUENCE.md
docs/TRACK_B_OWNER_LOCAL_SMOKE_AFTER_SIMPLIFICATION.md
docs/PAID_BETA_READINESS_AUDIT.md
docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md
docs/PRIVATE_BETA_GATE_PREP.md
docs/PRIVATE_BETA_READINESS_RERUN.md
docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md
docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_DECISION.md
docs/OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG.md
docs/AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.md
docs/PRIVATE_BETA_INVITE_PACKET.md
docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md
docs/PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md
docs/PAID_BETA_MANUAL_QA_CHECKLIST.md
docs/PAID_BETA_MANUAL_QA.md
docs/PAID_BETA_QA_RERUN_2026-06-10.md
docs/PAID_BETA_QA_RUN_2026-06-09.md
docs/PAID_BETA_PRIVATE_INVITE_SIGNOFF_2026-06-10.md
docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md
```

- [Track B Product/UI Readiness Audit](docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md)
- [Track B UI Rebuild Sequence](docs/TRACK_B_UI_REBUILD_SEQUENCE.md)
- [Track B Salmon Brand Tokens](docs/TRACK_B_SALMON_BRAND_TOKENS.md)
- [Track B Core Surface Visual Polish](docs/TRACK_B_CORE_SURFACE_VISUAL_POLISH.md)
- [Track B Simplicity Reset](docs/TRACK_B_SIMPLICITY_RESET.md)
- [Track B App Shell V2](docs/TRACK_B_APP_SHELL_V2.md)
- [Track B Shell Navigation Cleanup](docs/TRACK_B_SHELL_NAVIGATION_CLEANUP.md)
- [Track B Review Shell Consistency](docs/TRACK_B_REVIEW_SHELL_CONSISTENCY.md)
- [Track B Dashboard V2](docs/TRACK_B_DASHBOARD_V2.md)
- [Track B Review Session V2](docs/TRACK_B_REVIEW_SESSION_V2.md)
- [Review Session V2 Contract](docs/REVIEW_SESSION_V2_CONTRACT.md)
- [Review Session V2 Implementation Sequence](docs/REVIEW_SESSION_V2_IMPLEMENTATION_SEQUENCE.md)
- [Track B Review Reliability Gate](docs/TRACK_B_REVIEW_RELIABILITY_GATE.md)
- [Track B Analytics & Retention Gate](docs/TRACK_B_ANALYTICS_RETENTION_GATE.md) - test: `tests/track-b-analytics-retention-gate.spec.ts`
- [Track B Saved Library V2](docs/TRACK_B_SAVED_LIBRARY_V2.md)
- [Track B Packs V2](docs/TRACK_B_PACKS_V2.md)
- [Packs v2 Contract](docs/PACKS_V2_CONTRACT.md)
- [Packs v2 Implementation Sequence](docs/PACKS_V2_IMPLEMENTATION_SEQUENCE.md)
- [Track B Pricing / Paywall V2](docs/TRACK_B_PRICING_PAYWALL_V2.md)
- [Pricing / Paywall v2 Contract](docs/PRICING_PAYWALL_V2_CONTRACT.md)
- [Pricing / Paywall v2 Implementation Sequence](docs/PRICING_PAYWALL_V2_IMPLEMENTATION_SEQUENCE.md)
- [Track B Owner Local Smoke After Simplification](docs/TRACK_B_OWNER_LOCAL_SMOKE_AFTER_SIMPLIFICATION.md)
- [Paid Beta Readiness Audit](docs/PAID_BETA_READINESS_AUDIT.md)
- [Paid Beta Manual QA Execution Report](docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md)
- [Private Beta Gate Prep](docs/PRIVATE_BETA_GATE_PREP.md)
- [Private Beta Readiness Rerun](docs/PRIVATE_BETA_READINESS_RERUN.md)
- [Owner-Run Private Beta Launch Checklist](docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md)
- [Owner-Run Private Beta Launch Decision](docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_DECISION.md)
- [Owner-Run Private Beta Execution Log](docs/OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG.md)
- [Agent-Assisted Private Beta Dogfood Report](docs/AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.md)
- [Private Beta Invite Packet](docs/PRIVATE_BETA_INVITE_PACKET.md)
- [Private Beta Issue Log Template](docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md)
- [Private Beta Final Owner Signoff](docs/PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md)
- [Paid Beta Manual QA Checklist](docs/PAID_BETA_MANUAL_QA_CHECKLIST.md)
- [Manual Payment / Entitlement Policy](docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md)
- [Monitoring, Support, Privacy Beta Gate](docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md)
- [Private Beta Dry-Run Smoke Evidence](docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md)

Release candidate docs:

```txt
docs/PAID_BETA_V0_RELEASE_CHECKLIST.md
docs/PAID_BETA_INVITE_COPY.md
docs/PAID_BETA_ROLLBACK_PLAN.md
docs/PAID_BETA_SUPPORT_AND_DATA_DISCLOSURE.md
docs/PAID_OPEN_BETA_V0_LAUNCH_PLAN.md
docs/PAID_OPEN_BETA_V0_COPY.md
docs/PAID_OPEN_BETA_V0_OPERATIONS.md
```

These docs are for the no-payment paid beta readiness review. They do not add
checkout, billing, auth, Webflow, Cloudflare Worker, DNS, production data, or
deployment behavior.

## Production v1 Planning

Production paid launch planning docs:

- [Public Paid Launch Decision 2026-06-11](docs/PUBLIC_PAID_LAUNCH_DECISION_2026-06-11.md)
- [Public Launch Decision Rationale](docs/PUBLIC_LAUNCH_DECISION_RATIONALE.md)
- [Next Production Implementation Roadmap](docs/NEXT_PRODUCTION_IMPLEMENTATION_ROADMAP.md)
- [Production Decision Changelog](docs/PRODUCTION_DECISION_CHANGELOG.md)
- [Production v1 Gap Audit](docs/PRODUCTION_V1_GAP_AUDIT.md)
- [Production v1 Roadmap](docs/PRODUCTION_V1_ROADMAP.md)
- [Production v1 Release Criteria](docs/PRODUCTION_V1_RELEASE_CRITERIA.md)
- [Production Release QA](docs/PRODUCTION_RELEASE_QA.md)
- [Production Release QA Run 2026-06-11](docs/PRODUCTION_RELEASE_QA_RUN_2026-06-11.md)
- [Production P0 Blocker Register](docs/PRODUCTION_P0_BLOCKER_REGISTER.md)
- [Production Golden Flows](docs/PRODUCTION_GOLDEN_FLOWS.md)
- [Production Release Decision Template](docs/PRODUCTION_RELEASE_DECISION_TEMPLATE.md)
- [Auth Account Persistence Architecture](docs/AUTH_ACCOUNT_PERSISTENCE_ARCHITECTURE.md)
- [Auth Data Model Proposal](docs/AUTH_DATA_MODEL_PROPOSAL.md)
- [Auth Sync Contract](docs/AUTH_SYNC_CONTRACT.md)
- [Auth Rollout Plan](docs/AUTH_ROLLOUT_PLAN.md)
- [Auth Provider Decision Record](docs/AUTH_PROVIDER_DECISION_RECORD.md)
- [Auth Implementation Plan](docs/AUTH_IMPLEMENTATION_PLAN.md)
- [Auth Provider Evaluation Checklist](docs/AUTH_PROVIDER_EVALUATION_CHECKLIST.md)
- [Auth Implementation P0 Requirements](docs/AUTH_IMPLEMENTATION_P0_REQUIREMENTS.md)
- [Track B Auth Principal Foundation](docs/TRACK_B_AUTH_PRINCIPAL_FOUNDATION.md)
- [Track B Minimal Auth Session Flow](docs/TRACK_B_MINIMAL_AUTH_SESSION_FLOW.md)
- [Account Persistence Contracts](docs/ACCOUNT_PERSISTENCE_CONTRACTS.md)
- [Server SRS Sync Architecture](docs/SERVER_SRS_SYNC_ARCHITECTURE.md)
- [Server SRS Sync Contract](docs/SERVER_SRS_SYNC_CONTRACT.md)
- [Server SRS Sync Spike](docs/SERVER_SRS_SYNC_SPIKE.md)
- [Server SRS Sync Test Plan](docs/SERVER_SRS_SYNC_TEST_PLAN.md)
- [Guest Account Migration Prototype](docs/GUEST_ACCOUNT_MIGRATION_PROTOTYPE.md)
- [Account Sync Conflict Resolution](docs/ACCOUNT_SYNC_CONFLICT_RESOLUTION.md)
- [Server Persistence Adapter Contract](docs/SERVER_PERSISTENCE_ADAPTER_CONTRACT.md)
- [Server Persistence Integration Harness](docs/SERVER_PERSISTENCE_INTEGRATION_HARNESS.md)
- [Account Sync API Route Design](docs/ACCOUNT_SYNC_API_ROUTE_DESIGN.md)
- [Account Sync API Handler Harness](docs/ACCOUNT_SYNC_API_HANDLER_HARNESS.md)
- [Account Sync Route Readiness Audit](docs/ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.md)
- [Account Sync Auth Ownership Boundary](docs/ACCOUNT_SYNC_AUTH_OWNERSHIP_BOUNDARY.md)
- [Account Sync Idempotency Storage Design](docs/ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.md)
- [Account Sync Schema Payload Contract](docs/ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT.md)
- [Account Sync Audit Redaction Policy](docs/ACCOUNT_SYNC_AUDIT_REDACTION_POLICY.md)
- [Account Sync Rollout Gate](docs/ACCOUNT_SYNC_ROLLOUT_GATE.md)
- [Account Sync Final Readiness Review](docs/ACCOUNT_SYNC_FINAL_READINESS_REVIEW.md)
- [Account Sync Auth Provider Decision](docs/ACCOUNT_SYNC_AUTH_PROVIDER_DECISION.md)
- [Account Sync DB Persistence Decision](docs/ACCOUNT_SYNC_DB_PERSISTENCE_DECISION.md)
- [Account Sync Runtime Validator Decision](docs/ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION.md)
- [Account Sync Implementation Spike Plan](docs/ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.md)
- [Account Sync Route Skeleton Decision](docs/ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.md)
- [Account Sync Preview Digest Mock](docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md)
- [Billing Entitlement Architecture](docs/BILLING_ENTITLEMENT_ARCHITECTURE.md)
- [Billing Data Model Proposal](docs/BILLING_DATA_MODEL_PROPOSAL.md)
- [Billing Provider Decision Record](docs/BILLING_PROVIDER_DECISION_RECORD.md)
- [Billing Rollout Plan](docs/BILLING_ROLLOUT_PLAN.md)
- [Billing Release Criteria](docs/BILLING_RELEASE_CRITERIA.md)
- [Production Deployment Readiness](docs/PRODUCTION_DEPLOYMENT_READINESS.md)
- [Deployment Environment Inventory](docs/DEPLOYMENT_ENVIRONMENT_INVENTORY.md)
- [Deployment Rollout Plan](docs/DEPLOYMENT_ROLLOUT_PLAN.md)
- [Production Deployment Checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Production Smoke Test Plan](docs/PRODUCTION_SMOKE_TEST_PLAN.md)
- [Production Analytics Reporting](docs/PRODUCTION_ANALYTICS_REPORTING.md)
- [Analytics Event Contract](docs/ANALYTICS_EVENT_CONTRACT.md)
- [Analytics Dashboard Requirements](docs/ANALYTICS_DASHBOARD_REQUIREMENTS.md)
- [Analytics Privacy and Data Safety](docs/ANALYTICS_PRIVACY_AND_DATA_SAFETY.md)
- [Analytics Rollout Plan](docs/ANALYTICS_ROLLOUT_PLAN.md)

These docs recommend against a full paid SaaS launch until account persistence,
server-side SRS sync, billing/entitlement, production deployment readiness,
analytics/reporting, support/refund/legal systems, content readiness, and launch
QA are complete. The minimal auth session doc records the only current runtime
auth flow; the other planning docs do not change runtime behavior.

## World-Class Operating System

Agent and release guidance:

```txt
AGENTS.md
PLANS.md
docs/goals/track-b-private-paid-beta-runway.md
docs/factory/track-b-owner-command-center.md
docs/factory/track-b-pr-lanes.md
docs/factory/track-b-merge-gates.md
docs/world_class_bar.md
docs/product_quality_rubric.md
docs/golden_user_flows.md
docs/code_review.md
docs/security_and_permissions.md
docs/release_checklist.md
evals/visual_lexicon_golden_cases.json
```

These docs define the product bar, quality rubric, golden flows, review
standards, safety boundaries, release checklist, and golden eval cases for paid
beta hardening. They do not change runtime behavior.

Factory goal runway docs:

- [Track B Private Paid Beta Goal Runway](docs/goals/track-b-private-paid-beta-runway.md)
- [Track B Owner Command Center](docs/factory/track-b-owner-command-center.md)
- [Track B PR Lanes](docs/factory/track-b-pr-lanes.md)
- [Track B Merge Gates](docs/factory/track-b-merge-gates.md)

## Current Scope

- Next.js App Router shell for the Track B learning app
- Approved initial routes plus local save and review modes
- Local Save -> Review -> SRS state/events loop
- Dashboard memory mission from local SRS state
- Pack previews and local pack progress
- Local paid beta placeholder surfaces and upgrade interest capture
- Extension bridge and multilingual alias search contracts

Account Sync, real payment, Webflow publishing, Cloudflare production
integration, production user data, and deployment settings are outside this
repository scope. Minimal existing-user Supabase Magic Link auth is present only
for private unpaid dogfood sessions.

## Track B Monetization v1

Canonical source pack:

- [`docs/monetization/v1/README.md`](docs/monetization/v1/README.md)
