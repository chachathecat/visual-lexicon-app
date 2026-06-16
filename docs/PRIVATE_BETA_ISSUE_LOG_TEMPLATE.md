# Private Beta Issue Log Template

## Executive Summary

This template defines how the owner records, classifies, redacts, triages, and
resolves reports from the small owner-controlled Visual Lexicon Track B private
beta.

The issue log is a manual owner document. It does not create GitHub issues
automatically, does not call the GitHub API, does not integrate with an issue
tracker, and does not add monitoring, analytics, email, Slack, Discord, auth,
database, billing, payment, account sync, AI, route handler, middleware, or
deployment behavior.

The log exists to protect the learning loop and the beta boundary:

- Save must create or preserve review state.
- Review answers must create events and update memory state.
- Due, Weak, and Mastered must come from real review state.
- Payment remains manual/payment-link-only with no automatic entitlement.
- Learning state may remain browser-local until real account sync exists.
- Participant reports and evidence must be redacted before entering public docs.

## Current Verdicts

- Owner-controlled private beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**

Public signup is not open. Public paid beta is not open. The owner may continue
only within a small manually selected private beta cohort and must pause if a
P0 blocker appears.

## Issue Intake Fields

Every issue record must include these fields, even when the value is `null`,
`not provided`, or `pending owner triage`.

```ts
{
  issueId: "VLX-BETA-0001",
  reportedAt: "2026-06-16T00:00:00.000Z",
  participantAlias: "participant-001",
  participantContactRedacted: "[owner-private roster reference]",
  route: "/dashboard",
  featureArea: "review_srs",
  severity: "P2",
  status: "new",
  title: "Short redacted issue title",
  description: "Redacted issue summary.",
  expectedBehavior: "What should have happened.",
  actualBehavior: "What happened instead.",
  reproductionSteps: [
    "Open the owner-approved private beta app.",
    "Visit the affected route.",
    "Perform the action that produced the issue."
  ],
  browser: "Chrome 126",
  device: "Windows laptop",
  viewport: "1440x900",
  localStorageKeysInvolved: ["vlx_review_state_v1"],
  redactedLocalStateSummary: "Key present; count changed from 1 to 2.",
  screenshotOrVideoReference: "redacted-screenshot-001.png",
  paymentRelated: false,
  entitlementRelated: false,
  accountSyncRelated: false,
  dataLossRisk: false,
  ownerDecision: "pending-owner-triage",
  assignedOwner: "owner",
  nextAction: "Classify severity and decide pause impact.",
  resolvedAt: null,
  resolutionNotes: ""
}
```

Required fields:

| Field | Rule |
| --- | --- |
| issueId | Stable owner-assigned ID such as `VLX-BETA-0001`; no participant names. |
| reportedAt | ISO timestamp when the owner received the report. |
| participantAlias | Redacted alias such as `participant-003`. |
| participantContactRedacted | Owner-private roster reference; no raw email in public docs. |
| route | Use the route taxonomy below or `off-app/manual-payment-or-support`. |
| featureArea | Use one of the feature-area classifications below. |
| severity | P0, P1, or P2. |
| status | One status from the lifecycle below. |
| title | Short redacted title. |
| description | Summary with personal, payment, secret, and raw storage details removed. |
| expectedBehavior | What the participant or owner expected. |
| actualBehavior | What happened instead, redacted. |
| reproductionSteps | Numbered steps with no secrets or raw participant data. |
| browser | Browser name/version when available. |
| device | Device, OS, and input mode when relevant. |
| viewport | Viewport size or breakpoint. |
| localStorageKeysInvolved | Approved keys only; no raw values. |
| redactedLocalStateSummary | Key presence/counts/symptoms only; no raw dumps. |
| screenshotOrVideoReference | Redacted evidence filename, owner-private note, or `not provided`. |
| paymentRelated | True if payment, refund, cancellation, or payment-link copy is involved. |
| entitlementRelated | True if access or no-automatic-entitlement expectations are involved. |
| accountSyncRelated | True if local-state, backup, restore, cross-device, or account sync assumptions are involved. |
| dataLossRisk | True if saved words, review state, events, or stats could be lost or misrepresented. |
| ownerDecision | Current owner decision from the owner decision field below. |
| assignedOwner | Owner or responsible role; not participant contact. |
| nextAction | Concrete next step and needed evidence. |
| resolvedAt | ISO timestamp when resolved; `null` until closed. |
| resolutionNotes | Final result, validation evidence, and participant notification note, redacted. |

## Severity Levels

| Severity | Meaning | Examples |
| --- | --- | --- |
| P0 | Blocks launch, data loss risk, payment/entitlement confusion, privacy issue, or cannot review/save. | Cannot save; cannot answer review; review event not written; raw personal/payment data exposed; participant thinks payment grants automatic entitlement. |
| P1 | Major learning loop break, repeated route errors, broken paywall explanation, or severe mobile/accessibility issue. | Repeated `/dashboard` or `/review` errors; Weak review not derived from state; paywall implies public checkout; mobile review action unreachable. |
| P2 | Polish, confusing copy, non-blocking layout issue, or minor empty-state issue. | Minor wording ambiguity; spacing issue; empty-state copy improvement. |

P0 and unresolved repeated P1 issues block cohort expansion and may require
pause or rollback action.

## Status Lifecycle

| Status | Meaning |
| --- | --- |
| new | Report received but not triaged. |
| triaged | Severity, route, feature area, and redaction status are set. |
| investigating | Owner is reproducing or gathering missing evidence. |
| waiting-on-participant | Owner needs redacted steps, browser/device context, or evidence. |
| fixed | Fix or doc update is ready and awaiting verification. |
| wont-fix-for-beta | Owner accepts as non-blocking for this private beta. |
| duplicate | Report maps to an existing issue and inherits its outcome. |
| resolved | Owner verified closure and recorded evidence. |
| beta-blocker | Blocks invites, payment requests, beta continuation, or launch decision. |

## Route Taxonomy

Use these route values:

- `/`
- `/dashboard`
- `/saved`
- `/review`
- `/review/due`
- `/review/weak`
- `/packs`
- `/packs/[packId]`
- `/word/[slug]`
- `/pricing`
- `/settings`
- `off-app/manual-payment-or-support`
- `unknown`

Route evidence should identify what the participant was trying to do and
whether the issue affects save, review, due, weak, pack progress, pricing,
paywall, support, refund, privacy, local-state copy, or manual payment copy.

## Reproduction Steps Template

Each issue should answer:

1. Starting context: owner-approved access path, route, browser profile, and
   starting state.
2. Actions: each click, navigation, save, review answer, pack action, settings
   action, or manual support/payment step in order.
3. Expected behavior: what should have happened.
4. Actual behavior: what happened instead, redacted.
5. Repeatability: once, every time, after refresh, after a new session, or
   after clearing site data.

## Browser / Device Fields

Record browser, device, and viewport for every issue:

- Browser examples: `Chrome 126`, `Safari 18`, `Firefox 127`, `Edge 126`.
- Device examples: `iPhone iOS`, `Android phone`, `Windows laptop`, `MacBook`.
- Viewport examples: `390x844`, `768x1024`, `1440x900`, `mobile breakpoint`.

For mobile or accessibility issues, also note input method, keyboard access,
focus trap symptoms, and whether review can still be completed.

## localStorage Probe Fields

Approved keys:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`

Allowed probe fields:

- key present: yes/no
- item count only
- slug or word count when non-sensitive
- last-updated time bucket

Never paste raw localStorage values, JSON dumps, review event payloads, raw
answer values, participant notes, or browser-profile data into public docs.

## Screenshot / Video Evidence Fields

Allowed evidence references:

- redacted screenshot filename
- redacted video filename
- owner-private evidence note
- `not provided`

Screenshots and videos must be manually redacted before public reference. Do not
include visible personal data, payment data, account data, tokens, raw
localStorage values, unrelated browser tabs, private messages, or contact
details.

## Participant Privacy / Redaction Rules

Do not record these in public docs:

- raw payment data
- provider tokens
- secrets
- raw email addresses
- raw localStorage dumps
- screenshots or videos with visible personal/payment data unless manually redacted

Use participant aliases, redacted contact references, approved storage key
names, key presence/counts, and concise summaries instead.

## Payment / Entitlement Issue Classification

Use `featureArea: "payment_entitlement"` when a report touches manual payment,
payment-link copy, refunds, cancellations, access expectations, or entitlement
expectations.

Default severity: P0.

Set:

- `paymentRelated: true`
- `entitlementRelated: true` when access or no-automatic-entitlement is involved
- `ownerDecision: "pause-payment-requests"` when participants may misunderstand payment

Pause payment requests until copy clearly says manual/payment-link-only, no
checkout, no subscription, no invoice, no billing portal, no payment SDK, and no
automatic entitlement.

## Account Sync / Local-State Issue Classification

Use `featureArea: "account_sync_local_state"` when a report touches
browser-local saved words, review state, review events, daily stats, cross-device
expectations, backup, restore, account sync assumptions, or cleared site data.

Default severity: P0 when data loss or misleading account-sync expectations are
involved.

Set:

- `accountSyncRelated: true`
- `dataLossRisk: true` when saved/review state may be lost or misrepresented

The owner must not promise real account sync. Evidence must use approved key
names and redacted key presence/counts only.

## Review / SRS Issue Classification

Use `featureArea: "review_srs"` when a report touches save-to-review, active
recall, answer events, box updates, weakScore, due dates, Weak, Due, Mastered,
dashboard memory mission, or pack progress that depends on review state.

Default severity: P0 when save or review is blocked, events are missing, or
memory state is wrong.

Examples:

- Save does not create or preserve review state.
- Review answer does not create an event.
- Due, Weak, or Mastered is not derived from real review state.
- Mastery appears fake or premature.

## Pack / Pricing / Paywall Issue Classification

Use `featureArea: "pack_pricing_paywall"` when a report touches pack list, pack
detail, pack preview, pack progress, pricing route, upgrade placeholder, or
paywall explanation.

Default severity: P1, upgraded to P0 if the issue creates payment or
entitlement confusion.

Pack, pricing, and paywall copy must not imply public paid beta, public
checkout, subscription, automatic entitlement, invoice, billing portal, or
account sync.

## Support / Refund / Privacy Issue Classification

Use `featureArea: "support_refund_privacy"` when a report touches support
contact, response expectations, refund wording, cancellation wording, privacy
copy, localStorage disclosure, participant evidence, or redaction.

Default severity: P0 when support, refund, cancellation, or privacy copy is
missing or misleading.

Pause invites or payment requests when participants lack clear support, refund,
cancellation, privacy, or local-state instructions.

## Owner Triage Checklist

For every new issue, the owner must:

1. Assign `issueId`, `reportedAt`, `participantAlias`, and
   `participantContactRedacted`.
2. Confirm redaction: no raw payment data, provider tokens, secrets, raw email,
   raw localStorage dump, or unredacted personal evidence.
3. Classify route, feature area, severity, and status.
4. Capture reproduction steps, browser, device, viewport, and evidence reference.
5. Probe local state safely when relevant.
6. Record owner decision, assigned owner, next action, and pause/rollback impact.

## Owner Decision Field

Allowed owner decisions:

- `pending-owner-triage`
- `continue-monitoring`
- `fix-before-more-invites`
- `pause-private-beta`
- `pause-payment-requests`
- `mark-beta-blocker`
- `duplicate-existing-issue`
- `wont-fix-for-beta`
- `resolved-no-change`
- `resolved-with-doc-or-code-change`
- `escalate-to-next-pr`

Owner decisions must be revisited before first 24-hour review, 7-day review,
and final owner signoff.

## Rollback / Pause Trigger Mapping

| Trigger | Severity | Required owner action |
| --- | --- | --- |
| Save or review is broken | P0 | Pause invites and payment requests; mark beta-blocker; fix and rerun save/review smoke. |
| Payment or entitlement confusion | P0 | Pause payment requests; correct manual payment and no-automatic-entitlement copy; notify affected participants. |
| Privacy or redaction gap | P0 | Pause triage; remove sensitive evidence from public docs; continue only with redacted summaries. |
| Repeated state loss or account-sync assumption | P0 | Pause expansion; correct local-state copy; rerun approved storage-key smoke. |
| Repeated route, mobile, or accessibility break | P1 | Stop additional invites until fixed or explicitly owner-accepted as non-blocking. |

## Duplicate Issue Handling

- Set status to `duplicate`.
- Link the original issue ID in `resolutionNotes`.
- Preserve only new redacted evidence that improves the original issue.
- Do not close the original issue until its own closeout criteria are met.
- If the duplicate shows broader impact, update the original severity and owner
  decision.

## Unresolved Issue Escalation

- Escalate every P0 immediately as `beta-blocker`.
- Treat repeated P1 issues as beta-blocking until fixed or owner-accepted.
- If `waiting-on-participant` blocks a beta decision for more than 48 hours,
  owner decides whether to close, keep monitoring, or pause.
- Every unresolved P0/P1 must be listed in PR #88 final owner signoff.

## First 24-Hour And 7-Day Review Usage

First 24 hours:

- Review all new issues.
- Count P0/P1/P2 by feature area.
- Check for broken save, review, local-state, payment, support, refund, privacy,
  mobile, keyboard, console, or hydration patterns.
- Record continue, pause, or stop decision before inviting more participants.

First 7 days:

- Review open/closed issue counts and repeated patterns.
- Compare reports against Weekly Reviewed Words behavior: are participants
  saving words and returning to review?
- Check support load, payment/refund/privacy questions, and local-state
  confusion.
- Decide whether to continue within cap, pause, or stop the private beta.

## Closeout Criteria

An issue can close only when:

- All required fields are present.
- Redaction is confirmed.
- P0/P1 owner decision and pause impact are recorded.
- Fix, doc update, duplicate link, owner-accepted risk, or no-change resolution
  is documented.
- Verification evidence is recorded where applicable.
- Affected participant notification is recorded when support, payment, refund,
  privacy, access, or data-loss risk was involved.

## Recommended Next PR Sequence

- **#88 Private beta final owner signoff**
- **#89 Private beta dry-run smoke evidence**
- **#90 Owner-run private beta launch decision**

Recommended next PR: **#88 Private beta final owner signoff**

## Safety Confirmation

This template is docs/contracts/tests only. It does not implement runtime UI
changes, create GitHub issues, call the GitHub API, add issue tracker
integrations, add monitoring or analytics SDKs, add email/Slack/Discord
integrations, add API routes, add route handlers, add middleware, add auth,
add DB/provider SDKs, add payment, billing, checkout, subscription, entitlement
mutation, real account sync, AI calls, env var changes, deployment changes, or
production data changes.

Webflow, Cloudflare Workers, Vercel, DNS, deployment settings, secrets,
production data, billing settings, payment settings, auth settings, and Track A
remain untouched.
