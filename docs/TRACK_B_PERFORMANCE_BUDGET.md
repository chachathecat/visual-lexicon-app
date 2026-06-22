# Track B Performance Budget

Date: 2026-06-22

Scope: Track B routes `/dashboard`, `/save`, `/review`, `/saved`, and `/pricing`.

Safety boundary: This document and the related budget work stay local to the
Track B Next.js app, docs, and tests. Webflow, Cloudflare Workers, R2, Vercel,
DNS, auth, billing, payments, checkout, subscriptions, secrets, API routes,
middleware, production data, SRS algorithms, and production deployment settings
are out of scope.

## Baseline Before Code Changes

Baseline was recorded before Track B runtime code edits. The first build attempt
failed because the repository had no local `node_modules`, so `npm.cmd run build`
fell back to a parent install and Next inferred `C:\Users\jmg91` as the root.
After `npm.cmd ci` from the existing lockfile, the baseline production build
used the repo-local dependency tree and passed.

Command:

```powershell
npm.cmd run build
```

Result:

- Next.js: 14.2.35
- Production build: PASS
- Build output: compiled successfully, lint and type validity checked,
  generated 25 static pages, finalized page optimization, collected build traces.

### Baseline Route Sizes

| Route | Build mode | Size | First-load JS |
| --- | --- | ---: | ---: |
| `/` | Static | 6.18 kB | 111 kB |
| `/_not-found` | Static | 873 B | 88.2 kB |
| `/dashboard` | Static | 3.83 kB | 111 kB |
| `/packs` | Static | 182 B | 109 kB |
| `/packs/[packId]` | SSG | 181 B | 109 kB |
| `/pricing` | Static | 3.25 kB | 99.3 kB |
| `/review` | Dynamic | 149 B | 123 kB |
| `/review/due` | Static | 149 B | 123 kB |
| `/review/weak` | Static | 149 B | 123 kB |
| `/review/weak-sprint` | Static | 150 B | 123 kB |
| `/save` | Dynamic | 6.17 kB | 116 kB |
| `/saved` | Static | 3.77 kB | 111 kB |
| `/settings` | Static | 2.27 kB | 107 kB |
| `/word/[slug]` | SSG | 4.5 kB | 101 kB |

Shared first-load JS: 87.3 kB.

- `chunks/117-a5f7cb7a43194daa.js`: 31.7 kB
- `chunks/fd9d1056-0513bfa1d30c24ee.js`: 53.6 kB
- Other shared chunks: 1.95 kB

### Baseline CSS Assets

| Asset | Bytes | KB |
| --- | ---: | ---: |
| `.next/static/css/9cb95647db3f95ae.css` | 79,733 | 77.86 |

### Baseline Local Word Visual Assets

| Asset | Bytes | KB | Budget |
| --- | ---: | ---: | --- |
| `public/vlx-word-visuals/lucid.png` | 355,604 | 347.27 | PASS under 500 KB |
| `public/vlx-word-visuals/dissonance.png` | 156,298 | 152.63 | PASS under 500 KB |
| `public/vlx-word-visuals/obfuscate.png` | 147,342 | 143.89 | PASS under 500 KB |
| `public/vlx-word-visuals/abundance.png` | 98,129 | 95.83 | PASS under 500 KB |
| `public/vlx-word-visuals/resilient.png` | 55,561 | 54.26 | PASS under 500 KB |

### Baseline Font Loading

- `src/app/globals.css` starts with a Google Fonts `@import` for Fraunces and
  Plus Jakarta Sans.
- Browser requests on `/dashboard` include one remote Google Fonts CSS
  stylesheet and two remote `https://fonts.gstatic.com/...woff2` font files.
- The app does not use `next/font` in the baseline.
- `font-family` declarations reference `"Plus Jakarta Sans"` for body text and
  `"Fraunces"` for display headings.
- Risk: remote CSS is render-blocking and can contribute to font-driven layout
  shift. These are local laboratory observations only, not field Core Web
  Vitals.

### Baseline Image Loading

- `src/components/word-visual-image.tsx` uses `next/image` with `fill`,
  `loading="eager"`, `unoptimized`, and caller-provided `sizes`.
- Local word visuals are resolved from `src/lib/word-visuals.ts` and served from
  `public/vlx-word-visuals/*`.
- The clean-state core routes loaded no `<img>` elements in the local browser
  resource pass.
- When words are present, visual images render inside stable containers:
  review and save cards use aspect-ratio, queue thumbnails use fixed width and
  min-height, and the base `.word-card__visual` has `position: relative` and a
  minimum height.
- Risk: every local word visual instance is eager in the baseline, including
  below-the-fold queue and summary thumbnails. This can cause avoidable image
  requests when saved/review state contains several words.

### Baseline Client Component Counts

Counts include the root layout graph because `src/app/layout.tsx` imports the
client `AppShell`.

| Route | Client modules | Modules |
| --- | ---: | --- |
| `/dashboard` | 3 | `src/components/app-shell.tsx`, `src/components/navigation.tsx`, `src/components/views/dashboard-v2-view.tsx` |
| `/save` | 4 | `src/components/app-shell.tsx`, `src/components/navigation.tsx`, `src/components/paywall-prompt.tsx`, `src/components/views/save-landing-view.tsx` |
| `/review` | 4 | `src/components/app-shell.tsx`, `src/components/navigation.tsx`, `src/components/paywall-prompt.tsx`, `src/components/views/review-session-view.tsx` |
| `/saved` | 3 | `src/components/app-shell.tsx`, `src/components/navigation.tsx`, `src/components/views/saved-library-view.tsx` |
| `/pricing` | 3 | `src/components/app-shell.tsx`, `src/components/navigation.tsx`, `src/components/upgrade-placeholder-button.tsx` |

### Baseline Browser Resource Counts

Method: production build served by `next start` on `127.0.0.1:3006`, fresh
Playwright Chromium context per route and viewport, clean local state. These are
local laboratory observations, not field Core Web Vitals.

| Viewport | Route | Total requests | Breakdown | Horizontal overflow |
| --- | --- | ---: | --- | --- |
| Desktop 1440px | `/dashboard` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Desktop 1440px | `/save` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Desktop 1440px | `/review` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Desktop 1440px | `/saved` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Desktop 1440px | `/pricing` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Mobile 390px | `/dashboard` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Mobile 390px | `/save` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Mobile 390px | `/review` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Mobile 390px | `/saved` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |
| Mobile 390px | `/pricing` | 10 | 1 document, 2 stylesheets, 5 scripts, 2 fonts | No |

Example `/dashboard` resource URLs include the route document, `app/layout.css`,
the Google Fonts stylesheet, two Google font files, and five Next.js scripts:
`webpack.js`, `main-app.js`, `app-pages-internals.js`, `app/layout.js`, and
`app/dashboard/page.js`.

### Baseline Layout-Shift Sources

Obvious candidates found by source and local browser inspection:

- Remote font stylesheet and font files can shift text when fonts swap in.
- Several core views render honest loading or empty states before reading
  localStorage in `useEffect`, so local-state content can replace the initial
  client render after hydration.
- Word visual containers have stable dimensions, but the shared image component
  eagerly loads all instances.
- Clean-state `/dashboard`, `/save`, `/review`, `/saved`, and `/pricing` had no
  horizontal overflow at 390px in the local browser pass.

### Baseline Duplicate Or Dead CSS Candidates

These are candidates only. No dead CSS was removed before evidence was gathered.

- Legacy non-Track-B shell classes such as `.app-shell`, `.sidebar`,
  `.nav-list`, `.brand`, and `.app-main` are still referenced by the root
  `AppShell` for non-Track-B routes, so they are not dead.
- The older visual fallback classes and newer Figma-era visual classes both
  define `.word-card__visual--dissonance`, `.word-card__visual--abundance`,
  `.word-card__visual--resilient`, `.word-card__visual--obfuscate`, and
  `.word-card__visual--lucid`. These need targeted verification before removal.
- `globals.css` contains repeated responsive overrides for current Track B
  classes. Some are expected media-query overrides, not dead code by themselves.

## Deterministic Budgets

These budgets are suitable for CI because they inspect repository contracts or
stable DOM behavior. They intentionally avoid flaky millisecond timing gates.

| Budget | Gate |
| --- | --- |
| Local word visual size | No file in `public/vlx-word-visuals` may exceed 500 KB. |
| Approved local word visual location | Runtime source may not introduce unexpected `/vlx-word-visuals/*` paths outside the approved manifest. |
| Image layout stability | Local word visuals must use explicit intrinsic dimensions or a stable `fill` container with width/height or aspect ratio. |
| Font loading | Track B CSS must not include a remote render-blocking font stylesheet. |
| Mobile width | Core routes must not horizontally overflow at 320px. |
| Figma parity | Existing screenshot parity tests must pass without blindly updating baselines. |
| Accessibility | Existing approved accessibility release-gate tests must pass. |

## Laboratory Observations

Local browser request counts, local horizontal-overflow checks, local build
sizes, and local image inventories are laboratory observations. They are useful
for regressions but do not prove production LCP, CLS, INP, TTFB, or field Core
Web Vitals.

## Field Metrics Still Unverified

The following require real-user monitoring after deployment:

- LCP by route and viewport.
- INP for review answer selection, confidence submission, and next-card flow.
- CLS from real network font and image behavior.
- Route-level error rate and slow-session distribution.
- Device, connection, and browser segmentation.

## Changes Made

- Replaced the render-blocking Google Fonts CSS `@import` with direct
  `@font-face` declarations for the same Latin Fraunces and Plus Jakarta Sans
  font files. This removes the remote stylesheet request without adding font
  binaries to the repository or introducing a build-time font download.
- Updated `WordVisualImage` so local word visuals are lazy by default.
- Marked only the large save confirmation visual and active review-card visual
  as priority images.
- Disabled automatic Next.js route prefetch on persistent Track B navigation and
  visible core CTA links where preloading is not required for the current task.
- Reduced redundant localStorage reads in the save confirmation path.
- Added review-session click guards to prevent rapid duplicate confidence
  submissions and duplicate next-card actions before React rerenders.
- Added `tests/track-b-performance-budget.spec.ts` for deterministic repository
  and DOM budgets.

## After Measurements

Command:

```powershell
npm.cmd run build
```

Result:

- Next.js: 14.2.35
- Production build: PASS
- Build output: compiled successfully, lint and type validity checked,
  generated 25 static pages, finalized page optimization, collected build traces.

### After Route Sizes

| Route | Build mode | Baseline size | After size | Baseline first-load JS | After first-load JS |
| --- | --- | ---: | ---: | ---: | ---: |
| `/` | Static | 6.18 kB | 6.18 kB | 111 kB | 111 kB |
| `/_not-found` | Static | 873 B | 873 B | 88.2 kB | 88.2 kB |
| `/dashboard` | Static | 3.83 kB | 3.86 kB | 111 kB | 111 kB |
| `/packs` | Static | 182 B | 182 B | 109 kB | 109 kB |
| `/packs/[packId]` | SSG | 181 B | 181 B | 109 kB | 109 kB |
| `/pricing` | Static | 3.25 kB | 3.25 kB | 99.3 kB | 99.3 kB |
| `/review` | Dynamic | 149 B | 149 B | 123 kB | 123 kB |
| `/review/due` | Static | 149 B | 149 B | 123 kB | 123 kB |
| `/review/weak` | Static | 149 B | 149 B | 123 kB | 123 kB |
| `/review/weak-sprint` | Static | 150 B | 150 B | 123 kB | 123 kB |
| `/save` | Dynamic | 6.17 kB | 6.2 kB | 116 kB | 116 kB |
| `/saved` | Static | 3.77 kB | 3.81 kB | 111 kB | 111 kB |
| `/settings` | Static | 2.27 kB | 2.27 kB | 107 kB | 107 kB |
| `/word/[slug]` | SSG | 4.5 kB | 4.5 kB | 101 kB | 101 kB |

Shared first-load JS remains 87.3 kB.

### After CSS Assets

| Asset | Baseline bytes | After bytes | Baseline KB | After KB |
| --- | ---: | ---: | ---: | ---: |
| Built app CSS | 79,733 | 81,062 | 77.86 | 79.16 |

The CSS grew by 1,329 bytes because the font-face declarations now live in app
CSS instead of loading a remote Google stylesheet. The browser stylesheet request
count dropped from two to one on clean-state core-route loads.

### After Local Word Visual Assets

No local word visual files changed.

| Asset | Bytes | KB | Budget |
| --- | ---: | ---: | --- |
| `public/vlx-word-visuals/lucid.png` | 355,604 | 347.27 | PASS under 500 KB |
| `public/vlx-word-visuals/dissonance.png` | 156,298 | 152.63 | PASS under 500 KB |
| `public/vlx-word-visuals/obfuscate.png` | 147,342 | 143.89 | PASS under 500 KB |
| `public/vlx-word-visuals/abundance.png` | 98,129 | 95.83 | PASS under 500 KB |
| `public/vlx-word-visuals/resilient.png` | 55,561 | 54.26 | PASS under 500 KB |

### After Font Loading

- No Google Fonts stylesheet endpoint is requested.
- Clean-state core-route browser passes request one app stylesheet and two
  `fonts.gstatic.com` font files.
- No font binaries were added to the repository.
- No build-time font download was added.

### After Image Loading

- `WordVisualImage` defaults to lazy loading.
- Save confirmation and active review-card visuals use priority loading because
  they are the large above-the-fold learning visuals.
- Dashboard due thumbnails, saved queue thumbnails, and review summary
  thumbnails remain stable in fixed or aspect-ratio containers and lazy-load.
- Budget tests verify rendered local images use approved `/vlx-word-visuals/*`
  assets, not CDN word images, for seeded core Track B routes.

### After Browser Resource Counts

Method: production build served by `next start` on `127.0.0.1:3006`, fresh
Playwright Chromium context per route and viewport, clean local state. These are
local laboratory observations, not field Core Web Vitals.

| Viewport | Route | Total requests | Breakdown | Horizontal overflow |
| --- | --- | ---: | --- | --- |
| Desktop 1440px | `/dashboard` | 14 | 1 document, 1 stylesheet, 10 scripts, 2 fonts | No |
| Desktop 1440px | `/save` | 17 | 1 document, 1 stylesheet, 12 scripts, 1 fetch, 2 fonts | No |
| Desktop 1440px | `/review` | 16 | 1 document, 1 stylesheet, 12 scripts, 2 fonts | No |
| Desktop 1440px | `/saved` | 16 | 1 document, 1 stylesheet, 11 scripts, 1 fetch, 2 fonts | No |
| Desktop 1440px | `/pricing` | 11 | 1 document, 1 stylesheet, 7 scripts, 2 fonts | No |
| Mobile 390px | `/dashboard` | 14 | 1 document, 1 stylesheet, 10 scripts, 2 fonts | No |
| Mobile 390px | `/save` | 17 | 1 document, 1 stylesheet, 12 scripts, 1 fetch, 2 fonts | No |
| Mobile 390px | `/review` | 16 | 1 document, 1 stylesheet, 12 scripts, 2 fonts | No |
| Mobile 390px | `/saved` | 16 | 1 document, 1 stylesheet, 11 scripts, 1 fetch, 2 fonts | No |
| Mobile 390px | `/pricing` | 11 | 1 document, 1 stylesheet, 7 scripts, 2 fonts | No |

The local browser pass confirms the remote font stylesheet was removed. The
route-request totals remain laboratory-only because they include framework chunk
loading behavior and can vary with production chunking, link visibility, and
prefetch policy.

## Automated Budget Test

Added:

```txt
tests/track-b-performance-budget.spec.ts
```

The spec enforces:

- Local word visuals stay under 500 KB.
- Only approved local visual files exist in `public/vlx-word-visuals`.
- `src/lib/word-visuals.ts` references only approved `/vlx-word-visuals/*`
  assets.
- `globals.css` does not contain a render-blocking Google Fonts stylesheet
  import.
- Browser loads do not request a Google Fonts stylesheet endpoint.
- Seeded core routes render approved local word visuals in stable boxes.
- Only active above-the-fold review visuals are priority images, while saved
  queue thumbnails are lazy.
- Core routes do not horizontally overflow at 320px.
- Rapid duplicate confidence clicks create only one review event.
- Figma screenshot and accessibility release-gate specs remain wired for the
  required separate validation commands.

## Route Results

| Route | Result | Notes |
| --- | --- | --- |
| `/dashboard` | PASS | Build budget recorded, no remote font stylesheet, no 320px horizontal overflow, seeded local visuals use approved assets, Figma parity passed, accessibility gate passed. |
| `/save` | PASS | Build budget recorded, no remote font stylesheet, no 320px horizontal overflow, save visual is priority only for the above-the-fold confirmation card, Figma parity passed, accessibility gate passed. |
| `/review` | PASS | Build budget recorded, no remote font stylesheet, no 320px horizontal overflow, active review visual is priority, duplicate confidence clicks create one review event, Figma parity passed, accessibility gate passed. |
| `/saved` | PASS | Build budget recorded, no remote font stylesheet, no 320px horizontal overflow, queue thumbnails lazy-load from approved local visuals, Figma parity passed, accessibility gate passed. |
| `/pricing` | PASS | Build budget recorded, no remote font stylesheet, no 320px horizontal overflow, Figma parity passed, accessibility gate passed. |

No route is blocked by the deterministic budget. Field Core Web Vitals remain
unverified until real-user monitoring exists.

## Recommended Real-User Monitoring Contract

Future production monitoring should collect route, viewport class, connection
class, browser, LCP, CLS, INP, TTFB, hydration or client error signal, and
whether a review answer was submitted. It must not collect raw localStorage
values, answers beyond approved event labels, secrets, auth tokens, payment
data, or production user private data.
