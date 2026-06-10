# Paid Beta QA Rerun - 2026-06-10

Date prepared: 2026-06-10

Date executed: 2026-06-10

Prepared for: Visual Lexicon Track B paid beta local QA rerun after PR #36

Environment:

- Repository: `chachathecat/visual-lexicon-app`
- Branch checked: `test/paid-beta-qa-rerun-after-playwright-fix`
- Working directory: `C:\\Users\\jmg91\\Desktop\\visual-lexicon-app-paid-beta-qa-rerun`
- Base URL: `http://127.0.0.1:3006`
- OS/zone: Windows (Asia/Seoul)

Context:

- PR #35 (`test/execute-paid-beta-qa-run` / commit `5be4767`) produced `docs/PAID_BETA_QA_RUN_2026-06-09.md` and recorded a No-Go primarily due test infra fragility.
- PR #36 (`fix/paid-beta-playwright-validation` / merge `849e52f`) restored Playwright web-server bootstrap in `playwright.config.ts`.
- This rerun is documentation-only and does not alter runtime app behavior.

Scope and safety:

- No changes made to Webflow, Cloudflare Workers, auth, billing, DNS, payment settings, secrets, production data, deployment settings, or paid beta SDKs.
- No checkout/payment route was added.
- No changes to runtime app behavior.

Cross-links:

- [Previous run](PAID_BETA_QA_RUN_2026-06-09.md)
- [PAID_BETA_MANUAL_QA.md](PAID_BETA_MANUAL_QA.md)
- [PAID_BETA_V0_RELEASE_CHECKLIST.md](PAID_BETA_V0_RELEASE_CHECKLIST.md)
- [PAID_BETA_SUPPORT_AND_DATA_DISCLOSURE.md](PAID_BETA_SUPPORT_AND_DATA_DISCLOSURE.md)
- [PAID_BETA_ROLLBACK_PLAN.md](PAID_BETA_ROLLBACK_PLAN.md)
- [PAID_BETA_INVITE_COPY.md](PAID_BETA_INVITE_COPY.md)

## Pre-rerun checks

| Check | Result |
| --- | --- |
| Current branch check | Pass (`test/paid-beta-qa-rerun-after-playwright-fix`) |

## Required validation commands

| Command | Result | Evidence |
| --- | --- | --- |
| `npm.cmd run typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `npm.cmd run lint` | Pass | `next lint` completed with no ESLint warnings/errors. |
| `npm.cmd run build` | Pass | `next build` completed successfully; webpack printed non-fatal cache warnings (`Unable to snapshot resolve dependencies`). |
| `npm.cmd run test -- --workers=1` | **Blocked (tooling timeout)** | Playwright printed all active tests as `ok` (79 tests, 1 skipped) and no in-run failures, then hit the environment timeout before process exit summary. |

## Manual QA coverage (Executed)

### Required URL/state flow checklist

| Flow | Status | Evidence |
| --- | --- | --- |
| Clear localStorage | Pass | Ran clear-storage routine and verified required keys removed from localStorage. |
| `/save?slug=dissonance&source=word_page` | Pass | `200` response; `vlx_saved_words_v1.dissonance.source = "word_page"`; review state created; `vlx_save_word` emitted. |
| `/save?slug=dissonance&source=alias_search` | Pass | `200` response; `vlx_saved_words_v1.dissonance.source = "alias_search"`; review state created; `vlx_save_word` emitted. |
| `/save?slug=dissonance&source=extension` | Pass | `200` response; `vlx_saved_words_v1.dissonance.source = "extension"`; review state created; `vlx_save_word` emitted. |
| `/dashboard` | Pass | Page loaded and reflected local-state context (memory mission section present). |
| `/saved` | Pass | Local saved row visible for active word; no fake placeholder states observed. |
| `/word/dissonance` | Pass | Local memory state shown with `mastery: New`, `box: 0`, `weakScore: 0`. |
| `/review` | Pass | Review session rendered; one card answer was accepted; review events and daily stats updated. |
| `/review?mode=due` | Pass | Route loaded and emitted `vlx_review_start` for `mode=due`. |
| `/review?mode=weak` | Pass | Route loaded with active review session for weak-eligible words. |
| `/review/weak-sprint` | Pass | Sprint route rendered and accepted an answer; `vlx_review_answer` observed. |
| `/packs` | Pass | Route loaded; Academic Vocabulary listed. |
| `/packs/academic-vocabulary` | Pass | Route loaded and start preview link present. |
| `/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview` | Pass | Pack preview route reachable from pack page; preview start/completion executed in this rerun. |
| `/pricing` | Pass | `Preview Lite` and `Preview Pro` flows executed; `vlx_upgrade_interest_v1` records created. |
| Lite/Pro interest capture | Pass | `vlx_upgrade_interest_v1` had `lite` and `pro` entries with `source=pricing_page`; `vlx_pricing_interest` observed. |
| local analytics `dataLayer` checks | Pass | Required event names captured via browser checks. |
| no real checkout/payment/subscription route | Pass | `/checkout`, `/billing`, `/api/checkout`, `/api/billing` returned 404. |
| support/data disclosure coverage | Pass | `/settings` route loaded; support/disclosure contract remains documented in [PAID_BETA_SUPPORT_AND_DATA_DISCLOSURE.md](PAID_BETA_SUPPORT_AND_DATA_DISCLOSURE.md). |

### localStorage keys checked

Required and checked keys:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- `vlx_pack_progress_v1`
- `vlx_upgrade_interest_v1`
- `vlx_plan_state_v1` (observed where seeded in prior checks)

### dataLayer events checked

Required events in this rerun:

- `vlx_save_word`
- `vlx_review_start`
- `vlx_review_answer`
- `vlx_review_complete`
- `vlx_pack_preview_start`
- `vlx_pack_preview_complete`
- `vlx_pricing_interest` (pricing CTA)
- `vlx_paywall_interest` (not expected in this `/pricing` path without save-limit trigger)

## Route coverage

- `/`
- `/dashboard`
- `/saved`
- `/word/dissonance`
- `/review`
- `/review?mode=due`
- `/review?mode=weak`
- `/review/weak-sprint`
- `/packs`
- `/packs/academic-vocabulary`
- `/pricing`
- `/checkout`
- `/billing`
- `/api/checkout`
- `/api/billing`
- `/settings`
- `/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview`

## Evidence highlights

- Pack preview events
  - `vlx_pack_preview_start`: `1`
  - `vlx_pack_preview_complete`: `1`
  - `vlx_pack_progress_v1.academic-vocabulary.reviewedCount`: `3`
  - `vlx_pack_progress_v1.academic-vocabulary.correctCount`: `1`
- Pricing capture
  - `vlx_upgrade_interest_v1` captured both `lite` and `pro` entries from `/pricing`.
- Payment guardrails
  - Guard routes listed above all returned `404`.

## Findings (P0/P1/P2)

| Finding | Severity | Status | Impact |
| --- | --- | --- | --- |
| `npm.cmd run test -- --workers=1` does not exit before local timeout in this environment | P1 | Blocked | Manual rerun evidence is present, but required command was not able to finish to shell exit in this workspace runner. |
| webpack cache warning output (`Unable to snapshot resolve dependencies`) | P2 | Open | Non-blocking local build/test warning; no behavior defect observed. |

## Final recommendation

- P0: none
- P1: none blocking app behavior
- P2: 1 open

Final recommendation: **Conditional Go** (approve once `npm.cmd run test -- --workers=1` completes without runner timeout in the release validation environment).

## Safety confirmation

- No Webflow files were touched.
- No Cloudflare Worker settings changed.
- No auth, billing, DNS, payment, secret, deployment, or production-data behavior changed.
- No checkout/payment/subscription surfaces were added.
- No runtime behavior was changed in this rerun.

## Owner sign-off

- Owner: Codex
- QA date: 2026-06-10
- Recommendation: Conditional Go after full non-timeout test command completion

