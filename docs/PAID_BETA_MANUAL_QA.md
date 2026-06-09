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
- No due, weak, mastered, or saved counts are faked.

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

Console check:

```js
const saved = JSON.parse(localStorage.getItem("vlx_saved_words_v1") || "{}");
const state = JSON.parse(localStorage.getItem("vlx_review_state_v1") || "{}");

saved.dissonance.source;
state.dissonance.mastery;
state.dissonance.box;
```

Expected values:

- `saved.dissonance.source` is `"word_page"`.
- `state.dissonance.mastery` is `"New"`.
- `state.dissonance.box` is `0`.

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

Optional alias UI check:

- Open `/dashboard`.
- Use the Alias search panel.
- Confirm a known alias shows a canonical English card, a "View card" link, and
  a "Save to review" link.
- Confirm an unknown alias shows no card and no save action.

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
