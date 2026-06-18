# Track B Review Shell Consistency

Branch: `release/track-b-review-shell-consistency`

Scope: review route shell ownership, landmarks, navigation duplication, skip-link
order, and mobile bottom-navigation spacing only.

This is not a feature PR, visual polish PR, review behavior PR, route redesign
PR, pricing PR, or launch-readiness PR.

## Routes Covered

```txt
/review
/review/due
/review/weak
/review/weak-sprint
```

The routes still render the existing `ReviewSessionView` flow:

- `/review` keeps the focused recall session behavior.
- `/review/due` keeps due mode.
- `/review/weak` keeps weak mode.
- `/review/weak-sprint` keeps real weak-word selection and the safe empty state.

## Shell Contract

- Review routes bypass the legacy root `AppShell`.
- Review routes render one `TrackBAppShell`.
- Review routes expose one `main` landmark.
- Review routes expose no legacy `Primary` navigation.
- Desktop exposes the Track B learning navigation.
- Mobile exposes the Track B bottom navigation with safe-area-aware spacing.
- The Track B skip link remains the first meaningful tab stop.

## Behavior Contract

This cleanup does not change SRS logic, answer handling, confidence handling,
review-event writes, daily-stat writes, pack progress writes, paywall behavior,
pricing behavior, route parsing, or storage keys.

Confidence still appears before feedback, and the selected confidence still
persists on review events.

No new pack, pricing, alias search, beta log, checkout, payment, subscription,
AI, auth, account sync, route handler, middleware, or provider SDK surface is
introduced in the review flow.

## Tests

Coverage lives in:

```txt
tests/review-mode-routes.spec.ts
tests/track-b-app-shell-v2.spec.ts
```

The tests assert shell ownership, one main landmark, no duplicate legacy primary
navigation, first-tab skip-link order, mobile bottom spacing, direct due and
weak routes, weak sprint real-state behavior, safe weak-sprint empty state,
review-event writes, daily-stat writes, and confidence persistence.

## Safety

This cleanup does not touch Webflow, Cloudflare Workers, Vercel/DNS/deployment
settings, auth, billing, payments, checkout, subscriptions, provider SDKs,
secrets, env vars, production data, API routes, route handlers, middleware, or
AI features.

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

Recommended next PR: focused manual QA evidence for review routes on desktop
and mobile, with screenshots for skip link, one-main landmark, and the
weak-sprint real-state flow.
