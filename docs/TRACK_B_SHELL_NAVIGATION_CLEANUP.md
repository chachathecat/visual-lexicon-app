# Track B Shell Navigation Cleanup

Branch: `release/track-b-shell-navigation-cleanup`

Scope: Track B app shell, navigation landmarks, skip-link order, and mobile
bottom-nav spacing only.

This is not a feature PR, visual polish PR, route change PR, pricing PR, or
launch-readiness PR.

## Cleanup Contract

- Track B v2 shell-owned routes bypass the legacy root `AppShell`.
- `/dashboard`, `/packs`, `/pricing`, `/review`, and `/saved` render one
  `TrackBAppShell`.
- V2 shell routes expose one `main` landmark.
- V2 shell routes expose one visible primary navigation at a time:
  desktop learning navigation on desktop, mobile bottom navigation on mobile.
- The Track B skip link is the first meaningful tab stop on v2 shell routes.
- Mobile bottom navigation reserves safe-area-aware bottom spacing so content
  and CTA areas are not hidden behind the fixed nav.

## Routes Checked

The shell cleanup keeps these existing routes accessible:

```txt
/
/dashboard
/save?slug=dissonance&source=word_page
/review
/saved
/pricing
```

The dashboard keeps one dominant CTA:

```txt
Review 5 words before they fade
```

The save confirmation keeps:

```txt
Review now
Go to dashboard
```

Pricing remains interest-only. No checkout, paid access, subscription, invoice,
billing portal, payment provider, entitlement mutation, account sync, or AI
feature is introduced.

## Implementation Notes

- `src/components/app-shell.tsx` remains the legacy shell for routes that do not
  own `TrackBAppShell`.
- V2 shell-owned route prefixes are explicitly listed in that component.
- `src/components/track-b/app-shell.tsx` remains the Track B shell owner for
  skip link, desktop learning navigation, mobile bottom navigation, and the main
  landmark.
- `src/app/globals.css` preserves the salmon/warm Track B token foundation and
  adds `--vlx-track-b-bottom-nav-reserved` for mobile safe spacing.

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

Follow-up completed by `docs/TRACK_B_REVIEW_SHELL_CONSISTENCY.md`: `/review`,
`/review/due`, `/review/weak`, and `/review/weak-sprint` move from the legacy
shell into `TrackBAppShell` without changing review behavior.
