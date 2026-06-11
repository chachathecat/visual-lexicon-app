# Public Paid Launch Decision 2026-06-11

Decision date: 2026-06-11

Scope: Visual Lexicon Track B production paid launch decision for
`app.visuallexicon.org`.

This document is documentation-only. It does not deploy, change Vercel
settings, change DNS, touch Webflow, touch Cloudflare Workers, add environment
variables, add secrets, add auth runtime, add billing runtime, add analytics
SDKs, add tracking scripts, mutate production data, or change runtime app
behavior.

## Decision Summary

Decision: No-Go / Not Yet for public production paid SaaS.

Release type allowed now: local/private no-payment beta planning only.

Paid open beta: deferred unless explicitly approved later with account-bound
entitlement and support/refund caveats.

Production v1: blocked until P0 systems are implemented and verified.

Visual Lexicon Track B is strong as a local/private beta learning MVP. The core
local loop is represented and repeatedly validated: Save -> Review ->
`review_state`/events -> Due / Weak / Mastered. That evidence supports continued
private learning-loop work, but it does not prove that Visual Lexicon can safely
charge public users for a production SaaS product.

## Release Type

| Item | Status | Decision impact |
| --- | --- | --- |
| Local/private no-payment beta planning | Allowed | Continue improving the learning loop and implementation foundations without charging users. |
| Paid open beta | Deferred | Requires explicit later approval, account-bound entitlement, support/refund caveats, and clear beta wording. |
| Public production paid SaaS | No-Go | Blocked until auth, server sync, billing, entitlement, deployment, analytics, support/legal, QA, and owner sign-off are complete. |

Payment posture: no real payment, checkout, subscription, invoice, billing
portal, payment SDK, or payment link behavior is approved by this decision.

Account/sync posture: local storage remains the current MVP persistence layer.
Real account persistence, cross-device progress, and server-side SRS sync are
not implemented.

Entitlement posture: local plan and upgrade interest state are not proof of
payment and must not be treated as production entitlement.

Deployment posture: no production deployment, domain verification, DNS change,
or Vercel setting change was performed for this decision.

## Launch Owner Status

Launch owner status: missing final launch owner sign-off.

The launch owner has not accepted public production paid SaaS risk, validation,
support readiness, rollback readiness, stop-sales responsibility, or final
go/no-go accountability.

## Support Owner Status

Support owner status: missing production support owner sign-off.

Support/refund/legal operational copy is not finalized. A support path for
access, payment, refund, cancellation, data loss, and sync issues is required
before public users are charged.

## Rollback Owner Status

Rollback owner status: missing rollback owner sign-off.

Rollback procedures are documented at a planning level, but production rollback
has not been rehearsed against a verified staging or production deployment for
auth, sync, billing, entitlement, analytics, and domain behavior.

## Billing Owner Status

Billing owner status: missing billing owner sign-off.

Billing architecture exists, but no provider integration, checkout,
subscription state, invoice handling, billing portal, webhook processing,
refund handling, cancellation handling, or server-side entitlement enforcement
has been implemented or approved by this decision.

## Validation Results Summary

Required validation commands for this documentation PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

Current PR validation status: passed after installing locked dependencies with
`npm.cmd install`.

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run typecheck` | Passed | Initial attempt failed because `node_modules` was absent and `tsc` was unavailable; after `npm.cmd install`, `tsc --noEmit` passed. |
| `npm.cmd run lint` | Passed | `next lint` completed with no ESLint warnings or errors. |
| `npm.cmd run build` | Passed | `next build` compiled successfully and generated 25 static pages. |
| `npm.cmd run test -- --workers=1` | Passed | Playwright reported 81 passed and 1 skipped across 82 tests. |

Dependency note: `npm.cmd install` reported 5 audit vulnerabilities and
deprecation warnings. `npm audit fix` was not run.

Most recent reported validation context from the planning chain: 81 passed and
1 skipped in the full Playwright suite. That result supports the current local
MVP, not production paid SaaS readiness.

## Manual QA Status Summary

Manual QA status: no production paid launch manual QA has passed for this
decision.

The existing release QA package documents local/manual QA templates and current
local MVP expectations. It does not prove:

- Real account creation, sign-in, recovery, or account ownership.
- Cross-device saved word and SRS progress.
- Server-side review event idempotency and conflict handling.
- Billing provider integration, payment states, refunds, cancellations, or
  invoice access.
- Server-side entitlement enforcement.
- Production domain, DNS, TLS, monitoring, and rollback behavior.
- Trusted production analytics/reporting for Weekly Reviewed Words.
- Production support, refund, legal, privacy, and cancellation operations.

## Open P0 Gaps

| Gap | Status | Launch impact |
| --- | --- | --- |
| Real auth/account persistence | Architecture documented; runtime not implemented. | No-Go. Paid users cannot reliably own progress or recover access. |
| Server-side saved/review SRS sync | Architecture and contracts documented; runtime not implemented. | No-Go. Memory state remains browser-local and device-bound. |
| Cross-device progress | Not implemented. | No-Go. Paid progress, due queues, weak state, and mastery do not follow accounts. |
| Real billing provider integration | Architecture documented; runtime not implemented. | No-Go. No safe way to create, manage, refund, cancel, or audit subscriptions. |
| Server-side entitlement enforcement | Architecture documented; runtime not implemented. | No-Go. Local plan state cannot grant or revoke paid access. |
| Production deployment/domain verification | Planning docs exist; verification not performed. | No-Go. `app.visuallexicon.org` production readiness is unproven. |
| Trusted production analytics/reporting implementation | Architecture documented; production pipeline not implemented. | No-Go. Weekly Reviewed Words cannot be trusted as a production metric. |
| Support/refund/legal operational copy | Requirements documented; final copy and owners missing. | No-Go. Users should not be charged without clear support and billing terms. |
| Production staging/smoke QA | Test plans exist; staging/production execution not complete. | No-Go. Local tests do not validate the production runtime. |
| Final launch/support/rollback owner sign-off | Missing. | No-Go. No accountable owner has accepted launch risk. |

## Accepted P1 Gaps

No P1 gaps are accepted for a production paid launch in this No-Go decision.

The following can remain post-P0 follow-up only after the production launch bar
is otherwise met:

- Broader UI polish beyond launch-critical states.
- Advanced pack merchandising and preview analytics.
- Full extension integration beyond current app-side bridge contracts.
- Full multilingual pages and generated multilingual content.
- AI Tutor or wrong-answer explanation features after SRS sync is production
  safe.
- Admin tooling beyond minimum production support needs.

## Stop-Sales Triggers

If paid access is later approved, any of these conditions should pause checkout,
hide paid CTAs, revert to no-payment beta, or disable paid access:

- Auth/account creation, sign-in, session refresh, or recovery fails above the
  accepted threshold.
- Review event writes fail, duplicate, or over-advance SRS state.
- Due, Weak, or Mastered becomes untrusted, stale, or fakeable.
- Local and server SRS state diverge without a safe conflict path.
- Billing webhook processing fails, entitlements drift, or subscription states
  cannot be reconciled.
- Refund, cancellation, failed-payment, disputed, expired, or revoked states
  cannot be handled.
- Production deployment, DNS, TLS, monitoring, or rollback fails.
- Analytics cannot report Weekly Reviewed Words from trusted review behavior.
- Support owner cannot respond to access, billing, refund, data loss, or sync
  issues.
- Legal/privacy/refund/cancellation copy is missing, inaccurate, or unpublished.

## Rollback Procedure Status

Rollback status: planning-level only; not production verified.

Current safe rollback target: continue local/private no-payment beta planning
with no checkout, no billing runtime, no production entitlement, and no public
paid launch claim.

Required before any later paid launch:

- Named rollback owner.
- Verified staging and production deployment identifiers.
- Tested rollback path for app runtime, environment variables, DNS/domain
  posture, auth, sync, billing, entitlement, analytics, and support messaging.
- Data safety plan for review events, SRS state, account state, and entitlement
  state.
- Customer communication plan for access, billing, refund, and progress issues.
- Post-rollback smoke test and metric checks.

## Safety Confirmation

| Safety item | Touched by this decision PR? | Notes |
| --- | --- | --- |
| Webflow or Track A publishing | No | Track A remains untouched. |
| Cloudflare production Workers | No | No Worker changes. |
| DNS or domain settings | No | No DNS changes. |
| Vercel deployment/settings | No | No deployment or setting changes. |
| Auth runtime | No | No auth provider, session, route guard, or account runtime added. |
| Billing runtime | No | No provider, webhook, subscription, invoice, refund, or billing portal runtime added. |
| Checkout, payment SDK, subscription, invoice, or billing portal | No | Payment remains explicitly unimplemented. |
| Analytics SDKs, tracking scripts, or network calls | No | No analytics runtime added. |
| Environment variables or secrets | No | No env vars or secrets added, changed, moved, or requested. |
| Production user data | No | No production data mutation. |
| Production pack data or R2 objects | No | No production pack/R2 mutation. |
| Webflow CMS items | No | No CMS edits. |
| AI Tutor functionality | No | Not added. |
| Multilingual page generation | No | Not added. |
| Runtime app behavior | No | Documentation-only change. |

## Final Recommendation

Recommendation: No-Go / Not Yet for public production paid SaaS.

Continue only as local/private no-payment beta planning until P0 systems are
implemented and verified.

Do not add payment before account persistence and server-side SRS sync are
implemented and validated. Payment without durable account-owned memory state
would make paid progress unreliable and undermine the core product promise.

## Next Implementation Roadmap After This Decision

After #47, move from documentation-only planning into carefully scoped
implementation foundations:

1. #48 Auth provider decision and account implementation plan.
2. #49 Account persistence typed contracts and mocks.
3. #50 Server SRS sync implementation spike behind feature flag.
4. #51 Guest-to-account migration prototype.
5. #52 Server-side review event idempotency tests.
6. #53 Staging deployment audit.
7. #54 Support/refund/legal copy draft.
8. #55 Billing provider final decision.
9. #56 Test-mode entitlement snapshot prototype.
10. #57 Production readiness rerun.

The next merge after this decision should begin with auth provider decision and
account persistence work. Billing, checkout, payment SDKs, payment links, and
real entitlements should remain out of scope until account persistence and
server-side SRS sync are working and verified.
