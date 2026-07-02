# Track B Component Foundation

This folder contains the additive app-shell v2 foundation for the paid Track B
learning app. Route work should import these primitives instead of introducing
new shell, badge, metric, action, loading, or error-state patterns.

## Exports

- `TrackBAppShell`
- `MemoryMissionCard`
- `MetricPill`
- `MasteryBadge`
- `PrimaryActionPanel`
- `EmptyState`
- `LoadingState`
- `ErrorState`
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
- `trackBDesignTokens`
- `trackBNavigationItems`
- `trackBAppShellV2Contract`

## Usage

```tsx
import {
  MemoryMissionCard,
  TrackBAppShell,
  TrackBPageHeader
} from "@/components/track-b";

export function DashboardV2Foundation() {
  return (
    <TrackBAppShell activeItemId="today">
      <TrackBPageHeader
        eyebrow="Today"
        title="Today's Memory Mission"
        description="Review the words most likely to fade before browsing the saved library."
      />
      <MemoryMissionCard
        action={{ href: "/review/due", label: "Start review" }}
        body="Due words should come from real review_state nextDueAt values."
        metrics={[{ label: "Due now", value: 0, tone: "due" }]}
        status="due"
        title="Review due words"
      />
    </TrackBAppShell>
  );
}
```

## Contracts

- Components are presentation primitives only.
- Upgrade nudges are visual only and do not implement entitlement logic.
- Status badges communicate text labels, not color alone.
- `MemoryMissionCard`, `MetricPill`, and `MasteryBadge` render caller-provided
  values; they do not calculate mastery or SRS state.
- Navigation follows `Today -> Save -> Review -> Queue -> Early Access`.
- Track B app routes use desktop top navigation and mobile bottom navigation,
  not a desktop left sidebar.
- Components do not read or write SRS state. Future route PRs must keep Due,
  Weak, Mastered, and progress derived from real review state.

## Accessibility

- The shell includes a skip link and semantic navigation landmarks.
- Page and section components use semantic headings.
- Interactive elements rely on links with visible focus styles from
  `src/app/globals.css`.
- Status and progress primitives expose textual labels and ARIA labels.
- Motion tokens exist for consistency, but defaults are reduced-motion friendly.

## Safety

This foundation does not add API routes, route handlers, middleware, auth,
payment, billing, database/provider SDKs, production data mutation, environment
variable changes, or deployment settings.
