# Production Deployment Checklist

Checklist date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This checklist does
not authorize deployment, Vercel changes, DNS changes, Webflow changes,
Cloudflare Worker changes, environment variable changes, secrets, auth runtime
changes, billing runtime changes, payment behavior, production data mutation, or
runtime behavior changes.

Use this checklist only after the deployment readiness plan, environment
inventory, rollout plan, smoke test plan, and production release QA have
assigned owners.

## Before Deployment

- [ ] Release owner is named.
- [ ] Deployment operator is named.
- [ ] Rollback owner is named.
- [ ] Stop-sales owner is named for any release that can accept payment.
- [ ] Support/incident owner is named.
- [ ] `npm.cmd run typecheck` passed on the release candidate.
- [ ] `npm.cmd run lint` passed on the release candidate.
- [ ] `npm.cmd run build` passed on the release candidate.
- [ ] `npm.cmd run test -- --workers=1` passed on the release candidate.
- [ ] Vercel project, repository, branch policy, build command, install command,
  runtime version, logs, and rollback access are audited.
- [ ] Staging/preview deployment has been validated.
- [ ] Production environment variable inventory is complete.
- [ ] No secret is exposed through repository files, docs, logs, screenshots, or
  browser `NEXT_PUBLIC` variables.
- [ ] Public variables are intentionally public and approved.
- [ ] Domain/DNS owner has verified `app.visuallexicon.org` readiness.
- [ ] TLS and canonical host behavior are documented.
- [ ] Track A Webflow and root-domain behavior remain separate from Track B.
- [ ] Auth/account persistence readiness is approved or production launch
  remains no-go.
- [ ] Server SRS sync readiness is approved or production launch remains no-go.
- [ ] Billing/entitlement readiness is approved or production paid launch
  remains no-go.
- [ ] No real checkout, subscription, invoice, billing portal, or payment SDK is
  present unless separately authorized.
- [ ] Analytics/reporting readiness includes Weekly Reviewed Words.
- [ ] Support contact, refund, cancellation, terms, privacy, and legal copy are
  approved before any paid launch.
- [ ] Production smoke test rehearsal passed on staging/preview.
- [ ] Rollback rehearsal or tabletop review is recorded.
- [ ] Go/no-go meeting has all required owners present or delegated.

## Deployment Day

- [ ] Confirm branch, commit, and deployment artifact.
- [ ] Confirm no unrelated changes are included.
- [ ] Confirm Vercel target project and environment.
- [ ] Confirm production environment variables are present and scoped correctly.
- [ ] Confirm no staging secrets are used in production.
- [ ] Confirm no production secrets are used in staging.
- [ ] Confirm domain/DNS change window and rollback window if a DNS change is
  part of an explicitly approved release.
- [ ] Confirm Track A Webflow publishing is not part of this deployment.
- [ ] Confirm Cloudflare production Workers are not part of this deployment.
- [ ] Confirm billing, auth, and server SRS owners are available if those
  systems are included in a later release.
- [ ] Deploy only after explicit release owner approval.
- [ ] Record deployment timestamp, operator, commit, and deployment URL.

## Immediately After Deployment

- [ ] Production URL loads at `app.visuallexicon.org`.
- [ ] TLS is valid.
- [ ] Canonical host behavior matches the plan.
- [ ] Home page smoke test passes.
- [ ] Dashboard smoke test passes.
- [ ] Saved smoke test passes.
- [ ] Save route smoke test passes.
- [ ] Review route smoke test passes.
- [ ] Due review smoke test passes.
- [ ] Weak review smoke test passes.
- [ ] Weak sprint smoke test passes.
- [ ] Packs smoke test passes.
- [ ] Pack detail smoke test passes.
- [ ] Pricing smoke test passes.
- [ ] Settings smoke test passes.
- [ ] Word detail smoke test passes.
- [ ] localStorage continuity smoke test passes.
- [ ] Due, Weak, and Mastered still derive from real review state.
- [ ] No fake mastery is displayed.
- [ ] No accidental checkout is available.
- [ ] No accidental auth claim is displayed.
- [ ] No accidental production billing claim is displayed.
- [ ] Error reporting and monitoring receive expected healthy signals.
- [ ] Analytics/reporting receives only approved events.
- [ ] Support owner confirms support path is live if the release is public.
- [ ] Release owner records post-deployment status.

## Rollback Decision

Rollback should be considered immediately if any P0 condition is observed:

- [ ] Production URL is unavailable or TLS is invalid.
- [ ] Track A routes, Webflow, or root-domain behavior are disrupted.
- [ ] Save or review is broken.
- [ ] Review answers fail to create events or update SRS state.
- [ ] Due, Weak, or Mastered is not derived from real state.
- [ ] A secret or private endpoint is exposed.
- [ ] Auth claims appear before auth is ready.
- [ ] Checkout, subscription, invoice, or billing portal behavior appears before
  explicit authorization.
- [ ] Billing entitlements are wrong, missing, or grant access without evidence.
- [ ] Production analytics cannot distinguish staging/test traffic.
- [ ] Monitoring shows sustained runtime errors.
- [ ] Support owner cannot handle public incident volume.

Rollback execution:

- [ ] Release owner approves rollback.
- [ ] Deployment operator reverts to last known good Vercel deployment.
- [ ] DNS owner restores prior records if a DNS change caused the incident.
- [ ] Stop-sales owner disables new paid checkout if payment has been enabled
  in a later approved release.
- [ ] Smoke test owner reruns production smoke tests after rollback.
- [ ] Support owner publishes or sends incident guidance if users were affected.
- [ ] Incident owner records timeline, impact, root cause, and follow-up PRs.

## Stop-Sales Decision

Stop sales if any paid release later shows:

- [ ] Checkout creates access without account ownership.
- [ ] Entitlements grant paid access without provider or approved manual
  evidence.
- [ ] Refund, cancellation, chargeback, failed-payment, or expiry states cannot
  be processed.
- [ ] Billing webhook verification or idempotency fails.
- [ ] Account persistence or server SRS sync is degraded enough to risk paid
  learner progress.
- [ ] Pricing, support, refund, cancellation, terms, privacy, or billing copy is
  inaccurate.
- [ ] Support owner cannot respond to payment or access issues.

Stop-sales execution:

- [ ] Disable new checkout creation through the approved server-side control.
- [ ] Keep existing learner data intact.
- [ ] Preserve billing and entitlement audit logs.
- [ ] Publish support/status guidance.
- [ ] Do not resume sales until root cause, remediation, QA, and owner sign-off
  are complete.

## Post-Launch Monitoring

- [ ] Monitor app availability.
- [ ] Monitor client runtime errors.
- [ ] Monitor pack loading failures.
- [ ] Monitor save failures.
- [ ] Monitor review answer failures.
- [ ] Monitor SRS state update failures.
- [ ] Monitor Due, Weak, and Mastered selector anomalies.
- [ ] Monitor future auth session and migration failures.
- [ ] Monitor future server SRS sync write, retry, conflict, and hydration
  failures.
- [ ] Monitor future billing webhook, entitlement, checkout, refund,
  cancellation, and failed-payment failures.
- [ ] Monitor Weekly Reviewed Words reporting.
- [ ] Monitor support volume and incident themes.
- [ ] Record launch notes, accepted risks, follow-up owners, and next PRs.
