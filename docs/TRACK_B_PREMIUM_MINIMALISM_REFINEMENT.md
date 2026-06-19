# Track B Premium Minimalism Refinement

Branch: `release/track-b-premium-minimalism-refinement`

## Purpose

Refine Track B visual style toward warm premium minimalism while keeping the
current Track B v0 behavior, routes, SRS contracts, review answer flow, pricing
boundary, and local-storage contracts unchanged.

This is a visual refinement PR. It is not a feature PR, behavior PR, route
redesign PR, payment PR, auth PR, launch-readiness PR, SRS PR, or AI PR.

## Routes Covered

```txt
/dashboard
/save?slug=dissonance&source=word_page
/review
/saved
/pricing
```

## Refinement Summary

- `/dashboard`: Today’s Memory Mission is the central hero surface with more
  negative space, warmer salmon mist atmosphere, softer premium depth, and a
  stronger deep-coral primary CTA. Deferred queue-builder, weak, saved, and beta
  surfaces remain visually quieter.
- `/save`: The confirmation panel reads as a premium handoff into memory review.
  Required copy and CTA labels remain unchanged: `This word is now in your
  review queue.`, `Review now`, and `Go to dashboard`.
- `/review`: The recall session uses a calmer cinematic card, quieter borders,
  clearer answer hierarchy, and subtle salmon treatment for confidence and
  feedback surfaces. Answer, confidence, feedback, event write, and state update
  behavior are unchanged.
- `/saved`: Saved-word queue cards are warmer and less list-like. Tabs and
  secondary controls are quieter so the review queue cards carry the page.
- `/pricing`: Free/Lite/Pro cards use warmer premium surfaces and stronger
  outcome hierarchy. Pricing remains interest-only with no checkout or paid
  access.

## Implementation Notes

- Primary CTAs use deep coral through existing `.button--primary` and
  `.track-b-button--primary` classes.
- Salmon mist is used as controlled atmospheric surface treatment, not as small
  low-contrast text.
- Borders were reduced in visibility through token and route-surface changes.
- Typography and spacing were made calmer through Track B token refinement and
  targeted hero/card padding.
- No new routes, UI surfaces, storage keys, runtime integrations, providers, or
  product features were added.

## Safety Boundary

This refinement does not touch Webflow, Cloudflare Workers, Vercel/DNS/deployment
settings, auth, billing, payment, checkout, subscriptions, provider SDKs,
secrets, environment variables, production data, API routes, route handlers,
middleware, AI features, SRS logic, review answer logic, confidence logic,
review events, daily stats, pricing/payment behavior, or paid access.

Public paid beta remains **No-Go**.

## Validation

Required validation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
git diff --check
```

Manual QA should inspect the five covered routes on desktop and mobile, with
focus checks for dashboard primary CTA, save confirmation CTAs, review answer
choices and confidence buttons, saved-library tabs, and pricing interest
buttons.
