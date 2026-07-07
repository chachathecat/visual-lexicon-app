# Track B v3 Manual QA Script

Date: 2026-07-06  
Scope: local Track B v3 manual QA for the private/manual beta candidate audit.

This script verifies the Save -> Review -> Events -> Daily Stats -> Packs ->
Pricing path. It is manual evidence only. It does not launch private beta,
unblock public paid beta, connect billing, or grant entitlement.

Start the local server:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
```

Open:

```txt
http://127.0.0.1:3006/dashboard
```

## 1. Clear LocalStorage

In the browser console, run:

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

location.reload();
```

Expected:

- `/dashboard`, `/saved`, and `/packs` show honest empty or zero states.
- No Due, Weak, New, Learning, Mastered, pack progress, streak, or paid state is
  faked.
- No console errors appear during reload.

## 2. Save Word From Word Page Source

Visit:

```txt
http://127.0.0.1:3006/save?slug=dissonance&source=word_page
```

Expected:

- The page confirms `Dissonance` is saved for review.
- A review CTA is available.
- `vlx_saved_words_v1` exists.
- `vlx_review_state_v1` exists.

Console check:

```js
const saved = JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");

({
  savedSource: saved.dissonance?.source,
  stateExists: Boolean(state.dissonance),
  mastery: state.dissonance?.mastery,
  box: state.dissonance?.box,
  weakScore: state.dissonance?.weakScore
});
```

Expected:

- `savedSource` is `"word_page"`.
- `stateExists` is `true`.
- `mastery` is `"New"`.
- `box` is `0`.
- `weakScore` is `0`.

## 3. Save Word From Extension Source

Visit:

```txt
http://127.0.0.1:3006/save?slug=dissonance&source=extension
```

Expected:

- The existing saved word is preserved.
- Review state is not reset or downgraded.
- Extension source is accepted by the app-side save route.

Note: full browser-extension source tagging remains a P1 end-to-end QA item.

## 4. Run Due Review

Visit:

```txt
http://127.0.0.1:3006/review/due
```

Answer at least one card.

Expected:

- The due card comes from real `vlx_review_state_v1` due/new state.
- Feedback appears only after an answer.
- The answer writes a review event.
- The answer updates review state.
- The answer updates daily stats.

Console check:

```js
const events = JSON.parse(localStorage.getItem("vlx_review_events_v1") || "[]");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");
const stats = JSON.parse(localStorage.getItem("vlx_daily_stats_v1") || "{}");

({
  eventCount: events.length,
  reviewedState: state.dissonance,
  dailyStats: stats
});
```

Expected:

- `eventCount` is greater than `0`.
- `reviewedState.lastReviewedAt` is present.
- At least one `vlx_daily_stats_v1` day has `reviewed > 0`.

## 5. Seed Or Create Weak State

If `/review/weak` already has a real weak card, use it. Otherwise seed a weak
fixture from the console:

```js
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");
state.dissonance = {
  ...state.dissonance,
  slug: "dissonance",
  word: "Dissonance",
  hub: "academic-vocabulary",
  box: 0,
  mastery: "Weak",
  correct: state.dissonance?.correct || 0,
  wrong: Math.max(1, state.dissonance?.wrong || 0),
  streakCorrect: 0,
  lastReviewedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  nextDueAt: new Date(Date.now() - 60 * 1000).toISOString(),
  weakScore: Math.max(0.7, state.dissonance?.weakScore || 0)
};
localStorage.setItem("vlx_review_state_v1", JSON.stringify(state));
```

## 6. Run Weak Review

Visit:

```txt
http://127.0.0.1:3006/review/weak
```

Answer at least one card if a weak card appears.

Expected:

- Weak words come from `mastery === "Weak"`, wrong-answer evidence, or
  `weakScore`.
- No random saved word becomes weak without evidence.
- A weak review answer writes `vlx_review_events_v1`, updates
  `vlx_review_state_v1`, and updates `vlx_daily_stats_v1`.

## 7. Check Saved Library Tabs

Visit:

```txt
http://127.0.0.1:3006/saved
```

Check these tabs:

- Due
- Weak
- New
- Learning
- Mastered

Expected:

- Counts and rows are derived from `vlx_saved_words_v1` and
  `vlx_review_state_v1`.
- Mastered appears only with real `Mastered` plus box 5 evidence.
- The page does not write review events, daily stats, pack progress, plan state,
  or upgrade interest on load.

## 8. Check Packs With No Progress

Clear only pack progress:

```js
localStorage.removeItem("vlx_pack_progress_v1");
```

Visit:

```txt
http://127.0.0.1:3006/packs
```

Expected:

- Active packs, preview progress, and completed previews are zero.
- No `vlx_pack_progress_v1` record is created by loading `/packs`.
- Planned IELTS/GRE pack surfaces do not fake full content or progress.

## 9. Start Academic Preview

Visit:

```txt
http://127.0.0.1:3006/packs/academic-vocabulary
```

Click the Academic preview CTA.

Expected:

- Navigation goes to a review URL with `mode=hub`, `hub=academic-vocabulary`,
  `packId=academic-vocabulary`, and `source=pack_preview`.
- `vlx_pack_progress_v1` is created only after this explicit action.

Console check:

```js
const progress = JSON.parse(localStorage.getItem("vlx_pack_progress_v1") || "{}");

progress["academic-vocabulary"];
```

Expected:

- `previewStartedAt` or `startedAt` is present.
- No unrelated pack progress appears.

## 10. Complete Academic Preview

Answer the Academic preview review cards until summary, if cards are available.

Console check:

```js
const progress = JSON.parse(localStorage.getItem("vlx_pack_progress_v1") || "{}");
const academic = progress["academic-vocabulary"];

({
  previewCompletedAt: academic?.previewCompletedAt,
  reviewedCount: academic?.reviewedCount,
  correctCount: academic?.correctCount,
  source: academic?.source
});
```

Expected:

- Completed preview progress is based on real review answers.
- `reviewedCount` is not inflated by page views or planned copy.
- `correctCount` is between `0` and `reviewedCount`.

## 11. Check Pricing And Upgrade Interest

Visit:

```txt
http://127.0.0.1:3006/pricing
```

Click one or both interest CTAs:

- `Note Lite interest - billing not connected yet`
- `Note Pro interest - billing not connected yet`

Expected:

- The page says billing is not connected.
- No checkout opens when no placeholder payment URL is configured.
- No paid access, subscription, invoice, billing portal, or entitlement is
  created.
- `vlx_upgrade_interest_v1` records local interest.

Console check:

```js
const interest = JSON.parse(
  localStorage.getItem("vlx_upgrade_interest_v1") || "[]"
);

interest.map(({ plan, source, pagePath }) => ({ plan, source, pagePath }));
```

Expected:

- At least one record has `plan: "lite"` or `plan: "pro"`.
- Records are attribution-only and local-only.

## 12. Confirm No Checkout Payment Or Billing Route

Visit:

```txt
http://127.0.0.1:3006/checkout
http://127.0.0.1:3006/payment
http://127.0.0.1:3006/payments
http://127.0.0.1:3006/billing
http://127.0.0.1:3006/api/checkout
http://127.0.0.1:3006/api/payment
http://127.0.0.1:3006/api/payments
http://127.0.0.1:3006/api/billing
```

Expected:

- No app checkout, payment, payments, or billing flow exists.
- No page claims real paid entitlement or public paid beta availability.

Optional filesystem check:

```powershell
Get-ChildItem -Recurse -Directory src\app |
  Where-Object {
    $_.FullName -match '\\(checkout|billing|payment|payments)(\\|$)'
  }
```

Expected:

- The command prints no checkout, billing, payment, or payments route
  directories.

## 13. Confirm No Launch Claims

Inspect `/dashboard`, `/saved`, `/packs`, `/pricing`, and `/settings`.

Expected:

- Public paid beta remains No-Go.
- Private/manual beta remains owner-gated.
- The app does not present private beta as launched.
- The app does not present public paid beta as launched.
- No fake mastery, fake pack progress, fake entitlement, checkout, billing, or
  payment claim appears.

## 14. Mobile Smoke

Use a 390px wide viewport or a real phone.

Expected:

- `/dashboard`, `/review/due`, `/review/weak`, `/saved`, `/packs`, and
  `/pricing` render without overlapping text or hidden primary actions.
- Review answer and confidence controls are reachable and readable.
- Bottom navigation does not hide focused controls.

## 15. Keyboard Navigation Smoke

Using keyboard only:

- Navigate `/dashboard` to a review CTA.
- Answer a review card.
- Select confidence if shown.
- Continue to feedback or summary.
- Open `/saved` tabs.
- Open `/pricing` and reach the Lite/Pro interest CTA.

Expected:

- Focus order is visible and logical.
- Buttons and links have accessible names.
- Feedback/status changes are announced or visible.

## 16. Console Error Smoke

Open DevTools console while running the flow.

Expected:

- No uncaught errors during save, review, saved library, packs, pricing, or
  settings checks.
- Corrupt local payload handling fails safe and does not create fake progress or
  fake mastery.

## Pass Criteria

The manual QA run passes only if:

- Save creates or preserves review state.
- Review answers create events and update review state.
- Review answers update daily stats.
- Due, Weak, and Mastered come from real state.
- Pack progress is created only by explicit action or real review completion.
- Pricing records local upgrade interest only.
- No checkout, payment, billing, subscription, invoice, billing portal, payment
  SDK, analytics SDK, tracking pixel, real entitlement, public paid beta
  unblock, or beta launch claim appears.
