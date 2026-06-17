# Track B Owner Local Smoke After Simplification

This document records the owner-controlled local smoke path after the Track B v0
simplification sequence.

This is a QA record only. It does not implement runtime UI, route handlers,
middleware, API routes, auth, payment, checkout, subscription, provider SDKs,
secrets, env vars, production data writes, Webflow, Cloudflare Workers, Vercel
settings, DNS, deployment settings, or AI features.

## Run Summary

| Field | Value |
| --- | --- |
| Date of run | 2026-06-17 |
| Repository | `chachathecat/visual-lexicon-app` |
| Branch | `release/owner-local-smoke-after-simplification` |
| Local base URL used | `http://127.0.0.1:3007` |
| Primary route path | Save -> Review -> Memory state -> Return tomorrow |
| Smoke result | Pass after `/save` copy and CTA labels were corrected in this PR. |

Port note: `http://127.0.0.1:3006` was already occupied by another local
Next.js process from `visual-lexicon-app-dashboard-v0` and returned 404 for this
worktree's `/dashboard`. This run used `3007` for the current worktree.

## Commands Run

Smoke setup and route checks:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:3006/dashboard" -UseBasicParsing -TimeoutSec 15
node node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 3007
Invoke-WebRequest -Uri "http://127.0.0.1:3007/dashboard" -UseBasicParsing -TimeoutSec 30
node - <owner smoke Playwright script against http://127.0.0.1:3007>
```

Validation commands requested for this PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/track-b-owner-local-smoke.spec.ts --workers=1
npm.cmd run test -- tests/mvp-smoke.spec.ts tests/review-mode-routes.spec.ts tests/saved-library.spec.ts tests/paywall-surfaces.spec.ts tests/dashboard-v2.spec.ts --workers=1
git diff --check
```

Validation results:

| Command | Result |
| --- | --- |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run lint` | Passed. |
| `npm.cmd run build` | Passed. |
| `npm.cmd run test -- tests/track-b-owner-local-smoke.spec.ts --workers=1` | Passed: 3 tests. |
| `npm.cmd run test -- tests/mvp-smoke.spec.ts tests/review-mode-routes.spec.ts tests/saved-library.spec.ts tests/paywall-surfaces.spec.ts tests/dashboard-v2.spec.ts --workers=1` | Timed out after about 422 seconds when run exactly as listed because the default `3006` server was still occupied by another local worktree. Partial output showed multiple browser failures against that wrong server. |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3007 npm.cmd run test -- tests/mvp-smoke.spec.ts tests/review-mode-routes.spec.ts tests/saved-library.spec.ts tests/paywall-surfaces.spec.ts tests/dashboard-v2.spec.ts --workers=1` | Completed against this worktree: 55 passed, 1 skipped, 1 failed. The remaining failure was `dashboard-v2.spec.ts` supporting-stats assertion expecting `Due`, `Weak`, `New`, and `Reviewed this week` labels from `.track-b-metric-card`; this was outside the `/save` blocker fix scope. |
| `git diff --check` | Passed. Git emitted line-ending warnings for `README.md`, `src/components/views/save-landing-view.tsx`, and `tests/mvp-smoke.spec.ts`: `LF will be replaced by CRLF the next time Git touches it`. |

## Browser Route Checklist

| Step | Route / action | Expected result | Actual result |
| --- | --- | --- | --- |
| 1 | Start local dev server | App serves locally for owner smoke. | Passed on `http://127.0.0.1:3007`. `3006` was occupied by another local worktree. |
| 2 | Open `/save?slug=dissonance&source=word_page` | Save route loads and creates or preserves local review state. | Passed. Route returned 200 and created `vlx_saved_words_v1` plus `vlx_review_state_v1`. |
| 3 | Confirm save copy | Copy says `This word is now in your review queue.` | Passed after this PR's `/save` copy fix. |
| 4 | Confirm primary CTA | Primary CTA says `Review now`. | Passed after this PR's `/save` CTA fix. Destination remains `/review?mode=word&slug=dissonance&limit=5`. |
| 5 | Confirm secondary CTA | Secondary CTA says `Go to dashboard`. | Passed after this PR's `/save` CTA fix. Destination remains `/dashboard`. |
| 6 | Click review CTA | User enters review from the saved word. | Passed using the corrected primary CTA. Browser navigated to `/review?mode=word&slug=dissonance&limit=5`. |
| 7 | Complete at least one review card | Answer plus confidence writes a review event. | Passed. One answer was recorded. |
| 8 | Confirm review event is stored | `vlx_review_events_v1` has an appended event. | Passed. Event included `sessionId`, `slug`, `word`, `questionType`, `selected`, `answer`, `result`, `responseMs`, `createdAt`, `boxAfter`, and `weakScoreAfter`. |
| 9 | Confirm memory state is updated | `vlx_review_state_v1` updates for `dissonance`. | Passed. `lastReviewedAt`, `nextDueAt`, `wrong`, `weakScore`, `avgResponseMs`, and `lastQuestionType` updated. |
| 10 | Visit `/dashboard` | Today's Memory Mission is primary. | Passed. The page showed Today's Memory Mission as the primary dashboard surface. |
| 11 | Confirm dashboard stats | Stats are Due, Weak, New, Reviewed this week. | Passed for labels observed in the page after review. Note: the broader dashboard still includes additional legacy/supporting modules beyond the four-label checklist. |
| 12 | Visit `/saved` | Saved is presented as a review queue, not bookmarks. | Passed after local state loaded. The route showed saved words by review readiness, review queue framing, due/weak/new tabs, and no bookmark framing. |
| 13 | Visit `/pricing` | Pricing is interest-only. | Passed. Pricing stated no checkout, billing, or subscription logic is connected. |
| 14 | Confirm Lite framing | Lite is a daily memory habit. | Passed. Lite copy included daily visual memory habit framing. |
| 15 | Confirm Pro framing | Pro is weak-word repair and exam prep. | Passed. Pro copy included weak-word repair and exam preparation framing. |
| 16 | Click pricing interest action | No real checkout opens; interest is local only. | Passed. `Preview Lite` stayed on `/pricing`, opened no popup, and wrote `vlx_upgrade_interest_v1`. |
| 17 | Confirm public paid beta gate | Public paid beta remains No-Go. | Passed as a gate recommendation in this record. |

## localStorage Keys Verified

| Key | Verified when | Result |
| --- | --- | --- |
| `vlx_saved_words_v1` | After opening `/save?slug=dissonance&source=word_page` | Present. Contains `dissonance`. |
| `vlx_review_state_v1` | After save and after one review answer | Present and updated. `dissonance` remained box 0, not Mastered, with review evidence written after the answer. |
| `vlx_review_events_v1` | After one review answer | Present. One event was appended for `dissonance`. |
| `vlx_daily_stats_v1` | After one review answer | Present. Daily stats updated for the local review action. |
| `vlx_upgrade_interest_v1` | Only after clicking the pricing interest action | Present only after `Preview Lite`; stored a local Lite interest record from `pricing_page`. |

Observed review state after the smoke answer:

```txt
slug: dissonance
box: 0
mastery: Learning
wrong: 1
weakScore: 0.16
lastQuestionType: definition_to_word
```

No Mastered state was created by saving alone or by this single smoke answer.

## Safety Checks

| Safety check | Result |
| --- | --- |
| No real checkout | Passed. Pricing interest stayed local and opened no checkout. |
| No fake paid access | Passed. `vlx_plan_state_v1` was not created by the pricing interest action. |
| No fake mastery | Passed. Save created New/box 0 review state, and the smoke answer did not create Mastered state. |
| No external participant validation claim | Passed. This record is owner local smoke only. |
| No Webflow changes | Passed. No Webflow files, CMS items, or publishing flows were touched. |
| No Cloudflare Worker changes | Passed. No Cloudflare Worker files or production worker flows were touched. |
| No Vercel settings, DNS, deployment settings, auth, payment, API route, route handler, middleware, secrets, env var, provider SDK, production data, or billing changes | Passed. This PR remains limited to local Track B app copy, docs, and tests. |
| No AI feature added | Passed. No AI tutor, AI explanation, or AI call was added. |
| No `npm audit fix` | Passed. `npm audit fix` was not run. |

## Findings

### Resolved - `/save` simplified copy and CTA labels

The owner smoke checklist expects:

- `This word is now in your review queue.`
- `Review now`
- `Go to dashboard`

The original owner smoke blocker rendered:

- `Start 5-card review`
- `View dashboard`

This PR fixed that blocker by changing the saved-success `/save` visible copy
and CTA labels while preserving the existing review and dashboard destinations.
The underlying save-to-review-state behavior continued to pass.

### P2 - Local dev port and root inference need attention during owner smoke

Port `3006` was occupied by another local Next.js process and did not serve this
worktree. Also, `npm.cmd run dev -- --hostname 127.0.0.1 --port 3007` inferred a
parent workspace root in this local environment. The successful smoke server was
started with the current worktree's local Next CLI on port `3007`.

## Final Gate

| Gate | Recommendation |
| --- | --- |
| Public paid beta | No-Go |
| Private beta | Owner-controlled/manual-only/conditional |
| External participant validation | Not Started |

Private beta remains conditional because this smoke is local and
owner-controlled. Public paid beta remains No-Go.
