# Paid Beta Readiness Audit

Audit date: 2026-06-09

Repository branch audited: `release/beta-readiness-audit`

Scope: Track B learning app only. This audit does not include Webflow,
Cloudflare production Workers, auth, DNS, billing, payment settings, secrets,
production data, or deployment settings.

## Current Product Status

The app is ready for a documentation-only paid beta readiness review. It is not
ready to take real payment.

Implemented local MVP surfaces:

- Save links can create local saved words and review state.
- Review answers write review events, review state, and daily stats.
- Dashboard memory counts are derived from local SRS state.
- Due, weak, mixed, focused word, hub, and weak sprint review modes exist.
- Academic pack preview can start and complete a local preview review.
- Pack progress records preview start/completion and reviewed/correct counts.
- Paywall trigger logic and pricing surfaces exist as local paid beta
  placeholders.
- Upgrade interest capture writes to local storage when no external paid beta
  URL is configured.
- Extension save/review URL helpers normalize app-side routes.
- Multilingual alias matching resolves known aliases to canonical English word
  slugs and avoids creating fake actions for unknown aliases.

Not implemented for production paid launch:

- Real checkout, subscription, invoice, billing portal, or payment SDK.
- Account auth, account sync, or production user data persistence.
- Real IELTS/GRE paid pack content.
- Full multilingual word pages or cross-language content pages.
- AI mistake explanations.
- Full Chrome extension integration beyond route helpers and source tagging.
- Production analytics pipeline beyond local/dataLayer style event emission.

Important implementation note: `/dashboard`, `/save`, and `/review` use the
local SRS stores. `/saved` and `/word/[slug]` still render static/mock word card
data, so they should not be presented as a live saved library or live per-word
memory detail until that gap is closed.

## Route Inventory

| Route | Current behavior | Beta readiness |
| --- | --- | --- |
| `/` | Renders `DashboardView`, same learning dashboard as `/dashboard`. | OK for beta if dashboard counts pass QA. |
| `/dashboard` | Reads local saved words, review state, review events, daily stats, and plan state. Shows due, weak, new saved, mastered, hub progress, saved library preview, alias search, and paywall prompts. | OK for beta. Must not show fake counts. |
| `/saved` | Static saved page using `mockReviewItems` and `newSavedItems`, not the live local saved store. | Needs copy clarification before paid launch. Keep below learning actions. |
| `/save?slug=dissonance&source=word_page` | Resolves the word, writes `vlx_saved_words_v1`, creates `vlx_review_state_v1`, and tags source as `word_page` on first save. | P0 if it fails. Covered by smoke/regression tests. |
| `/save?slug=dissonance&source=alias_search` | Same save flow with accepted `alias_search` source. Duplicate saves preserve existing review progress and do not duplicate queue entries. | P0 if alias source creates fake or unsafe save behavior. |
| `/save?slug=dissonance&source=extension` | Same save flow with normalized extension source. Extension helper also builds this URL. | P0 if extension source cannot create review state. |
| `/review` | Mixed local review session from due, weak, and new saved candidates; can start starter deck if no local candidates exist. Answers update SRS state/events/stats. | OK for beta. P0 if answer writes fail. |
| `/review?mode=due` | Query-mode due review contract. Selects due items by `nextDueAt` and SRS state. | OK for beta. `/review/due` also exists as a route alias. |
| `/review?mode=weak` | Query-mode weak review contract. Selects weak words by `Weak` mastery or `weakScore > 0`. | OK for beta. `/review/weak` also exists as a route alias. |
| `/review/weak-sprint` | Five-card weak sprint using only real local weak state. Empty state appears when no weak words exist. | OK for beta. P0 if it does not update review state/events. |
| `/packs` | Pack preview catalog with available starter packs and honest planned placeholders. Pack cards can record preview start. | OK for beta with mock/R2 caveat. |
| `/packs/academic-vocabulary` | Academic pack detail from exam pack or academic hub pack data. Start preview review routes to `/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview`. | OK for beta if manual preview completion writes pack progress. |
| `/pricing` | Free/Lite/Pro outcome copy. Lite/Pro CTAs are placeholders or configured external paid beta links. Local clicks write upgrade interest. | OK for no-payment beta interest capture. No-Go for real payment. |
| `/settings` | Local plan and paywall trigger panels plus preference placeholder copy. No auth, billing, or payment settings. | OK for beta if copy remains explicit. |
| `/word/dissonance` | Static/mock word detail page with mock memory values, not live local review state. | Needs copy clarification before paid launch. |

## LocalStorage Key Inventory

| Key | Owner | Stored shape | Current writer | Readiness |
| --- | --- | --- | --- | --- |
| `vlx_saved_words_v1` | SRS storage | Record keyed by slug with saved word metadata and source. | `/save` via `writeSavedWords`. | P0 if save does not create or preserve this correctly. |
| `vlx_review_state_v1` | SRS storage | Record keyed by slug with box, mastery, counts, weak score, due date, and response metadata. | `/save` creates initial item; `/review` updates after answers. | P0 if missing or fake. |
| `vlx_review_events_v1` | SRS storage | Array of review answer events with session, question, answer, result, response time, box, and weak score data. | `/review` via `appendReviewEvent`. | P0 if answer events are not appended. |
| `vlx_daily_stats_v1` | SRS storage | Daily stats record with reviewed, correct, wrong, mastered, weak added, minutes, sessions. | `/review` via `writeDailyStats`. | OK for local weekly reviewed words; analytics pipeline remains P1. |
| `vlx_pack_progress_v1` | Pack progress | Record keyed by pack ID with preview start/completion, last review, reviewed/correct counts, and source. | Pack cards/detail and review completion. | P0 if pack progress shows fake completion or fake counts. |
| `vlx_plan_state_v1` | Entitlements | Local plan state only. Defaults to guest. | Manual/local state only; no billing writer. | OK for local gating previews. Not a subscription record. |
| `vlx_upgrade_interest_v1` | Upgrade interest | Array of local interest records with plan, source, trigger, timestamp, and page path. | Pricing and paywall prompts. | P0 if pricing/paywall CTA does not record interest in no-payment mode. |

## Test Inventory

Required validation commands for this audit PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

The Playwright browser suites expect the app at `http://127.0.0.1:3006` unless
`PLAYWRIGHT_BASE_URL` or `NEXT_PUBLIC_APP_URL` is set.

Current Playwright suites:

| Suite | Coverage |
| --- | --- |
| `tests/mvp-smoke.spec.ts` | Save route, extension source save, local SRS write, review events/stats, dashboard memory loop smoke. |
| `tests/review-state-regression.spec.ts` | Saved words become review items, duplicate save preservation, correct/wrong SRS updates, due/weak/mastered selectors. |
| `tests/review-mode-routes.spec.ts` | Review route contracts, extension bridge URLs, due/weak/weak sprint routes, focused word/hub routes, route answer writes, pack progress isolation. |
| `tests/exam-pack-preview.spec.ts` | Pack catalog/detail, academic preview start, pack progress start/completion, planned IELTS/GRE placeholder honesty. |
| `tests/paywall-triggers.spec.ts` | Save/review/exam/weak/mastery/mistake paywall trigger evaluator and no checkout/payment SDK guard. |
| `tests/paywall-surfaces.spec.ts` | Product paywall prompts, pricing Lite/Pro interest capture, configured external paid beta URLs, no prompt for paid preview plans. |
| `tests/entitlements.spec.ts` | Local entitlement skeleton, pricing plans, local billing disclaimer, no payment route directories. |
| `tests/multilingual-alias-contract.spec.ts` | Alias resolver, known canonical slugs, alias search UI, unknown alias no-action state. |

Focused commands for narrow regression runs:

```powershell
npm.cmd run test -- tests/mvp-smoke.spec.ts --workers=1
npm.cmd run test -- tests/review-state-regression.spec.ts tests/review-mode-routes.spec.ts --workers=1
npm.cmd run test -- tests/exam-pack-preview.spec.ts --workers=1
npm.cmd run test -- tests/paywall-triggers.spec.ts tests/paywall-surfaces.spec.ts tests/entitlements.spec.ts --workers=1
npm.cmd run test -- tests/multilingual-alias-contract.spec.ts --workers=1
```

Package script aliases also exist: `test:mvp`, `test:review`, `test:packs`,
`test:paywall`, and `test:e2e`.

## Manual QA Checklist

Use `docs/PAID_BETA_MANUAL_QA.md` for the step-by-step browser script.

Minimum manual pass before any paid beta invite:

- [ ] Clear all seven approved local storage keys.
- [ ] Save a `word_page` source word and confirm saved word plus review item.
- [ ] Save an `alias_search` source word and confirm source tagging.
- [ ] Save an `extension` source word and confirm source tagging.
- [ ] Complete a review card and confirm event/state/stats mutation.
- [ ] Create a weak word from a wrong answer and confirm weak score/miss state.
- [ ] Run `/review/weak-sprint` and confirm weak review events/state updates.
- [ ] Start Academic Vocabulary preview and confirm pack progress start.
- [ ] Complete Academic preview and confirm pack progress completion from real answers.
- [ ] Click Lite and Pro pricing CTAs and confirm local upgrade interest records.
- [ ] Confirm there is no real payment, checkout, billing, or subscription route.

## Paid Beta Funnel Checklist

- [x] Pricing page states billing is not connected.
- [x] Lite and Pro CTAs record local paid beta interest when no URL is configured.
- [x] Configured external paid beta URLs are sanitized to `http`/`https` and append `plan` and `source`.
- [x] Paywall prompts can record upgrade interest from trigger surfaces.
- [x] Tests assert no payment route directories are created.
- [ ] Manual QA must confirm both Lite and Pro write `vlx_upgrade_interest_v1`.
- [ ] P1: launch checklist should define allowed beta invite copy, support path, data reset disclosure, and no-payment language.
- [ ] P1: analytics coverage should be reviewed before launch. Current event emission is useful but not a complete production funnel.

## Multilingual Alias/Search Checklist

- [x] Alias resolver normalizes English casing and whitespace.
- [x] Korean/Japanese alias fixtures resolve only to known canonical English slugs.
- [x] Unknown aliases return no match and no fake actions.
- [x] Alias search UI links to `/word/[slug]` and `/save?slug=[slug]&source=alias_search`.
- [x] Alias entries pointing to missing slugs are skipped.
- [ ] Manual QA should verify alias search UI still works after local storage reset.
- [ ] P2: full multilingual pages and production alias pack loading remain future work.

## Weak Words Sprint Checklist

- [x] `/review/weak-sprint` exists.
- [x] Sprint size is capped at five cards.
- [x] Sprint candidates come from local weak state, wrong counts, weak score, and non-mastered state.
- [x] Empty state appears when no weak words exist.
- [x] Answers write review events, update review state, and use weak review question type.
- [x] Summary reports weak improvement and still-weak counts from answer/state data.
- [ ] Manual QA must verify a wrong answer creates a sprint candidate and that sprint answers mutate the same local review state.

## Pack Readiness Checklist

- [x] Pack reader can use static pack data or safe mock fallback.
- [x] Supported future file paths are represented in the pack contract.
- [x] Academic Vocabulary preview is available from current mock/fallback data.
- [x] Pack preview start writes local progress.
- [x] Pack preview completion writes reviewed/correct counts from actual review answers.
- [x] Planned IELTS and GRE routes are honest placeholders with no fake word counts or progress.
- [ ] P1: real IELTS/GRE paid pack content is missing.
- [ ] P1: R2/static pack source should be validated in a staging-like environment before paid beta.
- [ ] P1: pack reset/retry policy should be documented before learners rely on local progress.

## Placeholder/Planned Feature Inventory

Search terms used:

```txt
placeholder
planned
TODO
FIXME
mock
fallback
Billing is not connected
Paid beta placeholder
```

No `TODO` or `FIXME` matches were found in the searched code/docs.

| Finding | Files | Classification | Notes |
| --- | --- | --- | --- |
| Local mock pack data and fallback reader | `src/lib/packs/mock-data.ts`, `src/lib/packs/pack-reader.ts`, `src/lib/packs/index.ts`, tests | OK for beta; P1 before paid launch | Acceptable only while clearly labeled. Paid launch needs real pack content and staging R2 validation. |
| Planned IELTS/GRE pack placeholders | `src/lib/packs/preview.ts`, `src/app/packs/page.tsx`, `tests/exam-pack-preview.spec.ts` | P1 before paid launch | Current copy is honest and tests prevent fake progress, but paid pack value is incomplete. |
| Pricing and paid beta placeholder copy | `README.md`, `src/app/pricing/page.tsx`, `src/components/upgrade-placeholder-button.tsx`, `src/components/paywall-prompt.tsx`, paywall tests | OK for no-payment beta; P1 before paid launch | Strong safety copy exists. Launch copy still needs a checklist and review. |
| Local entitlement feature bullets say placeholder | `src/lib/entitlements/local-entitlements.ts` | Needs copy clarification | Lite/Pro bullets such as unlimited save/review placeholder and Pro placeholders should be made user-safe before paid launch. |
| Settings preference placeholder | `src/app/settings/page.tsx` | OK for beta | Clearly states no auth, billing, or payment settings. |
| Save route mock fallback source | `src/components/views/save-landing-view.tsx` | OK for beta; P1 before paid launch | Save does not create unknown words, but production pack source should be validated. |
| Review starter deck and distractor fallback use mock pack words | `src/components/views/review-session-view.tsx` | OK for beta; P1 before paid launch | The SRS loop is real; content remains starter/mock. Avoid claiming full content readiness. |
| Analytics source enums include mock/fallback/placeholder | `src/lib/analytics/types.ts` | OK for beta | Useful for honest event source tagging. |
| Paywall trigger copy references planned Pro tools | `src/lib/paywall/triggers.ts`, `tests/paywall-triggers.spec.ts` | Needs copy clarification | Safe for internal beta, but should be reviewed so users do not infer active paid entitlements. |
| Alias search input placeholder examples | `src/components/multilingual-alias-search.tsx` | OK for beta | UI placeholder only. Alias safety is covered by tests. |
| Roadmap and data contract mock/planned references | `ROADMAP.md`, `DATA_CONTRACT.md`, `AGENTS.md` | OK for beta | Planning/reference docs, not shipped app claims. |
| Test fixtures assert mock/fallback/planned behavior | `tests/*.spec.ts` | OK for beta | These are evidence that placeholder behavior remains honest. |

## P0/P1/P2 Risk List

### P0

No active P0 blocker was identified in the code scan. The following are P0
conditions for paid beta readiness and must remain passing in validation and
manual QA:

| P0 condition | Current audit status |
| --- | --- |
| Save creates or preserves a review item. | Covered by `mvp-smoke` and `review-state-regression`; manual QA required. |
| Review answer updates review state. | Covered by SRS regression and route tests; manual QA required. |
| Due, Weak, and Mastered remain truthful. | Selectors and delayed mastery are tested; no fake mastery found. |
| Pack progress remains truthful. | Tests assert no fake planned pack progress and completion from real answers. |
| Upgrade interest capture works without real payment. | Paywall/pricing tests cover local interest records. |
| Alias search only links known safe canonical slugs. | Alias contract tests cover known/missing slugs and unknown no-action state. |
| Weak sprint updates real SRS state. | Review route tests cover sprint state update. |
| No-real-payment safety remains intact. | Tests assert no payment route directories and code has no payment SDK. |
| Production safety boundaries are not touched. | This PR must remain docs-only plus README links. |

### P1

- Missing real IELTS/GRE paid pack content.
- Placeholder copy that could confuse users around Lite/Pro entitlements.
- Missing manual QA docs before this audit PR. This PR adds the docs, but the
  QA run still must be performed before beta invite.
- Weak analytics coverage gaps. Event emission exists, but production funnel
  reporting is not audited.
- Lack of a launch checklist covering support, data reset disclosure, beta
  invite copy, rollback, and no-payment boundaries.
- `/saved` and `/word/[slug]` still rely on static/mock word data instead of
  the live local saved/review state.

### P2

- UI polish across dashboard, review summary, settings, and pricing.
- Future Supabase or account sync.
- Future full multilingual pages and production alias pack loading.
- Future AI mistake explanation.
- Future Chrome extension full integration beyond route helpers.

## Go/No-Go Recommendation

Recommendation: conditional Go for a limited no-payment beta readiness PR and
internal/manual QA. No-Go for real paid launch or real checkout.

The memory loop is far enough along to audit because Save -> Review ->
review_state/events -> Due/Weak/Mastered is represented locally and covered by
current tests. The beta should remain no-payment until all P0 checks pass in
validation/manual QA and the P1 launch/content/copy gaps are resolved.

Safety confirmation for this audit scope: Webflow, Cloudflare Workers, auth,
billing, DNS, payment settings, secrets, production data, and deployment
settings must remain untouched.
