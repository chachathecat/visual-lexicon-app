# Saved Library v3 Memory Queue

Saved Library v3 makes `/saved` a memory queue instead of a passive bookmark
list.

Core model:

```txt
Saved word -> Review card -> Mistake evidence -> Due or Weak queue -> Mastery
```

## Queue Derivation

The page reads these browser-local stores:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

It does not write to review state, review events, daily stats, saved words, pack
progress, plan state, or upgrade interest on load.

Tabs are derived from local evidence:

- Due: saved words with valid review state whose `nextDueAt` is at or before
  now. Mastered words are excluded.
- Weak: saved words with real weak evidence: `mastery === "Weak"`,
  `weakScore > 0`, or `wrong > 0`.
- New: saved words with no review state, or New review state with no correct or
  wrong answers.
- Learning: saved words with review state that is not New, Weak, or Mastered.
- Mastered: saved words returned by the mastered selector, requiring
  `mastery === "Mastered"` and `box === 5`.
- All: all saved words with their best available review state. Missing review
  state is shown as honest New status.

## Primary CTA

The top action follows this decision tree:

```txt
Due > 0 -> Start due review -> /review/due
Weak > 0 -> Practice weak words -> /review/weak
New > 0 -> Review new saved words -> /review
Otherwise -> Find words to save -> /packs
```

## Read-Only Load

Loading `/saved` must be read-only for SRS state. Review answers remain the only
surface that appends `vlx_review_events_v1`, updates `vlx_review_state_v1`, and
updates `vlx_daily_stats_v1`.

## P0 Blockers

Fake mastery, fake due counts, fake weak counts, fake streaks, fake pack
progress, payment copy, checkout routes, billing routes, payment SDKs, and any
claim that public paid beta is launched are P0 blockers.

## Safety

Saved Library v3 does not touch Webflow, Cloudflare Workers, auth, billing,
payment, checkout, DNS, deployment settings, secrets, production data, R2
production objects, real user data, payment SDKs, real paid entitlement
behavior, or public paid beta launch posture.
