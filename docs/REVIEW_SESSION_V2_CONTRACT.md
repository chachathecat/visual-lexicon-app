# Review Session v2 Contract

Status: contract before implementation.

Scope: Track B review session behavior for the existing app routes only. This
document does not authorize a runtime review UI rewrite, new route group,
provider integration, account sync, payment, auth, deployment, Webflow, or
Cloudflare Worker change.

North Star: Weekly Reviewed Words.

Core loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Product Contract

Review Session v2 is a one-card focus mode. The learner sees one active recall
card, answers it, marks confidence, receives feedback from committed memory
state, and moves to the next card or session summary.

The first implementation must support these modes without adding new storage
keys or fake review work:

- `image_to_word` - show the visual metaphor image and ask for the word.
- `definition_to_word` - show the definition and ask for the word.
- saved review - review saved words that have real saved-word or review-state
  records.
- due review - review words whose `nextDueAt` is due from
  `vlx_review_state_v1`.
- weak review - review words with real weak evidence from review state.

Each card must complete this sequence:

```txt
prompt -> answer -> confidence -> committed event/state update -> feedback -> next
```

Feedback, progress, and summary state must appear only after the answer commit
succeeds. A failed commit keeps the learner on the same card and must not claim
that memory state was updated.

## Active Recall Rules

Review is built around active recall, not recognition padding.

- The learner must answer before seeing feedback.
- The card can use deterministic answer choices only when the candidates are
  credible confusable or related words from approved static app data.
- No random easy distractors are allowed as the main quiz method.
- If credible choices cannot be formed, the implementation must use a typed
  answer, a smaller deterministic choice set, or an honest empty/unavailable
  state.
- Hints, if later added, must be recorded and must not advance a word as though
  it was recalled unaided.

## Required State Contracts

Review Session v2 must preserve these localStorage keys:

```txt
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Saved review may also read `vlx_saved_words_v1`, but it must not invent a
competing review, mastery, session, or SRS storage key.

Each item in `vlx_review_state_v1` must be representable as:

```ts
{
  slug: string;
  word: string;
  image?: string;
  hub?: string;
  box: number;
  mastery: "New" | "Learning" | "Weak" | "Strong" | "Mastered";
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: string;
}
```

Each committed answer in `vlx_review_events_v1` must include the review event
evidence needed to rebuild memory state:

```ts
{
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  questionType: string;
  selected?: string;
  answer: string;
  result: "correct" | "wrong";
  responseMs: number;
  confidence: "knew" | "guessed" | "forgot";
  createdAt: string;
  boxAfter: number;
  weakScoreAfter: number;
}
```

`vlx_daily_stats_v1` must remain a derived daily rollup. It can summarize
reviewed, correct, wrong, mastered, weakAdded, minutes, and sessions, but review
events remain the evidence source for the session.

## Answer Event Contract

Review Session v2 requires responseMs tracking and correct/wrong event
recording for every committed answer.

- `responseMs` starts when the active card is ready for recall and stops when
  the learner submits the answer.
- `result` is exactly `correct` or `wrong`.
- `confidence` is exactly `knew`, `guessed`, or `forgot`.
- `questionType` is one of the supported review prompts or route modes, such as
  `image_to_word`, `definition_to_word`, `saved_review`, `due_review`, or
  `weak_review`.
- The event must be written before the UI claims success.
- Duplicate answer submissions must not double-increment state, events, daily
  stats, or the session summary.

## Confidence Contract

Confidence is part of the answer evidence, not decorative UI.

- `knew` means unaided recall. A correct, fast, no-hint `knew` answer may
  improve the box.
- `guessed` means the learner selected the right answer without reliable recall.
  A guessed correct answer records correctness but does not advance the box.
- `forgot` means the learner did not recall the word. A forgotten wrong answer
  should return sooner and increase weakness more than an ordinary miss.

## Box Update Rules

Review Session v2 uses the VLX 5-box SRS model:

```txt
Box 0: New or failed. Due soon or again in-session.
Box 1: First recall. Due in 1 day.
Box 2: Stable. Due in 3 days.
Box 3: Strong. Due in 7 days.
Box 4: Mastering. Due in 14 days.
Box 5: Mastered. Due in 30 days.
```

Box update rules:

- Correct, fast, `knew`, and no hint: advance by one box.
- Correct but slow: keep the box or apply only the existing small improvement
  rule.
- Correct but `guessed`: keep the box.
- Correct with a hint: keep the box.
- Wrong: move down one box or to Box 0.
- Repeated mistakes: prefer Box 0 and return the word sooner.
- Box 5 / `Mastered` requires delayed recall evidence. The UI must never mark
  a word Mastered just because it was saved, viewed, answered once, or completed
  in a session.

## weakScore Update Rules

`weakScore` is a real mistake signal, clamped between 0 and 1.

- Wrong answers increase `weakScore`.
- Repeated wrong answers increase `weakScore` more than first misses.
- `forgot` and very slow wrong answers add weakness.
- Correct `knew` answers reduce `weakScore`, with faster recall reducing it
  more than slow recall.
- Correct `guessed` or hinted answers may reduce `weakScore` only minimally.
- Weak review queues must come from `mastery === "Weak"`, high `weakScore`,
  repeated wrong answers, or wrong-heavy history, not from random saved words.

## nextDueAt Explanation

The feedback screen must explain `nextDueAt` in learner language, tied to the
box after the committed answer.

- Box 0 wrong answers come back soon, including same-session or short-delay
  retry behavior.
- Box 1 schedules roughly 1 day out.
- Box 2 schedules roughly 3 days out.
- Box 3 schedules roughly 7 days out.
- Box 4 schedules roughly 14 days out.
- Box 5 schedules roughly 30 days out and only after delayed recall qualifies
  the word as Mastered.

The UI must explain the consequence without promising exact delivery if local
storage is missing, stale, malformed, or unavailable.

## Queue Selection

Saved review:

- Reads saved words and preserves or creates review state as `New`.
- Duplicate saves must preserve existing review state.
- Saved library framing must support review, not bookmarks-only behavior.

Due review:

- Reads `vlx_review_state_v1`.
- Selects words whose `nextDueAt` is due.
- Excludes fake due work and words without trustworthy review-state evidence.
- Does not count Mastered words as due unless future rules explicitly define a
  Mastered maintenance review.

Weak review:

- Reads `vlx_review_state_v1`.
- Selects words with real weak evidence.
- Does not generate a weak queue from arbitrary saved words.

Missing, stale, or unknown state fails safe:

- Missing saved/review state shows an honest empty state.
- Malformed review state must not be silently overwritten by an answer commit.
- Unknown question types, invalid slugs, invalid timestamps, or impossible box
  values must block the commit or fall back to honest empty state.
- The UI must not infer Due, Weak, Strong, or Mastered when evidence is absent.

## Session Summary

The session summary is based on committed events, not optimistic UI state.

It must include:

- reviewed count
- correct count
- wrong count
- words improved
- weak words remaining or newly weak words
- next due consequences
- cards that failed to save, if any

The summary must exclude failed commits and duplicate event replays. It must not
claim mastery unless the committed review state is already `Mastered` through
the delayed-recall rule.

## Mobile Ergonomics

Mobile ergonomics are part of the contract:

- One active card fits the viewport without nested cards or competing panels.
- Primary answer and confidence controls are reachable with one hand.
- Tappable controls meet at least 44 by 44 CSS pixels.
- Text wraps without overlapping images, controls, or the bottom navigation.
- Feedback and next actions remain visible without precision scrolling.
- The design must respect safe-area insets and the existing Track B shell.
- There must be no layout shift caused by answer labels, confidence labels, or
  the summary count changing.

## Accessibility Expectations

Accessibility expectations:

- The card uses one clear heading and semantic button/form controls.
- Keyboard users can answer, set confidence, retry a failed save, and continue.
- Focus moves predictably after answer, confidence, feedback, retry, and next.
- Feedback and storage failures use appropriate live regions.
- Image prompts include useful alt text or a useful missing-image fallback.
- Color is not the only signal for correct, wrong, weak, due, or mastered.
- Reduced-motion preferences are respected for any transitions.
- Error copy must state that the answer was not saved when persistence fails.

## Safety Boundaries

This contract keeps the public paid beta blocked.

Required safety:

- No fake mastery.
- No random easy distractors.
- No fake due, weak, streak, dashboard, progress, or paid state.
- Missing/stale/unknown state fails safe.
- Public paid beta remains blocked until account sync, monitoring, privacy,
  accessibility, support, refund, rollback, and release gates pass.

This contract does not touch Webflow, Cloudflare Workers, R2, auth, billing,
payment, checkout, subscriptions, DNS, deployment settings, secrets, production
data, real user data, AI Tutor, route handlers, middleware, or provider SDKs.

## Definition Of Done For Implementation PR

The implementation PR is complete only when:

- Saved review creates or preserves review state.
- Review answers create events and update state.
- Due, Weak, and Mastered are derived from real state.
- `responseMs`, `result`, and `confidence` persist on committed events.
- Box, `weakScore`, and `nextDueAt` feedback comes from committed state.
- Empty, corrupted, and unavailable storage states fail safe.
- Mobile and keyboard flows pass manual QA.
- Tests cover changed contracts.
- Public paid beta remains blocked.
