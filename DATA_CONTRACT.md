# DATA_CONTRACT.md — Visual Lexicon Learning App

## Purpose

This document defines the first stable data contract for the Visual Lexicon learning app.

The app must turn saved visual words into reviewable memory cards.

The first implementation may use localStorage.

Later implementations may sync the same shapes to Supabase or the existing account backend.

## Storage Keys

The localStorage MVP uses these keys:

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

Do not create competing storage keys without approval.

## Saved Word

A saved word is a lightweight item that may come from:

- Webflow word page
- Webflow hub page
- extension lookup
- app search
- review session
- exam pack preview

Type:

```ts
export type VlxSavedWord = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  source?: "word_page" | "hub_page" | "extension" | "app" | "exam_pack" | "manual";
  savedAt: string;
};
```

Storage shape:

```ts
export type VlxSavedWordsStore = Record<string, VlxSavedWord>;
```

Example:

```json
{
  "dissonance": {
    "slug": "dissonance",
    "word": "Dissonance",
    "image": "https://cdn.visuallexicon.org/images/dissonance.webp",
    "definition": "A clash between sounds, ideas, or feelings.",
    "hub": "academic-vocabulary",
    "source": "word_page",
    "savedAt": "2026-06-05T09:00:00.000Z"
  }
}
```

## Review State

Review state is the current memory state for each word.

Type:

```ts
export type VlxMasteryLabel =
  | "New"
  | "Learning"
  | "Weak"
  | "Strong"
  | "Mastered";

export type VlxReviewStateItem = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  box: 0 | 1 | 2 | 3 | 4 | 5;
  mastery: VlxMasteryLabel;
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: VlxQuestionType;
  createdAt: string;
  updatedAt: string;
};

export type VlxReviewStateStore = Record<string, VlxReviewStateItem>;
```

Example:

```json
{
  "dissonance": {
    "slug": "dissonance",
    "word": "Dissonance",
    "image": "https://cdn.visuallexicon.org/images/dissonance.webp",
    "definition": "A clash between sounds, ideas, or feelings.",
    "hub": "academic-vocabulary",
    "box": 2,
    "mastery": "Learning",
    "correct": 4,
    "wrong": 1,
    "streakCorrect": 2,
    "lastReviewedAt": "2026-06-05T09:00:00.000Z",
    "nextDueAt": "2026-06-08T09:00:00.000Z",
    "weakScore": 0.36,
    "avgResponseMs": 5100,
    "lastQuestionType": "image_to_word",
    "createdAt": "2026-06-01T09:00:00.000Z",
    "updatedAt": "2026-06-05T09:00:00.000Z"
  }
}
```

## Review Event

Every answer in a review session must create an event.

Type:

```ts
export type VlxQuestionType =
  | "image_to_word"
  | "definition_to_word"
  | "word_to_image"
  | "cloze"
  | "confusable_pair"
  | "saved_review"
  | "due_review"
  | "weak_review"
  | "exam_pack";

export type VlxReviewResult = "correct" | "wrong";

export type VlxReviewEvent = {
  eventId: string;
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  questionType: VlxQuestionType;
  selected?: string;
  answer: string;
  result: VlxReviewResult;
  responseMs: number;
  usedHint?: boolean;
  confidence?: "knew" | "guessed" | "forgot";
  createdAt: string;
  boxBefore: number;
  boxAfter: number;
  weakScoreBefore: number;
  weakScoreAfter: number;
};
```

Storage shape:

```ts
export type VlxReviewEventsStore = VlxReviewEvent[];
```

Example:

```json
[
  {
    "eventId": "evt_20260605_abc123",
    "sessionId": "s_20260605_review_001",
    "slug": "dissonance",
    "word": "Dissonance",
    "hub": "academic-vocabulary",
    "questionType": "image_to_word",
    "selected": "harmony",
    "answer": "dissonance",
    "result": "wrong",
    "responseMs": 6300,
    "usedHint": false,
    "confidence": "forgot",
    "createdAt": "2026-06-05T09:00:00.000Z",
    "boxBefore": 2,
    "boxAfter": 1,
    "weakScoreBefore": 0.36,
    "weakScoreAfter": 0.52
  }
]
```

## Daily Stats

Daily stats are used for dashboard and weekly reporting.

Type:

```ts
export type VlxDailyStatsItem = {
  date: string;
  reviewed: number;
  correct: number;
  wrong: number;
  mastered: number;
  weakAdded: number;
  minutes: number;
  sessions: number;
};

export type VlxDailyStatsStore = Record<string, VlxDailyStatsItem>;
```

Example:

```json
{
  "2026-06-05": {
    "date": "2026-06-05",
    "reviewed": 10,
    "correct": 7,
    "wrong": 3,
    "mastered": 1,
    "weakAdded": 2,
    "minutes": 4,
    "sessions": 1
  }
}
```

## SRS Box Schedule

Box schedule:

```txt
Box 0: due soon / same session / about 10 minutes
Box 1: due in 1 day
Box 2: due in 3 days
Box 3: due in 7 days
Box 4: due in 14 days
Box 5: due in 30 days
```

Recommended interval function:

```ts
export const VLX_BOX_INTERVAL_DAYS = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
} as const;
```

## Mastery Label Rules

Recommended mapping:

```txt
New:
box 0 and no review history

Weak:
wrong count is high, weakScore >= 0.6, or repeated wrong answer

Learning:
box 0–2 and not Weak

Strong:
box 3–4 and weakScore < 0.4

Mastered:
box 5 and delayed recall has been passed
```

Do not mark a word as Mastered only because it was saved.

Do not mark a word as Mastered only because it was answered correctly once.

## Review Update Input

Type:

```ts
export type VlxReviewAnswerInput = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  questionType: VlxQuestionType;
  selected?: string;
  answer: string;
  result: VlxReviewResult;
  responseMs: number;
  usedHint?: boolean;
  confidence?: "knew" | "guessed" | "forgot";
  createdAt?: string;
};
```

## Review Update Output

Type:

```ts
export type VlxReviewUpdateOutput = {
  event: VlxReviewEvent;
  state: VlxReviewStateItem;
  dailyStats: VlxDailyStatsItem;
};
```

## Review Update Rules

Correct answer:

- increment `correct`
- increment `streakCorrect`
- update `lastReviewedAt`
- update `avgResponseMs`
- update `lastQuestionType`

Box change:

```txt
Correct + fast + no hint + confidence knew:
box +1

Correct but slow:
box unchanged or +1 only if current box is low

Correct but guessed:
box unchanged

Correct with hint:
box unchanged

Wrong:
box -1 or box 0
```

Wrong answer:

- increment `wrong`
- reset `streakCorrect`
- increase `weakScore`
- shorten `nextDueAt`
- set mastery to `Weak` when needed

## Quiz Pack Manifest

Type:

```ts
export type VlxQuizPackManifest = {
  version: string;
  buildId: string;
  builtAt: string;
  source: "mock" | "r2" | "webflow_export" | "manual";
  wordCount: number;
  hubCount: number;
  packs: {
    core?: string;
    home?: string;
    hubs?: Record<string, string>;
    words?: Record<string, string>;
    examPacks?: Record<string, string>;
    searchLite?: string;
  };
};
```

Example:

```json
{
  "version": "v1",
  "buildId": "20260605_mock_v1",
  "builtAt": "2026-06-05T09:00:00.000Z",
  "source": "mock",
  "wordCount": 3,
  "hubCount": 1,
  "packs": {
    "core": "/quiz-pack/core-v1.json",
    "home": "/quiz-pack/home-v1.json",
    "hubs": {
      "academic-vocabulary": "/quiz-pack/hubs/academic-vocabulary.json"
    },
    "searchLite": "/search/search-lite-v1.json"
  }
}
```

## Quiz Word

Type:

```ts
export type VlxQuizWord = {
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
  cefr?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  difficulty?: "beginner" | "intermediate" | "advanced" | "exam" | "expert";
  relatedWords?: string[];
  confusableWords?: string[];
  distractors?: string[];
  updatedAt?: string;
};
```

Example:

```json
{
  "slug": "dissonance",
  "word": "Dissonance",
  "url": "https://www.visuallexicon.org/photos/dissonance",
  "image": "https://cdn.visuallexicon.org/images/dissonance.webp",
  "definition": "A clash between sounds, ideas, or feelings.",
  "example": "There was dissonance between his words and actions.",
  "memoryHook": "Two musical notes pulling in opposite directions.",
  "hub": "academic-vocabulary",
  "hubs": ["academic-vocabulary", "abstract-words"],
  "partOfSpeech": "noun",
  "cefr": "C1",
  "difficulty": "advanced",
  "relatedWords": ["discord", "conflict", "tension"],
  "confusableWords": ["harmony", "resonance"],
  "distractors": ["harmony", "resonance", "melody"],
  "updatedAt": "2026-06-05T09:00:00.000Z"
}
```

## Quiz Pack

Type:

```ts
export type VlxQuizPack = {
  packId: string;
  title: string;
  description?: string;
  mode: "home" | "core" | "hub" | "word" | "exam" | "language_pair";
  hub?: string;
  words: VlxQuizWord[];
  updatedAt: string;
};
```

## Multilingual Alias Contract

The first multilingual layer is alias/search mapping only.

It lets Korean and Japanese search terms enter the app and resolve to existing
English Visual Lexicon word cards. It does not create translated word pages,
translated card publishing, or full multilingual learning UI.

Initial alias language pairs:

```txt
ko -> en
ja -> en
en -> ko
en -> ja
```

Alias pack paths are reserved for future R2/static pack loading:

```txt
/aliases/manifest.json
/aliases/ko-en-v1.json
/aliases/ja-en-v1.json
/aliases/en-ko-v1.json
/aliases/en-ja-v1.json
```

Alias entries must point to known English card slugs from the current pack word
list. A resolver must not return an alias match for a missing slug.

Seed aliases:

```txt
불협화음 -> dissonance
모호하게 하다 -> obfuscate
명료한 -> lucid
풍부함 -> abundance

不協和音 -> dissonance
曖昧にする -> obfuscate
明快な -> lucid
豊富 -> abundance
```

English reverse aliases may expose the Korean or Japanese equivalent for a known
English card, but the card target remains the existing English visual card.

Full multilingual learning cards come later, after the paid beta upgrade path
and extension bridge are stable.

## Exam Pack

Type:

```ts
export type VlxExamPack = {
  packId: string;
  title: string;
  subtitle?: string;
  targetExam?: "academic" | "ielts" | "gre" | "toefl" | "sat" | "essay" | "custom";
  description?: string;
  priceTier?: "free" | "lite" | "pro" | "one_time";
  freePreviewCount: number;
  wordCount: number;
  days?: number;
  words: VlxQuizWord[];
  reviewSchedule?: VlxPackScheduleDay[];
  updatedAt: string;
};

export type VlxPackScheduleDay = {
  day: number;
  title: string;
  newWords: string[];
  reviewWords?: string[];
};
```

Initial exam packs:

```txt
Academic Vocabulary Pack
IELTS Writing Vocabulary Pack
GRE Visual Verbal Pack
```

## Language Pair Pack

Future multilingual packs should be pair-specific.

Initial language pairs:

```txt
ko→en
ja→en
ko→ja
en→ja
ja→ko
en→es
```

Type:

```ts
export type VlxLanguageCode =
  | "en"
  | "ko"
  | "ja"
  | "es"
  | "fr"
  | "de";

export type VlxLanguagePair = {
  baseLocale: VlxLanguageCode;
  targetLocale: VlxLanguageCode;
};

export type VlxLanguageCardType =
  | "image_to_target"
  | "base_gloss_to_target"
  | "example_cloze"
  | "audio_match"
  | "usage_contrast";

export type VlxLanguagePairCard = {
  cardId: string;
  conceptId: string;
  baseLocale: VlxLanguageCode;
  targetLocale: VlxLanguageCode;
  cardType: VlxLanguageCardType;
  prompt: {
    image?: string;
    baseHint?: string;
    example?: string;
  };
  answer: {
    lemma: string;
    pos?: string;
    reading?: string;
    audio?: string;
  };
  distractors: string[];
  monetizationTags?: string[];
};
```

Example:

```json
{
  "cardId": "card_ko_en_abundance_image_to_target",
  "conceptId": "concept_abundance_001",
  "baseLocale": "ko",
  "targetLocale": "en",
  "cardType": "image_to_target",
  "prompt": {
    "image": "img_abundance",
    "baseHint": "풍부함"
  },
  "answer": {
    "lemma": "abundance",
    "pos": "noun"
  },
  "distractors": ["scarcity", "quantity", "wealth"],
  "monetizationTags": ["academic", "ielts", "pro"]
}
```

## Pack Reader Behavior

The app should attempt remote pack loading first when configured.

If remote loading fails:

- show helpful error in development
- use mock pack fallback when available
- do not crash the review session
- do not call Webflow CMS from browser
- do not expose tokens

## Extension Bridge App-Side Contract

The Chrome extension may open only app-side learning routes. The app accepts
these URLs and treats `source=extension` as metadata for save/review analytics
and local saved-word state.

Routes:

```txt
/save?slug={slug}&source=extension
/review?mode=saved&source=extension
/review?mode=due&source=extension
/review?mode=word&slug={slug}&source=extension
/review?mode=hub&hub={hubSlug}&limit=10&source=extension
```

App-side helper:

```ts
buildExtensionSaveUrl(slug)
buildExtensionReviewUrl({ mode, slug, hub, limit })
normalizeExtensionSource(source)
isExtensionSource(source)
```

Extension bridge analytics events:

```txt
vlx_extension_open_app
vlx_extension_save_click
vlx_extension_review_start
vlx_extension_quiz_later_click
```

Privacy-safe payload fields for these extension bridge events:

```ts
{
  event: string;
  eventId: string;
  eventTime: string;
  source?: "extension";
  slug?: string;
  mode?: "saved" | "due" | "word" | "hub";
  userState?: "guest" | "free" | "lite" | "pro";
  pagePath?: string;
}
```

Do not include page text, browsing history, domain, full-page context, or full
capture data in extension bridge analytics payloads.

## Analytics Event Contract

Core events:

```txt
vlx_save_word_click
vlx_quiz_start
vlx_quiz_answer
vlx_quiz_complete
vlx_review_state_update
vlx_due_review_start
vlx_weak_review_start
vlx_extension_open_app
vlx_extension_save_click
vlx_extension_review_start
vlx_extension_quiz_later_click
vlx_paywall_view
vlx_upgrade_click
```

Recommended payload fields:

```ts
export type VlxAnalyticsEventPayload = {
  event: string;
  eventId: string;
  eventTime: string;
  userState?: "guest" | "free" | "lite" | "pro";
  pagePath?: string;
  source?: string;
  slug?: string;
  word?: string;
  hub?: string;
  mode?: string;
  questionType?: string;
  correct?: boolean;
  responseMs?: number;
  cardsSeen?: number;
  correctCount?: number;
  wrongCount?: number;
  weakWordsCount?: number;
};
```

## P0 Data Contract Completion

This data contract is ready for P0 when:

```txt
Saved words can create review state.
Review sessions create review events.
Review events update review state.
Daily stats update after a session.
Dashboard selectors compute Due / Weak / New / Mastered.
Quiz words can come from mock data or R2 packs.
Exam Pack and Language Pair Pack types are ready for future monetization.
```
