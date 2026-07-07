# Track B v3 Keyboard QA Follow-up Report

Report date: 2026-07-07 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/v3-keyboard-qa-follow-up`  
Commit under test: `b474a2eb761dec859f4cc2dcd51bb18b5148fbf7` plus this PR diff  
Scope: Track B v3 keyboard QA follow-up for the paid learning app.

## Executive Summary

This report follows the #176 manual QA execution note and the #177 placeholder /
planned beta copy audit. It narrows the open keyboard note from #176 without
claiming a full sequential Tab traversal pass that was not proven reliable in
automation.

Current keyboard follow-up result:

- Sequential Tab traversal: **PASS WITH NOTE**
- Focused primary CTA keyboard activation: **PASS**
- Review answer and confidence keyboard activation: **PASS**
- Paywall prompt accessibility and safety copy: **PASS**
- P0 count: `0`
- Private/manual beta: **conditional owner-gated candidate only**
- Public paid beta: **No-Go**

Status vocabulary used by this report and its regression guard: `PASS`, `PASS
WITH NOTE`, `FAIL`, `BLOCKED`.

This report does not launch private beta, does not unblock public paid beta, and
does not add product features, payment behavior, checkout, billing, analytics
SDKs, tracking pixels, or entitlement behavior.

## Why This Follows #176 And #177

#176 recorded keyboard smoke as `PASS WITH NOTE`: focused keyboard activation
passed, but full sequential Tab traversal was brittle in automation after route
transitions. This follow-up preserves that limitation honestly while adding a
static regression guard for the routes and controls most relevant to owner
manual keyboard signoff.

#177 clarified placeholder, planned beta, pricing, and paywall copy so upgrade
interest cannot be mistaken for paid access. This keyboard follow-up keeps that
copy connected to keyboard QA because pricing and paywall prompts are part of
the keyboard path and must remain interest-only, owner-gated, and public No-Go.

Referenced source: `docs/TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md`.

## Environment

| Field | Value |
| --- | --- |
| Local base URL | `http://127.0.0.1:3006` |
| App server command | `npm.cmd run dev -- --hostname 127.0.0.1 --port 3006` |
| Browser automation | Playwright Chromium via local dev server |
| Data boundary | Browser localStorage only |
| Production data used | No |
| Webflow / Cloudflare / auth / billing touched | No |

## Commit Under Test

| Field | Value |
| --- | --- |
| Branch | `release/v3-keyboard-qa-follow-up` |
| Commit | `b474a2eb761dec859f4cc2dcd51bb18b5148fbf7` plus this PR diff |
| PR target | `#178 [Track B] Add v3 Keyboard QA Follow-up Report` |

## Keyboard QA Scope

Checks covered:

- Tab reaches main content or the skip/main landmark area where applicable.
- Primary CTA is reachable by keyboard.
- Primary CTA has an accessible name.
- Primary CTA can be activated with Enter; Space is used for button controls.
- Links have clear accessible names.
- Review answer options are keyboard reachable.
- Review confidence controls are keyboard reachable.
- Paywall prompt has accessible heading, body, and action copy.
- Upgrade interest CTA does not imply real paid access.
- Focus is visible enough for owner manual signoff evidence.
- No keyboard trap appears in `/pricing`, `/settings`, `/review`, or paywall
  prompt surfaces.
- Route transitions do not erase required keyboard access.

## Routes Tested

| Route | Keyboard follow-up result | Notes |
| --- | --- | --- |
| `/dashboard` | PASS | Primary `Start due review` CTA is named and links to `/review/due`. |
| `/review` | PASS | Review surface keeps named answer and confidence controls when state is available. |
| `/review/due` | PASS | Due answer option and confidence controls are keyboard addressable. |
| `/review/weak` | PASS | Weak answer option and confidence controls are keyboard addressable. |
| `/saved` | PASS | Saved Library primary review action and word-level review links are named. |
| `/packs` | PASS | Pack preview links are named and stay on the approved review route. |
| `/packs/academic-vocabulary` | PASS | Academic preview CTA is named and uses the existing review path. |
| `/pricing` | PASS | Plan CTAs are named; upgrade interest remains interest-only. |
| `/settings` | PASS | Local paywall prompt heading, body, action, and status copy are reachable. |

## Sequential Tab Traversal Result

Result: **PASS WITH NOTE**.

Focused keyboard activation and targeted keyboard addressability are covered by
the regression guard. Full sequential Tab traversal across route transitions is
not reclassified as a full pass here because #176 found it brittle in automation
after route changes. The limitation is automation reliability, not a confirmed
runtime keyboard trap.

Owner manual keyboard signoff should still perform a human sequential Tab pass
before any private/manual beta invite or payment request.

## Focus Visibility Result

Result: **PASS WITH NOTE**.

Existing release-gate coverage verifies visible focus styling for the dashboard
to review flow, review options, confidence buttons, app shell links, Saved
Library tabs, pack links, pricing controls, and paywall prompt actions. This
follow-up did not redesign focus styling. Owner manual signoff should still
confirm visible focus on a real desktop browser and a small viewport.

## Primary CTA Keyboard Activation Result

Result: **PASS**.

The stable primary CTAs have accessible names and keyboard activation coverage:

- `/dashboard`: `Start due review`
- `/saved`: `Start due review`
- `/pricing`: `Start free review`
- `/pricing`: `Note Lite interest - billing not connected yet`
- `/packs`: `Start Academic preview`
- `/packs/academic-vocabulary`: `Start preview Academic Vocabulary`

## Review Controls Keyboard Result

Result: **PASS**.

Due and weak review answer options are buttons with accessible names. Focused
keyboard activation with Space or Enter reaches the confidence step, and the
confidence controls expose named buttons such as `I knew it`, `I guessed`, and
`I forgot`.

## Saved Library Keyboard Result

Result: **PASS**.

Saved Library keeps the memory queue keyboard-addressable through named tabs and
review actions. The primary CTA and word-level review links stay tied to real
review state and do not create fake Mastered, Due, or Weak state.

## Packs Keyboard Result

Result: **PASS**.

`/packs` and `/packs/academic-vocabulary` keep named preview CTAs. Pack progress
is not created by page load; it is only tied to explicit preview/review action
evidence. Planned IELTS/GRE copy remains unavailable until real word data
exists.

## Pricing/Paywall Keyboard Result

Result: **PASS**.

Pricing CTAs are keyboard-addressable and named. Upgrade interest actions record
local interest only and preserve the required safety copy:

- Billing is not connected yet.
- No checkout is live.
- This records beta interest only.
- This does not grant paid access.
- No real paid entitlement is active.
- Private/manual beta requires owner approval.
- Public paid beta remains No-Go.

## Settings/Paywall Prompt Focus Result

Result: **PASS**.

`/settings` exposes local paywall prompts with an accessible heading/body/action
structure when local trigger state exists. The prompt action is a named button,
the fallback `Compare plans` link is named, and clicked state writes a local
status message without granting plan state or paid access.

## Mobile Keyboard/Small Viewport Note

Result: **PASS WITH NOTE**.

Existing accessibility gates cover mobile focus not being hidden by the bottom
navigation and small-viewport reflow. This follow-up does not replace real
device keyboard, switch-control, or screen-reader checks. Owner manual signoff
should still verify small viewport focus visibility and reachability before
private/manual beta.

## Known Limitations

- Full sequential Tab traversal after route transitions remains brittle in
  automation and is not claimed as a full pass.
- This is not a screen-reader certification.
- This is not a real-device mobile assistive technology pass.
- This does not validate production auth, account sync, billing, checkout,
  entitlement, analytics, monitoring, or production operations.
- This does not launch private/manual beta and does not unblock public paid beta.

## P0/P1/P2 Result

### P0

Count: `0`

No P0 keyboard blocker was found in this follow-up. No keyboard trap was
confirmed in `/pricing`, `/settings`, `/review`, or paywall prompt surfaces.

### P1

| ID | Finding | Action |
| --- | --- | --- |
| `p1_owner_manual_keyboard_signoff_required` | Full sequential Tab traversal remains `PASS WITH NOTE` because automation was brittle after route transitions. | Run owner human sequential Tab traversal before private/manual beta signoff. |
| `p1_screen_reader_real_device_pass_missing` | This follow-up is not a screen-reader or real-device assistive technology pass. | Keep owner accessibility signoff required. |
| `p1_public_beta_production_gates_missing` | Account sync, server-side SRS, production analytics/monitoring, support, refund, privacy, rollback, billing/payment/checkout, entitlement, and production operations remain incomplete. | Keep public paid beta No-Go. |

### P2

| ID | Finding | Action |
| --- | --- | --- |
| `p2_focus_polish_observation` | Continue checking focus visibility during visual polish and screenshot parity runs. | Do not alter focus styling without rerunning keyboard and visual evidence. |
| `p2_planned_pack_keyboard_depth` | IELTS/GRE planned packs have no real word data. | Do not claim full pack keyboard review until real pack data exists. |

## Private/Manual Beta Recommendation

Recommendation: **conditional private/manual beta candidate, owner-gated only**.

The keyboard follow-up supports moving into owner review only if the owner also
performs a human sequential Tab traversal pass and confirms support, refund,
privacy, manual entitlement, rollback, invite language, and accessibility
signoff. This is not a private beta launch claim.

## Public Paid Beta Recommendation

Recommendation: **Public paid beta remains No-Go**.

Public paid beta remains blocked until account sync, server-side SRS, production
analytics/monitoring, privacy/legal, accessibility, support, refund, rollback,
billing/payment/checkout, entitlement enforcement, and production operations
gates are separately completed and approved.

## Explicit Safety Confirmation

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, analytics SDK, tracking pixel, or public
paid beta unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake pack progress, fake paid access, private beta launch claim, or public paid
beta launch claim were added.

`npm audit fix` was not run.
