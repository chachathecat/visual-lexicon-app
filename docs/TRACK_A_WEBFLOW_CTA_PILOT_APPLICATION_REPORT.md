# Track A Webflow CTA Pilot Application Report

Date: 2026-07-08 KST

## Executive Summary

This report is an evidence template for owner-managed Webflow CTA pilot
application and QA after #183. It records the intended pilot targets, the
owner-supplied evidence required before any production claim, the app-side QA
steps, rollback evidence, and safety boundaries.

Current status:

- Owner-supplied Webflow screenshots, hrefs, and publish evidence are pending.
- This PR does not edit Webflow production.
- This PR does not claim Webflow production was published.
- This PR does not claim Track A production CTAs are live.
- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated candidate only.

Expected owner result: after manually applying CTAs in Webflow preview or
production, the owner can fill this report with evidence that distinguishes
preview-only work from any separately owner-published production change.

## Why This Follows #183

#183 added the Webflow Save CTA Implementation Kit. That kit gave the owner
known-safe href templates, manual snippets, slug parity checks, preview QA, and
rollback guidance for connecting public Track A Webflow pages to Track B
app-side routes.

This report follows #183 because the next safe step is evidence collection, not
agent-managed Webflow publishing. The owner can apply the pilot in Webflow,
capture before/after proof, run app-side QA, and record whether the work stayed
preview-only or was separately published by the owner. This PR stays limited to
docs, tests, README link, evidence checklist, and static safety assertions.

Reference docs:

- `docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md`
- `docs/TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md`
- `docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md`

## Pilot Scope

Word page pilot:

- Page: Dissonance
- Save CTA:
  `https://app.visuallexicon.org/save?slug=dissonance&source=word_page`
- Word review CTA:
  `https://app.visuallexicon.org/review?mode=word&slug=dissonance&source=word_page`

Hub page pilot:

- Page: Academic Vocabulary
- Hub review CTA:
  `https://app.visuallexicon.org/review?mode=hub&hub=academic-vocabulary&source=hub_page`
- Academic pack CTA:
  `https://app.visuallexicon.org/packs/academic-vocabulary?source=hub_page`

Out of scope:

- Broad Webflow CMS rollout.
- Agent-managed Webflow publishing.
- Webflow CMS deletion or mass edit.
- Cloudflare Worker, DNS, auth, billing, payment, checkout, deployment,
  production data, R2 production object, real user data, analytics SDK, tracking
  pixel, Chrome extension, private beta launch, or public paid beta unblock.

## Owner-Supplied Webflow Evidence Fields

Fill one evidence row per CTA element. Until the owner fills these fields with
actual evidence, status remains **Pending owner evidence**.

| Field | Required value |
| --- | --- |
| Webflow page URL | Pending owner evidence |
| Webflow preview URL if available | Pending owner evidence |
| CTA element name | Pending owner evidence |
| previous href | Pending owner evidence |
| new href | Pending owner evidence |
| before screenshot | Pending owner evidence |
| after screenshot | Pending owner evidence |
| publish status: not published / preview only / production published by owner | Pending owner evidence |
| rollback href | Pending owner evidence |
| QA timestamp | Pending owner evidence |
| owner initials or reviewer name | Pending owner evidence |

Evidence rules:

- If owner has not supplied Webflow screenshots/hrefs, mark evidence as pending.
- Do not claim Webflow production was published without owner-supplied publish
  evidence.
- Do not claim Track A production CTA is live without owner-supplied production
  evidence.
- Production publish status must be one of: `not published`, `preview only`, or
  `production published by owner`.

## Word Page CTA Evidence

Pilot page: Dissonance.

| CTA | Expected href | Evidence status |
| --- | --- | --- |
| Save CTA | `https://app.visuallexicon.org/save?slug=dissonance&source=word_page` | Pending owner evidence |
| Word review CTA | `https://app.visuallexicon.org/review?mode=word&slug=dissonance&source=word_page` | Pending owner evidence |

Required Dissonance evidence:

- [ ] Webflow page URL recorded.
- [ ] Webflow preview URL recorded if available.
- [ ] CTA element name recorded.
- [ ] previous href recorded before change.
- [ ] new href matches the expected Dissonance href.
- [ ] before screenshot captured.
- [ ] after screenshot captured.
- [ ] publish status recorded as `not published`, `preview only`, or
      `production published by owner`.
- [ ] rollback href recorded.
- [ ] QA timestamp recorded.
- [ ] owner initials or reviewer name recorded.

## Hub Page CTA Evidence

Pilot page: Academic Vocabulary.

| CTA | Expected href | Evidence status |
| --- | --- | --- |
| Hub review CTA | `https://app.visuallexicon.org/review?mode=hub&hub=academic-vocabulary&source=hub_page` | Pending owner evidence |
| Academic pack CTA | `https://app.visuallexicon.org/packs/academic-vocabulary?source=hub_page` | Pending owner evidence |

Required Academic Vocabulary evidence:

- [ ] Webflow page URL recorded.
- [ ] Webflow preview URL recorded if available.
- [ ] CTA element name recorded.
- [ ] previous href recorded before change.
- [ ] new href matches the expected Academic Vocabulary href.
- [ ] before screenshot captured.
- [ ] after screenshot captured.
- [ ] publish status recorded as `not published`, `preview only`, or
      `production published by owner`.
- [ ] rollback href recorded.
- [ ] QA timestamp recorded.
- [ ] owner initials or reviewer name recorded.

## Before/After Href Inventory

Record every pilot CTA before and after manual Webflow work.

| Page | CTA element name | previous href | new href | rollback href | Evidence status |
| --- | --- | --- | --- | --- | --- |
| Dissonance | Save CTA | Pending owner evidence | `https://app.visuallexicon.org/save?slug=dissonance&source=word_page` | Pending owner evidence | Pending owner evidence |
| Dissonance | Word review CTA | Pending owner evidence | `https://app.visuallexicon.org/review?mode=word&slug=dissonance&source=word_page` | Pending owner evidence | Pending owner evidence |
| Academic Vocabulary | Hub review CTA | Pending owner evidence | `https://app.visuallexicon.org/review?mode=hub&hub=academic-vocabulary&source=hub_page` | Pending owner evidence | Pending owner evidence |
| Academic Vocabulary | Academic pack CTA | Pending owner evidence | `https://app.visuallexicon.org/packs/academic-vocabulary?source=hub_page` | Pending owner evidence | Pending owner evidence |

Do not overwrite the previous href after a successful QA pass. It is the
rollback source of truth.

## Preview QA Checklist

Run this checklist in Webflow preview before any owner production publish:

1. Confirm Webflow page URL for Dissonance.
2. Confirm Webflow preview URL for Dissonance if available.
3. Confirm Save CTA element name.
4. Confirm Word review CTA element name.
5. Confirm previous hrefs were recorded before changes.
6. Confirm Save CTA href is
   `https://app.visuallexicon.org/save?slug=dissonance&source=word_page`.
7. Confirm Word review CTA href is
   `https://app.visuallexicon.org/review?mode=word&slug=dissonance&source=word_page`.
8. Confirm Webflow page URL for Academic Vocabulary.
9. Confirm Webflow preview URL for Academic Vocabulary if available.
10. Confirm Hub review CTA href is
    `https://app.visuallexicon.org/review?mode=hub&hub=academic-vocabulary&source=hub_page`.
11. Confirm Academic pack CTA href is
    `https://app.visuallexicon.org/packs/academic-vocabulary?source=hub_page`.
12. Capture before screenshot and after screenshot for each CTA.
13. Click each CTA in preview and confirm the app route opens.
14. Record QA timestamp and owner initials or reviewer name.
15. Record publish status as `not published`, `preview only`, or
    `production published by owner`.

## Production Publish Status

Current production publish status: **Pending owner evidence**.

This report must remain honest:

- This PR does not publish Webflow.
- This PR does not claim Webflow production was changed.
- This PR does not claim Track A production CTA is live.
- Production may be marked `production published by owner` only when the owner
  supplies explicit manual publish evidence, screenshots or href inventory, QA
  timestamp, and reviewer identity.
- If the owner has only tested Webflow preview, mark status `preview only`.
- If no Webflow changes have been applied, mark status `not published`.

## App-Side Route QA Checklist

Run this checklist against the app route target after Webflow preview click QA:

1. Clear localStorage.
2. Open `/save?slug=dissonance&source=word_page`.
3. Confirm `vlx_saved_words_v1` contains dissonance.
4. Confirm `vlx_review_state_v1` contains dissonance.
5. Confirm no `vlx_review_events_v1` is created on save page load.
6. Confirm no `vlx_daily_stats_v1` is created on save page load.
7. Open `/review?mode=saved`.
8. Open `/review?mode=due`.
9. Open `/review?mode=word&slug=dissonance`.
10. Open `/review?mode=hub&hub=academic-vocabulary&source=hub_page`.
11. Open `/packs/academic-vocabulary?source=hub_page`.
12. Confirm public paid beta remains No-Go.
13. Confirm private/manual beta remains owner-gated candidate only.

## LocalStorage Evidence Checklist

After opening `/save?slug=dissonance&source=word_page`, record local evidence:

- [ ] `vlx_saved_words_v1` exists.
- [ ] `vlx_saved_words_v1.dissonance.slug` is `dissonance`.
- [ ] `vlx_saved_words_v1.dissonance.word` is `Dissonance`.
- [ ] `vlx_saved_words_v1.dissonance.source` is `word_page` on first save.
- [ ] `vlx_review_state_v1` exists.
- [ ] `vlx_review_state_v1.dissonance.slug` is `dissonance`.
- [ ] `vlx_review_state_v1.dissonance.box` is safe New state evidence.
- [ ] `vlx_review_state_v1.dissonance.mastery` is New or Learning-safe, not
      Weak, Strong, or Mastered from save page load alone.
- [ ] `vlx_review_events_v1` is absent on save page load.
- [ ] `vlx_daily_stats_v1` is absent on save page load.
- [ ] Any later `vlx_review_events_v1` entry comes only from a committed review
      answer.
- [ ] Any later `vlx_daily_stats_v1` update comes only from a committed review
      answer.

## Rollback Evidence Checklist

Before any owner publish:

- [ ] previous href recorded for each CTA.
- [ ] rollback href recorded for each CTA.
- [ ] before screenshot captured for each CTA.
- [ ] Webflow preview QA completed.
- [ ] app-side route QA completed.

If rollback is needed:

- [ ] restore the rollback href for each affected CTA.
- [ ] capture after rollback screenshot.
- [ ] record rollback QA timestamp.
- [ ] record owner initials or reviewer name.
- [ ] verify Dissonance and Academic Vocabulary CTAs no longer point to the
      failed href.
- [ ] verify no Webflow CMS item mass update happened unintentionally.
- [ ] verify no DNS, Worker, payment, auth, billing, checkout, deployment
      setting, secret, production data, R2 production object, or real user data
      changed.

## What Is Real Vs Planned

Real now:

- `docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md` exists.
- `docs/TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md` exists.
- `docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md` exists.
- This evidence report template exists.
- The pilot scope names Dissonance and Academic Vocabulary.
- App-side route QA steps are defined.
- Owner evidence fields are defined.
- Webflow evidence remains pending until the owner supplies screenshots, hrefs,
  publish status, QA timestamp, and reviewer identity.
- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated candidate only.

Planned, not live:

- Owner-managed Webflow CTA application.
- Webflow preview QA completion.
- Owner production publish, if separately chosen by the owner.
- Production Track A CTA live claim.
- Broad Webflow CTA rollout beyond the two pilot pages.
- Public paid beta.
- Private/manual beta launch.
- Account sync, server-side SRS persistence, production analytics/monitoring,
  billing, checkout, payment, subscription, invoice, billing portal, real paid
  entitlement, Chrome extension rewrite, AI Tutor, or AI mistake explanation.

## P0/P1/P2 Risk Summary

P0:

- Count: `0` for this documentation and static test report template.
- No Webflow production edit by this PR.
- No Webflow production edit claim unless evidence is supplied.
- No private beta launch claim.
- No public paid beta unblock claim.
- No payment, checkout, billing, auth, analytics SDK, tracking pixel, DNS,
  deployment setting, secret, production data, R2 production object, real user
  data, Cloudflare Worker, or Chrome extension behavior is introduced.

P1:

- Owner Webflow implementation can still point to a wrong href if previous and
  new hrefs are not recorded carefully.
- Production status can be misread unless it is explicitly marked as
  `not published`, `preview only`, or `production published by owner`.
- Dissonance and Academic Vocabulary evidence must be captured separately so a
  word-page pass does not imply hub-page pass.
- App-side localStorage QA must distinguish save page load from committed
  review answers.

P2:

- Consider an owner-owned screenshot folder or evidence tracker outside this
  PR.
- Consider a future CSV export of Webflow pilot CTA hrefs for offline parity
  checks.
- Consider expanding to additional word and hub pages only after the pilot
  evidence is complete.

## Safety Boundaries

Required safety assertions:

- `docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md` exists.
- `docs/TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md` exists.
- `docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md` exists.
- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated candidate only.
- No Webflow production edit claim unless evidence is supplied.
- No private beta launch claim.
- No public paid beta unblock claim.
- No payment/checkout/billing route directories.
- No forbidden payment dependencies.
- No analytics SDK/tracking pixel dependencies.

Forbidden route directories:

```txt
src/app/checkout
src/app/billing
src/app/payment
src/app/payments
src/app/api/checkout
src/app/api/billing
src/app/api/payment
src/app/api/payments
```

Forbidden payment dependencies:

```txt
stripe
paddle
lemon
lemonsqueezy
lemon-squeezy
```

Forbidden analytics SDK or tracking pixel dependencies:

```txt
segment
mixpanel
amplitude
posthog
plausible
rudderstack
```

Explicit safety confirmation for this report: no Webflow production edit by
this PR, Cloudflare Workers, auth, billing, payment, checkout, DNS, deployment
settings, secrets, production data, R2 production objects, real user data,
payment SDK, real entitlement, analytics SDK, tracking pixel, Chrome extension
rewrite, private beta launch claim, or public paid beta unblock.

`npm audit fix` must not be run for this report.

## Next Step Recommendation

Recommendation: keep public paid beta **No-Go** and keep private/manual beta an
owner-gated candidate only.

Next owner action:

1. Apply the four pilot CTAs in Webflow preview only.
2. Fill the owner-supplied evidence fields for Dissonance and Academic
   Vocabulary.
3. Run the preview QA checklist.
4. Run the app-side route QA checklist.
5. Record production publish status honestly as `not published`,
   `preview only`, or `production published by owner`.
6. Publish production only if the owner separately chooses to do so after
   preview and app-side QA pass.
7. Use the rollback evidence checklist if any CTA or app route fails.
