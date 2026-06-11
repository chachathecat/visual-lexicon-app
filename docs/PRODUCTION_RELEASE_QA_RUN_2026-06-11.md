# Production Release QA Run 2026-06-11

Date: 2026-06-11

Branch: `release/production-release-qa`

Commit: fill after commit creation.

Scope: Documentation-only release QA package for Visual Lexicon Track B. This
run does not deploy, change runtime behavior, change Vercel settings, change
DNS, touch Webflow, touch Cloudflare Workers, add environment variables, add
secrets, add auth runtime, add billing runtime, add analytics SDKs, or mutate
production data.

## Validation Commands

Run from the repository root:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

## Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run typecheck` | Passed | Initial attempt failed because `node_modules` was absent and `tsc` was unavailable; after `npm.cmd install`, `tsc --noEmit` passed. |
| `npm.cmd run lint` | Passed | `next lint` completed with no ESLint warnings or errors. |
| `npm.cmd run build` | Passed | `next build` compiled successfully and generated the current app routes. |
| `npm.cmd run test -- --workers=1` | Passed | Playwright reported 81 passed and 1 skipped across 82 tests. |

## Automated QA Summary

Automated QA for this PR should confirm that the documentation-only package did
not break the current app build or tests.

Result: passed after installing locked dependencies with `npm.cmd install`.
`npm.cmd install` reported existing audit warnings; `npm audit fix` was not run.
The Playwright run also emitted a `vlx-pack-reader` warning for the
`missing-route-word` safe-missing-pack fixture, but the suite passed.

Expected coverage from the full Playwright command:

- Save creates or preserves local saved words and review state.
- Review answers create events and update SRS state.
- Dashboard, Saved Library, Word Detail, Due, Weak, Weak Sprint, Packs,
  Pricing, Paywall, Entitlement skeleton, Analytics events, and multilingual
  alias contracts still pass their existing checks.
- No checkout, payment SDK, billing route, auth runtime, or analytics network
  integration is introduced.

## Manual QA Checklist Template

Use this template for any local, staging, or production QA pass.

| Check | Result | Notes |
| --- | --- | --- |
| Fresh browser opens `/dashboard` without fake saved/review counts. | Not run in this docs PR |  |
| Save a known word and confirm local saved/review state is created. | Not run in this docs PR |  |
| Complete a review answer and confirm event/state/stats writes. | Not run in this docs PR |  |
| Create a weak word and confirm weak review uses real weak state. | Not run in this docs PR |  |
| Start a pack preview and confirm progress is not faked. | Not run in this docs PR |  |
| Open pricing and confirm no real checkout starts. | Not run in this docs PR |  |
| Confirm settings do not claim real auth, sync, or billing management. | Not run in this docs PR |  |
| Confirm no deployment, DNS, Webflow, or Cloudflare changes occurred. | Not run in this docs PR |  |

## Route Checks

| Route | QA expectation | Run status |
| --- | --- | --- |
| `/` | Loads app shell/dashboard and does not fake memory metrics. | Template only |
| `/dashboard` | Counts and mission derive from local SRS state. | Template only |
| `/saved` | Saved library reads local saved/review/event state. | Template only |
| `/save?slug=dissonance&source=word_page` | Creates or preserves saved word and review state. | Template only |
| `/save?slug=lucid&source=extension` | Records extension source without private extension data. | Template only |
| `/save?slug=obfuscate&source=alias_search` | Records alias-search source for canonical slug. | Template only |
| `/review` | Answers append events and update state/stats. | Template only |
| `/review/due` | Due queue derives from real due state. | Template only |
| `/review/weak` | Weak queue derives from real weak state. | Template only |
| `/review/weak-sprint` | Weak sprint uses real weak items and writes events. | Template only |
| `/packs` | Pack catalog does not fake paid-pack readiness. | Template only |
| `/packs/academic-vocabulary` | Pack preview progress derives from actual actions. | Template only |
| `/word/dissonance` | Memory panel reads local SRS state, not static content. | Template only |
| `/pricing` | No checkout, subscription, invoice, billing portal, or SDK. | Template only |
| `/settings` | No real auth, account recovery, or billing-management claims. | Template only |

## Storage Checks

| Key | Expected behavior | Run status |
| --- | --- | --- |
| `vlx_saved_words_v1` | Save writes saved record keyed by slug. | Template only |
| `vlx_review_state_v1` | Save creates initial state and review updates it. | Template only |
| `vlx_review_events_v1` | Each answered review appends an event. | Template only |
| `vlx_daily_stats_v1` | Review completion updates local daily stats. | Template only |
| `vlx_pack_progress_v1` | Pack preview progress reflects actual preview/review actions. | Template only |
| `vlx_plan_state_v1` | Local-only plan preview; not proof of payment. | Template only |
| `vlx_upgrade_interest_v1` | Interest signal only; not entitlement. | Template only |

## No-Fake-Mastery Checks

- A saved-only word must show `New` and box `0`, not Mastered.
- One fast correct answer must not create a production mastery claim unless the
  delayed-recall rule is satisfied by real review state.
- Dashboard, Saved Library, Word Detail, Due, Weak, and Mastered counts must
  derive from review state.
- Pack progress must derive from preview/review actions, not page views or
  marketing copy.

Run status: template only for manual QA in this docs PR.

## No-Accidental-Auth Checks

- No sign-in, sign-up, password recovery, magic link, session refresh, or
  account settings runtime was added.
- No auth provider SDK, account API route, database migration, or account-owned
  production state was added.
- UI copy must not claim cross-device sync or account recovery is live.

Run status: documentation review only.

## No-Accidental-Checkout Checks

- No checkout route, billing route, payment SDK, payment link, subscription
  creation, invoice behavior, or billing portal behavior was added.
- Pricing and paywall surfaces remain local interest or placeholder flows.
- No payment credentials are requested.

Run status: documentation review only.

## No-Accidental-Production-Billing Checks

- `vlx_plan_state_v1` remains local preview state only.
- `vlx_upgrade_interest_v1` remains a lead signal only.
- No server entitlement snapshot, webhook handler, provider customer record, or
  subscription state was implemented by this PR.
- No claim is made that production billing is ready.

Run status: documentation review only.

## No-Deployment Checks

- No Vercel setting was changed.
- No deployment command was run.
- No DNS record was changed.
- No Webflow or Cloudflare production Worker change was made.
- No environment variable or secret was added, removed, renamed, or populated.
- No production data was mutated.

Run status: documentation review only.

## Final Decision

No-Go for production paid SaaS.

Go only for continued local/private no-payment beta planning.

Proceed to #47 Public paid launch decision as a documented No-Go / Not Yet
decision unless the P0 systems are later implemented and verified.
