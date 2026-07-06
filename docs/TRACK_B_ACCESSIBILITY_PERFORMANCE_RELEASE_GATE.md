# Track B Accessibility / Performance Release Gate

Date: 2026-07-06

Scope: Track B paid beta readiness gate for `/dashboard`, `/review`,
`/review/due`, `/review/weak`, `/saved`, `/packs`,
`/packs/academic-vocabulary`, `/pricing`, and `/settings`.

This is a release gate, not a product feature. Passing this gate does not unblock
public paid beta.

## Safety Boundary

This gate is limited to docs, tests, route smoke assertions, and safe local
accessibility/performance contracts for the Track B Next.js app.

Out of scope and untouched: Webflow, Cloudflare Workers, auth behavior, billing,
payment, checkout, DNS, deployment settings, secrets, production data, R2
production objects, real user data, payment SDKs, real entitlement behavior, and
public paid beta launch status.

## Route Coverage

| Route | Gate expectation |
| --- | --- |
| `/dashboard` | Today Memory Mission remains reachable, has one main landmark and h1, and exposes a named primary review CTA from real review state. |
| `/review` | Focus review starts from local saved/review state and exposes usable answer and confidence controls. |
| `/review/due` | Due review is selected from real `nextDueAt` state and is not blocked. |
| `/review/weak` | Weak review is selected from real Weak, wrong, or `weakScore` evidence and is not blocked. |
| `/saved` | Saved Library remains a memory queue with a named primary CTA and no fake Mastered count. |
| `/packs` | 30-day plan surface remains reachable and keeps named preview plan CTAs. |
| `/packs/academic-vocabulary` | Academic pack preview CTA remains accessible and tied to the existing safe review route. |
| `/pricing` | Outcome copy and public paid beta No-Go safety copy remain visible. |
| `/settings` | Local diagnostics remain reachable without adding payment, checkout, billing, or real entitlement behavior. |

## Accessibility Checks

| Check | Required evidence |
| --- | --- |
| Keyboard navigation | Existing accessibility gate covers dashboard to review to feedback to summary with keyboard only, plus desktop focus order and mobile bottom navigation focus protection. |
| Visible focus states | Existing gate checks focused controls expose visible outline or focus styling. New route smoke keeps the primary routes available for those checks. |
| Accessible names for primary CTAs | Release-gate spec asserts named dashboard, saved, pricing, packs, pack detail, review answer, and confidence controls using role/name queries. |
| Status and summary text for review state changes | Existing review gate verifies singular polite status regions and summary focus after review answers. This gate keeps review routes smoke-tested with real local state. |
| No inaccessible paywall prompt | Settings paywall prompt actions must expose named buttons, use status text after interest is recorded, and avoid granting plan state or paid access. |
| Mobile one-hand review ergonomics | Existing accessibility gate covers mobile focus not hidden by bottom navigation, target size, and 320px reflow. Manual QA should still confirm thumb reach on a real phone. |

## Performance Checks

| Check | Required evidence |
| --- | --- |
| Build must pass | `npm.cmd run build` is a required validation command. |
| Route smoke must pass | The release-gate spec checks every scoped route returns 200, has one main landmark, and has one h1. |
| No heavy new runtime dependency | Runtime dependencies stay on the approved allowlist in `package.json`; no new runtime package is introduced by this gate. |
| No blocked primary Track B route | The route smoke loop covers all required Track B routes before owner signoff. |
| No public paid beta safety regression | Pricing and paywall copy must keep No-Go, no checkout, no billing connected, and no real paid entitlement text visible. |

## Visual Screenshot Parity

Visual screenshot parity remains part of the release evidence. Do not update
baselines in this release-gate PR. Run:

```powershell
npm.cmd run test -- tests/figma-parity-screenshots.spec.ts --workers=1
```

The release-gate spec also checks that the parity spec still contains
`toHaveScreenshot` and that desktop/mobile snapshot baselines remain present.

## Automated Evidence

Primary gate:

```powershell
npm.cmd run test -- tests/track-b-accessibility-performance-release-gate.spec.ts --workers=1
```

Related gates:

```powershell
npm.cmd run test -- tests/track-b-accessibility-release-gate.spec.ts --workers=1
npm.cmd run test -- tests/track-b-performance-budget.spec.ts --workers=1
npm.cmd run test -- tests/figma-parity-screenshots.spec.ts --workers=1
```

Required release validation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/track-b-accessibility-performance-release-gate.spec.ts --workers=1
npm.cmd run test -- tests/pricing-paywall-v3-outcome-copy.spec.ts tests/packs-v3-30-day-plan-surface.spec.ts tests/saved-library-v3-memory-queue.spec.ts tests/review-mode-routes.spec.ts tests/review-state-regression.spec.ts --workers=1
```

## P0/P1/P2 Safety Summary

P0: Public paid beta remains blocked. No checkout, payment SDK, billing route,
real entitlement grant, production data mutation, or deployment setting change
is part of this gate.

P1: Primary learning routes must not be blocked. Due, Weak, and Mastered remain
derived from real review state; paywall prompts record local interest only.

P2: Accessibility and performance contracts stay deterministic in Playwright and
docs. Manual screen-reader and real-device mobile checks remain required before
owner signoff.

## Manual QA Notes

Run these before owner signoff:

1. Keyboard only: `/dashboard` to `/review/due`, answer one card, choose
   confidence, open summary, and return to dashboard.
2. Mobile: 390px viewport or real phone, verify answer options and confidence
   buttons are reachable with one hand and not hidden by bottom navigation.
3. Pricing: confirm public paid beta No-Go, no checkout, no billing connected,
   and no real paid entitlement copy remains visible.
4. Packs: confirm Academic preview CTA goes to the existing review route and
   does not imply full pack unlock.
5. Visual parity: run the Figma parity screenshot spec without updating
   snapshots.

## Explicit Safety Confirmation

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, or public paid beta unblock is included in
this release gate.
