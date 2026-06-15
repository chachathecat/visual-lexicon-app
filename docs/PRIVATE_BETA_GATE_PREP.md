# Private Beta Gate Prep

Report date: 2026-06-15 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/private-beta-gate-prep`  
PR: `#80 Private beta gate prep`  
Scope: Track B owner-controlled private beta gate.

## Executive Summary

Visual Lexicon Track B may run only a small owner-controlled private beta after
the owner records manual QA evidence and accepts the manual operating burden.
This is not a public paid beta, not a self-serve launch, and not a real billing
or account-sync release.

The beta exists to validate whether learners return to review words weekly:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

The gate keeps the product focused on Weekly Reviewed Words while making the
limits explicit: local learning state, manual invites, manual/payment-link-only
payments, no automatic entitlement, no public signup, and owner-run support.

## Current Verdicts

- Private paid beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**

Beta type: **owner-controlled private beta**.

## Launch Allowed Conditions

Private beta may start only when all of these are true:

- Initial cohort is **5 to 20 owner-invited users**.
- No public signup, public invite form, or self-serve paid access exists.
- Manual QA evidence is recorded for save, review, weak words, packs, pricing,
  mobile, keyboard, and local browser state.
- Payment is manual or payment-link-only.
- No checkout, subscription, invoice, billing portal, payment SDK, or automatic
  paid access exists.
- Entitlement is handled manually outside the app; this PR does not implement
  entitlement mutation.
- Invite/support copy discloses that account sync is not implemented.
- Invite/support copy discloses that review progress is tied to one browser
  profile until sync exists.
- Support contact, refund/cancellation wording, and privacy copy are approved.
- Manual monitoring owner, issue log, and pause thresholds are ready.
- Owner approval is recorded before invites.

## Launch Blocked Conditions

Private beta is blocked if any of these are true:

- Manual QA evidence is missing or stale.
- Public signup, self-serve paid access, or a public invite form exists.
- Real checkout, payment SDK, billing portal, invoice, subscription, or payment
  route behavior exists in this PR.
- Any payment event, link click, local plan preview, or upgrade-interest record
  automatically grants paid access.
- Support, refund, cancellation, privacy, account-sync limitation, or
  local-state limitation copy is missing.
- Monitoring, issue reporting, or rollback/pause criteria are missing.
- Owner approval is missing.

## P0 Blockers For Public Beta

Public paid beta remains **No-Go** until these P0 blockers are closed:

- Real payment, billing, checkout, and entitlement system is not implemented.
- Account sync and server-backed learning state are not implemented.
- Production monitoring, analytics dashboard, alerting, and incident response
  are not implemented.
- Privacy, support, refund, cancellation, failed-payment, and data disclosure
  gate is not complete.
- Accessibility gate is not complete.
- Fresh public launch QA and rollback evidence are missing.

## P1 Requirements Before Private Beta

- Owner roster and invite log for the 5 to 20 participant cohort.
- Account sync and single-browser local-state disclosure in participant copy.
- Manual payment / entitlement policy.
- Support, refund, cancellation, and privacy copy.
- Manual monitoring cadence and issue log.
- Mobile and keyboard accessibility smoke evidence for the core loop.

## P2 Polish

- Richer IELTS/GRE pack content and copy polish.
- Dashboard progress and streak polish.
- Onboarding and invite copy polish.
- Future AI mistake explanation after the SRS loop works.

## Participant Cap Recommendation

Recommended initial cohort: **5 to 20 users**.

Hard cap before reapproval: **20 users**.

Allowed participant profile:

- Known learners personally invited by the owner.
- Users who understand this is an early private beta with local learning-state
  limitations.
- Users willing to report review, weak-word, support, payment-link, and
  accessibility issues.
- Users who can use one browser profile for the initial loop.

Excluded participant profile:

- Public self-serve signups.
- Organizations or classrooms needing account sync, admin controls, invoices, or
  guaranteed data portability.
- Users who require production-grade payment receipts, subscriptions, or
  automatic entitlement.
- Users who require multi-device progress sync before joining.
- Users who should not rely on owner-operated support/refund handling.

## Owner Checklist

- Approve this private beta gate and cohort cap.
- Prepare owner-invited roster for 5 to 20 users.
- Run manual QA evidence from a clean browser profile.
- Approve manual payment or payment-link-only policy.
- Approve manual entitlement policy with no app entitlement mutation.
- Approve support contact, privacy copy, and refund/cancellation wording.
- Set monitoring cadence and issue triage owner.
- Confirm public paid beta remains No-Go.

## Manual QA Evidence Requirements

Before invites, record evidence that:

- Save creates or preserves a review item.
- Review answers write events and update memory state.
- Due, Weak, and Mastered derive from real review state.
- Pricing exposes no checkout, subscription, invoice, billing portal, or
  automatic entitlement.
- Mobile and keyboard smoke covers dashboard, save, review, saved, packs, and
  pricing.
- Account sync and single-browser local-state limitations match actual behavior.

Use `docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md` and
`docs/PAID_BETA_MANUAL_QA.md` as the evidence baseline, then rerun the relevant
checks after #81-#83.

## Monitoring Checklist

Minimum owner-run monitoring before invites:

- Single issue log for broken review, lost state, support, payment-link, refund,
  privacy, and accessibility reports.
- Daily owner review of the issue log and support inbox during the initial
  cohort.
- Sampling of learning-loop health: save-to-review success, review completion,
  weak-word returns, and Weekly Reviewed Words signals.
- Pause thresholds for core review breaks, unhandled support, refund/privacy
  issues, or accidental public exposure.

This does not replace production monitoring. Production monitoring remains a P0
public beta blocker.

## Support / Refund / Privacy Checklist

Before any invite or payment link is sent:

- Invite and payment-link copy include a monitored support contact.
- Payment copy explains how to request a refund or cancel beta participation.
- Privacy copy explains local learning data, support messages, and external
  payment-link processor boundaries.
- Copy explains that account sync is not implemented.
- Copy explains that review progress is tied to one browser profile until sync
  exists.

## Issue Reporting Process

- Invite copy gives participants one support contact.
- Participants are asked to include browser, route, word, and expected behavior.
- Owner classifies issues as P0 learning-loop break, P1 support/payment/privacy
  or accessibility issue, or P2 polish.
- Owner responds to P0/P1 reports before adding more participants.
- Owner pauses invites and payment links when rollback criteria are met.

## Rollback Plan

Pause or rollback private beta execution if:

- Save no longer creates or preserves review items.
- Review answers stop writing events and state.
- Due, Weak, Mastered, pack progress, streaks, or paid access are fake or
  misleading.
- Support, refund, cancellation, or privacy requests cannot be handled within
  the owner-defined cadence.
- Mobile or keyboard users cannot complete save or review in the core loop.
- Private beta surfaces become public signup, public paid beta, or self-serve
  paid access.

Owner actions:

- Pause new invites immediately.
- Pause or remove external payment links until the issue is resolved.
- Notify affected participants through the support contact.
- Record the issue, owner action, and retest evidence in the beta issue log.
- Rerun manual QA before reopening the cohort.
- Keep public paid beta No-Go until all public P0 gates are closed.

## Next PR Sequence

Recommended next PR: **#81 Manual payment / entitlement policy**.

Then:

- **#82 Account sync preview/digest mock**
- **#83 Monitoring, support, privacy beta gate**
- **#84 Private beta readiness rerun**
- **#85 Owner-run private beta launch checklist**

## Safety Confirmation

- Docs/contracts/tests only.
- No runtime UI changes.
- No API routes.
- No route handlers.
- No middleware.
- No auth integrations.
- No database/provider SDKs.
- No payment, billing, checkout, subscription, invoice, billing portal, or
  entitlement mutation.
- No account sync implementation.
- No AI calls.
- No env var changes.
- No deployment, Webflow, Cloudflare, Vercel, DNS, secrets, or production data
  changes.
- No public paid beta.
- No public signup.
- No automatic paid access.
- `npm audit fix` was not run.
