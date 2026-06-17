# Private Beta Final Owner Signoff

## Executive Summary

This document is the final owner signoff contract before any owner-controlled
Visual Lexicon Track B private beta invitations may be sent.

The final signoff is manual and owner-controlled. It does not send invitations,
send emails, create GitHub issues, call external services, add provider SDKs,
change app routes, add auth, add billing, mutate entitlement, add real account
sync, deploy, or touch production systems.

The private beta may move forward only after the owner completes this checklist
and the next dry-run smoke evidence PR confirms the app is ready for invited
participants.

## Current Verdicts

- Owner-controlled private beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**
- Real checkout: **Blocked**
- Automatic entitlement: **Blocked**
- Real account sync: **Blocked**
- Public signup: **Blocked**
- Owner invitation: **Allowed only after signoff checklist is complete**

## Required Prior Gates

The owner must confirm these gates remain complete and accepted before sending
any invitations:

| PR | Gate | Required contribution |
| --- | --- | --- |
| #79 | Manual QA execution report | Baseline route, save, review, storage, console, hydration, mobile, keyboard, packs, pricing, and paywall evidence. |
| #80 | Private beta gate prep | Owner-controlled invite-only boundary, Conditional / Manual-only verdict, blockers, and rollback rules. |
| #81 | Manual payment / entitlement policy | Manual/payment-link-only boundary, no checkout, no automatic entitlement, support, refund, and cancellation policy. |
| #82 | Account sync preview/digest mock | Preview/digest-only account sync boundary and browser-local learning state disclosure. |
| #83 | Monitoring, support, privacy beta gate | Manual monitoring, support contact, privacy/localStorage disclosure, incident logging, and pause criteria. |
| #84 | Private beta readiness rerun | Consolidated readiness verdict keeping private beta conditional and public paid beta No-Go. |
| #85 | Owner-run private beta launch checklist | Owner checklist for roster cap, participant copy, smoke checks, rollback/pause, and post-invite reviews. |
| #86 | Private beta invite packet | Participant instructions for invite-only beta, local state, manual payment, no automatic entitlement, support, refund, privacy, issue reporting, and pause rules. |
| #87 | Private beta issue log template | Owner issue log for severity, route, reproduction, redacted evidence, local-state probes, decision, status, escalation, and pause/rollback tracking. |

## Owner Final Signoff Checklist

The owner must complete every item before invitations:

1. Confirm owner-controlled private beta is **Conditional / Manual-only** and
   public paid beta is **No-Go**.
2. Confirm required prior gates #79 through #87 are complete.
3. Confirm the participant cap is 5 to 20 manually selected participants.
4. Confirm invite-only owner-controlled access.
5. Confirm manual payment/payment-link-only handling.
6. Confirm no automatic entitlement.
7. Confirm local-state/account-sync limitation disclosure.
8. Confirm monitored support contact.
9. Confirm refund/cancellation copy.
10. Confirm privacy/localStorage disclosure.
11. Confirm issue log readiness.
12. Confirm smoke test readiness.
13. Confirm first 24-hour review plan.
14. Confirm first 7-day review plan.
15. Confirm public paid beta blockers remain blocked.
16. Complete the final decision table.
17. Confirm no forbidden integrations or production mutations were introduced.

## Launch Allowed Conditions

Owner-controlled private beta invitations are allowed only when:

- Final owner signoff checklist is complete.
- Required prior gates #79 through #87 remain complete.
- Manual roster contains 5 to 20 owner-selected participants.
- Invite-only access is enforced; no public signup or self-serve invite exists.
- Payment remains manual/payment-link-only.
- No automatic entitlement exists.
- Browser-local learning state and no real account sync are disclosed.
- Support, refund, cancellation, privacy, and localStorage copy are approved.
- Issue log and smoke test readiness are confirmed.
- First 24-hour and first 7-day review plans are scheduled.
- No unresolved P0/P1 blockers remain.

## No-Launch Conditions

Do not send invitations if any of these are true:

- Owner final signoff checklist is incomplete.
- Any unresolved P0/P1 blocker remains.
- Public signup, public waitlist, or self-serve invite is exposed.
- Real checkout, billing, subscription, invoice, billing portal, or payment SDK
  is active.
- Automatic entitlement or access mutation is active.
- Real account sync is claimed or enabled.
- Support, refund, cancellation, privacy, or localStorage copy is missing.
- Issue log readiness or smoke readiness is missing.
- A forbidden integration or production mutation was introduced.

## Pause/Rollback Conditions

Pause invitations or payment requests when:

- Save, review, or SRS state breaks.
- Payment or entitlement copy creates confusion.
- Privacy, redaction, or localStorage disclosure fails.
- Repeated state loss or account-sync assumptions appear.
- Issue log triage, support response, first 24-hour review, or first 7-day
  review cannot stay under owner control.
- Public exposure appears or the 20 participant cap is breached.

Resume only after the owner records evidence, updates the issue log, reruns the
needed smoke checks, and makes a continue/pause/stop decision.

## Participant Cap Confirmation

The beta is capped at 5 to 20 owner-selected participants. The owner must keep a
manual roster, stop at 20 participants until reapproval, and avoid public
signup, public waitlist, or self-serve invite paths.

## Invite-Only Confirmation

Owner invitation is **Allowed only after signoff checklist is complete**. There
is no public signup, self-serve invite, public checkout, or automatic access
grant.

## Manual Payment/Payment-Link-Only Confirmation

Payment remains manual or payment-link-only. This signoff does not add checkout,
subscription, invoice, billing portal, payment SDK, billing settings, or payment
automation.

## No Automatic Entitlement Confirmation

Payment does not automatically grant app access, mutate entitlement, or change
account status. Any access record remains manual and owner-controlled.

## Local-State/Account-Sync Limitation Confirmation

Saved words, review state, review events, and daily stats remain browser-local.
Real account sync, server-backed learning state, backup, restore, and
cross-device roaming are blocked until explicitly approved in a later scope.

## Support Contact Confirmation

Participant instructions, payment copy, refund/cancellation copy, privacy copy,
and issue-reporting instructions must name the same monitored support contact
and expected response path.

## Refund/Cancellation Copy Confirmation

Refund and cancellation copy must be approved before any payment request is
sent. Participants must understand the manual beta, payment-link-only handling,
and support path before paying.

## Privacy/localStorage Disclosure Confirmation

Participant copy must disclose that localStorage stores learning state. Public
docs may reference approved key names and redacted key presence/counts only; raw
localStorage dumps, raw emails, payment data, secrets, provider tokens, and
unredacted screenshots must not be recorded.

## Issue Log Readiness Confirmation

The owner issue log must be ready before invitations. It must capture severity,
route, feature area, status, reproduction steps, browser/device/viewport,
redacted evidence, approved localStorage key symptoms, owner decision, next
action, escalation, and pause/rollback impact.

## Smoke Test Readiness Confirmation

The owner must be ready to record PR #89 dry-run smoke evidence for approved
routes, save-to-review, active recall, review events, memory state updates,
Due/Weak/Mastered derivation, localStorage key presence/counts, console,
hydration, mobile, keyboard, pricing, paywall, and no-checkout/no-entitlement
boundaries.

## First 24-Hour Review Confirmation

Within the first 24 hours after invitations, the owner must review invite
delivery, participant questions, P0/P1 issues, support/payment/privacy reports,
broken save/review signals, state-loss reports, and the continue/pause decision
before inviting more participants.

## First 7-Day Review Confirmation

Within the first 7 days, the owner must review Weekly Reviewed Words behavior,
save and review return behavior, weak-word practice, issue patterns, support
load, refund/cancellation questions, local-state confusion, and the
continue/pause/stop decision.

## Final Decision Table

| Decision | Private beta allowed? | Public paid beta allowed? | Required evidence |
| --- | --- | --- | --- |
| Proceed with owner-controlled private beta | Yes, only within manual owner cap | No | All final signoff items complete, no P0/P1 blockers, PR #89 smoke evidence ready, owner accepts manual-only operations. |
| Delay and fix P0/P1 | No | No | Any P0/P1 blocker, missing confirmation, or smoke-readiness gap remains. |
| Stop and keep beta closed | No | No | Owner decides learning-loop, support, payment/privacy, local-state, or safety risk is unacceptable. |

## Public Paid Beta Blocker Table

| Blocker | Verdict | Why blocked |
| --- | --- | --- |
| Real checkout | Blocked | No checkout, billing, subscription, invoice, billing portal, payment SDK, or billing setting is approved. |
| Automatic entitlement | Blocked | Access must not be granted automatically from payment or account state. |
| Real account sync | Blocked | Learning state remains browser-local and cannot support public paid expectations. |
| Public signup | Blocked | Public signup exceeds owner-controlled invite-only private beta scope. |
| Production operations | Blocked | Public paid beta needs production monitoring, analytics, incident response, support, privacy, refund, deployment, content, and launch QA readiness. |

## Recommended Next PR Sequence

- **#89 Private beta dry-run smoke evidence**
- **#90 Owner-run private beta launch decision**

Recommended next PR: **#89 Private beta dry-run smoke evidence**

## Safety Confirmation

This signoff is docs/contracts/tests only. It does not implement runtime UI
changes, send invitations, send emails, add email provider integrations, create
GitHub issues automatically, call the GitHub API, add issue tracker
integrations, add monitoring SDKs, add analytics SDKs, add API routes, add route
handlers, add middleware, add auth integrations, add DB/provider SDKs, add
payment, billing, checkout, subscription, entitlement mutation, real account
sync, AI calls, env var changes, deployment changes, or production data
changes.

Webflow, Cloudflare Workers, Vercel, DNS, deployment settings, secrets,
production data, billing settings, payment settings, auth settings, and Track A
remain untouched.
