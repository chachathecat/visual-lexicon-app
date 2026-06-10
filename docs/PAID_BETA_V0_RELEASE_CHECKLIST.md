# Paid Beta v0 Release Checklist

Use this checklist before sending any Visual Lexicon Track B paid beta invite.
This is a release-candidate decision document for a private no-payment beta. It
does not launch the beta, connect billing, or change runtime behavior.

## Current Release Candidate Scope

Scope for paid beta v0:

- Track B learning app only, served from the app repository.
- Local browser-state Save -> Review -> SRS loop.
- Local saved library, word memory panel, dashboard memory mission, due review,
  weak review, weak sprint, pack preview, pricing placeholders, and local
  upgrade-interest capture.
- Local privacy-safe `window.dataLayer` event pushes for beta funnel checks.
- Documentation, support copy, rollback process, and release decision records.

Out of scope:

- Webflow publishing or CMS mutation.
- Cloudflare production Worker changes.
- Auth, account sync, billing, checkout, subscription, invoice, billing portal,
  DNS, secrets, deployment settings, production user data, or real payment.
- AI Tutor functionality.
- Multilingual page generation.
- Production analytics backend integration.

## What Is Ready

- Save creates or preserves local saved-word records and review state.
- Review answers write local review events, update review state, and update
  daily stats.
- Due, Weak, and Mastered states are derived from local review state rather than
  fake progress.
- `/saved` reads local saved/review state and has an honest empty state.
- `/word/[slug]` shows local memory state honestly while static word content
  remains mock/starter content.
- Academic Vocabulary preview can start and complete local pack progress from
  review answers.
- Pricing and paywall surfaces are no-payment beta placeholders.
- Local analytics events are pushed to `window.dataLayer` without adding an
  external analytics SDK.
- Tests cover the current local SRS, saved library, word memory, packs,
  paywall, entitlement, alias, and local analytics contracts.

## What Is Explicitly Not Ready

- Real paid launch.
- Real checkout, subscription, invoice, billing portal, or payment SDK.
- Account auth, account sync, or cross-device progress.
- Production user data persistence.
- Real IELTS/GRE paid pack content.
- Production analytics reporting.
- Full Chrome extension integration beyond app-side save-route contracts.
- Full multilingual content pages.
- AI mistake explanations or AI Tutor.
- Any claim that beta progress is permanent.

## Required Validation Commands

Run these before any final release decision:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

Record exact results in the PR and in the release decision notes. Do not claim a
check passed unless it actually ran.

## Required Manual QA Run

Manual QA must be executed against the local app before any private invite is
sent.

Reference docs:

```txt
docs/PAID_BETA_MANUAL_QA.md
docs/PAID_BETA_QA_RUN_2026-06-09.md
```

Minimum run requirements:

- Start the local app with
  `npm.cmd run dev -- --hostname 127.0.0.1 --port 3006`.
- Clear local browser state before the run.
- Confirm `/dashboard`, `/saved`, and `/word/dissonance` empty states are
  honest.
- Save words from `word_page`, `alias_search`, and `extension` sources.
- Confirm each saved word creates or preserves review state.
- Complete review answers and confirm review events, state, and daily stats are
  updated.
- Create a weak word from a wrong answer and confirm weak review uses the same
  local SRS state.
- Start and complete Academic Vocabulary preview and confirm pack progress is
  based on real answers.
- Click Lite and Pro pricing CTAs and confirm only local upgrade-interest
  records are written.
- Visit checkout and billing-like routes and confirm no real payment flow
  exists.

Do not mark any pending manual QA item as passed unless it has actually been
executed in the browser.

## Required Local Analytics Console Checks

The beta analytics contract is local-only. After exercising save, saved
library, word detail, review, pack preview, pricing, and paywall flows, inspect
recent events in the browser console:

```js
(window.dataLayer || [])
  .filter((item) => item && typeof item === "object")
  .filter((item) => String(item.event || "").startsWith("vlx_"))
  .slice(-20);
```

Expected local event names include:

```txt
vlx_save_word
vlx_saved_library_view
vlx_word_memory_state_view
vlx_review_start
vlx_review_answer
vlx_review_complete
vlx_pack_preview_start
vlx_pack_preview_complete
vlx_pricing_interest
vlx_paywall_interest
```

Run the privacy check:

```js
(window.dataLayer || [])
  .filter((item) => item && typeof item === "object")
  .some((item) =>
    ["email", "authToken", "apiToken", "pageText", "browserHistory", "pagePath", "sessionId"]
      .some((key) => Object.prototype.hasOwnProperty.call(item, key))
  );
```

Expected result: `false`.

## P0 Blockers

Any P0 blocks a paid beta invite.

- Save does not create or preserve `vlx_saved_words_v1`.
- Save does not create or preserve `vlx_review_state_v1`.
- Review answers do not append `vlx_review_events_v1`.
- Review answers do not update review state.
- Daily reviewed/correct/wrong stats are not based on real answers.
- Due, Weak, or Mastered states are fake or detached from SRS state.
- Saved library shows fake sample words as saved words.
- Word detail shows fake mastery, box, weak score, due date, or recall counts.
- Pack progress claims completion without real review answers.
- Pricing, paywall, settings, or routes imply real payment or a real
  subscription.
- Checkout, billing, payment SDK, subscription, invoice, or billing portal
  behavior exists without explicit authorization.
- Local analytics includes secrets, email, tokens, session IDs, full page text,
  browser history, or external analytics SDK behavior.
- Webflow, Cloudflare Workers, auth, billing, DNS, payment settings, secrets,
  production data, or deployment settings were touched.

## P1 Pre-Invite Checks

P1 items should be resolved or explicitly accepted by the owner before any
private invite.

- All required validation commands pass or failures are understood and accepted.
- Manual QA run has been executed and recorded.
- Local analytics console checks have been executed and recorded.
- Invite copy has been reviewed for no-payment, local-browser-state, and reset
  disclosure language.
- Support and data disclosure copy has been reviewed.
- Rollback plan owner has been named.
- Real pack/content limitations are clear to testers.
- Production analytics gap is acknowledged.
- Any remaining placeholder entitlement copy is acceptable for the private beta
  audience.

## P2 Follow-Ups

P2 items should be tracked, but they do not block a narrow private no-payment
beta if P0 and accepted P1 conditions are clear.

- UI polish on dashboard, review summary, settings, and pricing.
- More screenshots or recorded QA evidence.
- Broader manual QA across browsers.
- Pack reset/retry policy details.
- Future production analytics reporting plan.
- Future account sync plan.
- Future full multilingual page plan.
- Future AI mistake explanation plan.

## Release Decision Rules

Go:

- All validation commands pass.
- Required manual QA passes.
- Local analytics console checks pass.
- No P0 blockers remain.
- P1 items are either resolved or explicitly accepted by the owner.
- Safety boundaries are confirmed untouched.
- Invite copy, support/data disclosure, and rollback plan are ready.

Conditional Go:

- No P0 blockers remain.
- Any remaining P1 items have named owners, written acceptance, and do not
  weaken the local Save -> Review -> SRS loop.
- The invite audience is constrained to private no-payment testers.
- The invite copy clearly says billing is not connected, progress is local, no
  subscription is created, and beta progress may reset.

No-Go:

- Any P0 blocker exists.
- Required manual QA has not been executed.
- Local analytics privacy checks fail.
- Any payment, billing, checkout, subscription, production data, Webflow,
  Cloudflare Worker, auth, DNS, secrets, or deployment surface was touched
  without explicit approval.
- Invite copy could reasonably imply a real subscription, real billing, or
  durable account sync.

## Final Owner Sign-Off

Release candidate:

Commit SHA:

Branch:

Validation owner:

Manual QA owner:

Product owner:

Support owner:

Rollback owner:

Release decision: `<Go / Conditional Go / No-Go>`

Accepted P1 items:

Open P2 follow-ups:

Decision date:

Safety confirmation:

- Webflow was not touched.
- Cloudflare Workers were not touched.
- Auth, billing, DNS, payment settings, secrets, production data, deployment
  settings, and real payment were not touched.
- No checkout, payment SDK, billing route, subscription behavior, or external
  payment logic was added.
- No external analytics SDK was added.
- No runtime behavior changed as part of this release-process documentation PR.
