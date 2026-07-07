# Track B Extension Save Review Loop Alignment

Date: 2026-07-07 KST

## Executive Summary

This alignment pass verifies the app-side contract for a Chrome extension save
entry point without rewriting the extension or changing production
infrastructure.

Expected app-side flow:

```txt
extension lookup
/save?slug=dissonance&source=extension
saved word becomes a New review item
due review can pick it up
weak review remains based on real mistake state
pricing and paywall actions stay beta-interest only
```

Current result:

- `/save?slug=dissonance&source=extension` is a safe app-side entry point.
- First save writes `vlx_saved_words_v1` and `vlx_review_state_v1`.
- The saved word stores `source: "extension"` because the current saved-word
  model supports source metadata.
- Page load does not write fake `vlx_review_events_v1`,
  `vlx_daily_stats_v1`, Weak state, Mastered state, payment, or entitlement.
- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated.

## Why This Follows #179

#179 added Exam Pack Content v1 and kept Academic Vocabulary, IELTS Writing,
and GRE Visual Verbal in a safe real-vs-planned posture. This PR follows that
merge by checking that words discovered outside the app can enter the same
Track B learning loop without inventing progress or launching paid behavior.

The extension path depends on the pack and review work from #179 because an
extension-saved word must land in the existing app-side queues:

- saved library and local review state
- due review
- weak review after real mistake evidence
- pack/pricing surfaces that still separate preview, planned, and paid-beta
  interest states

## Extension Save Review Contract

For this PR, the extension contract is app-side only:

```txt
/save?slug={wordSlug}&source=extension
```

Required behavior:

- Resolve the slug from current app pack/static word data.
- Save the word to `vlx_saved_words_v1`.
- Preserve existing saved-word and review-state records when present.
- Create a New review state item in `vlx_review_state_v1` when no review state
  exists.
- Preserve `source: "extension"` in saved-word metadata when the state model
  supports it.
- Avoid review events and daily stats until the learner answers a review card.
- Avoid Weak and Mastered state unless review evidence justifies it.
- Keep pricing and paywall actions as beta-interest only.

Out of scope:

- Chrome extension rewrite.
- Extension packaging, permissions, publishing, or store submission.
- Account sync.
- Production SRS sync.
- Checkout, billing, payment, subscription, invoice, or real entitlement.

## Current App-Side Behavior

`/save` accepts `slug` and `source` query parameters. The app normalizes
`source=extension`, resolves the word, writes a saved-word record, and creates a
local review-state item through the existing SRS storage helper.

First save for `dissonance` creates:

```ts
vlx_saved_words_v1.dissonance.source === "extension"
vlx_review_state_v1.dissonance.mastery === "New"
vlx_review_state_v1.dissonance.box === 0
vlx_review_state_v1.dissonance.correct === 0
vlx_review_state_v1.dissonance.wrong === 0
vlx_review_state_v1.dissonance.weakScore === 0
```

The page load does not create:

- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- fake Weak state
- fake Mastered state
- `vlx_upgrade_interest_v1`
- `vlx_plan_state_v1`

Existing state preservation:

- Existing saved words are not overwritten by a later save link.
- Existing review state is not downgraded or replaced.
- If a word already exists with a different source, the app preserves the
  existing saved-word metadata rather than rewriting history.

## What Is Real Vs Planned

Real now:

- App-side `/save?slug=...&source=extension` route behavior.
- Saved-word source metadata for `extension`.
- Local SRS review item creation for saved words.
- `/review?mode=saved`, `/review?mode=due`, and
  `/review?mode=word&slug=dissonance` support for saved extension words.
- Weak review selection from real `vlx_review_state_v1` evidence.
- Pricing CTA interest capture in `vlx_upgrade_interest_v1`.
- Academic Vocabulary active starter preview from current static data.
- IELTS Writing and GRE Visual Verbal preview-only planned paths.

Planned, not live:

- Chrome extension rewrite or release.
- Account sync across browsers/devices.
- Server-side SRS persistence.
- Full IELTS/GRE pack content and pack-specific review paths.
- AI mistake explanations.
- Real checkout, billing, subscription, paid entitlement, or public paid beta.

## Route Inventory

Approved app routes relevant to this contract:

| Route | Current status |
| --- | --- |
| `/save?slug=dissonance&source=extension` | Creates or preserves saved word and local review state. |
| `/saved` | Reads saved words, review state, events, and stats without writing review progress. |
| `/review?mode=saved` | Can review saved extension words. |
| `/review?mode=due` | Can review extension-saved words once their `nextDueAt` is due. |
| `/review?mode=word&slug=dissonance` | Supported focused review route for current pack word data. |
| `/review/due` | Direct due-review route. |
| `/review/weak` | Direct weak-review route from real Weak or weak-score evidence. |
| `/packs` | Loads current pack catalog. |
| `/packs/academic-vocabulary` | Active starter preview. |
| `/packs/ielts-writing-vocabulary` | Preview-only planned path. |
| `/packs/gre-visual-verbal` | Preview-only planned path. |
| `/pricing` | Interest-only pricing surface. |

Forbidden route directories remain absent:

```txt
src/app/checkout
src/app/billing
src/app/payment
src/app/payments
src/app/api/checkout
src/app/api/billing
src/app/api/payment
src/app/api/payments
```

## LocalStorage Key Inventory

Core learning-loop keys:

| Key | Current role |
| --- | --- |
| `vlx_saved_words_v1` | Saved word records, including `source: "extension"` when first saved from extension. |
| `vlx_review_state_v1` | SRS state for New, Learning, Weak, Strong, and Mastered. |
| `vlx_review_events_v1` | Review answers only. Not written on save page load. |
| `vlx_daily_stats_v1` | Daily review counters only. Not written on save page load. |

Adjacent local MVP keys:

| Key | Current role |
| --- | --- |
| `vlx_upgrade_interest_v1` | Interest-only pricing/paywall click records. Does not grant paid access. |
| `vlx_plan_state_v1` | Optional local plan skeleton read model. Not created by extension save. |
| `vlx_pack_progress_v1` | Pack preview progress from explicit pack review actions. Not created by extension save. |
| `vlx_pending_home_quiz` | Optional transition key, not required by this flow. |

## P0/P1/P2 Risk Summary

P0:

- Count: `0`
- No fake mastery, fake review events, fake daily stats, fake weak state,
  checkout, billing, payment, real entitlement, analytics SDK, tracking pixel,
  Chrome extension rewrite, private beta launch claim, or public paid beta
  unblock is introduced.

P1:

- Source preservation depends on the first saved-word record. The current model
  stores `source`, but an already-saved word keeps its existing source rather
  than being rewritten to `extension`.
- Extension entry is only as complete as current app pack/static word
  resolution. Unknown slugs remain safe failures with no saved or review state.
- Due timing for box 0 is intentionally immediate/soon for New items; manual QA
  should verify the extension-saved word appears in due review without bloating
  sessions.

P2:

- Future extension UI should explain that save is local to this browser until
  account sync is approved.
- Future source metadata could include a non-sensitive extension context, but
  only after a privacy review.
- Future server sync should preserve the existing local storage key contracts
  during migration.

## Safety Boundaries

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, analytics SDK, tracking pixel, Chrome
extension rewrite, or public paid beta unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake review events, fake daily stats, fake weak state, fake paid access,
private beta launch claim, or public paid beta launch claim were added.

`npm audit fix` was not run.

## Manual QA Checklist

1. Start the app with:

   ```powershell
   npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
   ```

2. Clear local storage for `http://127.0.0.1:3006`.

3. Open:

   ```txt
   http://127.0.0.1:3006/save?slug=dissonance&source=extension
   ```

4. Confirm the page shows Dissonance added to the review queue.

5. Inspect local storage:

   ```js
   JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}").dissonance
   JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}").dissonance
   localStorage.getItem("vlx_review_events_v1")
   localStorage.getItem("vlx_daily_stats_v1")
   ```

6. Confirm saved word source is `extension`.

7. Confirm review state is New or otherwise Learning-safe, with no Mastered or
   Weak state on save page load.

8. Open `/review?mode=saved` and confirm Dissonance can enter review.

9. Open `/review?mode=due` and confirm due review can pick up the saved item
   when `nextDueAt` is due.

10. Open `/review?mode=word&slug=dissonance` and confirm focused review works.

11. Open `/review?mode=weak` before any wrong answer and confirm no fake weak
    item appears.

12. Create a real wrong-answer or seeded local weak state in QA only, then
    confirm `/review?mode=weak` picks it up.

13. Open `/pricing`, click a Lite/Pro/Exam Pack CTA, and confirm only
    `vlx_upgrade_interest_v1` is written. Confirm no paid entitlement is
    created.

14. Open `/packs` and confirm Academic Vocabulary, IELTS Writing, and GRE
    Visual Verbal remain visible. Confirm IELTS/GRE remain preview-only/planned.

15. Confirm public paid beta remains No-Go and private/manual beta remains
    owner-gated where those states are mentioned.

## Future Extension Integration Plan

1. Keep the extension as a thin bridge to app routes until the local SRS loop,
   account sync, and privacy boundaries are ready.
2. Add extension-side tests that assert it opens only approved app URLs:
   `/save?slug=...&source=extension` and approved review modes.
3. Add privacy review before adding page URL, selected text, or browser context
   metadata to saved-word source records.
4. Add account-sync migration only after the server SRS contract can preserve
   `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, and
   `vlx_daily_stats_v1` semantics.
5. Keep paid upgrade actions interest-only until billing, entitlement,
   monitoring, privacy, accessibility, support, refund, rollback, and owner
   approval gates are complete.
