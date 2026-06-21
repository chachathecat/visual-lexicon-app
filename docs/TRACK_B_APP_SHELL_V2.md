# Track B App Shell V2

PR: `#73 Track B design tokens / app shell v2`  
Branch: `release/track-b-app-shell-v2`  
North Star Metric: **Weekly Reviewed Words**

## Purpose

This PR creates the reusable design foundation for the Track B learning app
rebuild. It prepares the next route PRs without rebuilding Dashboard, Review,
Saved, Packs, Pricing, or any paid access flow.

Track B should feel like a premium visual vocabulary learning app organized
around:

```txt
Today -> Save -> Review -> Queue -> Early Access
```

The product loop remains:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Added Foundation

Component entrypoint:

```txt
src/components/track-b/index.ts
```

Design token groups:

- spacing
- radius
- typography scale
- border
- shadow
- focus ring
- status tones for Due, Weak, New, Learning, Strong, and Mastered
- motion duration tokens

Reusable components:

- `TrackBAppShell`
- `TrackBPageHeader`
- `TrackBPrimaryActionCard`
- `TrackBMetricCard`
- `TrackBProgressBadge`
- `TrackBStatusBadge`
- `TrackBEmptyState`
- `TrackBSection`
- `TrackBBottomNav`
- `TrackBFocusPanel`
- `TrackBUpgradeNudge`

## Accessibility Contract

- The shell includes a keyboard skip link.
- Navigation uses desktop top navigation, mobile bottom navigation, semantic
  landmarks, and `aria-current` for the active item.
- Headings are semantic and controlled by component props where nesting matters.
- Focus styles are visible through namespaced `--vlx-track-b-focus-*` tokens.
- Status and progress components include text labels and ARIA labels, so meaning
  is not color-only.
- Reduced-motion defaults are covered by a scoped media query.

## Safety Boundary

This PR is additive foundation work only.

- No Dashboard rebuild.
- No Review Session rebuild.
- No Saved Library rebuild.
- No Packs rebuild.
- No Pricing or paywall rebuild.
- No payment, billing, subscription, checkout, invoice, billing portal, or
  entitlement logic.
- No API routes.
- No route handlers.
- No middleware.
- No database/provider SDK integrations.
- No auth changes.
- No environment variable changes.
- No production data mutation.
- No deployment changes.
- No Webflow, Cloudflare Workers, Vercel, DNS, or production setting changes.
- No fake mastery, fake streaks, or fake pack progress.

## Planned Integration

#74 should use this foundation to rebuild `/dashboard` around Today's Memory
Mission. The dashboard integration should keep:

- Due, Weak, and Mastered counts derived from real review state.
- Start Review pointed at due review when due words exist.
- Saved Queue subordinate to review behavior.
- No desktop left sidebar on Track B app routes.

If a route integration starts requiring new data contracts, paid access logic,
or SRS changes, keep it out of this PR and move it into the relevant future PR.

## Validation

Required commands for this PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```
