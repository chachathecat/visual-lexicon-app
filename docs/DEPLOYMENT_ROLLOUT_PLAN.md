# Deployment Rollout Plan

Rollout plan date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document does
not deploy, change Vercel settings, change DNS, touch Webflow, touch
Cloudflare Workers, add environment variables, add secrets, change auth
runtime, change billing runtime, add payment behavior, mutate production data,
or change current runtime app behavior.

## Rollout Principle

Deployment rollout should move from documentation readiness to production
sign-off only after each environment, domain, monitoring, rollback, and smoke
test gate is validated. Production paid SaaS launch remains no-go until account
persistence, server-side SRS sync, billing entitlement architecture,
deployment readiness, analytics/reporting, support/refund/legal copy, and
production release QA are validated.

## Phase 0: Deployment Readiness Docs Only

Goal: Create the deployment and domain readiness plan without changing runtime
behavior.

Scope:

- Add deployment readiness documentation.
- Add environment inventory structure.
- Add rollout, checklist, and smoke test planning docs.
- Link the docs from README.

Risks:

- Documentation could be mistaken for deployment approval.
- Missing safety language could imply production readiness.

Tests:

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test -- --workers=1`

Exit criteria:

- Docs are reviewed as planning-only artifacts.
- README links resolve.
- Validation results are recorded.
- Safety confirmation states no deployment or settings changes occurred.

Rollback plan:

- Revert the Markdown docs and README link changes.
- No data, DNS, Vercel, auth, billing, or runtime rollback is required.

## Phase 1: Vercel Project Audit

Goal: Verify that the intended Vercel project can safely host Track B.

Scope:

- Identify project owner and release owner.
- Verify repository connection, branch policy, build/install commands, runtime
  version, log access, domain settings, environment separation, and rollback
  capabilities.
- Record findings without changing settings unless a later approved task
  authorizes changes.

Risks:

- Wrong project or branch could be connected.
- Preview and production settings could be coupled.
- Rollback access could be unclear.

Tests:

- Build command verification in a safe preview context.
- Review deployment logs for build/runtime warnings.
- Confirm previous-deployment rollback path exists.

Exit criteria:

- Vercel audit is documented.
- Project, environment, and rollback owners are named.
- Any required setting change is split into an approved follow-up.

Rollback plan:

- If audit-only, no rollback is required.
- If a later approved change is made, revert the Vercel setting to its prior
  documented value and run preview smoke tests.

## Phase 2: Staging/Preview Validation

Goal: Prove production-like behavior outside localhost before public launch.

Scope:

- Validate preview/staging build.
- Run route smoke tests.
- Confirm local storage continuity in the deployed browser environment.
- Confirm pack loading behavior with approved public pack source or documented
  local mock fallback.
- Confirm no accidental auth, checkout, billing, or production launch claims.

Risks:

- Staging may use production data or production-like secrets incorrectly.
- Preview may expose unfinished paid claims.
- Pack source may differ from production.

Tests:

- Production smoke test plan against staging/preview.
- Build/test validation from CI or local equivalent.
- Manual route checks for `/`, `/dashboard`, `/saved`, `/save`, `/review`,
  `/review/due`, `/review/weak`, `/review/weak-sprint`, `/packs`,
  `/packs/[packId]`, `/pricing`, `/settings`, and `/word/[slug]`.

Exit criteria:

- Staging/preview test run is recorded.
- Any P0 issue is fixed before production sign-off.
- Any accepted P1/P2 issue has an owner and follow-up.

Rollback plan:

- Revert to the prior preview deployment.
- Disable or protect the staging URL if it exposes misleading claims.
- Document failures and rerun smoke tests after correction.

## Phase 3: Domain/DNS Readiness Review

Goal: Verify that `app.visuallexicon.org` can be mapped safely when production
launch is approved.

Scope:

- Identify DNS owner and change approver.
- Verify current DNS records and conflicts.
- Verify intended Vercel domain mapping.
- Verify TLS behavior and canonical host plan.
- Confirm Track A remains separate.

Risks:

- DNS change could disrupt Track A.
- TLS or propagation failure could make Track B unreachable.
- Incorrect redirects could send app traffic to Webflow or marketing traffic
  to the app.

Tests:

- Dry-run checklist with DNS owner.
- Confirm required DNS records from the deployment platform.
- Confirm rollback record values and expected propagation window.

Exit criteria:

- Domain readiness is documented.
- DNS owner signs off.
- Rollback owner and rollback records are recorded.
- No DNS change is made without explicit approval.

Rollback plan:

- Restore prior DNS records if a later approved DNS change fails.
- Revert Vercel domain assignment if needed.
- Run production URL health checks after rollback propagation.

## Phase 4: Production Environment Variable Readiness

Goal: Confirm production configuration is complete, environment-scoped, and
safe.

Scope:

- Complete the environment inventory.
- Separate local, staging, and production values.
- Verify no secret is exposed through browser bundles.
- Confirm public values are intentionally public.
- Confirm future auth, server SRS sync, billing, analytics, and support
  variables are planned but not added until their implementation PRs.

Risks:

- Missing production variable causes runtime failure.
- Secret is accidentally placed in `NEXT_PUBLIC`.
- Staging and production share credentials.
- Placeholder payment URLs are confused with real checkout.

Tests:

- Build with production-like environment in a safe context.
- Review browser bundle exposure for public-only variables.
- Smoke test pack loading and pricing placeholder behavior.

Exit criteria:

- Inventory is approved by owner.
- Every production value has a sensitivity classification.
- No real secret appears in docs or repository files.
- No unapproved auth, billing, or payment variables are introduced.

Rollback plan:

- Restore the prior environment variable values in Vercel if a later approved
  change breaks production.
- Redeploy the last known good build if required.
- Rotate any secret suspected of exposure.

## Phase 5: Monitoring/Error Reporting Readiness

Goal: Ensure production failures are visible and actionable.

Scope:

- Define availability checks for the production URL.
- Define client/server error reporting.
- Define alerts for pack loading, save, review, SRS, auth, sync, billing, and
  analytics failures as those systems exist.
- Define severity levels and incident owner.

Risks:

- App can fail silently after launch.
- Review writes or SRS updates can fail without alerting.
- Billing or entitlement errors can continue without stop-sales decision.

Tests:

- Trigger safe test errors in staging where supported.
- Confirm alert routing reaches the release owner.
- Confirm dashboards separate staging and production.

Exit criteria:

- Monitoring owner signs off.
- Alert paths and severity levels are documented.
- Smoke test includes health and error-reporting checks.

Rollback plan:

- If monitoring setup breaks runtime behavior, remove or disable the monitoring
  integration and redeploy the last known good build.
- If production impact is unknown, pause launch and keep the app in no-go state.

## Phase 6: Production Smoke Test Rehearsal

Goal: Rehearse the exact production smoke test before production deployment.

Scope:

- Run the smoke test plan against staging/preview.
- Record expected results, owners, timestamps, blockers, and follow-ups.
- Confirm no fake mastery, accidental checkout, accidental auth claim, or
  accidental production billing claim.

Risks:

- Manual steps may be ambiguous on launch day.
- Test data may not cover the learning loop.
- Smoke tests may miss localStorage continuity.

Tests:

- Full `docs/PRODUCTION_SMOKE_TEST_PLAN.md`.
- Browser checks across fresh and returning sessions.
- Review of pricing/settings copy for unauthorized production claims.

Exit criteria:

- Rehearsal results are documented.
- P0 blockers are resolved.
- Launch-day smoke test owner is assigned.

Rollback plan:

- Revert any smoke-test-only test data or settings.
- Keep production launch blocked until rehearsal passes.

## Phase 7: Production Deployment Sign-Off

Goal: Decide whether production deployment may proceed.

Scope:

- Review validation results.
- Review Vercel, domain/DNS, environment, monitoring, smoke test, support,
  auth, sync, billing, analytics, and legal readiness.
- Record final go/no-go decision.

Risks:

- Launch could proceed with unresolved P0 gaps.
- Paid claims could go live before billing/support/legal are ready.
- Rollback or stop-sales owner could be unavailable.

Tests:

- Final build/test validation.
- Final production smoke test immediately after deployment if deployment is
  explicitly approved.
- Rollback decision drill.

Exit criteria:

- Named owner signs off on each launch-critical area.
- No unresolved P0 gaps remain.
- P1 risks are accepted with owners and dates.
- Go/no-go decision is recorded.

Rollback plan:

- If deployment is not approved, do not deploy.
- If a later approved production deployment fails, roll back to the previous
  Vercel deployment, restore prior DNS if needed, stop sales if payment has
  been enabled, run smoke tests, and publish incident/support notes.
