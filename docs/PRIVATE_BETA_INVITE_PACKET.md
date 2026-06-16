# Private Beta Invite Packet

## Executive Summary

This packet is the participant-facing communication package for inviting 5 to
20 manually selected Visual Lexicon Track B private beta users.

The owner may use this packet only for a small owner-controlled private beta.
It is not approval for public signup, public paid beta, automated entitlement,
real account sync, production billing, auth, monitoring SDKs, deployment
changes, or production data changes.

Before sending any invitation or payment request, the owner must fill the
support, refund/cancellation, privacy, access, and optional payment-link
placeholders and approve the final copy.

## Current Verdicts

- Owner-controlled private beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**

Public signup is not open. Public paid beta is not open. Access is manually
invited and manually controlled by the owner.

## Participant Eligibility

Invite only participants who:

- Are manually selected by the owner for a 5 to 20 person private beta cohort.
- Understand this is an owner-controlled, manual, private beta.
- Can test the save-to-review learning loop in one browser profile.
- Accept that learning state may be local/browser-specific until real account
  sync exists.
- Can report issues with route, device, browser, steps, and screenshots or
  videos when possible.
- Accept that beta data should not be treated as permanent production data.
- Receive support, refund/cancellation, and privacy instructions before any
  payment request.

## Participant Exclusions

Do not invite participants who need:

- Public signup or self-serve access.
- Public paid beta access.
- Automatic entitlement after payment.
- Guaranteed cross-device account sync.
- Guaranteed backup, restore, or permanent production data.
- Formal invoice, subscription, billing portal, checkout, or automatic renewal.
- Production support coverage or production service-level guarantees.
- Public sharing rights for invite links, screenshots, or beta access details.

## Invitation Email Template

Owner must fill these placeholders before sending:

- `[participant_name]`
- `[owner_name]`
- `[access_instructions]`
- `[support_contact]`
- `[support_response_window]`
- `[refund_cancellation_terms]`
- `[privacy_local_storage_note]`
- `[payment_link_if_any]`

```txt
Subject: Visual Lexicon private beta invite

Hi [participant_name],

I am inviting a small group of manually selected users to try the Visual
Lexicon Track B private beta.

Current status:
- Owner-controlled private beta: Conditional / Manual-only
- Public paid beta: No-Go

This is not a public launch. Public signup is not open, public paid beta is not
open, and access is manually invited. Please do not forward this invite or share
beta access details publicly.

What to expect:
- You can test saving words, reviewing due words, practicing weak words, and
  using packs as part of the learning loop.
- Learning state may be local/browser-specific until real account sync is
  implemented.
- Please do not rely on beta data as permanent production data.

Payment, if any:
- Payment is manual/payment-link-only: [payment_link_if_any]
- The app does not automatically grant entitlement after payment.
- Support, refund/cancellation, and privacy instructions are below and must be
  clear before any payment request.

Support and privacy:
- Support contact: [support_contact]
- Expected response window: [support_response_window]
- Refund/cancellation wording: [refund_cancellation_terms]
- Privacy/localStorage note: [privacy_local_storage_note]

How to start:
1. Use [access_instructions].
2. Use the same browser profile during the beta when possible.
3. Start with the dashboard, save at least one word, then complete a short
   review session.
4. Report issues with the route, device, browser, steps, and screenshots or
   video when possible.

Please reply "I understand and want to join" only if these limitations are
acceptable.

Thanks,
[owner_name]
```

## Short DM Invitation Template

Owner must fill `[participant_name]`, `[access_instructions]`,
`[support_contact]`, `[refund_cancellation_terms]`, and
`[privacy_local_storage_note]` before sending.

```txt
Hi [participant_name] - I am inviting a small owner-controlled group to try the
Visual Lexicon Track B private beta.

Status: Owner-controlled private beta is Conditional / Manual-only. Public paid
beta is No-Go. Public signup is not open.

Access is manual: [access_instructions]

Limitations: payment, if any, is manual/payment-link-only; the app does not
grant automatic entitlement; learning state may be local/browser-specific until
real account sync exists; beta data should not be treated as permanent
production data.

Before any payment request, you must have support, refund/cancellation, and
privacy details:
- Support: [support_contact]
- Refund/cancellation: [refund_cancellation_terms]
- Privacy/localStorage: [privacy_local_storage_note]

Please do not share invite details publicly. If you join, report issues with
route, device, browser, steps, and screenshots/video when possible.
```

## Participant Consent Checklist

Before sending access instructions, confirm the participant accepts:

- This is a small owner-controlled private beta.
- Access is manually invited.
- Public signup is not open.
- Public paid beta is not open.
- Payment, if any, is manual/payment-link-only.
- No automatic entitlement is granted by app code.
- Learning state may be local/browser-specific until real account sync is
  implemented.
- Beta data should not be treated as permanent production data.
- Support, refund/cancellation, and privacy instructions are provided before
  any payment request.
- Issues should include route, device, browser, steps, and screenshots or
  videos when possible.
- Invite details, beta access, and screenshots are not for public sharing unless
  the owner explicitly approves.

## Onboarding Instructions

1. Confirm the participant has accepted the consent checklist.
2. Send only owner-approved access instructions.
3. Ask the participant to use one browser profile when possible.
4. Ask the participant not to clear site data during the test unless they are
   intentionally testing state loss.
5. Ask the participant to start at `/dashboard`, then save a word and complete a
   short review session.
6. Provide the monitored support contact and response expectation.

## First Session Instructions

Ask the participant to complete this short first session:

1. Open the app using the owner-provided access instructions.
2. Visit `/dashboard`.
3. Save one word from a word detail page or approved save entry point.
4. Start `/review` or `/review/due` and answer at least one active-recall
   prompt.
5. Visit `/saved` and confirm the saved word is visible.
6. Visit `/review/weak` if a weak word exists.
7. Report any breakage with route, device, browser, steps, expected behavior,
   actual behavior, and screenshot/video when possible.

## What To Test

- Dashboard Today Memory Mission.
- Save creates or preserves review state.
- Review answers create events and update memory state.
- Due and Weak review routes derive from real review state.
- Saved Library supports returning to review.
- Packs and pack detail routes load.
- Pricing copy remains honest about manual beta and no public checkout.
- Mobile, keyboard, console, hydration, and visible layout issues.
- Support, refund/cancellation, privacy, local-state, and payment wording
  clarity.

## What Not To Expect

- Public signup.
- Public paid beta.
- Public checkout, subscription, invoice, billing portal, or automatic renewal.
- Automatic entitlement after payment.
- Real account sync, cross-device progress, backup, or restore.
- Permanent production data guarantees.
- Production support coverage, monitoring, or incident response.
- AI Tutor functionality.

## Known Limitations

- This is a small owner-controlled private beta.
- Access is manually invited.
- Public signup is not open.
- Public paid beta is not open.
- Payment, if any, is manual/payment-link-only.
- No automatic entitlement is granted by app code.
- Learning state may be local/browser-specific until real account sync is
  implemented.
- Users should not rely on beta data as permanent production data.
- Support/refund/privacy instructions must be provided before any payment
  request.
- Users should report issues with route, device, browser, steps, and screenshots
  or videos when possible.

## Local-State/Account-Sync Limitation Disclosure

Saved words, review state, review events, daily stats, and related learning
state may live in local browser storage during this beta. During this beta, real
account sync is not implemented. Progress may not follow participants across
devices, browsers, accounts, cleared site data, or browser profile changes.

Participants should not rely on this beta data as permanent production data.

## Manual Payment And No Automatic Entitlement Disclosure

Payment, if any, is manual/payment-link-only. The app does not include checkout,
subscription, invoice, billing portal, payment SDK, or automatic entitlement
granting.

Clicking or completing a payment link does not automatically grant access in app
code. The owner must manually confirm access through an off-app manual record.

Support, refund/cancellation, and privacy instructions must be provided before
any payment request.

## Support Contact Placeholder Requirement

Every invite and payment request must include a filled, monitored
`[support_contact]` and `[support_response_window]`. Do not send if these
placeholders are blank.

## Refund/Cancellation Wording Placeholder Requirement

Every payment request must include filled `[refund_cancellation_terms]`. Do not
request payment if refund and cancellation wording is missing, unclear, or not
owner-approved.

## Privacy/localStorage Disclosure

Participant copy must explain that local learning data may be stored in the
browser through approved localStorage keys, including saved words, review state,
review events, and daily stats. Do not ask participants to send raw localStorage
values, secrets, payment data, auth credentials, or private account data.

## Issue Reporting Instructions

Ask participants to report:

- Route or screen where the issue happened.
- Device and operating system.
- Browser and browser version when known.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Whether local state, saved words, review events, payment, support, privacy, or
  refund/cancellation wording was involved.
- Screenshot or video when possible.

Urgent issues include broken save, broken review, lost local state, payment or
entitlement confusion, privacy concerns, refund/cancellation confusion, and
unreachable support.

## Screenshot/Video Evidence Guidance

Screenshots or videos are useful when they show route failures, visible layout
breakage, wrong copy, state loss symptoms, console/hydration errors, mobile
issues, or keyboard traps.

Participants should avoid including secrets, payment details, private account
content, raw localStorage values, or unrelated page content.

## First 24-Hour Follow-Up Template

```txt
Hi [participant_name] - quick 24-hour check-in on the Visual Lexicon private
beta.

Could you reply with:
1. Were you able to open the app and reach `/dashboard`?
2. Did saving a word and starting review work?
3. Did anything feel broken, confusing, or risky?
4. If there was an issue, please include route, device, browser, steps, and a
   screenshot/video when possible.

Reminder: public signup and public paid beta are not open. Learning state may be
local/browser-specific, and payment, if any, remains manual/payment-link-only
with no automatic entitlement.
```

## 7-Day Follow-Up Template

```txt
Hi [participant_name] - checking in after the first week of the Visual Lexicon
private beta.

Could you reply with:
1. Did you save words and return to review during the week?
2. Did Due or Weak review feel useful?
3. Did you notice any lost state, confusing copy, mobile/keyboard issue, or
   support/payment/privacy concern?
4. What would make you more likely to review words again next week?

Please include route, device, browser, steps, and screenshots/video for any
issue when possible.
```

## Beta Closeout / Continuation Template

```txt
Hi [participant_name] - thank you for joining the Visual Lexicon private beta.

The owner is reviewing whether to continue, pause, or close this beta cohort.
Public signup and public paid beta are still not open unless you receive a
separate owner-approved update.

Please reply with any final issues or feedback, especially around save, review,
weak words, local state, support, payment, refund/cancellation, privacy, mobile,
or keyboard behavior. Include route, device, browser, steps, and screenshots or
video when possible.

If the beta continues, access remains owner-controlled and manual.
```

## No Public Sharing / No Public Signup Note

Participants must not publicly share invite links, screenshots, videos, payment
links, or access instructions unless the owner explicitly approves. Public
signup is not open, and public paid beta is not open.

## Owner Approval Requirement Before Sending

Do not send the invite packet until the owner approves:

- Current verdicts.
- Participant roster and 5 to 20 person cap.
- Invitation email and DM copy.
- Support contact and response window.
- Refund/cancellation wording.
- Privacy/localStorage disclosure.
- Manual payment/payment-link-only wording, if any payment is requested.
- No automatic entitlement wording.
- Issue reporting instructions.
- No public sharing and no public signup wording.

## Recommended Next PR Sequence

Recommended next PR: **#87 Private beta issue log template**

- #87 Private beta issue log template
- #88 Private beta final owner signoff
- #89 Private beta dry-run smoke evidence
- #90 Owner-run private beta launch decision

## Safety Confirmation

This PR is docs/contracts/tests only. It does not implement runtime UI changes,
send emails, add email provider integrations, add API routes, add route
handlers, add middleware, add auth integrations, add DB/provider SDKs, add
payment, billing, checkout, subscription, entitlement mutation, real account
sync, monitoring SDKs, AI calls, env var changes, deployment, Webflow,
Cloudflare, Vercel, DNS, secrets, or production data changes. It does not run
`npm audit fix`.
