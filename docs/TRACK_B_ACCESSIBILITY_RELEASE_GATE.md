# Track B Accessibility Release Gate

Date: 2026-06-21

Scope: Figma-parity Track B core loop on `/dashboard`, `/save`, `/review`,
`/saved`, and `/pricing`.

Safety boundaries: no Webflow, Cloudflare Workers, auth, billing, payment, DNS,
deployment settings, secrets, API routes, middleware, production data, SRS
algorithms, or localStorage key contracts were changed.

## Result By Route

| Route | Result | Evidence |
| --- | --- | --- |
| `/dashboard` | PASS | Keyboard entry to review, one `main`, one `h1`, list semantics for due words, visible focus, 320px reflow, 200% zoom-equivalent reflow, mobile focus not obscured, target-size smoke. |
| `/save` | PASS | Save success uses one polite status region; error states use alerts; one `main`, one `h1`, useful visual cue name, target-size and reflow smoke. |
| `/review` | PASS | Keyboard-only answer, confidence, feedback, and summary flow passes; focus moves to feedback action and summary heading; correct/wrong/memory-state/session completion announcements use one status region. |
| `/saved` | PASS | Queue uses structured sections and list items, useful visual cue names, corrected action names, mobile bottom nav focus protection, target-size and reflow smoke. |
| `/pricing` | PASS | One `main`, one `h1`, tier cards in a named section, visible focus on CTA controls, target-size and reflow smoke. |

## WCAG 2.2 AA Checklist

| Area | Status | Notes |
| --- | --- | --- |
| Keyboard access | PASS | Dashboard to review to feedback to summary completes with Tab, Enter, and Space. No keyboard trap found in automated route flow. |
| Focus visible | PASS | Track B links/buttons have visible focus rings. Programmatic review focus anchors also show a visible focus state. |
| Focus order | PASS | Desktop starts with skip link, brand, and primary nav. Review state changes restore focus to the next logical control or heading. |
| Landmarks and headings | PASS | Each scoped route has one `main` and one `h1`; heading order does not skip levels in the automated contract. |
| Names, roles, values | PASS | Icon-only saved actions have accessible names; decorative icons are hidden; learning visuals expose useful image role names. |
| Status messages | PASS | Save, review answer feedback, memory-state update, loading/empty states, and session completion use `role=status` or `role=alert` without duplicate review announcements. |
| Reflow | PASS | Automated 320 CSS px and 200% zoom-equivalent smoke checks have no horizontal overflow. |
| Target size | PASS | Visible interactive controls meet at least 24 by 24 CSS px in the automated mobile smoke. |
| Contrast | PASS | Low-contrast taupe text and primary coral controls were darkened while preserving the approved composition. Correct/wrong states include text feedback, not color alone. |
| Reduced motion | PASS | Route-specific v2 classes are included in the `prefers-reduced-motion` transition reduction. |

## Automated Checks

Primary release-gate coverage:

```powershell
npm.cmd run test -- tests/track-b-accessibility-release-gate.spec.ts --workers=1
```

Covered assertions:

- keyboard-only dashboard to review to feedback to summary flow
- visible focus and desktop focus order
- mobile focus not obscured by the fixed bottom navigation
- save success polite live region
- correct and wrong review feedback announcements
- heading and landmark contracts for all scoped routes
- learning image accessible-name contracts
- 320px reflow smoke
- 200% zoom-equivalent reflow smoke
- reduced-motion smoke
- minimum interactive target dimensions

Figma parity remains covered by:

```powershell
npm.cmd run test -- tests/figma-parity-screenshots.spec.ts --workers=1
```

## Manual Checks

Run these before owner signoff:

1. With keyboard only, start at `/dashboard`, tab to "Start today's review",
   answer a card, choose confidence, move to summary, and return to dashboard.
2. At actual browser zoom 200%, inspect `/dashboard`, `/save?slug=dissonance`,
   `/review?mode=word&slug=dissonance&limit=1`, `/saved`, and `/pricing`.
3. At 320 CSS px, check no horizontal scrolling and that focused controls are
   not covered by the mobile bottom navigation.
4. Confirm focus indicators remain visible in Chromium, Firefox, and Safari or
   the closest available local browser set.
5. Confirm correct and wrong answer states are understandable when color is
   ignored.

## Human Screen-Reader Checks Still Required

Automated tests can confirm roles and live-region text, but not speech timing or
verbosity. A human should still run:

- NVDA plus Firefox or Chrome: `/dashboard` to `/review` to summary.
- VoiceOver plus Safari: `/save?slug=dissonance&source=word_page` and `/saved`.
- Mobile screen reader spot check: bottom navigation labels and focused review
  controls at 390px.
- Confirm the live announcements are not overly verbose when answer feedback
  appears.

## Known Limitations

- No new accessibility dependency such as axe was added; this gate uses existing
  Playwright infrastructure and explicit DOM/keyboard assertions.
- Automated 200% coverage uses the CSS-pixel viewport equivalent. Actual browser
  zoom is still listed as a manual signoff check.
- Human screen-reader testing is not replaced by this gate.
- The local MVP remains browser-local and uses the unchanged approved keys:
  `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, and
  `vlx_daily_stats_v1`.
