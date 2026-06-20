# Track B Core Surface Visual Polish

Branch: `release/track-b-core-surface-visual-polish`

## Purpose

Apply focused visual polish to Track B core learning surfaces using the existing
salmon, coral, and warm premium token foundation.

This is a visual polish PR. It is not a feature PR, behavior PR, route redesign
PR, pricing PR, launch-readiness PR, or SRS logic PR.

## Routes Covered

```txt
/dashboard
/save?slug=dissonance&source=word_page
/review
/saved
/pricing
```

## Polish Summary

- `/dashboard`: Today Memory Mission is the warm dominant surface. The primary
  CTA remains `Review 5 words before they fade`; supporting stats remain Due,
  Weak, New, and Reviewed this week. Deferred pack, weak, saved, and pricing
  surfaces remain visually secondary.
- `/save`: The save confirmation reads as a warm review-queue handoff. The
  required confirmation copy and actions remain in place: `This word is now in
  your review queue.`, `Review now`, and `Go to dashboard`.
- `/review`: The active recall card, answer choices, confidence prompt,
  feedback panel, next-card action, and summary keep the same flow while the
  visual treatment is calmer and more premium.
- `/saved`: Saved words read as review queue cards rather than bookmarks.
  Filters and tabs remain secondary, and queue card readability is improved.
- `/pricing`: Pricing cards lead with memory outcomes. Lite remains the daily
  memory habit, Pro remains weak-word repair and exam prep, and all upgrade
  behavior remains interest-only.

## Implementation Notes

- Uses existing CSS variables from `src/app/globals.css`, especially
  `--vlx-track-b-coral-deep`, `--vlx-track-b-salmon-mist`,
  `--vlx-track-b-surface`, and warm border/shadow tokens.
- Keeps light salmon as decorative background treatment only.
- Keeps deep coral for accessible primary CTA, focus, and accent states.
- Does not add routes, route groups, product features, AI features, checkout,
  billing, subscriptions, auth, API routes, route handlers, middleware, or new
  storage keys.
- Does not change SRS logic, review answer logic, confidence handling, review
  events, daily stats, pack progress, paywall evaluation, or pricing behavior.

## Safety Boundary

This PR does not touch Webflow, Cloudflare Workers, Vercel/DNS/deployment
settings, auth, billing, payment, checkout, subscription, provider SDKs,
secrets, environment variables, production data, API routes, route handlers,
middleware, AI features, pricing/payment behavior, or app routes.

Public paid beta remains **No-Go**. Private beta remains
owner-controlled/manual-only/conditional. External participant validation
remains **Not Started**.

## Validation

Required validation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
git diff --check
```

Manual QA should cover the five routes above on desktop and mobile, with focus
checks for primary CTAs, saved-library tabs, review answer choices, and upgrade
interest buttons.
