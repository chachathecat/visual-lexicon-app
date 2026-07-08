# Track A Webflow Save CTA Implementation Kit

Date: 2026-07-08 KST

## Executive Summary

This kit gives the owner exact, safe Webflow CTA href templates and manual
snippets for connecting public Track A word and hub pages to Track B app-side
Save and Review routes.

This is an implementation kit only:

- It does not edit Webflow production.
- It does not prove Webflow production has already been updated.
- It does not touch Cloudflare Workers.
- It does not add auth, billing, payment, checkout, subscription, entitlement,
  analytics SDK, tracking pixel, account sync, production data behavior, Chrome
  extension rewrite, private beta launch, or public paid beta unblock.
- Public paid beta remains No-Go.
- Private/manual beta remains an owner-gated candidate only.

Expected owner result: Webflow CTAs can be manually updated with known-safe app
hrefs, preview QA can verify them, and rollback can restore previous CTA hrefs
without changing Track B runtime behavior.

## Why This Follows #182

#182 verified the app-side public Webflow Save CTA to Track B review bridge.
Its merged result confirmed that `/save?slug=dissonance&source=word_page`
writes or preserves `vlx_saved_words_v1` and `vlx_review_state_v1`, does not
create fake `vlx_review_events_v1` or `vlx_daily_stats_v1` on save page load,
and can hand the saved word into existing review routes.

This kit follows #182 because the next safe step is not more runtime behavior.
The next safe step is owner-facing Webflow implementation guidance: exact href
templates, manual snippets, slug parity checks, source attribution rules,
preview QA, and rollback steps. The production Webflow update remains manual and
outside this PR.

Reference bridge doc: `docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md`.

## Track A / Track B Responsibility Split

Track A responsibilities:

- Own public discovery pages on `visuallexicon.org` and Webflow.
- Apply CTA hrefs manually in Webflow only after recording current hrefs.
- Use canonical word slugs, hub slugs, and supported pack ids.
- Preview and QA Webflow pages before publishing.
- Roll back by restoring previous CTA hrefs if app routes fail.
- Avoid sending secrets, user data, selected text, referrer URLs, CMS item ids,
  billing data, or entitlement claims through CTA URLs.

Track B responsibilities:

- Own app routes on `app.visuallexicon.org`.
- Resolve known word and hub slugs from current Track B app data.
- Create or preserve `vlx_saved_words_v1` and `vlx_review_state_v1` from the
  Save route.
- Create `vlx_review_events_v1` and `vlx_daily_stats_v1` only after a learner
  answers a review card.
- Keep Due, Weak, Strong, and Mastered derived from real review state.
- Keep public paid beta No-Go and private/manual beta owner-gated.

## Exact Webflow CTA Href Templates

Word page Save CTA:

```txt
https://app.visuallexicon.org/save?slug={slug}&source=word_page
```

Word page Recall/Quiz CTA:

```txt
https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page
```

Hub page Train Deck CTA:

```txt
https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page
```

Pack CTA, only when the Track B pack route already supports the pack id:

```txt
https://app.visuallexicon.org/packs/{packId}?source=hub_page
```

Current supported pack ids include `academic-vocabulary`, `core-v1`,
`home-v1`, `ielts-writing-vocabulary`, and `gre-visual-verbal`.

## Word Page Save CTA Snippet

Plain HTML anchor example:

```html
<a href="https://app.visuallexicon.org/save?slug={slug}&source=word_page">
  Save to Visual Lexicon
</a>
```

Replace `{slug}` with the canonical lower-case Track B word slug, for example
`dissonance`.

This snippet is a template only. It is not proof that production Webflow has
been updated.

## Word Page Recall/Quiz CTA Snippet

Plain HTML anchor example:

```html
<a href="https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page">
  Recall this word
</a>
```

Replace `{slug}` with the canonical lower-case Track B word slug, for example
`dissonance`.

This snippet is a template only. It is not proof that production Webflow has
been updated.

## Hub Page Train Deck CTA Snippet

Plain HTML anchor example:

```html
<a href="https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page">
  Train this deck
</a>
```

Replace `{hubSlug}` with the canonical Track B hub slug, for example
`academic-vocabulary`.

This snippet is a template only. It is not proof that production Webflow has
been updated.

## Pack CTA Snippet If Appropriate

Use this only when the public Webflow page maps to an existing Track B pack
detail route.

Plain HTML anchor example:

```html
<a href="https://app.visuallexicon.org/packs/{packId}?source=hub_page">
  Preview this pack
</a>
```

Replace `{packId}` with a supported Track B pack id, for example
`academic-vocabulary`. Do not invent pack ids for planned content.

This snippet is a template only. It is not proof that production Webflow has
been updated.

## Source Attribution Rules

Allowed public Webflow bridge sources:

- `word_page` for public word detail page CTAs.
- `hub_page` for public hub, deck, pack preview, or collection page CTAs.

Rules:

- `source` is an attribution label only.
- `source` is not an authorization signal.
- `source` does not grant paid access.
- `source` does not prove account ownership.
- `source` must not contain user identifiers, email addresses, selected text,
  referrer URLs, UTM payloads, billing state, CMS item ids, API tokens, or
  secrets.
- Existing saved-word source metadata may be preserved by Track B when a word
  has already been saved from another source.

## Slug Parity Checklist

Before applying or publishing Webflow CTA changes:

- Confirm the Webflow word slug matches a Track B app word slug.
- For Dissonance, confirm the slug is `dissonance`.
- Confirm `{slug}` is lower-case and hyphenated.
- Confirm `{slug}` is not a display word, definition, raw selected text, Webflow
  CMS item id, or private CMS field.
- Confirm `{hubSlug}` matches a Track B hub slug, for example
  `academic-vocabulary`.
- Confirm `{hubSlug}` is not a display label such as `Academic Vocabulary`.
- Confirm `{packId}` matches an existing Track B pack route before using the
  pack CTA.
- Confirm unknown slugs fail safely in Track B and are not published as primary
  CTAs until Track B data supports them.
- Confirm no CTA URL includes secrets, user data, billing state, entitlement
  claims, or tracking payloads.

## Manual Webflow Application Checklist

Use this checklist in Webflow preview first:

1. Record the previous CTA hrefs before changing Webflow.
2. Keep a pre-publish screenshot of each page and CTA state.
3. Pick one known word page, such as Dissonance.
4. Confirm the Webflow slug matches Track B app static/pack data.
5. Apply the Save CTA href template with the page slug.
6. Apply the Recall/Quiz CTA href template with the page slug.
7. Apply the hub Train Deck CTA href template only when the hub slug is known.
8. Apply the pack CTA href template only when the Track B pack route already
   supports the pack id.
9. Verify all updated CTAs in Webflow preview.
10. Publish only after preview QA passes.
11. Do not claim this PR changed Webflow production.
12. Do not use Webflow bulk CMS updates unless the owner separately approves a
    scoped production operation.

## Manual QA Checklist

Run this after applying CTAs in Webflow preview, and again after any separately
approved production publish:

1. Pick one Webflow word page such as Dissonance.
2. Confirm slug matches Track B app static/pack data.
3. Click Save CTA.
4. Confirm app route opens.
5. Confirm `vlx_saved_words_v1` contains the slug.
6. Confirm `vlx_review_state_v1` contains the slug.
7. Confirm no fake `vlx_review_events_v1` is created on save page load.
8. Confirm no fake `vlx_daily_stats_v1` is created on save page load.
9. Open `/review?mode=saved` and confirm review can start.
10. Open `/review?mode=due` and confirm due route works when due.
11. Open `/review?mode=word&slug=dissonance` and confirm focused review works.
12. Confirm Webflow production can be rolled back by restoring previous CTA
    hrefs.
13. Confirm public paid beta remains No-Go.
14. Confirm private/manual beta remains owner-gated candidate only.
15. Confirm no Webflow CMS item mass update happened unintentionally.
16. Confirm no DNS, Worker, payment, auth, or deployment setting changed.

## Rollback Checklist

Before changing Webflow:

- Record previous CTA hrefs before changing Webflow.
- Keep a pre-publish screenshot.

Before publishing:

- Publish only after preview QA.

If an app route fails:

- Restore previous CTA hrefs if app route fails.
- Verify no Webflow CMS item mass update happened unintentionally.
- Verify no DNS, Worker, payment, auth, or deployment setting changed.
- Re-run the Manual QA Checklist after rollback.
- Record the failed app URL, expected result, actual result, and rollback time.

## What Is Real Vs Planned

Real now:

- `docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md` exists.
- `docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md` exists.
- #182 verified the app-side bridge behavior.
- `/save?slug={slug}&source=word_page` is the approved app-side Save CTA
  template for known word slugs.
- `/review?mode=word&slug={slug}&source=word_page` is the approved focused
  word review template.
- `/review?mode=hub&hub={hubSlug}&source=hub_page` is the approved hub review
  template for known hub slugs.
- `/packs/{packId}?source=hub_page` is the approved pack template only for
  supported Track B pack ids.
- Save creates or preserves `vlx_saved_words_v1` and `vlx_review_state_v1`.
- Save page load must not create fake `vlx_review_events_v1` or fake
  `vlx_daily_stats_v1`.
- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated candidate only.

Planned, not live:

- Webflow production CTA application.
- Webflow production publish.
- Public paid beta.
- Private/manual beta launch.
- Account sync.
- Server-side SRS persistence.
- Billing, checkout, payment, subscription, invoice, billing portal, or real
  paid entitlement.
- Analytics SDK or tracking pixel.
- Chrome extension rewrite.
- AI Tutor or AI mistake explanation behavior.

## P0/P1/P2 Risk Summary

P0:

- Count: `0` for this documentation and test implementation kit.
- No Webflow production edit claim.
- No private beta launch claim.
- No public paid beta unblock claim.
- No payment, checkout, billing, auth, analytics SDK, tracking pixel, DNS,
  deployment setting, secret, production data, R2 production object, or real
  user data behavior is introduced.

P1:

- Manual Webflow implementation can still point to a wrong slug if slug parity
  is skipped.
- Webflow publish must remain a separate owner action after preview QA.
- Unknown Track A slugs remain safe failures until Track B data supports them.
- Pack CTAs must use only existing Track B pack ids.

P2:

- Consider exporting Webflow CMS slugs for an offline parity check before broad
  CTA rollout.
- Consider adding a small owner-owned Webflow preview evidence log.
- Consider future non-sensitive source attribution expansion only after privacy
  review.

## Safety Boundaries

Required safety assertions:

- `docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md` exists.
- `docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md` exists.
- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated candidate only.
- No Webflow production edit claim.
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

Explicit safety confirmation for this kit: no Webflow production edit,
Cloudflare Workers, auth, billing, payment, checkout, DNS, deployment settings,
secrets, production data, R2 production objects, real user data, payment SDK,
real entitlement, analytics SDK, tracking pixel, Chrome extension rewrite,
private beta launch claim, or public paid beta unblock.

`npm audit fix` must not be run for this kit.

## Future Implementation Plan

1. Keep this PR scoped to docs, tests, and README link.
2. Owner reviews this kit and the #182 bridge evidence.
3. Owner records existing Webflow CTA hrefs and screenshots.
4. Owner applies the href templates in Webflow preview only.
5. Owner verifies Dissonance end to end with the Manual QA Checklist.
6. Owner verifies one known hub CTA and one supported pack CTA if appropriate.
7. Owner publishes only after preview QA passes.
8. Owner restores previous CTA hrefs if any app route fails.
9. Track B keeps public paid beta No-Go until separate release gates pass.
10. Track B keeps private/manual beta owner-gated until separate owner approval.
