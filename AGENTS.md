# AGENTS.md — Visual Lexicon Learning App

## Project Mission

You are working on Visual Lexicon, a two-track education product.

Track A is the public discovery layer:

- `visuallexicon.org`
- Webflow public visual dictionary
- SEO word pages
- vocabulary hub pages
- image search
- guest ads
- public Save / Quiz / App CTA

Track B is the paid learning app:

- `app.visuallexicon.org`
- Vercel / Next.js app
- Save
- Review
- spaced repetition
- Due / Weak / Mastered
- Exam Packs
- Lite / Pro monetization
- future AI mistake explanations

The immediate goal is to build Track B without breaking Track A.

## Non-Negotiable Rules

Do not touch Webflow.

Do not touch Cloudflare production Workers.

Do not change billing, DNS, payment settings, or production user data.

Do not delete or mass-edit Webflow CMS items.

Do not modify existing production authentication, save, payment, or subscription logic unless a task explicitly asks for it.

Do not ask for secrets, API keys, passwords, tokens, or billing credentials.

Do not expose API tokens in frontend code.

Do not call Webflow CMS directly from the browser.

Build `app.visuallexicon.org` as a separate learning app.

Main priority:

Save → Review → review_state/events → Due/Weak/Mastered.

## Core Product Principle

Save is not enough.

Saved words must become review items.

Review is not enough.

Review must update memory state.

Memory state is the moat.

Do not fake mastery.

Do not use random easy distractors as the main quiz method.

Do not overbuild AI before the SRS loop works.

AI comes later, first as wrong-answer mistake explanation.

## North Star Metric

Weekly Reviewed Words.

This means the number of words a learner actually reviews in a week.

Traffic is not the primary goal.

Saved words are not the primary goal.

Repeated learning behavior is the primary goal.

## Core Learning Formula

Visual metaphor → Active recall → Mistake record → Spaced review → Mastery status → Paid habit

## Current Build Priority

The first app version must prove this loop:

1. A user saves a word.
2. The saved word becomes a review item.
3. The user reviews the word in a short session.
4. The answer creates a review event.
5. The review event updates review state.
6. The dashboard shows real Due / Weak / Mastered states.
7. Free / Lite / Pro gating can be added after the loop works.

## Approved Initial App Routes

Create or maintain these routes:

```txt
/
 /dashboard
 /saved
 /review
 /review/due
 /review/weak
 /packs
 /packs/[packId]
 /word/[slug]
 /pricing
 /settings
```

Do not add large new route groups without approval.

## Approved Local Storage Keys

Use these exact keys for the localStorage MVP:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Optional transition key:

```txt
vlx_pending_home_quiz
```

Do not invent competing SRS or mastery storage keys.

## Required Review State Fields

Each reviewed or saved word must be representable as:

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

## Required Review Event Fields

Each review answer must create an event shaped like:

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
  createdAt: string;
  boxAfter: number;
  weakScoreAfter: number;
}
```

## VLX 5-Box SRS Rules

Box 0: New or failed. Due soon or again in-session.

Box 1: First recall. Due in 1 day.

Box 2: Stable. Due in 3 days.

Box 3: Strong. Due in 7 days.

Box 4: Mastering. Due in 14 days.

Box 5: Mastered. Due in 30 days.

Update rules:

- Correct + fast + no hint: box +1.
- Correct but slow: keep box or apply only small improvement.
- Correct but guessed: keep box.
- Wrong: box -1 or box 0.
- Wrong answers come back sooner.
- Repeated mistakes increase weakScore.
- Do not mark a word as Mastered unless it has passed delayed recall.

## UI Principles

Visual Lexicon should feel:

- calm
- premium
- minimal
- warm
- credible
- learning-focused

Avoid:

- childish game UI
- noisy animations
- cluttered dashboards
- fake metrics
- overdramatic copy
- random badges that do not reflect real learning

Dashboard priority:

```txt
Today’s Memory Mission
{dueCount} words due · {weakCount} weak · 3 minutes

Primary actions:
Start Review
Practice Weak Words
Continue Deck
```

Saved Library should appear below learning modules, not above them.

## Data Pack Rules

The app should read static learning packs from R2 or mock data.

Support these future files:

```txt
/quiz-pack/manifest.json
/quiz-pack/core-v1.json
/quiz-pack/home-v1.json
/quiz-pack/hubs/{hub}.json
/quiz-pack/words/{slug}.json
/exam-packs/manifest.json
/exam-packs/{packId}.json
/search/search-lite-v1.json
```

Each quiz word should include:

```ts
{
  slug: string;
  word: string;
  url?: string;
  image?: string;
  definition: string;
  example?: string;
  memoryHook?: string;
  hub?: string;
  hubs?: string[];
  partOfSpeech?: string;
  cefr?: string;
  difficulty?: string;
  relatedWords?: string[];
  confusableWords?: string[];
  distractors?: string[];
  updatedAt?: string;
}
```

## Branch and PR Discipline

Use small branches.

Recommended branch names:

```txt
feat/app-scaffold
feat/pack-contract
feat/srs-engine
feat/review-ui
feat/dashboard-memory-mission
feat/r2-pack-reader
feat/save-landing
feat/webflow-bridge
feat/analytics-events
feat/exam-pack-preview
```

Each PR must include:

- summary
- changed files
- tests run
- screenshots if UI changed
- risks
- rollback note

## Merge Order

Merge in this order unless the Control Room says otherwise:

1. App Scaffold
2. Pack Data Contract
3. SRS Engine
4. Review UI
5. Dashboard Memory Mission
6. R2 Pack Reader
7. Save Landing Endpoint
8. Analytics Events
9. Free / Lite / Pro UI Gating
10. Exam Pack Preview
11. Webflow CTA Bridge

Webflow CTA Bridge must not be merged or applied before the app review flow works.

## Testing Expectations

Run available checks before finishing:

```txt
npm run typecheck
npm run lint
npm run test
npm run build
```

If a script does not exist, report that honestly.

Do not claim tests passed unless they actually ran.

## Safety Stop Conditions

Stop and ask for approval if a task requires:

- Webflow publishing
- Cloudflare production Worker changes
- DNS changes
- payment or Paddle changes
- billing changes
- production user data modification
- deleting R2 objects
- deleting CMS items
- exposing secrets
- changing login or authentication behavior

## Final Reminder

The goal is not to make another dictionary.

The goal is to turn saved visual words into remembered words.

Build the memory loop first.
