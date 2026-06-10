# Paid Beta QA Run - 2026-06-09

Date: 2026-06-09

Run status: Pending manual execution

Prepared for: Visual Lexicon Track B no-payment paid beta invite readiness
after PR #29 and PR #30 made `/saved` and `/word/[slug]` memory state truthful.

Environment: local app at `http://127.0.0.1:3006`

Branch under test: `<fill before execution>`

Commit under test: `<fill exact commit SHA before execution>`

## Cross-Links

- [docs/BETA_READINESS_AUDIT.md](BETA_READINESS_AUDIT.md)
- [docs/PAID_BETA_MANUAL_QA.md](PAID_BETA_MANUAL_QA.md)
- [docs/golden_user_flows.md](golden_user_flows.md)
- [evals/visual_lexicon_golden_cases.json](../evals/visual_lexicon_golden_cases.json)

## Scope And Safety

This is a documentation and test-process QA run record only. It does not change
runtime app behavior.

Safety boundaries for this run:

- Do not touch Webflow.
- Do not touch Cloudflare Workers.
- Do not touch auth, billing, DNS, payment settings, secrets, production data,
  deployment settings, or real payment.
- Do not add AI Tutor functionality.
- Do not add multilingual page generation.
- Do not run `npm audit fix`.
- Do not mark a manual step as passed unless it was actually executed in the
  browser against the local app.

## Required Clean Start Commands

Confirm the branch and working tree before starting:

```powershell
git status --short --branch
```

Expected:

- Branch is the intended QA branch or merge commit branch for the run.
- Working tree is clean except for intentional QA note edits.

Start the local app:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
```

Open:

```txt
http://127.0.0.1:3006/dashboard
```

Clear local browser state from the browser console before the first checklist
step:

```js
[
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
].forEach((key) => localStorage.removeItem(key));

location.assign("http://127.0.0.1:3006/dashboard");
```

## Validation Commands

Run these before recording a final Go/No-Go recommendation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run typecheck` | Pending execution | Fill during QA run. |
| `npm.cmd run lint` | Pending execution | Fill during QA run. |
| `npm.cmd run build` | Pending execution | Fill during QA run. |
| `npm.cmd run test -- --workers=1` | Pending execution | Fill during QA run. |

## Expected LocalStorage Keys

These are the expected local-only keys for this no-payment beta QA run.

| Key | Expected owner | Pass condition |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word metadata | Saves create or preserve saved records keyed by slug. |
| `vlx_review_state_v1` | SRS memory state | Saves create review items and answers update box, mastery, counts, due date, and weakness honestly. |
| `vlx_review_events_v1` | Review answer events | Each submitted review answer appends an event with result, response time, box, and weak score. |
| `vlx_daily_stats_v1` | Local reviewed-word stats | Review completion increments local reviewed/correct/wrong stats from real answers. |
| `vlx_pack_progress_v1` | Pack preview progress | Academic preview start and completion are recorded from real review flow actions. |
| `vlx_plan_state_v1` | Local entitlement placeholder | May exist as local-only state. It must not claim real billing or subscription status. |
| `vlx_upgrade_interest_v1` | Local upgrade interest | Lite and Pro CTA clicks record interest locally when no payment URL is configured. |
| `vlx_pending_home_quiz` | Optional transition key | Not required for this run. If present, it must not compete with SRS state keys. |

No checkout, billing, subscription, payment SDK, payment secret, or production
user data should appear in local storage.

## Manual QA Flow Checklist

All statuses below start as `Pending manual execution`. Change a status only
after executing the step against `http://127.0.0.1:3006`.

| Step | Action | Expected result | Status |
| --- | --- | --- | --- |
| 1 | Clear localStorage with the clean-start console snippet. | The seven local QA keys are removed and `/dashboard` reloads. | Pending manual execution |
| 2 | Open `/dashboard` after the clear. | Empty state is honest. Due, weak, mastered, saved, and streak-like counts are not faked. | Pending manual execution |
| 3 | Open `/saved` after the clear. | Saved library shows an honest empty state and does not show sample words as saved. | Pending manual execution |
| 4 | Open `/word/dissonance` after the clear. | Local memory panel shows no local memory state yet and no fake mastery, box, weak score, due date, or saved state. | Pending manual execution |
| 5 | Open `/save?slug=dissonance&source=word_page`. | Save succeeds, offers review, writes `vlx_saved_words_v1.dissonance`, and creates `vlx_review_state_v1.dissonance`. | Pending manual execution |
| 6 | Open `/saved` after saving `dissonance`. | `Dissonance` appears from local saved/review state with truthful local memory metadata. | Pending manual execution |
| 7 | Open `/word/dissonance` after saving. | Word page shows saved locally, source `word_page`, mastery `New`, box `0`, weak score `0`, and `0 correct, 0 wrong`. | Pending manual execution |
| 8 | Open `/save?slug=obfuscate&source=alias_search`. | Save succeeds, source is recorded as `alias_search`, and a review item exists. | Pending manual execution |
| 9 | Open `/save?slug=lucid&source=extension`. | Save succeeds, source is recorded as `extension`, and a review item exists without extension secrets or private page data. | Pending manual execution |
| 10 | Open `/review` and answer through a summary. | Answers append review events, update review state, and update daily stats from real answers. | Pending manual execution |
| 11 | Open `/review?mode=due`. | Due candidates come from real `nextDueAt`/review state, or the route shows an honest empty state when no due items exist. | Pending manual execution |
| 12 | Open `/review?mode=weak`. | Weak candidates come from real `Weak` mastery or positive `weakScore`, or the route shows an honest empty state when none exist. | Pending manual execution |
| 13 | Open `/review/weak-sprint`. | Sprint uses real weak words, or shows an honest empty state. Sprint answers update the same review state and append weak review events. | Pending manual execution |
| 14 | Open `/packs`. | Pack catalog is honest about available previews and planned placeholders. No fake paid-pack progress appears. | Pending manual execution |
| 15 | Open `/packs/academic-vocabulary`. | Academic Vocabulary detail renders and does not claim completed progress before the preview is run. | Pending manual execution |
| 16 | Start the academic pack preview. | Browser routes into review with `mode=hub`, `hub=academic-vocabulary`, `packId=academic-vocabulary`, and `source=pack_preview`; pack progress start is recorded. | Pending manual execution |
| 17 | Complete the academic pack preview. | Pack progress records `previewCompletedAt`, reviewed count, and correct count from actual answers. | Pending manual execution |
| 18 | Open `/pricing`, click Lite CTA, then click Pro CTA. | Page states billing is not connected and no checkout opens when no paid beta URL is configured. | Pending manual execution |
| 19 | Check `vlx_upgrade_interest_v1`. | At least one local record exists for `lite` and one for `pro`, both from `pricing_page`. | Pending manual execution |
| 20 | Visit `/checkout`, `/billing`, `/api/checkout`, and `/api/billing`. | No checkout, billing, payment SDK, subscription flow, billing portal, or production payment action exists. | Pending manual execution |

## Pass/Fail Recording Table

Use this table to record the actual manual run. Evidence can be a screenshot
path, console output snippet, or short note.

| Flow | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Clear localStorage | Pending manual execution |  |  |
| `/dashboard` empty state | Pending manual execution |  |  |
| `/saved` empty state | Pending manual execution |  |  |
| `/word/dissonance` empty local memory state | Pending manual execution |  |  |
| `/save?slug=dissonance&source=word_page` | Pending manual execution |  |  |
| `/saved` after save | Pending manual execution |  |  |
| `/word/dissonance` after save | Pending manual execution |  |  |
| `/save?slug=obfuscate&source=alias_search` | Pending manual execution |  |  |
| `/save?slug=lucid&source=extension` | Pending manual execution |  |  |
| `/review` | Pending manual execution |  |  |
| `/review?mode=due` | Pending manual execution |  |  |
| `/review?mode=weak` | Pending manual execution |  |  |
| `/review/weak-sprint` | Pending manual execution |  |  |
| `/packs` | Pending manual execution |  |  |
| `/packs/academic-vocabulary` | Pending manual execution |  |  |
| Academic pack preview start | Pending manual execution |  |  |
| Academic pack preview completion | Pending manual execution |  |  |
| `/pricing` Lite and Pro CTA | Pending manual execution |  |  |
| `vlx_upgrade_interest_v1` check | Pending manual execution |  |  |
| No checkout/billing/payment route check | Pending manual execution |  |  |

## P0/P1/P2 Issue Recording Table

Severity guide:

- P0: blocks any paid beta invite.
- P1: fix before broader paid beta or before learners rely on the affected
  surface.
- P2: follow-up polish, docs, or non-blocking improvement.

Do not add an issue unless it was observed during validation or browser QA.

| Issue ID | Severity | Flow | Observed failure | Evidence | Owner | Status | Target fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _Add observed issue_ | _P0/P1/P2_ | _Flow name_ | _Observed behavior_ | _Screenshot/log/link_ | _Owner_ | _Open/Closed_ | _Fix or follow-up_ |

## Go/No-Go Recommendation

Current recommendation: No-Go until manual execution is complete.

Final recommendation options:

- Go: all validation commands pass, all P0 manual flows pass, no real payment
  behavior exists, and safety boundaries are confirmed untouched.
- Conditional Go: no P0 failures, but P1/P2 follow-ups are recorded with clear
  owners and do not undermine the local Save -> Review -> SRS loop.
- No-Go: any P0 flow fails, any manual step cannot be verified before invite,
  any fake mastery/progress/payment behavior appears, or any forbidden
  production surface is touched.

Final recommendation: `<Go / Conditional Go / No-Go>`

Reviewer:

Date completed:

Safety confirmation:

- Webflow was not touched.
- Cloudflare Workers were not touched.
- Auth, billing, DNS, payment settings, secrets, production data, deployment
  settings, and real payment were not touched.
- Runtime app behavior was not changed by this QA run record.
