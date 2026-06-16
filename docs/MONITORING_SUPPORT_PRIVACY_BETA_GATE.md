# Monitoring, Support, Privacy Beta Gate

Report date: 2026-06-16 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/monitoring-support-privacy-beta-gate`  
PR: `#83 Monitoring, support, privacy beta gate`  
Scope: Track B owner-controlled private beta operations gate.

## Executive Summary

This gate defines the minimum monitoring, support, privacy, refund,
cancellation, and beta-operations requirements before any invited private beta
participant receives access.

The gate is intentionally manual. It does not add monitoring SDKs, analytics
SDKs, API routes, route handlers, middleware, auth, database/provider SDKs,
payment, billing, account sync, AI calls, env vars, deployments, Webflow,
Cloudflare, Vercel, DNS, secrets, or production data changes.

Visual Lexicon may proceed only as an owner-controlled private beta after the
owner completes the smoke checks, issue log, support/privacy copy, participant
consent checklist, and pause/rollback acceptance.

## Required Verdicts

- Private paid beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**
- Real monitoring SDK integration: **Blocked in this PR**
- Real analytics SDK integration: **Blocked in this PR**
- Real payment integration: **Blocked**
- Real account sync: **Blocked**
- Owner-controlled manual beta ops: **Allowed when checklist is complete**

Public signup and public paid beta remain blocked.

## Monitoring Minimum Requirements

- No real monitoring SDK or analytics SDK is introduced in this PR.
- Manual monitoring is required before invites.
- Owner-run browser smoke checks are required before any invited participant
  receives access.
- Owner records route result, console error count, hydration warning count, and
  owner decision for each required route.
- Owner keeps a single manual issue log.
- Owner reviews support messages and the issue log at least daily during the
  initial cohort.
- Local QA must include a stale dev server mitigation note: restart the dev
  server before smoke evidence is recorded and note the command, port, base URL,
  and timestamp.

## Required Browser Smoke Routes

Run smoke checks before inviting users for:

- `/dashboard`
- `/review`
- `/saved`
- `/packs`
- `/pricing`
- `/save?slug=dissonance&source=word_page`

Each route record must include pass/fail, console error count, hydration warning
count, screenshot/video reference when useful, and owner decision.

## Console And Hydration Capture

For each smoke route, record:

- Console error count, including zero.
- Hydration warning count, including zero.
- Route load result.
- Blocking visual/layout issue notes.
- Screenshot or video reference for failures or ambiguous behavior.

Blocking console or hydration issues on core routes pause invites until rerun
evidence is clean or the owner records an explicit accepted limitation.

## Manual Incident Log Requirements

The owner must keep a manual issue log with these fields:

- issue id
- participant id or alias
- route
- severity
- reproduction steps
- browser/device
- localStorage keys involved, redacted
- screenshot/video reference if available
- owner decision
- status
- resolved timestamp

Severity levels: P0, P1, P2.  
Statuses: open, triaged, paused, resolved, wont_fix.

Only localStorage key names may be recorded. Raw localStorage values, provider
tokens, secrets, auth sessions, payment payloads, and production data must not
be pasted into the issue log.

## Support, Refund, Cancellation, And Privacy Requirements

Before any invite or payment request:

- Support contact must be defined.
- Support response expectation must be stated.
- Issue reporting process must be included in participant copy.
- Refund/cancellation wording must be ready before any payment request.
- Privacy copy must disclose local-state limitations and account-sync
  limitations.
- Participants must know review progress and saved words are local to the
  browser during this beta.
- Participants must know real account sync is not implemented.
- Participants must know payment is manual or owner-controlled payment-link
  only.
- Participants must know no payment link, local plan state, or app event
  automatically grants paid access.
- No raw payment data should be collected in app.
- No provider tokens, secrets, API keys, auth sessions, or payment credentials
  should be stored.
- Participants must know this is a private/manual beta.

## Participant Consent Checklist

Before access, participant copy must confirm:

- This is a private, owner-controlled, manual beta.
- Local learning state may be limited to one browser profile.
- Account sync is not implemented.
- Payment, if requested, is manual or payment-link-only.
- No automatic paid entitlement is granted by the app.
- Support contact, response expectation, refund/cancellation path, and privacy
  copy are available.
- The owner may pause invites, payment requests, or access during incidents.

## Owner Approval Checklist

Before invites, owner must:

- Approve the private beta verdict as Conditional / Manual-only.
- Confirm public paid beta remains No-Go.
- Run the required route smoke checks.
- Record console error counts and hydration warning counts.
- Restart the local dev server before local QA and record stale-server
  mitigation notes.
- Prepare the manual incident log with all required fields.
- Define support contact and support response expectation.
- Approve refund/cancellation and privacy copy.
- Approve local-state, account-sync, manual-payment, and no automatic
  entitlement disclosures.
- Confirm no forbidden integrations were introduced.
- Accept pause and rollback criteria.

## Pause And Rollback Criteria

Pause invites and payment requests when:

- Save no longer creates or preserves review items.
- Review answers stop writing events and memory state.
- Multiple participants report local saved-word, review-state, or review-event
  loss without a clear local-browser explanation.
- Required smoke routes show blocking console errors, hydration warnings, or
  route load failures.
- The owner cannot meet the stated support response expectation for P0/P1
  reports.
- Refund/cancellation wording, privacy copy, local-state disclosure, or
  account-sync disclosure is missing or confusing.
- Private beta becomes public signup, public paid beta, self-serve checkout,
  automatic entitlement, or public invite access.
- Monitoring SDK, analytics SDK, auth, DB/provider SDK, API route, route
  handler, middleware, payment, account sync, AI, env, deployment, secrets, or
  production data changes appear in this PR.

## Operational Risks

P0 risks:

- Public paid beta launches without monitoring, support, refund, privacy,
  payment, and account-sync gates.
- Participants lose local saved words, review events, or SRS state without
  recovery through account sync.
- Participants pay or join without clear refund, cancellation, privacy,
  local-state, or account-sync limitations.
- Forbidden runtime/provider integration appears in this docs/contracts/tests
  PR.

P1 risks:

- Console errors or hydration warnings escape manual QA.
- Owner cannot respond to P0/P1 support reports within the stated beta
  expectation.
- Local QA evidence is recorded against a stale dev server.
- Issue log entries include unredacted local-state values.

P2 risks:

- Private beta copy is complete but not polished for a larger public audience.
- Issue labels or owner decision notes need refinement after the first cohort.

## Next PR Sequence

Recommended next PR: **#84 Private beta readiness rerun**.

Then:

- **#85 Owner-run private beta launch checklist**

## Safety Confirmation

- Docs/contracts/tests only.
- No runtime UI changes.
- No monitoring SDKs.
- No analytics SDKs.
- No API routes.
- No route handlers.
- No middleware.
- No auth integrations.
- No database/provider SDKs.
- No payment, billing, checkout, subscription, invoice, billing portal, or
  entitlement mutation.
- No real account sync.
- No AI calls.
- No env var changes.
- No deployment changes.
- No Webflow, Cloudflare, Vercel, DNS, secrets, or production data changes.
- No raw payment data collection in app.
- No provider tokens or secrets stored.
- No public signup.
- No public paid beta.
- `npm audit fix` was not run.
