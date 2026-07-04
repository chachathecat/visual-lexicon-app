# Paid Beta Manual QA Script

Use this script against a local app server. The Playwright suites default to
`http://127.0.0.1:3006`, so this manual script uses the same URL.

Start the app:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
```

Open:

```txt
http://127.0.0.1:3006/dashboard
```

## Required Surface Coverage

This manual run must cover these Track B surfaces exactly:

```txt
/dashboard
/saved
/review
/review/due
/review/weak
/review/weak-sprint
/packs
/packs/academic-vocabulary
/pricing
/save?slug=dissonance&source=word_page
/word/dissonance
```

## 1. Clear Local Storage

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

- Dashboard shows no local memory loop data.
- `/saved` shows an honest "No saved words in this browser" empty state.
- `/word/dissonance` shows "No local memory state yet" in the local memory
  panel.
- No due, weak, mastered, or saved counts are faked.
- `/word/dissonance` does not show fake saved state, fake mastery, or a fake box
  in the local memory panel.

## 2. Save Word Page Word

Visit:

```txt
http://127.0.0.1:3006/save?slug=dissonance&source=word_page
```

Expected:

- Page says the word was saved to review.
- Page offers a review action.
- The saved word and review item exist locally.
- `/saved` shows `Dissonance` from local saved/review state and does not show
  sample words as saved.
- `/word/dissonance` shows `Saved locally`, `Source: Word page`, mastery
  `New`, `Box 0`, weak score `0`, and `0 correct, 0 wrong` from local storage.
- `/word/dissonance` does not use static/mock word card values for mastery,
  box, weak score, recall counts, or due date.

Console check:

```js
const saved = JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");

saved.dissonance.source;
state.dissonance.mastery;
state.dissonance.box;
state.dissonance.weakScore;
state.dissonance.correct;
state.dissonance.wrong;
```

Expected values:

- `saved.dissonance.source` is `"word_page"`.
- `state.dissonance.mastery` is `"New"`.
- `state.dissonance.box` is `0`.
- `state.dissonance.weakScore` is `0`.
- `state.dissonance.correct` is `0`.
- `state.dissonance.wrong` is `0`.

## 2A. Confirm Dashboard And Saved Library State

Visit:

```txt
http://127.0.0.1:3006/dashboard
http://127.0.0.1:3006/saved
```

Expected:

- `/dashboard` shows Today Memory Mission values from local SRS state.
- `/saved` shows `Dissonance` from local saved/review state.
- Neither page shows fake due, weak, mastered, saved, or streak values.

## 3. Save Alias Search Word

Use a different slug so duplicate-save preservation does not hide the new
source value.

Visit:

```txt
http://127.0.0.1:3006/save?slug=obfuscate&source=alias_search
```

Expected:

- Save succeeds.
- Source is recorded as `alias_search`.
- A review item exists.

Console check:

```js
const saved = JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");

saved.obfuscate.source;
Boolean(state.obfuscate);
```

Expected:

- `saved.obfuscate.source` is `"alias_search"`.
- `Boolean(state.obfuscate)` is `true`.

Current alias UI state:

- Alias resolver/data contracts remain available.
- Canonical DashboardV2 currently exposes no learner-facing alias-search UI.
- Use direct alias-search save routes for manual source-attribution QA.
- A future approved product surface is required before restoring alias-search
  UI tests.

## 4. Save Extension Source Word

Visit:

```txt
http://127.0.0.1:3006/save?slug=lucid&source=extension
```

Expected:

- Save succeeds.
- Source is recorded as `extension`.
- A review item exists.

Console check:

```js
const saved = JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");

saved.lucid.source;
Boolean(state.lucid);
```

Expected:

- `saved.lucid.source` is `"extension"`.
- `Boolean(state.lucid)` is `true`.

## 5. Complete A Review

Visit:

```txt
http://127.0.0.1:3006/review
```

Answer one or more visible cards, then continue until the summary appears.

Expected:

- Each answered card shows feedback.
- Summary shows reviewed, correct, wrong, weak, and moved-forward counts from
  actual answers.

## 5A. Check Due And Weak Routes

Visit:

```txt
http://127.0.0.1:3006/review/due
http://127.0.0.1:3006/review/weak
```

Expected:

- `/review/due` renders due words from `nextDueAt` and SRS state, or an honest
  empty state when no due words exist.
- `/review/weak` renders weak words from `Weak` mastery or `weakScore > 0`, or
  an honest empty state when no weak words exist.
- Neither route creates fake due, weak, mastered, or review-event state.

Console check:

```js
const events = JSON.parse(localStorage.getItem("vlx_review_events_v1") || "[]");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");
const stats = JSON.parse(localStorage.getItem("vlx_daily_stats_v1") || "{}");

events.length;
Object.keys(state).length;
Object.values(stats).reduce((sum, day) => sum + (day.reviewed || 0), 0);
```

Expected:

- `events.length` is greater than `0`.
- Review state still contains saved/reviewed words.
- Reviewed daily count is greater than `0`.

## 6. Trigger A Weak Word

Visit:

```txt
http://127.0.0.1:3006/review?mode=word&slug=dissonance&limit=1
```

Choose an answer that is not `Dissonance`, then view the summary.

Console check:

```js
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");

state.dissonance.wrong;
state.dissonance.weakScore;
state.dissonance.mastery;
```

Expected:

- `state.dissonance.wrong` is greater than `0`.
- `state.dissonance.weakScore` is greater than `0`.
- Mastery is not faked as `Mastered`.

## 7. Run Weak Sprint

Visit:

```txt
http://127.0.0.1:3006/review/weak-sprint
```

Expected:

- The sprint renders real weak words from local state.
- If no weak words appear, go back to step 6 and create one wrong answer.

Answer the sprint card(s), then view the summary.

Console check:

```js
const events = JSON.parse(localStorage.getItem("vlx_review_events_v1") || "[]");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");
const weakEvents = events.filter((event) => event.questionType === "weak_review");

weakEvents.length;
state.dissonance.lastQuestionType;
```

Expected:

- `weakEvents.length` is greater than `0`.
- The weak sprint updates the same review state record, not a separate fake
  sprint store.

## 8. Start Academic Pack Preview

First visit:

```txt
http://127.0.0.1:3006/packs
```

Expected:

- Pack cards do not show fake progress or fake paid access.
- Planned or locked pack states are honest about unavailable content/payment.

Visit:

```txt
http://127.0.0.1:3006/packs/academic-vocabulary
```

Click `Start preview review`.

Expected:

- Browser navigates to a review URL with:
  - `mode=hub`
  - `hub=academic-vocabulary`
  - `packId=academic-vocabulary`
  - `source=pack_preview`
- Pack progress start is recorded.

Console check:

```js
const progress = JSON.parse(localStorage.getItem("vlx_pack_progress_v1") || "{}");

progress["academic-vocabulary"].previewStartedAt;
progress["academic-vocabulary"].source;
```

Expected:

- `previewStartedAt` is a timestamp.
- `source` is `"pack_detail"` when started from the pack detail page.

## 9. Complete Academic Pack Preview

Answer the pack preview review cards until the summary appears.

Console check:

```js
const progress = JSON.parse(localStorage.getItem("vlx_pack_progress_v1") || "{}");
const academic = progress["academic-vocabulary"];

academic.previewCompletedAt;
academic.reviewedCount;
academic.correctCount;
academic.source;
```

Expected:

- `previewCompletedAt` is a timestamp.
- `reviewedCount` is greater than `0`.
- `correctCount` is between `0` and `reviewedCount`.
- `source` is `"review"`.

## 10. Click Pricing Lite And Pro CTA

Visit:

```txt
http://127.0.0.1:3006/pricing
```

Click `Preview Lite`, then click `Preview Pro`.

Expected:

- The page states billing is not connected.
- No checkout is opened when no paid beta URL is configured.
- Local upgrade interest records are created.

Console check:

```js
const interest = JSON.parse(
  localStorage.getItem("vlx_upgrade_interest_v1") || "[]"
);

interest.map((record) => ({
  plan: record.plan,
  source: record.source,
  pagePath: record.pagePath
}));
```

Expected:

- At least one record has `plan: "lite"` and `source: "pricing_page"`.
- At least one record has `plan: "pro"` and `source: "pricing_page"`.

## 11. Confirm No Real Payment Route Is Created

In the browser, visit:

```txt
http://127.0.0.1:3006/checkout
http://127.0.0.1:3006/billing
http://127.0.0.1:3006/api/checkout
http://127.0.0.1:3006/api/billing
```

Expected:

- These routes are not app payment or billing flows.
- There is no payment SDK, checkout page, subscription page, billing portal, or
  production payment action.
- No real payment route or production payment behavior exists.

Optional filesystem check:

```powershell
Get-ChildItem -Recurse -Directory src\app |
  Where-Object {
    $_.FullName -match '\\(payment|payments|billing|checkout)(\\|$)'
  }
```

Expected:

- The command prints no app payment, payments, billing, or checkout route
  directories.

## Pass Criteria

Manual QA passes only if:

- Saved words become review items.
- Review answers update event, state, and daily stat stores.
- Weak words are created from real misses and weak sprint updates the same SRS
  state.
- Pack progress reflects real preview start and review completion.
- Upgrade interest is local-only when billing is not connected.
- No real payment route or production payment behavior exists.

Any failure in those areas is a P0 blocker for paid beta readiness.
