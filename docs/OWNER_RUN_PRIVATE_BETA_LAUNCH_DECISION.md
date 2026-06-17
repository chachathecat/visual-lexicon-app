# Owner-Run Private Beta Launch Decision

## Executive Summary

This is the owner-run launch decision before owner-controlled private beta
invitations may be sent. The app remains in owner-controlled, invite-only,
manual private beta mode for now.

Owner-controlled private beta is **Proceed / Conditional Manual Launch** and public
paid beta is **No-Go** until production and account-sync/billing readiness are
completed.

## Current Verdicts

- Owner-controlled private beta: **Proceed / Conditional Manual Launch**
- Public paid beta: **No-Go**
- Public signup: **Blocked**
- Public checkout: **Blocked**
- Automatic entitlement: **Blocked**
- Real account sync: **Blocked**
- Production deployment changes: **Blocked**
- Owner invitations: **Allowed only after owner manually confirms checklist completion**

## Decision Date

- `2026-06-17`

## Evidence Summary

Prior gates contributing to this decision:

- #79 Manual QA execution report
  (`docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md`)
- #80 Private beta gate prep
  (`docs/PRIVATE_BETA_GATE_PREP.md`)
- #81 Manual payment / entitlement policy
  (`docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md`)
- #82 Account sync preview/digest mock
  (`docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md`)
- #83 Monitoring, support, privacy beta gate
  (`docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md`)
- #84 Private beta readiness rerun
  (`docs/PRIVATE_BETA_READINESS_RERUN.md`)
- #85 Owner-run private beta launch checklist
  (`docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md`)
- #86 Private beta invite packet / participant instructions
  (`docs/PRIVATE_BETA_INVITE_PACKET.md`)
- #87 Private beta issue log template
  (`docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md`)
- #88 Private beta final owner signoff
  (`docs/PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md`)
- #89 Private beta dry-run smoke evidence
  (`docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md`)

## Required Prior Gates

Owners must confirm each PR #79 through #89 artifact exists and is accepted for
launch decision use.

## Launch Allowed Conditions

- All required prior gates #79 through #89 are complete.
- 5 to 20 participants are manually selected by owner.
- Manual/payment-link-only policy is confirmed.
- No automatic entitlement is active.
- Dry-run smoke evidence is available and complete.
- Issue log and support readiness are ready.
- Owner final signoff is complete.
- No unresolved P0/P1 blockers remain.

## Launch Limitations

- Owner-invited-only access:
  - Public signup disabled
  - Public checkout disabled
  - Self-serve invite disabled
  - 5 to 20 participant roster cap
- Manual/payment-link-only only:
  - No app-side checkout
  - No automatic entitlement grant in this PR sequence
- No automatic entitlement:
  - No entitlement mutation in app runtime
  - No automatic paid-access transition
- Local-state/account-sync limitation:
  - Learning state is browser-local
  - Real account sync is not implemented
  - Approved keys only (`vlx_saved_words_v1`, `vlx_review_state_v1`,
    `vlx_review_events_v1`, `vlx_daily_stats_v1`)

## No-Launch Conditions

- Public signup or public checkout is exposed.
- Automatic entitlement becomes active.
- Real account sync is claimed or enabled.
- Production deployment or infrastructure changes are introduced.
- Support/refund/privacy readiness is incomplete.
- Issue log readiness or owner signoff is incomplete.
- Public beta blockers are removed without approved readiness.

## Public Beta Blockers

- Real checkout: Blocked
- Automatic entitlement: Blocked
- Real account sync: Blocked
- Public signup: Blocked
- Production deployment changes: Blocked

## Participant Cap

- Minimum: 5 participants
- Maximum: 20 participants
- Hard cap before re-approval: 20

## Owner-Invited-Only Policy

Only the owner may invite and manually curate the roster. No public signup forms,
public checkout, or self-serve paid access are permitted.

## Manual Payment / Payment-Link-Only Policy

Payment is manual and/or payment-link-only. This phase does not include automatic
payment SDK checkout, billing portal, or entitlement automation.

## No Automatic Entitlement

No automatic entitlement or entitlement mutation is allowed before public launch.

## Local-State / Account-Sync Limitation Disclosure

Participants must be informed that saved words, review state, review events, and
daily stats are browser-local only and that real account sync is not implemented.

## Support, Refund, Privacy Readiness

- Support contact and response expectation are confirmed.
- Refund/cancellation copy is in place.
- Privacy statement and data boundary disclosure are in place.
- No raw storage dumps are used in public-facing evidence.

## Issue Log Readiness

The issue-log template is required before invitations, with severity, route, repro
steps, affected device/browser, owner decision, status, and resolution fields.

## Dry-Run Evidence Readiness

Dry-run smoke evidence from PR #89 is required before any owner invitation.

## Owner Final Signoff Readiness

Owner final signoff must be complete before invites.

## First 24-Hour Review Plan

- Invite delivery and acceptance tracking.
- First-day blocker scan (save/review/support/privacy/payment/privacy/support issues).
- Pause/continue decision before adding additional participants.

## First 7-Day Review Plan

- Learning-loop signal review (save, review start/completion, weak words, due review
  return).
- Operational review (support load, issue patterns, response quality).
- Continue/pause/stop decision with strict cap adherence.

## Pause/Rollback Criteria

- Save/review loop breaks.
- Repeated state-loss reports or account-sync assumptions.
- Payment/entitlement confusion.
- Privacy/support readiness gaps.
- Repeated P1 patterns.

## Private Beta Success Metrics

- Save success
- Review start
- Review completion
- Due review return
- Weak word understanding
- Pack preview engagement
- Pricing comprehension
- Issue count/severity
- **Weekly Reviewed Words**

## Private Beta Failure Criteria

- Data loss
- Save/review broken
- Local-state confusion blocks learning
- Payment/entitlement misunderstanding
- Privacy/support issue
- Unresolved P0
- Repeated P1 across participants

## Recommended Post-Launch PR Sequence

- #91 Owner-run private beta execution log
- #92 24-hour private beta review
- #93 7-day private beta review
- #94 Private beta P0/P1 stabilization, if needed
- #95 Private beta learning-loop improvements

## Safety Confirmation

This PR is docs/contracts/tests only. It does not send email, expose or call
payments, use monitoring/analytics SDKs, create auth integrations, add API routes,
change billing/checkout/provisioning, mutate production data, alter deployment,
or integrate external issue-tracker or payment providers.
