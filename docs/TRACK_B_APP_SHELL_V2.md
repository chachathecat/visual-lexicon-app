# Track B App Shell V2

Branch: `feat/track-b-app-shell-v2`  
Draft PR title: `[Track B] Add app shell and design tokens v2`  
North Star Metric: **Weekly Reviewed Words**

## Purpose

This document defines the reusable UI foundation for the paid Track B learning
app. The foundation is intentionally small: shared design tokens, shell
structure, and presentation components that future route PRs can use without
changing SRS, auth, billing, Webflow, Cloudflare Workers, production data, or
deployment settings.

Track B should keep the learning loop visible:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

Baseline shell navigation stays ordered around:

```txt
Today -> Save -> Review -> Queue -> Early Access
```

## Visual Principles

- Calm and premium before decorative. The interface should feel warm, credible,
  quiet, and focused on repeat review behavior.
- Dashboard priority remains Today Memory Mission, then Start Review, Practice
  Weak Words, and Continue Deck. Saved Library supports the loop; it should not
  dominate the product.
- Due, Weak, Strong, and Mastered labels must be rendered from real review state
  in route work. Foundation components only display values passed to them.
- Visual meaning cannot depend on color alone. Badges, pills, and progress
  states include text labels.
- Button hierarchy is limited to primary, secondary, and quiet actions so route
  screens do not invent competing CTA styles.

## Design Tokens

The canonical token entrypoint is:

```txt
src/components/track-b/tokens.ts
```

Token groups:

- `spacing`
- `radius`
- `typography`
- `cardElevation`
- `buttonHierarchy`
- `focusStates`
- `mobileSpacing`
- existing compatibility groups: `border`, `shadow`, `focusRing`,
  `statusTones`, and `motion`

CSS variables live in `src/app/globals.css` under the `--vlx-track-b-*`
namespace. Do not create competing Track B token names in route files.

## Component Usage

Import components from the barrel:

```tsx
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MasteryBadge,
  MemoryMissionCard,
  MetricPill,
  PrimaryActionPanel,
  TrackBAppShell
} from "@/components/track-b";
```

Core components:

- `TrackBAppShell`: page shell with skip link, desktop learning navigation,
  mobile bottom navigation, and one `main` landmark.
- `MemoryMissionCard`: primary mission surface for due or weak review prompts.
  It renders only caller-provided counts and labels.
- `MetricPill`: compact metric display for real due, weak, saved, or progress
  values.
- `MasteryBadge`: display badge for the review-state mastery union:
  `New`, `Learning`, `Weak`, `Strong`, `Mastered`.
- `PrimaryActionPanel`: reusable high-priority action surface.
- `EmptyState`: empty queue or unavailable content state with optional actions.
- `LoadingState`: polite, busy state for client-side or route-level loading.
- `ErrorState`: alert state for recoverable UI failures.

Example:

```tsx
<TrackBAppShell activeItemId="today" currentPath="/dashboard">
  <MemoryMissionCard
    action={{ href: "/review/due", label: "Start review" }}
    body="Review the words most likely to fade before browsing saved words."
    eyebrow="Today's Memory Mission"
    metrics={[
      { label: "Due", value: dueCount, tone: "due" },
      { label: "Weak", value: weakCount, tone: "weak" }
    ]}
    status="due"
    title="Review due words"
  />
</TrackBAppShell>
```

## Accessibility Baseline

- The shell skip link is the first meaningful tab stop.
- Track B pages should render one `main` landmark.
- Navigation uses `aria-current="page"` for active destinations.
- Loading states use `role="status"`, `aria-live="polite"`, and
  `aria-busy="true"`.
- Error states use `role="alert"` only for visible recoverable failures.
- Focus styles must use `--vlx-track-b-focus-*` tokens and remain visible on
  keyboard navigation.
- Status and mastery components must include readable labels; do not use color
  as the only signal.

## Mobile Behavior

- Mobile spacing is controlled by `trackBDesignTokens.mobileSpacing` and
  `--vlx-track-b-mobile-*` CSS variables.
- The bottom navigation reserves space through
  `--vlx-track-b-bottom-nav-reserved` and accounts for
  `env(safe-area-inset-bottom, 0px)`.
- Mobile route content should not be hidden behind the bottom navigation.
- Primary action rows may wrap; labels must remain readable and should not
  overflow their buttons.
- Avoid new desktop sidebars on Track B routes. Keep desktop navigation at the
  top and mobile navigation at the bottom.

## Blocked Surfaces

This foundation PR must not include:

- Webflow publishing or Webflow CMS mutation.
- Cloudflare production Worker changes.
- Auth, login, account creation, session, or provider behavior changes.
- Billing, payment, checkout, subscription, invoice, or billing portal logic.
- DNS, deployment settings, secrets, environment variables, or production data.
- Real payment SDKs or production provider SDK integrations.
- New SRS storage keys or fake mastery, streak, pack progress, or dashboard
  metrics.
- Large Dashboard v2, Review Session v2, Saved Library v2, Packs v2, or Pricing
  rewrites.

## Validation

Required local checks:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```
