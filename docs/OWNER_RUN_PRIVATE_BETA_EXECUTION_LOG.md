# Owner-Run Private Beta Execution Log

## Executive Summary

This log records the owner-run private beta execution contract for Batch 0. It is
a ready-to-execute template, not evidence that the owner has sent invitations.

Current execution state is **Ready to Execute**. No participants have been
invited, no participants have accepted, no payment has been confirmed, and no
manual entitlement has been recorded.

## Current Verdicts

- Owner-controlled private beta: **Proceed / Conditional Manual Launch**
- Public paid beta: **No-Go**
- Public signup: **Blocked**
- Public checkout: **Blocked**
- Automatic entitlement: **Blocked**
- Real account sync: **Blocked**
- Production deployment changes: **Blocked**

## Execution State

Allowed execution states:

- Not Started
- Ready to Execute
- In Progress
- Paused
- Completed

Current state:

- Execution state: **Ready to Execute**
- Rationale: prior launch artifacts are present, but this PR does not claim any
  real invitation, participant response, payment, or entitlement evidence.
- Batch posture: **Batch 0**
- In Progress is not allowed until the owner sends a real invite or records a
  real participant response.

## Batch Metadata

| Field | Current value |
| --- | --- |
| batchId | `batch-0` |
| plannedParticipantCap | `10` |
| invitedParticipantCount | `0` |
| acceptedParticipantCount | `0` |
| declinedParticipantCount | `0` |
| paymentRequestedCount | `0` |
| paymentConfirmedCount | `0` |
| manualEntitlementRecordedCount | `0` |
| realInvitationsSent | `false` |
| evidenceStatus | `deterministic placeholder only - no execution evidence yet` |

The participant cap is inside the approved 5 to 20 participant range. Counts must
stay zero until real owner-run evidence exists.

## Participant Redaction Rules

- Public docs use aggregate counts and anonymized participant IDs only.
- No raw participant personal data is committed.
- No raw emails are committed.
- No raw support transcripts are committed.
- No payment payloads, payment secrets, provider tokens, API keys, or credentials
  are committed.
- Owner roster details stay outside the repository.
- Issue evidence is summarized by route, severity, reproduction, browser/device
  class, redacted storage notes, status, and owner decision.

## Invite Execution Checklist

- Confirm PR #90 owner-run launch decision remains accepted.
- Confirm Batch 0 cap is within 5 to 20 participants.
- Run a fresh smoke check immediately before the first invite.
- Prepare the private beta invite packet and participant instructions.
- Send the first invite manually only after the pre-invite checks are complete.
- Update invitedParticipantCount only after a real owner-sent invite.
- Update acceptedParticipantCount or declinedParticipantCount only after a real
  participant response.
- Update paymentRequestedCount and paymentConfirmedCount only after real manual
  payment evidence exists.
- Update manualEntitlementRecordedCount only after a real manual off-app record
  exists.

## Participant Communication Confirmation

- Invite packet: ready, but unsent.
- Local-state disclosure: ready.
- Manual payment/no automatic entitlement disclosure: ready.
- Support, refund, and privacy copy: ready.
- No invite delivery is claimed in this PR.

## Support / Refund / Privacy Confirmation

- Support path is prepared for owner-run private beta.
- Refund and cancellation wording must be included before any manual payment
  request.
- Privacy copy must explain redaction and local-state boundaries.
- Public docs must use aggregate counts and redacted evidence.

## Local-State / Account-Sync Limitation Confirmation

Participants must be told that saved words, review state, review events, and
daily stats remain browser-local in this phase.

Approved local storage keys:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Real account sync is not implemented. This execution log does not add account
sync, auth, database persistence, or cross-device state.

## Manual Payment / No Automatic Entitlement Confirmation

Payment handling remains manual or payment-link-only. This PR does not add
checkout, billing portal, subscription flow, invoice flow, payment SDK,
entitlement mutation, or automatic entitlement.

Payment and entitlement counts must remain zero until the owner records real
off-app evidence.

## Smoke Check Confirmation Before Invite

The dry-run smoke evidence reference is:

```txt
docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md
```

Before sending the first invite, the owner should rerun a fresh local smoke check
covering route load, save/review state, review events, due/weak/mastery behavior,
pricing/manual payment copy, local storage probes, console/hydration status,
mobile layout, and keyboard access.

## Issue Log Reference

Use:

```txt
docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md
```

Current issue counts for Batch 0:

- Active issues: `0`
- P0 issues: `0`
- P1 issues: `0`

No external issue tracker integration is added by this PR.

## First 24-Hour Review Plan

- Review first-day invite, response, payment, and entitlement counts against real
  evidence.
- Review save success, review start, review completion, due review return,
  weak-word understanding, pricing comprehension, and Weekly Reviewed Words.
- Review support, privacy, refund, and manual payment clarity.
- Record a continue, pause, or rollback decision before adding more
  participants.

## First 7-Day Review Plan

- Review Weekly Reviewed Words from real review activity only.
- Review SRS state quality, due review return, weak-word recovery, and delayed
  recall.
- Review issue count and severity trends.
- Decide whether PR #94 stabilization is needed before private beta expansion.

## Pause/Rollback Trigger Mapping

- P0: save/review loop breaks.
  - Pause invites and payment requests.
  - Fix the SRS loop and rerun smoke checks before resuming.
- P0: repeated local-state loss or account-sync confusion.
  - Pause expansion.
  - Clarify local-state copy and rerun storage validation.
- P0: manual payment or entitlement confusion.
  - Pause payment requests.
  - Correct copy and keep counts tied to real evidence only.
- P1: privacy, refund, or support readiness gap.
  - Pause new invites and payment requests until response handling is corrected.
- P1: repeated issue pattern across participants.
  - Pause batch expansion and decide whether stabilization is required.

## Owner Decision Notes

- No invitations were sent by this PR.
- Ready to Execute means the owner can begin manual execution after final smoke
  confirmation; it is not an In Progress state.
- Public paid beta remains No-Go.
- Do not convert placeholder counts into evidence without a real owner action.

## Private Beta Success Metrics

Prepare to record these metrics from real Batch 0 activity:

- Save success
- Review start
- Review completion
- Due review return
- Weak word understanding
- Pack preview engagement
- Pricing comprehension
- Issue count/severity
- **Weekly Reviewed Words**

## Next PR Sequence

- #92 24-hour private beta review
- #93 7-day private beta review
- #94 Private beta P0/P1 stabilization, if needed
- #95 Private beta learning-loop improvements

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
git diff --check
```

## Safety Confirmation

This PR is docs/contracts/tests only. It does not send invitations, send emails,
add email provider integrations, change runtime UI, add API routes, add route
handlers, add middleware, change auth, add DB/provider SDKs, add payment,
billing, checkout, subscription, entitlement mutation, real account sync,
monitoring SDKs, analytics SDKs, AI calls, env vars, deployment changes, or
production data mutation.

Webflow, Cloudflare Workers, Vercel, DNS, deployment settings, secrets,
production data, payment settings, and billing settings were not touched.
