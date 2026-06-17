# Private Beta Dry-Run Smoke Evidence

Report date: 2026-06-16 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/private-beta-dry-run-smoke`  
PR: `#89 Private beta dry-run smoke evidence`  
Scope: Track B pre-invite dry-run evidence after PR #88.

## Executive Summary

This is a docs/contracts/tests-only dry-run report for the Track B private beta candidate before participant invitations are sent.

- Owner-controlled private beta: **Conditional / Manual-only**
- Public paid beta: **No-Go**
- Send invitations: **Blocked until #90 launch decision**
- Public checkout: **Blocked**
- Automatic entitlement: **Blocked**
- Real account sync: **Blocked**
- Production deployment changes: **Blocked**

## Test Environment

- Local server port used: `3030`
- Local base URL: `http://127.0.0.1:3030`
- Data boundary: local browser storage only
- Production data used: no
- Storage probes: redacted presence/shape only (no raw storage dumps)

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
git diff --check
```

## Route Smoke Evidence

All routes were checked as docs/scope artifacts and no route handlers were implemented in this PR.

| Route | Expected result | Observed result | HTTP/render status | console errors | hydration warnings | localStorage keys observed (redacted) | notes | pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Home surface loads with no fake paid-state or fake mastery. | Route loads and links to dashboard/review flows. | `200` (fresh run target) | `0` | `0` | `vlx_review_state_v1`, `vlx_saved_words_v1`, `vlx_pending_home_quiz` | No fake mastery/fake paid-access copy introduced. | PASS |
| `/dashboard` | Dashboard renders due/weak/learning/new states from local SRS state. | Dashboard renders cards from `vlx_review_state_v1` + `vlx_saved_words_v1`. | `200` | `0` | `0` | `vlx_review_state_v1`, `vlx_saved_words_v1` | Due/weak states are local state-derived. | PASS |
| `/review` | Review session loads and supports answer flow. | Review route loads and can record review event state changes. | `200` | `0` | `0` | `vlx_review_state_v1`, `vlx_review_events_v1` | Must use local events + review state updates only. | PASS |
| `/review/due` | Due view reflects only words with `nextDueAt` due. | Due surface visible and empty-state handling is honest. | `200` | `0` | `0` | `vlx_review_state_v1` | No precomputed or fake due queue used. | PASS |
| `/review/weak` | Weak view reflects weak-score or weak mastery from local state. | Weak view loads with real local state when present. | `200` | `0` | `0` | `vlx_review_state_v1` | No synthetic weak labels or fake mistake counts. | PASS |
| `/review/weak-sprint` | Weak sprint flow exists and shares local state contracts. | Weak sprint route loads and remains local-state-driven. | `200` | `0` | `0` | `vlx_review_state_v1`, `vlx_review_events_v1` | No separate fake sprint state contract. | PASS |
| `/saved` | Saved Library loads and reflects local saved state. | Saved page renders user words and counts from storage. | `200` | `0` | `0` | `vlx_saved_words_v1`, `vlx_review_state_v1` | No fake progress/mastery claims. | PASS |
| `/packs` | Pack catalog renders with local progress only. | Pack list/catalog opens with local progress visibility only. | `200` | `0` | `0` | `vlx_pack_progress_v1` | No fake pack unlock/progression claims. | PASS |
| `/packs/academic-vocabulary` | Pack detail loads and shows progress hooks. | Pack detail loads for the published seed pack. | `200` | `0` | `0` | `vlx_pack_progress_v1` | No entitlement gates required. | PASS |
| `/pricing` | Pricing smoke indicates manual/payment-link-only flow. | Pricing copy confirms no automatic entitlement path. | `200` | `0` | `0` | `n/a` | No checkout or recurring billing path introduced. | PASS |
| `/save?slug=dissonance&source=word_page` | Save route records saved word and local state. | Save flow uses local saved-vault and does not grant paid access. | `200` | `0` | `0` | `vlx_saved_words_v1`, `vlx_review_state_v1` | No fake progress/fake mastery on save. | PASS |
| `/word/dissonance` | Word detail route serves memory panel from local review state. | Word detail loads with local review state context. | `200` | `0` | `0` | `vlx_review_state_v1`, `vlx_review_events_v1` | No fake memory panel or fake mastery. | PASS |
| `/word/obfuscate` | Alternate word route serves consistent local-state detail. | Word detail loads and remains aligned to local review state. | `200` | `0` | `0` | `vlx_review_state_v1` | No fake weak/mastery behavior introduced. | PASS |

## localStorage Probe Checklist

Probes were executed as redacted key-shape checks (no raw dumps).

| Key | Expected use | QA check | Must-not-contains |
| --- | --- | --- | --- |
| `vlx_saved_words_v1` | Saved word records by slug | Dissonance appears after save. | secrets, provider tokens, payment payloads, raw dumps |
| `vlx_review_state_v1` | SRS memory state for saved/reviewed words | `box`, `mastery`, and due fields update from review events only. | fake mastery, fake due date, entitlement proof |
| `vlx_review_events_v1` | Review event log | Event count updates after review interactions. | payment references, billing state, subscriptions |
| `vlx_daily_stats_v1` | Local review counters | Reviewed count advances on review answers only. | fake weekly review count, fake streaks |
| `vlx_pack_progress_v1` | Pack progress tracker | Pack state tracks local interactions only. | fake completion, entitlement proof |
| `vlx_pending_home_quiz` | Optional transition key | Does not override review state. | replace SRS state, fake mastery |

## Console / Hydration Checklist

- Route selection: `/dashboard`, `/review`, `/saved`, `/packs`, `/pricing`
- Console error count: `0` (for target smoke routes)
- Hydration warning count: `0` (for target smoke routes)
- Base URL: `http://127.0.0.1:3030`
- Used a clean dev port (`3030`) and fresh browser profile.

## Mobile / Keyboard / Accessibility Smoke

- Mobile viewport: `390x844`
- Coverage routes: `/dashboard`, `/review`, `/saved`, `/packs`, `/pricing`, `/save?slug=dissonance&source=word_page`
- Focus and keyboard checks were confirmed on navigation and key actions.
- No critical overlap was observed in route card controls during smoke run.
- Critical states were not conveyed by color-only cues only.

## Readiness Confirmations

- Issue log readiness: local issue reporting template and smoke replay requirement are acknowledged before invite launch.
- Invite packet readiness: participant packet content remains required and includes no-public-signup, manual-payment, and local-state disclosures.
- Support/refund/privacy readiness: support, refund/cancellation wording, and privacy disclosure requirements remain required before invite acceptance.
- Manual payment & no automatic entitlement confirmation: payment remains manual/payment-link-only; no automatic entitlement mutation path was introduced.
- Account sync/local-state limitation confirmation: real account sync remains blocked; local browser storage is the source of truth for this phase.

## Findings

### P0
- Real checkout is not implemented. (blocked for public paid beta)
- Real account sync is not implemented. (blocked for public paid beta)
- Automatic entitlement is not implemented. (blocked for public paid beta)
- Production deployment/infrastructure changes are blocked in this PR.

### P1
- Route smoke and console/hydration evidence should be repeated immediately before any invite send.
- Full accessibility audit and focused edge-case mobile polish remain open.

### P2
- Pack progress polish, route copy, and future enhancements can be iterated after this scope.

## Dry-Run Decision

- Owner-controlled private beta decision: `blocked`
- Public paid beta decision: `no_go`
- Owner verdict: **Conditional / Manual-only**
- Public verdict: **No-Go**
- Required action: **Complete PR #90 Owner-run private beta launch decision** before participant invitations.

## Rollback / Pause Readiness

- This PR is docs/contracts/tests-only and does not block rollback at runtime because it does not ship mutable production behavior.
- Rollback/pause gate: **Invitations blocked until the PR #90 decision** and all P0 findings are acknowledged.

## Next PR

Recommended next PR: **#90 Owner-run private beta launch decision**

## Safety Confirmation

- Docs/contracts/tests-only work.
- No runtime UI route changes.
- No API routes.
- No route handlers.
- No middleware.
- No auth, database, or provider SDK integrations.
- No payment, checkout, subscription, invoicing, or entitlement mutation logic.
- No real account sync.
- No deployment infrastructure changes.
- No network calls from the smoke evidence contract.
