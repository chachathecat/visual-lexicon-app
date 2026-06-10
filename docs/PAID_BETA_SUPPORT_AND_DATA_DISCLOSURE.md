# Paid Beta Support And Data Disclosure

Use these notes for private no-payment beta testers. They are user-facing and
should stay accurate until Visual Lexicon adds approved account sync, billing,
or production data storage.

## Beta Status

Visual Lexicon Track B is currently a private no-payment beta candidate.

- Billing is not connected.
- No real subscription is created.
- No production subscription exists.
- Learning progress is stored in local browser storage.
- There is no account sync.
- Progress may be reset during beta.

## Local Browser Storage Only

The beta stores learning state in the browser you use for testing. This means:

- Progress on one browser or device will not automatically appear on another.
- Clearing browser data can remove your saved words and review progress.
- We may ask testers to reset local data during beta.
- This local state is not proof of payment, subscription, or account ownership.

## What Data Is Stored Locally

The current local beta may use these browser `localStorage` keys:

| Key | What it stores | Notes |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word metadata keyed by slug. | Used to show the local saved library. |
| `vlx_review_state_v1` | SRS memory state such as box, mastery, correct/wrong counts, weak score, last reviewed, and next due. | Used for Due, Weak, and Mastered states. |
| `vlx_review_events_v1` | Review answer events such as question type, selected answer, result, response time, box after, weak score after, and created time. | Used to keep review history local. |
| `vlx_daily_stats_v1` | Local daily reviewed/correct/wrong stats. | Used for local progress summaries. |
| `vlx_pack_progress_v1` | Local pack preview start/completion and reviewed/correct counts. | Used for pack preview progress. |
| `vlx_plan_state_v1` | Local plan preview state. | Not a real subscription or billing record. |
| `vlx_upgrade_interest_v1` | Local Lite/Pro interest clicks. | Not checkout, payment, or subscription data. |
| `vlx_pending_home_quiz` | Optional transition state for a home quiz. | May not exist in every browser. |

Do not put sensitive personal information, payment details, passwords, API
keys, or private page content into feedback fields or browser console snippets.

## Local Analytics

The current beta analytics contract is local-only.

- The app may push sanitized Visual Lexicon events to `window.dataLayer`.
- These events are for local QA and funnel checks.
- No external analytics SDK is added by this beta candidate.
- Local dataLayer events are not a production analytics reporting pipeline.

Example local event names:

```txt
vlx_save_word
vlx_saved_library_view
vlx_word_memory_state_view
vlx_review_start
vlx_review_answer
vlx_review_complete
vlx_pack_preview_start
vlx_pack_preview_complete
vlx_pricing_interest
vlx_paywall_interest
```

These events should not contain email, auth tokens, API tokens, payment
credentials, full page text, browser history, account IDs, or production user
data.

## How To Clear Local Data

To reset the beta in your current browser, open the browser console on the app
and run:

```js
[
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1",
  "vlx_pending_home_quiz"
].forEach((key) => localStorage.removeItem(key));

location.reload();
```

This clears beta progress only in the current browser. It does not cancel a
subscription because no beta subscription is created.

## How To Report Bugs

When reporting a bug, include:

- The route or screen where it happened.
- The word, review mode, or pack you were testing.
- What you expected to happen.
- What actually happened.
- Whether it affected Save, Review, Due, Weak, Mastered, pricing, or local
  progress.
- Browser and device if relevant.
- Screenshot or console output if it helps, with private information removed.

Useful bug categories:

- Save did not create a review item.
- Review answer did not update memory state.
- Due, Weak, or Mastered looked fake or wrong.
- Saved library showed the wrong words.
- Pack preview progress looked fake.
- Pricing implied billing, checkout, or a subscription.
- Local data did not clear as expected.

## Support Boundary

During this beta, support can help with:

- Resetting local browser state.
- Reproducing Save -> Review -> Due/Weak/Mastered issues.
- Collecting route, browser, and console evidence for bugs.
- Clarifying that billing is not connected and no subscription exists.

Support cannot recover local browser progress after it is cleared, sync progress
between devices, manage a subscription, or process a payment because those
systems are not connected in this beta.
