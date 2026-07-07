# Track A To Track B Save CTA Bridge

Date: 2026-07-07 KST

## Executive Summary

This document verifies the app-side bridge from public Webflow word and hub
pages on Track A to the Track B learning app.

Current result:

- `/save?slug=dissonance&source=word_page` is a safe app-side Save CTA target.
- First save writes `vlx_saved_words_v1` and `vlx_review_state_v1`.
- The saved word stores `source: "word_page"` because the current saved-word
  model supports source metadata.
- Save page load does not create fake `vlx_review_events_v1`, fake
  `vlx_daily_stats_v1`, fake Weak state, fake Mastered state, payment,
  entitlement, analytics SDK, or tracking-pixel behavior.
- `/review?mode=saved`, `/review?mode=due`, and
  `/review?mode=word&slug=dissonance` can accept the saved word through the
  existing local review loop.
- Public paid beta remains No-Go.
- Private/manual beta remains an owner-gated candidate only.

This PR verifies and documents the bridge contract. It does not edit Webflow
production and does not claim Webflow has already been updated.

## Why This Follows #181

#181 added the Track B Private Beta Candidate Owner Gate after the app-side
learning loop had enough local evidence for owner review. That gate did not
launch beta and did not unblock public paid beta.

This bridge verification follows #181 because the next safe question is whether
public discovery pages can point into the already-existing Track B save/review
loop without changing production Webflow, auth, billing, checkout, analytics,
account sync, or entitlement behavior.

The answer for this PR is app-side only: Track B exposes safe URL targets for
future Webflow CTAs, but Webflow production implementation remains a separate
manual step.

## Track A / Track B Responsibility Split

Track A responsibilities:

- Own public discovery pages on `visuallexicon.org` and Webflow.
- Render word-page Save and Quiz/Review CTAs with the approved URL templates.
- Render hub/deck CTAs with the approved URL templates.
- Provide stable public word slugs and hub slugs.
- Avoid calling Track B local storage directly.
- Avoid sending secrets, user data, billing data, or Webflow CMS mutations to
  Track B CTA URLs.

Track B responsibilities:

- Own `app.visuallexicon.org` app routes, local save state, and local review
  state.
- Resolve known word and hub slugs from current app pack/static data.
- Create or preserve `vlx_saved_words_v1` and `vlx_review_state_v1`.
- Create review events and daily stats only after a learner answers a review
  card.
- Keep Due, Weak, Strong, and Mastered derived from real review state.
- Keep public paid beta No-Go and private/manual beta owner-gated.

## Current App-Side Save Route Contract

The current app route accepts:

```txt
/save?slug={slug}&source={source}
```

For `source=word_page`, the route:

- Normalizes the slug.
- Resolves the word from current Track B pack/static word data.
- Creates a saved word in `vlx_saved_words_v1` when the word is not already
  saved.
- Preserves an existing saved-word record when one already exists.
- Creates a New review state item in `vlx_review_state_v1` when no review
  state exists.
- Preserves existing review state when one already exists.
- Preserves `source: "word_page"` on first save when the saved-word model
  supports source metadata.
- Does not create review events or daily stats on save page load.
- Does not create fake Weak, Strong, Mastered, pack progress, paid access, or
  beta launch state.

For `dissonance`, first save creates:

```ts
vlx_saved_words_v1.dissonance.source === "word_page"
vlx_review_state_v1.dissonance.mastery === "New"
vlx_review_state_v1.dissonance.box === 0
vlx_review_state_v1.dissonance.correct === 0
vlx_review_state_v1.dissonance.wrong === 0
vlx_review_state_v1.dissonance.weakScore === 0
```

## Required Webflow CTA URL Templates

Word page Save CTA:

```txt
https://app.visuallexicon.org/save?slug={slug}&source=word_page
```

Word page Quiz/Review CTA:

```txt
https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page
```

Hub page deck review CTA:

```txt
https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page
```

Hub page pack CTA when the existing Track B pack detail route supports the
pack id:

```txt
https://app.visuallexicon.org/packs/{packId}?source=hub_page
```

Current supported pack ids include `academic-vocabulary`, `core-v1`,
`home-v1`, `ielts-writing-vocabulary`, and `gre-visual-verbal`.

## Word Page Save CTA Contract

Required Track A input:

- `{slug}` must be the canonical lower-case word slug, for example
  `dissonance`.
- `source` must be `word_page`.

Required Track B outcome:

- Known slug: save confirmation loads and writes or preserves saved word and
  review state.
- Unknown slug: safe empty/error state with no saved word and no review state.
- Missing slug: safe empty/error state with no saved word and no review state.
- Save page load must not write `vlx_review_events_v1` or
  `vlx_daily_stats_v1`.
- Save page load must not mark a word Weak, Strong, or Mastered without review
  evidence.

## Word Page Quiz/Review CTA Contract

Required Track A input:

- `{slug}` must match a known Track B word slug.
- `mode` must be `word`.
- `source` must be `word_page`.

Required Track B outcome:

- Known slug: focused one-word review session loads.
- Unknown slug: safe focused-word empty state.
- Review answers, not page load, write `vlx_review_events_v1`,
  `vlx_daily_stats_v1`, and updated SRS state.
- The route may review a known static word even if the learner has not saved it
  yet; answering still writes local SRS state through the existing review
  answer flow.

## Hub Page Deck CTA Contract

Required Track A input:

- `{hubSlug}` must be the canonical Track B hub slug, for example
  `academic-vocabulary`.
- `mode` must be `hub`.
- `source` must be `hub_page`.

Required Track B outcome:

- Known hub: hub review session loads from current static pack/hub data.
- Unknown hub: safe empty state.
- Review answers write SRS state and events through the existing review answer
  flow.
- Hub review must not imply full paid pack availability.

## Source Attribution Rules

Allowed public Webflow bridge sources:

- `word_page` for word detail pages.
- `hub_page` for hub, deck, or public collection pages.

Rules:

- Source values are attribution labels, not authorization signals.
- Source values do not grant paid access.
- Source values do not prove account ownership.
- Existing saved-word source metadata is preserved when a word was already
  saved from another source.
- Do not include user identifiers, email addresses, selected text, referrer
  URLs, UTM payloads, billing state, or secrets in the source value.

## Slug Mapping Rules

Word slugs:

- Use the canonical Track A/Webflow word slug when it matches Track B pack data.
- Lower-case and hyphenate slugs.
- Do not pass display words, definitions, raw selected text, or CMS item ids as
  `slug`.
- Unknown slugs should fail safely in Track B until the pack/static data is
  updated.

Hub slugs:

- Use canonical Track B hub slugs, such as `academic-vocabulary`.
- Do not use human display labels like `Academic Vocabulary` in the `hub`
  query parameter.
- Do not invent pack ids for planned content. Use `/packs/{packId}` only when
  the Track B pack route already supports that id.

## LocalStorage State Expectations

Core keys:

| Key | Expected bridge behavior |
| --- | --- |
| `vlx_saved_words_v1` | Created or preserved by `/save?slug=...&source=word_page`. |
| `vlx_review_state_v1` | Created or preserved by save; updated by review answers. |
| `vlx_review_events_v1` | Not created by save page load; created only by committed review answers. |
| `vlx_daily_stats_v1` | Not created by save page load; updated only by committed review answers. |

Adjacent keys:

| Key | Expected bridge behavior |
| --- | --- |
| `vlx_pack_progress_v1` | Not created by word-page save. Pack progress remains explicit action or review evidence. |
| `vlx_plan_state_v1` | Not paid proof and not created by word-page save. |
| `vlx_upgrade_interest_v1` | Not created by word-page save. Interest-only pricing actions own this key. |
| `vlx_pending_home_quiz` | Optional transition key only; not required by this bridge. |

## Manual QA Checklist

1. Confirm the current branch is `release/webflow-save-cta-bridge` and the
   working tree is clean before starting.
2. Start the local app:

   ```powershell
   npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
   ```

3. Clear local storage for `http://127.0.0.1:3006`.
4. Open:

   ```txt
   http://127.0.0.1:3006/save?slug=dissonance&source=word_page
   ```

5. Confirm the page shows Dissonance added to the review queue.
6. Inspect local storage:

   ```js
   JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}").dissonance
   JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}").dissonance
   localStorage.getItem("vlx_review_events_v1")
   localStorage.getItem("vlx_daily_stats_v1")
   ```

7. Confirm saved word source is `word_page`.
8. Confirm review state is New or Learning-safe with no Weak or Mastered state
   on save page load.
9. Confirm `vlx_review_events_v1` and `vlx_daily_stats_v1` are absent after
   save page load.
10. Open `/review?mode=saved` and confirm Dissonance can enter review.
11. Open `/review?mode=due` and confirm Dissonance appears when due.
12. Open `/review?mode=word&slug=dissonance&source=word_page` and confirm
    focused review loads.
13. Open `/review?mode=hub&hub=academic-vocabulary&source=hub_page` and confirm
    hub review loads.
14. Open `/packs/academic-vocabulary?source=hub_page` and confirm the pack
    detail route loads.
15. Confirm public paid beta remains No-Go and private/manual beta remains
    owner-gated in relevant docs and copy.
16. Confirm no Webflow production edits were made.

## What Is Real Vs Planned

Real now:

- App-side `/save?slug=...&source=word_page` route behavior.
- App-side `/review?mode=word&slug=...&source=word_page` focused review route.
- App-side `/review?mode=hub&hub=...&source=hub_page` hub review route.
- App-side `/packs/{packId}?source=hub_page` detail route for existing pack ids.
- Local saved-word creation and source metadata.
- Local New review state creation.
- Review answer event and daily stat creation after committed answers.
- Due and Weak routes from real review state.
- #181 owner gate document preserving private/manual beta owner-gated candidate
  status and public paid beta No-Go status.

Planned, not live:

- Webflow production CTA implementation.
- Webflow publish.
- Public paid beta.
- Private/manual beta launch.
- Account sync.
- Server-side SRS persistence.
- Real analytics SDK or tracking pixel.
- Billing, checkout, payment, subscription, invoice, billing portal, real paid
  entitlement, or entitlement enforcement.
- Full IELTS/GRE pack content.
- Chrome extension rewrite.
- AI mistake explanations.

## P0/P1/P2 Risk Summary

P0:

- Count: `0` for this app-side bridge verification.
- No fake mastery, fake review events, fake daily stats, fake Weak state,
  checkout, billing, payment, real entitlement, analytics SDK, tracking pixel,
  Webflow production edit, private beta launch claim, or public paid beta
  unblock is introduced.

P1:

- Webflow production CTA implementation still requires manual Webflow work and
  verification outside this PR.
- Slug parity between Webflow CMS and Track B pack/static data must be checked
  before publishing public CTAs.
- Existing saved-word metadata is preserved, so a later word-page save does not
  overwrite an earlier source value.
- Unknown Track A slugs remain safe failures until Track B pack/static data is
  updated.

P2:

- Consider adding a Webflow CMS QA export check for word and hub slug parity.
- Consider adding non-sensitive source context only after privacy review.
- Consider server-side SRS/account sync migration only after local storage
  contracts can be preserved.

## Safety Boundaries

No Webflow production edit, Cloudflare Workers, auth, billing, payment,
checkout, DNS, deployment settings, secrets, production data, R2 production
objects, real user data, payment SDK, real entitlement, analytics SDK, tracking
pixel, Chrome extension rewrite, private beta launch claim, or public paid beta
unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake review events, fake daily stats, fake weak state, fake paid access, real
paid entitlement, private/manual beta launch, or public paid beta launch
behavior are part of this bridge verification.

`npm audit fix` was not run.

## Future Webflow Implementation Plan

1. Keep this PR app-side documentation and verification only.
2. In Webflow, add Save CTAs to word pages with:

   ```txt
   https://app.visuallexicon.org/save?slug={slug}&source=word_page
   ```

3. Add Quiz/Review CTAs to word pages with:

   ```txt
   https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page
   ```

4. Add hub/deck CTAs with:

   ```txt
   https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page
   ```

5. Add pack links only for supported Track B pack ids:

   ```txt
   https://app.visuallexicon.org/packs/{packId}?source=hub_page
   ```

6. Manually verify a small set of Webflow preview pages before any publish.
7. Do not publish Webflow from this PR.
8. After any separate Webflow publish, run manual QA against production URLs and
   record evidence separately.
9. Keep public paid beta No-Go and private/manual beta owner-gated until their
   separate gates are explicitly approved.
