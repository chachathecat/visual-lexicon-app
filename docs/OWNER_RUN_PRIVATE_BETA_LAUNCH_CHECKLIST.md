# Owner-Run Private Beta Launch Checklist

## Executive Summary

This is the final operational runbook the owner must complete before inviting 5
to 20 manually selected private beta participants to Track B.

The launch is allowed only as an owner-controlled, invite-only, manual private
beta. Public paid beta remains blocked. The owner must finish the source gates
from PRs #79 through #84, rerun smoke checks, prepare participant copy, enforce
the cohort cap manually, and keep support, incident logging, refund,
cancellation, privacy, local-state, and rollback procedures ready before any
invitation or payment request.

## Current Verdicts

- Owner-controlled private beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**

This checklist does not authorize public signup, public checkout, automatic
entitlement, real account sync, production monitoring SDKs, auth, database
providers, AI calls, env changes, deployment changes, Webflow, Cloudflare,
Vercel, DNS, secrets, or production data mutation.

## Launch Preconditions

- #79 manual QA report exists:
  `docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md`.
- #80 private beta gate exists:
  `docs/PRIVATE_BETA_GATE_PREP.md`.
- #81 manual payment/entitlement policy exists:
  `docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md`.
- #82 account sync preview/digest mock exists:
  `docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md`.
- #83 monitoring/support/privacy beta gate exists:
  `docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md`.
- #84 readiness rerun exists:
  `docs/PRIVATE_BETA_READINESS_RERUN.md`.
- Owner reruns smoke checks before sending invitations.
- Support contact is ready and monitored.
- Refund/cancellation copy is ready before any payment request.
- Privacy/local-state/account-sync limitation copy is ready.
- Participant cap is enforced manually.
- No public signup or public checkout is exposed.

## No-Launch Conditions

Do not launch, invite, or request payment if any of these are true:

- Public checkout is active.
- Automatic entitlement is active.
- Real account sync is assumed but not implemented.
- Support/refund/privacy copy is missing.
- Monitoring/incident log is missing.
- Route smoke fails.
- Console/hydration errors are unresolved.
- Owner has not approved launch.
- Participant communication is incomplete.

## Owner Final Signoff Checklist

- Approve Owner-controlled private beta as Conditional / Manual-only and public
  paid beta as No-Go.
- Confirm every launch precondition is complete.
- Approve the 5 to 20 participant roster.
- Approve participant communication copy.
- Approve final smoke, console, hydration, and local-state evidence.
- Accept rollback and pause rules.
- Confirm no forbidden integrations or production changes were introduced.

## Participant Selection Checklist

- Select only known participants manually chosen by the owner.
- Keep the cohort between 5 and 20 participants.
- Invite participants who accept browser-local learning state.
- Exclude participants who require real account sync, cross-device progress,
  backup/restore, admin controls, invoices, or durable account state.
- Select participants willing to report review, local-state, payment, support,
  privacy, refund, cancellation, mobile, and keyboard issues.

## Invite-Only Policy

The beta is owner invite-only. There must be no public signup, public checkout,
public invite form, self-serve paid access, or automatic entitlement. The owner
must keep a manual roster with invite status and stop at 20 participants until a
new approval checkpoint.

## Participant Cap

The launch cohort must be 5 to 20 manually selected participants. Fewer than 5
does not provide enough private beta signal; more than 20 requires reapproval.
The cap is enforced manually through the owner roster.

## Participant Communication Checklist

- Private/manual beta notice.
- Invite-only policy.
- Local-state/account-sync limitation disclosure.
- Manual payment/payment-link-only disclosure.
- No automatic entitlement disclosure.
- Support contact and response expectation.
- Refund/cancellation wording.
- Privacy copy.
- Issue-reporting instructions.
- Pause/rollback notice.

## Local-State/Account-Sync Limitation Disclosure

Participant copy must state that saved words, review state, review events, and
daily stats stay in one browser profile. Real account sync is not implemented;
progress does not roam across accounts or devices, and there is no backup or
restore guarantee for this private beta.

## Manual Payment And No Automatic Entitlement Disclosure

Payment, if requested, is manual or payment-link-only. The app has no connected
checkout, subscription, billing portal, invoice flow, payment SDK, or automatic
entitlement. Payment or link clicks do not grant access automatically; owner
confirmation and an off-app manual record are required.

## Support, Refund, Cancellation, And Privacy Copy Checklist

- Support copy names one monitored support contact.
- Support copy gives an expected response window for private beta issues.
- Refund/cancellation copy is ready before payment request.
- Privacy copy explains local learning data, support messages, and external
  payment boundaries.
- Copy states the app does not collect raw payment payloads, provider tokens,
  secrets, auth credentials, or production account data.

## Smoke Test Checklist

- `/` loads.
- `/dashboard` loads Today Memory Mission from real review state.
- `/review` starts active recall and writes review state/events.
- `/review/due` derives due words from real review state.
- `/review/weak` derives weak words from real review state and mistakes.
- `/saved` supports entry back into review.
- `/packs` and one pack detail route load without provider secrets.
- `/word/dissonance` loads word memory state.
- `/pricing` exposes no public checkout or automatic entitlement.
- Mobile and keyboard smoke covers save, review, saved, packs, pricing, and
  support copy.

## Console/Hydration Error Checklist

For every smoke route, record:

- Route load result.
- Browser console error count, including zero.
- Hydration warning count, including zero.
- Screenshot/video reference when a route fails or shows blocking layout issues.
- Owner decision for any unresolved nonblocking finding.

## localStorage Probe Checklist

Probe only approved local storage keys and do not paste raw values:

- `vlx_saved_words_v1`: confirm save creates or preserves a saved word.
- `vlx_review_state_v1`: confirm save/review creates or updates review state.
- `vlx_review_events_v1`: confirm review answer appends an event.
- `vlx_daily_stats_v1`: confirm review activity updates daily stats when
  applicable.

## Manual Incident Log Checklist

Before invites, the owner must have a manual incident log ready with:

- Issue id.
- Participant alias.
- Route or screen.
- Severity.
- Reproduction steps.
- Browser/device.
- Redacted local storage key names only.
- Screenshot/video reference when available.
- Owner decision.
- Status.
- Resolved timestamp or `unresolved`.

## Rollback/Pause Checklist

Pause invites and payment requests when:

- Save or review loop breaks.
- Multiple participants report local-state loss.
- Required routes fail smoke checks.
- Blocking console or hydration errors remain unresolved.
- Support, refund, cancellation, privacy, or local-state copy is missing or
  confusing.
- Public signup, public checkout, self-serve access, automatic entitlement, real
  account sync, auth, API routes, middleware, monitoring SDKs, AI calls, env
  changes, deployment changes, secrets, or production data changes appear.

Before resuming, fix the issue, notify affected participants when needed, update
the incident log, and rerun smoke checks.

## Post-Invite Monitoring Checklist

- Review support messages and incident log daily.
- Monitor whether participants save words and return to review.
- Monitor confusion or disputes about manual payment, entitlement, support,
  refund, cancellation, privacy, or local-state limits.
- Do not invent dashboard metrics, streaks, mastery, pack progress, or paid
  access claims.

## First 24-Hour Review Checklist

- Record invite delivery, acceptance, and clarification questions.
- Scan for broken review, state loss, payment, refund, privacy, support,
  console, hydration, mobile, and keyboard blockers.
- Record continue or pause decision before inviting additional participants.

## First 7-Day Review Checklist

- Review whether participants saved words, completed review sessions, revisited
  weak words, and showed real Weekly Reviewed Words behavior.
- Review support volume, issue severity, response timing, refund/cancellation
  requests, and privacy questions.
- Decide whether to continue within the 20 participant cap, pause, or stop.

## Final Beta Continuation/Stop Decision Checklist

- Continue only if no P0 blockers remain, support is manageable, the review loop
  works, local-state copy is accepted, and the cohort stays at or below 20.
- Pause if any P0/P1 launch blocker needs correction but the owner expects to
  resume after a fix and smoke rerun.
- Stop if core review, local-state, support, payment, refund, privacy, or safety
  issues make the beta unsuitable to continue.

## Recommended Next PR Sequence

Recommended next PR: **#86 Private beta invite packet / participant instructions**

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
