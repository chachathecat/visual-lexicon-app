# Private Beta Readiness Rerun

## Executive Summary

This rerun consolidates PR #79 through PR #83 for Track B private paid beta
readiness.

Current verdicts:

- Owner-controlled private beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**
- Real checkout: **Blocked**
- Automatic entitlement: **Blocked**
- Real account sync: **Blocked**
- Monitoring SDK integration: **Blocked in current phase**
- Owner-run invite-only beta: **Allowed only if checklist is complete**

The owner may run a private, invite-only beta only when all required manual
checklists are complete. The beta must remain 5 to 20 manually invited users,
manual/payment-link-only, manually entitled, browser-local for learning state,
and supported by manual monitoring, incident logging, support, refund,
cancellation, privacy, and rollback procedures.

Public paid beta remains No-Go because there is no real payment integration, no
real account sync, no automated entitlement, no production monitoring/alerting,
no completed full accessibility audit, and no final production
privacy/support/refund gate.

## Readiness Delta Since #79

| Source | Delta | Owner-controlled private beta effect | Public beta effect |
| --- | --- | --- | --- |
| #79 Manual QA execution report | Established the local route, storage, console, hydration, mobile, keyboard, save, review, weak, packs, and pricing evidence baseline. | Conditional manual baseline. | No-Go baseline. |
| #80 Private beta gate prep | Added owner-invited cohort cap, allowed conditions, blocked conditions, owner checklist, and rollback criteria. | Allows only 5 to 20 owner-invited users when the checklist is complete. | Still No-Go. |
| #81 Manual payment / entitlement policy | Added manual/payment-link-only payment, owner approval, no checkout, no SDK, no automatic entitlement, refund/cancellation, and audit boundaries. | Allows only manual payment and manual entitlement. | Still No-Go because real payment and entitlement are absent. |
| #82 Account sync preview/digest mock | Added preview/digest-only account sync boundary and local-state disclosure requirements. | Allows only participants who accept local browser learning state. | Still No-Go because real account sync is absent. |
| #83 Monitoring, support, privacy beta gate | Added manual monitoring, route smoke, console/hydration capture, incident log, support, refund, privacy, consent, and pause criteria. | Allows only owner-run manual operations when ready. | Still No-Go because production monitoring/alerting is absent. |

## Gate-By-Gate Matrix

| Gate | Source | Owner-controlled private beta | Public paid beta | Required evidence |
| --- | --- | --- | --- | --- |
| Manual QA evidence | #79 | Conditional / Manual-only | No-Go | Fresh owner rerun with route, storage, console, hydration, mobile, keyboard, save, review, weak, packs, and pricing evidence. |
| Owner-controlled private gate | #80 | Allowed only if checklist is complete | No-Go | 5 to 20 user roster, no public signup, owner approval, and rollback criteria. |
| Manual payment and entitlement | #81 | Conditional / Manual-only | Blocked | Manual/payment-link evidence, owner approval, off-app entitlement record, refund/cancellation copy, and no app entitlement mutation. |
| Account sync limitation | #82 | Conditional / Manual-only | Blocked | Participant acceptance of browser-local progress, no roaming state, preview/digest only, and no apply/write operation. |
| Monitoring, support, privacy operations | #83 | Allowed only if checklist is complete | Blocked in current phase | Manual monitoring owner, incident log, support contact, privacy copy, refund/cancellation copy, console/hydration capture, and pause thresholds. |

## Private Beta Allowed Conditions

- Owner invites 5 to 20 users manually.
- Payment is manual/payment-link-only.
- Entitlement is manual and not automatic.
- Users accept local-state/account-sync limitation.
- Support contact is ready.
- Refund/cancellation wording is ready.
- Manual monitoring and incident log are ready.
- Owner reruns smoke checks before inviting users.
- No public signup or public checkout exists.

## Private Beta Blocked Conditions

- Manual QA evidence is missing or stale.
- Public signup, public checkout, billing, subscription, or self-serve paid access exists.
- Automatic entitlement or app entitlement mutation exists.
- Participant copy does not disclose or accept local-state/account-sync limits.
- Support, refund/cancellation, or privacy copy is not ready.
- Manual monitoring or incident log is missing.
- Owner approval is missing.

## Public Beta P0 Blockers

- No real payment integration.
- No real account sync.
- No automated entitlement.
- No production monitoring/alerting.
- Full accessibility audit is not complete.
- Privacy/support/refund final production gate is not complete.

## Remaining P1 Requirements

- Owner-run private beta launch checklist.
- Private beta invite packet and participant instructions.
- Private beta issue log template.
- Private beta final owner signoff.
- Fresh accessibility, mobile, and keyboard smoke evidence before invites.

## P2 Polish

- Private beta copy polish after the first cohort.
- Richer IELTS/GRE pack depth after the core learning loop is stable.
- Dashboard progress and streak polish after weekly reviewed words behavior is observed.
- Future AI mistake explanation only after the SRS loop and beta gates work.

## Owner Approval Checklist

- Approve Owner-controlled private beta as Conditional / Manual-only.
- Approve 5 to 20 manually invited users.
- Approve manual/payment-link-only payment flow.
- Approve manual entitlement and no automatic access.
- Approve local-state/account-sync limitation disclosure.
- Approve support, privacy, refund, and cancellation copy.
- Approve manual monitoring, issue log, and pause criteria.
- Confirm no public signup, public checkout, or public paid beta.

## Manual QA Evidence Checklist

- Save creates or preserves review state.
- Review answers create events and update memory state.
- Due, Weak, and Mastered derive from real review state.
- Core routes load before invites.
- Console error and hydration warning counts are recorded.
- Mobile and keyboard smoke is complete.

## Payment/Entitlement Checklist

- Use manual/payment-link-only payment.
- Confirm no checkout, payment SDK, subscription, billing portal, or invoice.
- Keep entitlement in an owner manual record.
- Confirm no automatic entitlement grant.
- Refund/cancellation wording is ready.

## Account Sync Limitation Checklist

- Real account sync remains blocked.
- Account sync work is preview/digest only.
- Local-state limitation is disclosed.
- Account sync preview cannot grant entitlement.

## Monitoring/Support/Privacy Checklist

- Manual monitoring owner and cadence are ready.
- Incident log template is ready.
- Support contact and response expectation are ready.
- Privacy copy is ready.
- Monitoring SDK integration is blocked in current phase.

## Incident/Rollback Checklist

- Pause invites when save or review loop breaks.
- Pause invites on repeated local state loss reports.
- Pause invites and payment requests on support, privacy, refund, or cancellation gaps.
- Pause immediately if public signup, public checkout, or self-serve access appears.
- Rerun smoke checks before resuming beta.

## Launch/No-Launch Decision Table

| Scenario | Decision | Verdict | Rationale |
| --- | --- | --- | --- |
| All owner, manual QA, payment, entitlement, account sync disclosure, support, privacy, monitoring, and rollback checklist items are complete. | Launch owner-controlled private beta. | Allowed only if checklist is complete. | Invite 5 to 20 users manually with no public signup or checkout. |
| Any required owner, manual QA, support, refund, privacy, local-state, incident, or smoke evidence is missing. | Do not launch. | No-Go. | Missing checklist evidence blocks even owner-controlled private beta. |
| Public paid beta, public signup, real checkout, automatic entitlement, or public marketing launch is proposed. | Do not launch. | No-Go. | Public paid beta remains blocked by P0 payment, account sync, entitlement, monitoring, accessibility, and production support/privacy/refund gaps. |
| Core review breaks, state loss repeats, support/privacy/refund gaps appear, or public/self-serve access leaks. | Pause or rollback. | Conditional / Manual-only. | Pause invites and payment requests, correct the issue, notify affected participants, and rerun smoke checks before resuming. |

## Recommended Next PR Sequence

Recommended next PR: **#85 Owner-run private beta launch checklist**

- #85 Owner-run private beta launch checklist
- #86 Private beta invite packet / participant instructions
- #87 Private beta issue log template
- #88 Private beta final owner signoff

## Safety Confirmation

This PR is docs/contracts/tests only. It does not implement runtime UI changes,
API routes, route handlers, middleware, auth integrations, DB/provider SDKs,
payment, billing, checkout, subscription, entitlement mutation, real account
sync, monitoring SDKs, AI calls, env var changes, deployment, Webflow,
Cloudflare, Vercel, DNS, secrets, or production data changes. It does not run
`npm audit fix`.

