# Paid Beta QA Run - 2026-06-09

Date prepared: 2026-06-09

Date executed: 2026-06-10

Run status: Completed manual execution; validation gate failed

Prepared for: Visual Lexicon Track B no-payment paid beta invite readiness
after PR #29 and PR #30 made `/saved` and `/word/[slug]` memory state truthful.

Environment: local app at `http://127.0.0.1:3006`

Branch under test: `test/execute-paid-beta-qa-run`

Commit under test: `15d8a37f41115520499f716beca6a328a5ebe5de`

Browser used for execution: Playwright Chromium headless against the local
Next.js dev server.

## Cross-Links

- [docs/BETA_READINESS_AUDIT.md](BETA_READINESS_AUDIT.md)
- [docs/PAID_BETA_MANUAL_QA.md](PAID_BETA_MANUAL_QA.md)
- [docs/PAID_BETA_V0_RELEASE_CHECKLIST.md](PAID_BETA_V0_RELEASE_CHECKLIST.md)
- [docs/golden_user_flows.md](golden_user_flows.md)
- [evals/visual_lexicon_golden_cases.json](../evals/visual_lexicon_golden_cases.json)

## Scope And Safety

This was a documentation and test-process QA run record only. It did not change
runtime app behavior.

Safety boundaries confirmed for this run:

- Webflow was not touched.
- Cloudflare Workers were not touched.
- Auth, billing, DNS, payment settings, secrets, production data, deployment
  settings, and real payment were not touched.
- No checkout, payment SDK, billing route, subscription behavior, external
  payment logic, external analytics SDK, AI Tutor functionality, or multilingual
  page generation was added.
- `npm audit fix` was not run.
- No deployment was performed.

README update: not needed. `README.md` already links this QA run document under
Paid Beta Readiness.

## Clean Start

Required pre-change checks were run before making edits.

| Check | Result | Evidence |
| --- | --- | --- |
| Current branch | Pass | `git branch --show-current` returned `test/execute-paid-beta-qa-run`. |
| Working tree clean before QA | Pass | `git status --short` returned no output before execution. |
| Do not switch branches | Pass | Branch remained `test/execute-paid-beta-qa-run`. |

The local app was run at:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
```

The first local server attempts left a stale local Node listener on port `3006`;
that stale local PID was stopped and the dev server was relaunched. The manual
QA run was executed only after the app loaded at `http://127.0.0.1:3006`.

## Validation Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `npm.cmd run lint` | Pass | `next lint` completed with no ESLint warnings or errors. |
| `npm.cmd run build` | Pass | Production build completed successfully. Non-fatal webpack cache warnings were printed: `Unable to snapshot resolve dependencies`. |
| `npm.cmd run test -- --workers=1` | Pass | Full rerun passed at `78 passed`, `1 skipped` after adding local Playwright server bootstrap (`playwright.config.ts`). |

## Expected LocalStorage Keys

The run checked these local-only keys where relevant:

| Key | Observed use |
| --- | --- |
| `vlx_saved_words_v1` | Created by save flows for `dissonance`, `obfuscate`, and `lucid`. |
| `vlx_review_state_v1` | Created by save flows and updated by review, weak, weak sprint, and pack preview answers. |
| `vlx_review_events_v1` | Appended by review answer flows. Final manual run count: `9`. |
| `vlx_daily_stats_v1` | Updated from real review answers. Final manual run date key: `2026-06-10`. |
| `vlx_pack_progress_v1` | Updated by Academic Vocabulary preview start and completion. |
| `vlx_plan_state_v1` | Not required by the core manual run; visible as local-only plan state on `/settings`. |
| `vlx_upgrade_interest_v1` | Updated by pricing Lite/Pro and paywall-interest CTA checks. |
| `vlx_pending_home_quiz` | Not used during this run. |

No checkout, billing, subscription, payment SDK, payment secret, or production
user data appeared in local storage during the manual checks.

## Executed QA Items

| Flow | Result | Browser/route checked | Evidence | localStorage checked | dataLayer checked | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Clear localStorage | Pass | `/dashboard` | Clean-start snippet removed all seven QA keys; remaining keys were `[]`. | `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, `vlx_daily_stats_v1`, `vlx_pack_progress_v1`, `vlx_plan_state_v1`, `vlx_upgrade_interest_v1` absent. | Not applicable. | OK |
| `/dashboard` empty state | Pass | `/dashboard` | Dashboard showed zero-state memory mission with no fake due, weak, mastered, saved, or streak-like progress. | No local SRS keys present after clear. | Not applicable. | OK |
| `/saved` empty state | Pass | `/saved` | Empty library showed `0 local saved words`, `No saved words in this browser`, and stated sample words are not shown as saved. | No saved, review, event, daily, pack, plan, or interest keys present. | `vlx_saved_library_view`, `hasLocalReviewState: false`, `hasLocalSavedWord: false`; privacy check `false`. | OK |
| `/word/dissonance` empty local memory state | Pass | `/word/dissonance` | Local memory panel showed `No local memory state yet` and offered save/review actions without fake mastery. | No local SRS keys present. | `vlx_word_memory_state_view`, `hasLocalReviewState: false`, `hasLocalSavedWord: false`; privacy check `false`. | OK |
| Save from `word_page` source | Pass | `/save?slug=dissonance&source=word_page` | Save succeeded for `Dissonance`. Review state was `mastery: New`, `box: 0`, `correct: 0`, `wrong: 0`, `streakCorrect: 0`, `weakScore: 0`. | `vlx_saved_words_v1.dissonance.source: "word_page"` and `vlx_review_state_v1.dissonance` existed. | `vlx_save_word` emitted for `source: word_page`; privacy check `false`. | OK |
| Saved library after `dissonance` save | Pass | `/saved` | `Dissonance` appeared with `Box 0`, `0 correct / 0 wrong`, and `Source: Word page`. | `vlx_saved_words_v1` contained only `dissonance`; review state matched the saved word. | `vlx_saved_library_view`, `hasLocalReviewState: true`, `hasLocalSavedWord: true`; privacy check `false`. | OK |
| Word detail after `dissonance` save | Pass | `/word/dissonance` | Word detail showed saved locally, source Word page, box `0`, recall `0 correct, 0 wrong`; storage confirmed `mastery: New` and `weakScore: 0`. | `vlx_saved_words_v1.dissonance` and `vlx_review_state_v1.dissonance` checked. | `vlx_word_memory_state_view`, `source: word_page`; privacy check `false`. | OK |
| Save from `alias_search` source | Pass | `/save?slug=obfuscate&source=alias_search` | Save succeeded for `Obfuscate`. | `vlx_saved_words_v1.obfuscate.source: "alias_search"` and `vlx_review_state_v1.obfuscate` existed. | `vlx_save_word`, `source: alias_search`; privacy check `false`. | OK |
| Save from `extension` source | Pass | `/save?slug=lucid&source=extension` | Save succeeded for `Lucid` without extension secrets or private page data. | `vlx_saved_words_v1.lucid.source: "extension"` and `vlx_review_state_v1.lucid` existed; only saved/review keys were present immediately after this save. | `vlx_save_word`, `source: extension`; privacy check `false`. | OK |
| Review start, answer, and complete | Pass | `/review` | Answered 3 cards. Summary showed 3 reviewed, 1 correct, 2 wrong. | `vlx_review_events_v1.length: 3`; `vlx_daily_stats_v1["2026-06-10"]` was `reviewed: 3`, `correct: 1`, `wrong: 2`; state updated `lastReviewedAt`, `nextDueAt`, boxes, and weak scores. | `vlx_review_start`, `vlx_review_answer`, `vlx_review_complete`; privacy check `false`. | OK |
| `review_state` update | Pass | `/review` and `/review?mode=word&slug=dissonance&limit=1` | Dissonance moved through real answer state; after forced miss it became `mastery: Weak`, `wrong: 2`, `weakScore: 0.56`, `lastQuestionType: definition_to_word`. | `vlx_review_state_v1.dissonance` checked. | `vlx_review_answer` included `boxBefore`, `boxAfter`, and `weakScoreAfter`. | OK |
| `review_events` update | Pass | `/review`, `/review/weak-sprint`, pack preview review | Events appended from submitted answers. Final manual run count was `9`. Latest forced miss event included `selected: Melody`, `answer: Dissonance`, `result: wrong`, `boxAfter: 0`, `weakScoreAfter: 0.56`. | `vlx_review_events_v1` checked. | `vlx_review_answer` emitted during review flows. | OK |
| `daily_stats` update | Pass | Review flows | Final manual run daily stats for `2026-06-10`: `reviewed: 9`, `correct: 2`, `wrong: 7`, `mastered: 0`, `weakAdded: 2`, `sessions: 4`. | `vlx_daily_stats_v1` checked. | Review completion events checked. | OK |
| Due words | Pass | `/review?mode=due` | Due mode rendered from local review state. After prior answers, next due times were future-dated for reviewed words, so no fake due progress was introduced. | `vlx_review_state_v1` checked for `nextDueAt` on `dissonance`, `obfuscate`, and `lucid`. | No due review answer was submitted on this check; privacy check `false`. | OK |
| Weak words | Pass | `/review?mode=weak` | A real wrong answer created weak state. Weak route used local weak state rather than sample data. | Weak candidates from `vlx_review_state_v1`: `dissonance` was `Weak`, `wrong: 2`, `weakScore: 0.56`; `lucid` had positive `weakScore`. | `vlx_review_start` emitted with `mode: weak`; privacy check `false`. | OK |
| Weak Sprint | Pass | `/review/weak-sprint` | Answered 2 sprint cards. | `vlx_review_events_v1` had `2` `questionType: "weak_review"` events; `dissonance` and `lucid` state updated `lastQuestionType: "weak_review"`. | `vlx_review_start`, `vlx_review_answer`, `vlx_review_complete`; privacy check `false`. | OK |
| Pack catalog | Pass | `/packs` | Catalog showed Academic Vocabulary as preview-ready and IELTS/GRE as `Data pending`; no fake planned-pack progress appeared. | `vlx_pack_progress_v1` was not present before pack detail/progress actions. | Not applicable. | OK |
| Academic pack detail | Pass | `/packs/academic-vocabulary` | Detail rendered `Academic Vocabulary`, `Pack details`, `Preview words`, and `Dissonance`; it did not claim completion. | `vlx_pack_progress_v1["academic-vocabulary"]` existed with `reviewedCount: 0`, `correctCount: 0`, `source: "pack_detail"`, and no `previewCompletedAt`. | `vlx_exam_pack_preview_view` observed. | OK |
| Pack preview start | Pass | Start preview from `/packs/academic-vocabulary` | Browser routed to `/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview`. | `vlx_pack_progress_v1["academic-vocabulary"].previewStartedAt` existed; `reviewedCount: 0`, `correctCount: 0`, `source: "pack_detail"`. | `vlx_pack_preview_start` and `vlx_review_start` emitted; privacy check `false`. | OK |
| Pack preview complete | Pass | Academic hub review route | Answered 3 pack preview cards; summary showed real answer results. | `vlx_pack_progress_v1["academic-vocabulary"]` had `previewCompletedAt`, `reviewedCount: 3`, `correctCount: 1`, `source: "review"`. | `vlx_pack_preview_complete`, `vlx_review_answer`, `vlx_review_complete`; privacy check `false`. | OK |
| Pricing Lite/Pro interest | Pass | `/pricing` | Clicked `Preview Lite` and `Preview Pro`. URL stayed `/pricing`, page showed `Billing is not connected` and local interest notice. | `vlx_upgrade_interest_v1` had one `lite` and one `pro` record with `source: "pricing_page"` and `pagePath: "/pricing"`. | `vlx_pricing_interest` emitted for `lite` and `pro`; privacy check `false`. | OK |
| `vlx_upgrade_interest_v1` check | Pass | `/pricing` and save-limit paywall CTA | Pricing records existed for `lite` and `pro`; save-limit paywall check added a `lite` record with `source: "save_confirmation"`, `trigger: "save_limit"`. | `vlx_upgrade_interest_v1` checked. | `vlx_pricing_interest` and `vlx_paywall_interest` emitted; privacy check `false`. | OK |
| Local dataLayer events | Pass | Save, saved, word detail, review, weak sprint, pack preview, pricing, paywall CTA | Local-only event checks observed the expected beta funnel events with sanitized payloads. | Related local stores checked with each flow. | Observed `vlx_save_word`, `vlx_saved_library_view`, `vlx_word_memory_state_view`, `vlx_review_start`, `vlx_review_answer`, `vlx_review_complete`, `vlx_pack_preview_start`, `vlx_pack_preview_complete`, `vlx_pricing_interest`, `vlx_paywall_view`, and `vlx_paywall_interest`; privacy checks returned `false`. | OK |
| No checkout/billing/payment route | Pass | `/checkout`, `/billing`, `/api/checkout`, `/api/billing` | All four routes returned `404` and showed `This page could not be found`. Filesystem check found no disallowed payment, billing, or checkout route directories. | No payment localStorage key or subscription state was created. | Not applicable. | OK |
| Support/data disclosure copy | Pass | `/settings` and `docs/PAID_BETA_SUPPORT_AND_DATA_DISCLOSURE.md` | `/settings` states no auth, billing, or payment setting is configured. Support/data disclosure doc exists and covers billing not connected, local storage keys, local analytics/no external SDK, and support boundary. | Disclosure doc lists all expected beta localStorage keys. | Disclosure doc documents local `window.dataLayer` events and privacy limits. | OK |

## Validation Issues

Severity guide:

- P0: blocks any paid beta invite.
- P1: fix before broader paid beta or before learners rely on the affected
  surface.
- P2: follow-up polish, docs, or non-blocking improvement.

| Issue ID | Severity | Flow | Observed failure | Evidence | Owner | Status | Target fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| QA-VAL-001 | P1 | Required validation | `npm.cmd run test -- --workers=1` initially failed (`ERR_CONNECTION_REFUSED`) because no Playwright webServer config existed for local startup. After adding `playwright.config.ts` (local app bootstrap + base URL), the same suite passes with `78 passed`, `1 skipped`. | Reproduced failure output and fixed rerun output. | Product engineering | Closed | Keep test bootstrapping in repo config so Playwright always starts/follows the configured app server. |
| QA-BUILD-001 | P2 | Build validation | `npm.cmd run build` passed but printed non-fatal webpack cache warnings: `Unable to snapshot resolve dependencies`. | Build command output. | Product engineering | Open | Investigate cache warning if it slows builds or hides dependency tracing issues. |

## Final QA Decision

P0 blockers: none observed in the executed manual QA checklist.

P1 before invite:

- `QA-VAL-001`: the required full Playwright validation command initially failed from env startup race; this run is now resolved after adding `playwright.config.ts`, with rerun result `78 passed, 1 skipped`.
  failing tests. This prevents a clean paid beta invite recommendation even
  though the manual Save -> Review -> SRS loop passed in this run.

P2 backlog:

- `QA-BUILD-001`: non-fatal webpack cache snapshot warnings during build.

Final recommendation: No-Go until manual QA is rerun after this validation fix and reviewed as a package.

Manual QA decision detail: the required local manual flows passed against
`http://127.0.0.1:3006`; no real payment, checkout, subscription, production
data, Webflow, Cloudflare Worker, auth, billing, DNS, secret, deployment, AI
Tutor, or multilingual page generation behavior was touched or added.

Reviewer: Codex

Date completed: 2026-06-10
