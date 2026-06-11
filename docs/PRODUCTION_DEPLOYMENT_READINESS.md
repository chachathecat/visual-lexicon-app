# Production Deployment Readiness

Readiness date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document does
not deploy the app, change Vercel settings, change DNS, touch Webflow, touch
Cloudflare Workers, add environment variables, add secrets, change auth runtime,
change billing runtime, add payment behavior, mutate production data, or change
current runtime app behavior.

## Goal

Define the deployment and domain readiness bar for serving the Track B learning
app at:

```txt
app.visuallexicon.org
```

Production deployment readiness must protect the core learning loop:

```txt
Save -> Review -> review_state/events -> Due/Weak/Mastered -> Weekly Reviewed Words
```

The deployment plan must make the app observable, reversible, and clearly
separated from Track A before any public production paid SaaS launch.

## Non-Goals

- Do not deploy this PR.
- Do not change Vercel project, environment, domain, redirect, or deployment
  settings.
- Do not change DNS or Cloudflare settings.
- Do not touch Track A, Webflow publishing, Webflow CMS, or Cloudflare
  production Workers.
- Do not add, rename, remove, or populate environment variables.
- Do not add secrets, request secrets, expose secrets, or move secrets.
- Do not add auth, server SRS sync, billing, checkout, subscription, invoice,
  payment link, billing portal, or payment SDK behavior.
- Do not claim production deployment is ready.

## Track A Versus Track B Boundary

Track A is the public discovery layer on `visuallexicon.org` and Webflow. It
may introduce users to Visual Lexicon, host public marketing content, and route
qualified learners toward the app when approved.

Track B is the Next.js learning app intended for `app.visuallexicon.org`. It
owns the learning surfaces: saved words, review, due review, weak review, weak
sprint, packs, word detail, settings, and pricing placeholders.

Production deployment work for Track B must not require Webflow publishing,
Webflow CMS changes, Cloudflare production Worker edits, DNS changes, billing
settings, auth settings, or production data mutation unless a later approved
release explicitly authorizes that work.

## Intended Production Domain

The intended production app domain is:

```txt
app.visuallexicon.org
```

The domain is not ready until ownership, DNS records, Vercel domain mapping,
TLS status, redirect behavior, cache behavior, and rollback ownership are
verified outside this documentation PR.

No document in this PR authorizes changing the domain, adding DNS records, or
claiming that `app.visuallexicon.org` is live.

## Current Local/Private Beta Status

The current app is a strong local/private beta learning MVP:

- Save creates or preserves local review state.
- Review answers create local events and update local SRS state.
- Due, Weak, and Mastered derive from real local review state.
- Packs and pack progress are represented locally.
- Pricing and upgrade interest are placeholders and do not create checkout,
  subscription, invoice, billing portal, or paid entitlement behavior.

This status is not enough for production paid SaaS launch because account
persistence, server-side SRS sync, billing entitlement enforcement, deployment
readiness, analytics/reporting, support/refund/legal copy, and production
release QA still need validation.

## Required Deployment Environments

| Environment | Purpose | Required before launch |
| --- | --- | --- |
| Local development | Developer validation and docs-only checks. | Existing local setup remains documented and reproducible. |
| Preview/staging | Validate production-like builds, environment separation, smoke tests, and rollback rehearsal before public launch. | Dedicated preview/staging URL, owner, environment inventory, smoke test record, and no live payment behavior without approval. |
| Production | Serve `app.visuallexicon.org` after sign-off. | Verified Vercel project, domain, DNS, environment variables, monitoring, rollback plan, smoke test plan, and owner sign-off. |

Preview/staging must be available before production launch because auth,
server-side SRS sync, billing, analytics, and support flows cannot be safely
validated only on localhost.

## Required Vercel Project Readiness

Before production launch, the Vercel project must have a documented audit for:

- Repository connection and branch/deployment policy.
- Build command, install command, framework detection, and Node/runtime
  versions.
- Preview, staging, and production environment separation.
- Domain assignments and canonical host behavior.
- Environment variable inventory by environment.
- Secret storage policy and access owner.
- Deployment protection for staging if test accounts or internal data are used.
- Rollback procedure, including previous deployment selection and owner.
- Build log access, deployment log access, and incident owner.
- Error reporting, analytics, and uptime monitoring integration status.

This document does not perform that audit. It defines the required audit bar.

## Required Domain/DNS Readiness

Before `app.visuallexicon.org` can be used for production, the release owner
must verify:

- DNS owner and change approver.
- Current DNS records and whether any existing app or redirect uses the
  subdomain.
- Required Vercel domain verification records.
- TLS certificate status and renewal ownership.
- Canonical host behavior for `app.visuallexicon.org`.
- Whether root-domain, `www`, and Track A routes remain isolated.
- Rollback option if DNS propagation, TLS, or routing fails.
- Monitoring check against the final production URL.

DNS readiness is a P0 launch gate. This PR does not change DNS.

## Required Environment Variable Inventory

Before production deployment, every environment variable and external runtime
setting must have an inventory entry covering:

- Purpose.
- Owner.
- Environment scope: local, preview/staging, production.
- Sensitivity.
- Whether it can be public.
- Whether it can be exposed through `NEXT_PUBLIC`.
- Risk if missing.
- Risk if exposed.
- Implementation status: planned only, existing, or must verify.

The companion document `docs/DEPLOYMENT_ENVIRONMENT_INVENTORY.md` defines the
proposed inventory structure. It does not add new environment variables.

## Required Secrets Handling Policy

Production launch must require:

- Secrets stored only in approved server-side secret stores.
- No secrets committed to the repository.
- No secrets exposed through browser bundles or `NEXT_PUBLIC` variables.
- No secrets pasted into docs, tickets, screenshots, logs, or support notes.
- Separate production and staging secrets.
- Named owners for rotating auth, sync, billing, analytics, and support
  secrets.
- A documented revoke/rotate procedure before launch.
- Log scrubbing for tokens, credentials, webhook signing material, and customer
  identifiers where needed.

Safe public URLs can be documented when they are intentionally public. Secret
values must never be documented.

## Required Rollback Strategy

Production deployment must be reversible without data loss or broken learning
state. Required rollback coverage:

- Vercel deployment rollback to the last known good production build.
- DNS rollback owner and expected propagation window.
- Runtime feature rollback for auth, sync, billing, analytics, and support
  surfaces when those systems exist.
- Stop-sales path before any real payment behavior is enabled.
- Support and status copy for learner-facing incidents.
- Smoke test after rollback.
- Incident record with timeline, owner, user impact, and follow-up PRs.

For this docs-only PR, rollback is limited to reverting Markdown docs and
README links.

## Required Monitoring/Error Reporting Plan

Production launch requires monitoring for:

- App availability and production URL health.
- Build and deployment failures.
- Client runtime errors by route.
- Pack loading failures.
- Save failures.
- Review answer failures.
- SRS state update failures.
- Due, Weak, and Mastered selector anomalies.
- Future auth session, account migration, and account recovery failures.
- Future server SRS sync write, retry, conflict, and hydration failures.
- Future billing webhook, entitlement, checkout, refund, and cancellation
  failures.
- Analytics/reporting gaps for Weekly Reviewed Words.

Monitoring must have an owner, alert path, severity levels, and rollback or
stop-sales decision criteria before production paid launch.

## Required Smoke Test Plan

Production launch requires a manual smoke test plan that can be run against:

- Local development before merge.
- Preview/staging before production promotion.
- Production immediately after deployment.
- Production after rollback, if rollback occurs.

The companion document `docs/PRODUCTION_SMOKE_TEST_PLAN.md` defines the
expected manual coverage. Smoke tests must confirm the app still avoids fake
mastery, accidental checkout, accidental auth claims, and accidental production
billing claims.

## Required Staging Versus Production Separation

Staging and production must be separated by:

- Domain and canonical URL.
- Environment variables.
- Secrets.
- Auth providers and account stores when auth exists.
- Server-side SRS stores when sync exists.
- Billing providers, test mode, products, prices, webhooks, and entitlement
  records when billing exists.
- Analytics projects or clear environment tags.
- Support and incident routing.
- Test accounts and production user data.

No staging test data should be able to grant production paid access. No
production user data should be required for staging QA.

## Required Release Ownership

Before production launch, ownership must be assigned for:

- Release lead and final go/no-go decision.
- Vercel project and deployment operations.
- Domain/DNS changes.
- Environment variables and secrets.
- Auth/account persistence readiness.
- Server SRS sync readiness.
- Billing/entitlement readiness.
- Analytics/reporting readiness.
- Support/refund/legal readiness.
- Smoke test execution and sign-off.
- Rollback and stop-sales decisions.
- Incident communication.

No production deployment should proceed without explicit owner sign-off.

## P0 Gap List

P0 gaps block production paid SaaS launch.

| Gap | Why it blocks launch | Required action |
| --- | --- | --- |
| Domain and DNS not verified | The intended production host may not route, secure, or isolate correctly. | Audit `app.visuallexicon.org`, DNS owner, TLS, routing, and rollback path. |
| Vercel project readiness not audited | Build, environment, domain, and rollback settings are not production-proven. | Complete Vercel project audit before launch. |
| Environment inventory incomplete | Missing or exposed configuration could break app behavior or leak secrets. | Approve local, staging, and production inventory. |
| No staging validation record | Production-like behavior is not rehearsed outside localhost. | Create staging/preview validation and smoke test record. |
| Monitoring/error reporting not ready | Production failures could be invisible. | Add health, errors, review, sync, billing, and analytics monitoring plan. |
| Rollback and stop-sales ownership undefined | Incidents could continue charging or serving broken paid access. | Assign owners and rehearse rollback/stop-sales before launch. |
| Auth, server SRS sync, and billing still pending production validation | Paid users cannot safely own progress or entitlement state. | Complete and validate the prior production foundations before launch. |

## P1 Gap List

P1 gaps may not block all internal deployment rehearsals, but they block a
confident public launch.

- Production smoke test evidence for every approved route and learning loop.
- Documented support path for deployment incidents, access issues, data loss,
  billing questions, and refund requests.
- Analytics/reporting plan for Weekly Reviewed Words and activation funnels.
- Production content and pack URL verification.
- Release checklist with named sign-off from product, engineering, support, and
  operations owners.
- Incident severity definitions and escalation expectations.

## P2 Gap List

P2 gaps can follow after the P0/P1 launch bar is satisfied.

- Automated synthetic monitoring for every major route.
- Performance budgets by route and network condition.
- More detailed deployment dashboards.
- Expanded disaster recovery exercises.
- Formal post-launch review template and recurring release calendar.

## Go/No-Go Recommendation

No-go for production paid SaaS launch today.

Do not deploy or launch production paid SaaS until account persistence,
server-side SRS sync, billing entitlement architecture, deployment readiness,
analytics/reporting, support/refund/legal copy, and production release QA are
validated.

This PR should be treated as Phase 0 documentation readiness for the next
foundation PR, recommended next as `#45 Production analytics/reporting`.
