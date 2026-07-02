"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PaywallPrompt } from "@/components/paywall-prompt";
import {
  MetricPill,
  TrackBAppShell,
  type TrackBNavigationItemId
} from "@/components/track-b";
import {
  CheckIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  XIcon
} from "@/components/track-b/icons";
import { WordVisualImage } from "@/components/word-visual-image";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import { readLocalPlanState, type VlxPlanId } from "@/lib/entitlements";
import { mockQuizWords } from "@/lib/packs/mock-data";
import { recordPackReviewCompleted } from "@/lib/packs/progress";
import type { VlxQuizWord } from "@/lib/packs/types";
import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateReviewLimitPaywall,
  type VlxPaywallPrompt
} from "@/lib/paywall";
import type { VlxReviewRouteMode } from "@/lib/review/route-contract";
import {
  getDueToday,
  getNewSaved,
  getReviewedToday,
  getWeakWords
} from "@/lib/srs/selectors";
import {
  applyReviewAnswer,
  readDailyStats,
  readReviewEvents,
  readReviewState,
  readSavedWords,
  VlxReviewStorageError
} from "@/lib/srs/storage";
import type {
  VlxMasteryLabel,
  VlxQuestionType,
  VlxReviewConfidence,
  VlxReviewResult,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_FAST_RESPONSE_MS } from "@/lib/srs/types";
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

const SESSION_SIZE = 5;
const WEAK_SPRINT_SIZE = 5;
type ReviewMode = VlxReviewRouteMode;
type ReviewSource = "due" | "weak" | "saved" | "starter" | "word" | "hub";
type SessionStatus = "loading" | "empty" | "active" | "summary";
type AnswerOptionSource = "confusable" | "same-hub" | "static-fallback";

export type ReviewRouteSession = {
  label: string;
  words: VlxQuizWord[];
  emptyTitle: string;
  emptyBody: string;
};

type ReviewableWord = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  memoryHook?: string;
  hub?: string;
  confusableWords?: string[];
  distractors?: string[];
  box?: number;
  mastery?: VlxMasteryLabel;
  weakScore?: number;
  source: ReviewSource;
};

type ReviewQuestion = ReviewableWord & {
  options: string[];
  optionSource: AnswerOptionSource;
  optionSourceLabel: string;
  questionType: VlxQuestionType;
};

type AvailabilityStats = {
  dueCount: number;
  weakCount: number;
  savedCount: number;
  localCandidateCount: number;
};

type PendingSelection = {
  eventId: string;
  selected: string;
  result: VlxReviewResult;
  responseMs: number;
  selectedAt: string;
};

type ReviewFeedbackKind = "correct-fast" | "correct-slow" | "guessed" | "wrong";

type SessionAnswer = {
  eventId: string;
  slug: string;
  word: string;
  selected: string;
  answer: string;
  result: VlxReviewResult;
  responseMs: number;
  confidence: VlxReviewConfidence;
  questionType: VlxQuestionType;
  boxBefore: number;
  boxAfter: number;
  weakScoreBefore: number;
  weakScoreAfter: number;
  weakAdded: boolean;
  weakImproved: boolean;
  movedForward: boolean;
  masteryAfter: VlxMasteryLabel;
  nextDueAt?: string;
  feedbackKind: ReviewFeedbackKind;
  explanation: string;
};

type SessionSummarySpotlight = {
  word: string;
  result: VlxReviewResult;
  mastery?: VlxMasteryLabel;
  weakScore: number;
  wrong: number;
  nextDueAt?: string;
};

type SessionSummary = {
  reviewed: number;
  correct: number;
  wrong: number;
  weakAdded: number;
  weakImproved: number;
  stillWeak: number;
  movedForward: number;
  weakRemaining: number;
  weakSpotlight?: SessionSummarySpotlight;
  nextDueAt?: string;
  nextDueWord?: string;
};

type ReviewPaywallSurface = {
  prompt: VlxPaywallPrompt;
  userState: VlxPlanId;
};

type ReviewPersistenceError = {
  fatal: boolean;
  message: string;
};

type ReviewModeCopy = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyBody: string;
  sourceLabel: string;
  sourceDetail: string;
  modeLabel: string;
};

const modeCopy = {
  mixed: {
    eyebrow: "Review Session",
    title: "A focused recall session for today's memory loop.",
    description:
      "One card, one question, one answer, confidence, feedback, next card, then summary.",
    emptyTitle: "No saved, due, or weak words yet",
    emptyBody:
      "Save a word or open a pack before starting review. The app is not inventing review work.",
    sourceLabel: "Saved, due, and weak queues",
    sourceDetail: "Built from vlx_review_state_v1 and vlx_saved_words_v1",
    modeLabel: "Saved Review"
  },
  saved: {
    eyebrow: "Saved Review",
    title: "Recall words from your saved library.",
    description:
      "One saved card at a time. Confidence is required before memory state updates.",
    emptyTitle: "No saved words yet",
    emptyBody:
      "Saved words appear here after a word is added to the local review loop.",
    sourceLabel: "Saved words",
    sourceDetail: "Built from vlx_saved_words_v1",
    modeLabel: "Saved Review"
  },
  due: {
    eyebrow: "Due Review",
    title: "Review the cards due now.",
    description:
      "One due card at a time. Each answer records confidence and updates memory state.",
    emptyTitle: "No due words right now",
    emptyBody:
      "No due words were found in vlx_review_state_v1. Return to Today or save more words to keep the loop moving.",
    sourceLabel: "Due queue",
    sourceDetail: "Due by nextDueAt from vlx_review_state_v1",
    modeLabel: "Due Review"
  },
  weak: {
    eyebrow: "Weak Review",
    title: "Repair fragile recall.",
    description:
      "One weak card at a time, using real mistake evidence from memory state.",
    emptyTitle: "No weak words right now",
    emptyBody:
      "Weak words appear after missed or fragile recall is stored locally. This page does not create fake weak work.",
    sourceLabel: "Weak queue",
    sourceDetail: "Selected from Weak mastery, weakScore, and misses",
    modeLabel: "Weak Review"
  },
  "weak-sprint": {
    eyebrow: "Weak Sprint",
    title: "A five-card sprint for fragile recall.",
    description:
      "One weak card at a time, limited to real local weak-word evidence.",
    emptyTitle: "No weak words right now.",
    emptyBody:
      "Weak sprints appear after missed or fragile recall is stored locally.",
    sourceLabel: "Weak sprint",
    sourceDetail: "Prioritized by weakScore, misses, and box",
    modeLabel: "Weak Sprint"
  },
  word: {
    eyebrow: "Focused Review",
    title: "Review one word in focus.",
    description:
      "One focused card. Answer, mark confidence, and update memory state locally.",
    emptyTitle: "No focused word available",
    emptyBody: "This focused review link did not resolve to a pack word.",
    sourceLabel: "Focused word",
    sourceDetail: "Static pack card with local SRS writeback",
    modeLabel: "Saved Review"
  },
  hub: {
    eyebrow: "Hub Review",
    title: "Review a vocabulary hub.",
    description:
      "One hub card at a time from static pack data with local memory-state writeback.",
    emptyTitle: "No hub cards available",
    emptyBody: "This hub review link did not resolve to any pack cards.",
    sourceLabel: "Hub pack",
    sourceDetail: "Static hub pack with local SRS writeback",
    modeLabel: "Saved Review"
  }
} satisfies Record<ReviewMode, ReviewModeCopy>;

const confidenceOptions = [
  {
    value: "knew",
    label: "I knew it",
    detail: "Confident recall can improve the box when it is fast enough."
  },
  {
    value: "guessed",
    label: "I guessed",
    detail: "Guessed correct answers do not advance the box."
  },
  {
    value: "forgot",
    label: "I forgot",
    detail: "Forgotten or wrong answers keep the card closer to review."
  }
] satisfies Array<{
  value: VlxReviewConfidence;
  label: string;
  detail: string;
}>;

const packWordsBySlug = new Map(mockQuizWords.map((word) => [word.slug, word]));

function getNowMs() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function createSessionId(mode: ReviewMode) {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `s_${datePart}_${mode}_${randomPart}`;
}

function createReviewEventId(sessionId: string, slug: string, cardIndex: number) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `evt_${sessionId}_${cardIndex + 1}_${slug}_${randomPart}`;
}

function normalizeTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}

function toOptionLabel(value: string) {
  return value
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .join(" ");
}

function rotateDeterministically(options: string[], slug: string) {
  if (options.length <= 1) {
    return options;
  }

  const offset =
    slug.split("").reduce((total, character) => total + character.charCodeAt(0), 0) %
    options.length;

  return [...options.slice(offset), ...options.slice(0, offset)];
}

function getOptionSourceLabel(source: AnswerOptionSource) {
  if (source === "confusable") {
    return "Static confusable and related candidates";
  }

  if (source === "same-hub") {
    return "Static same-hub candidates";
  }

  return "Static pack fallback candidates";
}

function buildOptions(word: ReviewableWord) {
  const answer = toOptionLabel(word.word);
  const confusableCandidates = [
    ...(word.confusableWords ?? []),
    ...(word.distractors ?? [])
  ];
  const sameHubWords = mockQuizWords
    .filter((packWord) => packWord.slug !== word.slug && packWord.hub === word.hub)
    .map((packWord) => packWord.word);
  const fallbackWords = mockQuizWords
    .filter((packWord) => packWord.slug !== word.slug)
    .map((packWord) => packWord.word);
  const optionSource: AnswerOptionSource = confusableCandidates.length
    ? "confusable"
    : sameHubWords.length
      ? "same-hub"
      : "static-fallback";
  const candidates = [
    answer,
    ...confusableCandidates,
    ...sameHubWords,
    ...fallbackWords
  ];
  const uniqueOptions: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const option = toOptionLabel(candidate);
    const key = normalizeTerm(option);

    if (!seen.has(key)) {
      seen.add(key);
      uniqueOptions.push(option);
    }

    if (uniqueOptions.length === 4) {
      break;
    }
  }

  return {
    options: rotateDeterministically(uniqueOptions, word.slug),
    optionSource,
    optionSourceLabel: getOptionSourceLabel(optionSource)
  };
}

function getQuestionType(
  word: ReviewableWord,
  mode: ReviewMode,
  index: number
): VlxQuestionType {
  if (word.source === "starter") {
    return index % 2 === 0 ? "image_to_word" : "definition_to_word";
  }

  if (word.source === "due" || mode === "due") {
    return "due_review";
  }

  if (word.source === "weak" || mode === "weak" || mode === "weak-sprint") {
    return "weak_review";
  }

  if (word.source === "saved") {
    return "saved_review";
  }

  return index % 2 === 0 ? "definition_to_word" : "image_to_word";
}

function getQuestionTypeLabel(questionType: VlxQuestionType) {
  switch (questionType) {
    case "image_to_word":
      return "Image to Word";
    case "definition_to_word":
      return "Definition to Word";
    case "saved_review":
      return "Saved Review";
    case "due_review":
      return "Due Review";
    case "weak_review":
      return "Weak Review";
    default:
      return "Review";
  }
}

function getPrompt(questionType: VlxQuestionType) {
  switch (questionType) {
    case "image_to_word":
      return "Choose the word that matches this visual cue.";
    case "definition_to_word":
      return "Choose the word that matches this definition.";
    case "saved_review":
      return "Recall the saved word from its memory clue.";
    case "due_review":
      return "This card is due. Choose the word that matches the clue.";
    case "weak_review":
      return "This card needs repair. Choose the word that matches the clue.";
    default:
      return "Choose the word that matches the clue.";
  }
}

function getClue(question: ReviewQuestion) {
  if (question.questionType === "image_to_word") {
    return question.memoryHook ?? question.definition ?? "Use the visual cue.";
  }

  return (
    question.definition ??
    question.memoryHook ??
    "Use your saved memory state to recall this word."
  );
}

function mergePackWord(slug: string) {
  return packWordsBySlug.get(slug);
}

function fromStateItem(
  item: VlxReviewStateItem,
  source: "due" | "weak"
): ReviewableWord {
  const packWord = mergePackWord(item.slug);

  return {
    slug: item.slug,
    word: item.word || packWord?.word || item.slug,
    image: item.image ?? packWord?.image,
    definition: item.definition ?? packWord?.definition,
    memoryHook: packWord?.memoryHook,
    hub: item.hub ?? packWord?.hub,
    confusableWords: packWord?.confusableWords,
    distractors: packWord?.distractors,
    box: item.box,
    mastery: item.mastery,
    weakScore: item.weakScore,
    source
  };
}

function fromSavedWord(
  savedWord: VlxSavedWord,
  stateItem?: VlxReviewStateItem
): ReviewableWord {
  const packWord = mergePackWord(savedWord.slug);

  return {
    slug: savedWord.slug,
    word: savedWord.word || packWord?.word || savedWord.slug,
    image: stateItem?.image ?? savedWord.image ?? packWord?.image,
    definition: stateItem?.definition ?? savedWord.definition ?? packWord?.definition,
    memoryHook: packWord?.memoryHook,
    hub: stateItem?.hub ?? savedWord.hub ?? packWord?.hub,
    confusableWords: packWord?.confusableWords,
    distractors: packWord?.distractors,
    box: stateItem?.box,
    mastery: stateItem?.mastery ?? "New",
    weakScore: stateItem?.weakScore,
    source: "saved"
  };
}

function fromPackWord(
  packWord: VlxQuizWord,
  source: Extract<ReviewSource, "starter" | "word" | "hub"> = "starter"
): ReviewableWord {
  return {
    slug: packWord.slug,
    word: packWord.word,
    image: packWord.image,
    definition: packWord.definition,
    memoryHook: packWord.memoryHook,
    hub: packWord.hub,
    confusableWords: packWord.confusableWords,
    distractors: packWord.distractors,
    mastery: "New",
    source
  };
}

function dedupeBySlug(words: ReviewableWord[]) {
  const seen = new Set<string>();

  return words.filter((word) => {
    if (seen.has(word.slug)) {
      return false;
    }

    seen.add(word.slug);
    return true;
  });
}

function toDate(value: string | Date) {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function isDueNow(item: VlxReviewStateItem, now: Date) {
  if (!item.nextDueAt) {
    return true;
  }

  const nextDueAt = toDate(item.nextDueAt);

  return isValidDate(nextDueAt) && nextDueAt.getTime() <= now.getTime();
}

function sortByDueNowPriority(
  first: VlxReviewStateItem,
  second: VlxReviewStateItem
) {
  const firstDue = first.nextDueAt ? Date.parse(first.nextDueAt) : 0;
  const secondDue = second.nextDueAt ? Date.parse(second.nextDueAt) : 0;

  if (firstDue !== secondDue) {
    return firstDue - secondDue;
  }

  if (first.weakScore !== second.weakScore) {
    return second.weakScore - first.weakScore;
  }

  return first.slug.localeCompare(second.slug);
}

function getDueNow(reviewState: VlxReviewStateStore, now: Date = new Date()) {
  return Object.values(reviewState)
    .filter((item) => item.mastery !== "Mastered" && isDueNow(item, now))
    .sort(sortByDueNowPriority);
}

function getRouteWeakWords(reviewState: VlxReviewStateStore) {
  return Object.values(reviewState)
    .filter((item) => item.mastery === "Weak" || item.weakScore > 0)
    .sort((first, second) => {
      if (first.weakScore !== second.weakScore) {
        return second.weakScore - first.weakScore;
      }

      if (first.wrong !== second.wrong) {
        return second.wrong - first.wrong;
      }

      if (first.box !== second.box) {
        return first.box - second.box;
      }

      return first.slug.localeCompare(second.slug);
    });
}

function getWeakSprintWords(reviewState: VlxReviewStateStore) {
  return Object.values(reviewState)
    .filter(
      (item) =>
        item.mastery !== "Mastered" &&
        (item.mastery === "Weak" || item.weakScore > 0 || item.wrong > 0)
    )
    .sort((first, second) => {
      if (first.weakScore !== second.weakScore) {
        return second.weakScore - first.weakScore;
      }

      if (first.wrong !== second.wrong) {
        return second.wrong - first.wrong;
      }

      if (first.box !== second.box) {
        return first.box - second.box;
      }

      return first.slug.localeCompare(second.slug);
    });
}

function getSavedReviewWords(
  savedWords: VlxSavedWordsStore,
  reviewState: VlxReviewStateStore
) {
  return Object.values(savedWords)
    .sort((first, second) => Date.parse(second.savedAt) - Date.parse(first.savedAt))
    .map((savedWord) => fromSavedWord(savedWord, reviewState[savedWord.slug]));
}

function getAvailability(
  savedWords: VlxSavedWordsStore,
  reviewState: VlxReviewStateStore
): AvailabilityStats {
  const dueCount = getDueToday(reviewState).length;
  const weakCount = getWeakWords(reviewState).length;
  const savedCount = getNewSaved(savedWords, reviewState).length;

  return {
    dueCount,
    weakCount,
    savedCount,
    localCandidateCount: dedupeBySlug([
      ...getDueToday(reviewState).map((item) => fromStateItem(item, "due")),
      ...getWeakWords(reviewState).map((item) => fromStateItem(item, "weak")),
      ...getNewSaved(savedWords, reviewState).map((savedWord) =>
        fromSavedWord(savedWord)
      )
    ]).length
  };
}

function buildLocalWords(
  mode: ReviewMode,
  savedWords: VlxSavedWordsStore,
  reviewState: VlxReviewStateStore,
  limit: number
) {
  const dueWords = getDueToday(reviewState).map((item) =>
    fromStateItem(item, "due")
  );
  const weakWords = getWeakWords(reviewState).map((item) =>
    fromStateItem(item, "weak")
  );
  const savedReviewWords = getNewSaved(savedWords, reviewState).map((savedWord) =>
    fromSavedWord(savedWord)
  );

  if (mode === "saved") {
    return dedupeBySlug(getSavedReviewWords(savedWords, reviewState)).slice(
      0,
      limit
    );
  }

  if (mode === "due") {
    return dedupeBySlug(
      getDueNow(reviewState).map((item) => fromStateItem(item, "due"))
    ).slice(0, limit);
  }

  if (mode === "weak") {
    return dedupeBySlug(
      getRouteWeakWords(reviewState).map((item) => fromStateItem(item, "weak"))
    ).slice(0, limit);
  }

  if (mode === "weak-sprint") {
    return dedupeBySlug(
      getWeakSprintWords(reviewState).map((item) => fromStateItem(item, "weak"))
    ).slice(0, Math.min(limit, WEAK_SPRINT_SIZE));
  }

  return dedupeBySlug([
    ...dueWords,
    ...weakWords,
    ...savedReviewWords
  ]).slice(0, SESSION_SIZE);
}

function buildQuestions(words: ReviewableWord[], mode: ReviewMode) {
  return words.map((word, index) => ({
    ...word,
    ...buildOptions(word),
    questionType: getQuestionType(word, mode, index)
  }));
}

function isCorrectSelection(selected: string, answer: string) {
  return normalizeTerm(selected) === normalizeTerm(answer);
}

function getVisualClass(question: ReviewQuestion) {
  return getWordVisualImage(question.slug) || question.image
    ? " word-card__visual--image"
    : getWordVisualFallbackClass(question.slug);
}

function getVisualStyle(question: ReviewQuestion): CSSProperties | undefined {
  return !getWordVisualImage(question.slug) && question.image
    ? {
        backgroundImage: `url("${question.image}")`
      }
    : undefined;
}

function getReviewMemoryState(
  question: Pick<ReviewableWord, "mastery" | "source" | "weakScore">
) {
  if (question.mastery === "Weak" || (question.weakScore ?? 0) > 0) {
    return "weak";
  }

  if (question.mastery === "Mastered") {
    return "mastered";
  }

  if (question.mastery === "New" || question.source === "saved") {
    return "new";
  }

  return "due";
}

function ReviewMemoryPill({
  state
}: {
  state: "due" | "weak" | "new" | "mastered";
}) {
  const label =
    state === "weak"
      ? "Needs work"
      : state === "new"
        ? "New"
        : state === "mastered"
          ? "Mastered"
          : "Due now";

  return (
    <span className={`review-v2-memory-pill review-v2-memory-pill--${state}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

function ReviewQuestionVisual({ question }: { question: ReviewQuestion }) {
  return (
    <div
      aria-label={`Visual cue for ${question.word}`}
      className={`word-card__visual review-v2-card__visual${getVisualClass(
        question
      )}`}
      role="img"
      style={getVisualStyle(question)}
    >
      {getWordVisualImage(question.slug) ? (
        <WordVisualImage
          priority
          sizes="(max-width: 768px) 100vw, 560px"
          src={getWordVisualImage(question.slug) ?? ""}
        />
      ) : null}
      <div className="review-v2-card__visual-pill">
        <ReviewMemoryPill state={getReviewMemoryState(question)} />
      </div>
    </div>
  );
}

function ReviewResultThumbnail({ answer }: { answer: SessionAnswer }) {
  const packWord = mergePackWord(answer.slug);
  const visualImage = getWordVisualImage(answer.slug);
  const externalImage = visualImage ? undefined : packWord?.image;
  const style: CSSProperties | undefined = externalImage
    ? { backgroundImage: `url("${externalImage}")` }
    : undefined;
  const visualClass =
    visualImage || externalImage
      ? " word-card__visual--image"
      : getWordVisualFallbackClass(answer.slug);

  return (
    <div
      aria-hidden="true"
      className={`word-card__visual review-v2-result-row__thumb${visualClass}`}
      style={style}
    >
      {visualImage ? <WordVisualImage sizes="42px" src={visualImage} /> : null}
    </div>
  );
}

function getAnswerSummary(answers: SessionAnswer[]): SessionSummary {
  return {
    reviewed: answers.length,
    correct: answers.filter((answer) => answer.result === "correct").length,
    wrong: answers.filter((answer) => answer.result === "wrong").length,
    weakAdded: answers.filter((answer) => answer.weakAdded).length,
    weakImproved: answers.filter((answer) => answer.weakImproved).length,
    stillWeak: answers.filter((answer) => answer.result === "wrong").length,
    movedForward: answers.filter((answer) => answer.movedForward).length,
    weakRemaining: 0
  };
}

function getDateTime(value?: string) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const time = Date.parse(value);

  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function buildCompletedSummary(
  answers: SessionAnswer[],
  reviewState: VlxReviewStateStore
): SessionSummary {
  const answerSummary = getAnswerSummary(answers);
  const reviewedStates = answers
    .map((answer) => ({
      answer,
      state: reviewState[answer.slug]
    }))
    .filter(
      (
        item
      ): item is {
        answer: SessionAnswer;
        state: VlxReviewStateItem;
      } => Boolean(item.state)
    );
  const weakSpotlightCandidate = reviewedStates
    .filter(
      ({ answer, state }) =>
        answer.result === "wrong" ||
        state.mastery === "Weak" ||
        state.weakScore > 0
    )
    .sort((first, second) => {
      if (first.answer.result !== second.answer.result) {
        return first.answer.result === "wrong" ? -1 : 1;
      }

      if (first.state.weakScore !== second.state.weakScore) {
        return second.state.weakScore - first.state.weakScore;
      }

      return second.state.wrong - first.state.wrong;
    })[0];
  const nextDueCandidate = reviewedStates
    .filter(({ state }) => Boolean(state.nextDueAt))
    .sort(
      (first, second) =>
        getDateTime(first.state.nextDueAt) - getDateTime(second.state.nextDueAt)
    )[0];
  const stillWeak = reviewedStates.filter(({ answer, state }) => {
    const hasRemainingMistakes = state.wrong > 0 || answer.result === "wrong";

    return (
      hasRemainingMistakes &&
      (state.mastery === "Weak" || state.weakScore > 0 || state.wrong > 0)
    );
  }).length;

  return {
    ...answerSummary,
    stillWeak,
    weakRemaining: getWeakWords(reviewState).length,
    weakSpotlight: weakSpotlightCandidate
      ? {
          word: weakSpotlightCandidate.state.word,
          result: weakSpotlightCandidate.answer.result,
          mastery: weakSpotlightCandidate.state.mastery,
          weakScore: weakSpotlightCandidate.state.weakScore,
          wrong: weakSpotlightCandidate.state.wrong,
          nextDueAt: weakSpotlightCandidate.state.nextDueAt
        }
      : undefined,
    nextDueAt: nextDueCandidate?.state.nextDueAt,
    nextDueWord: nextDueCandidate?.state.word
  };
}

function getCommittedSessionAnswers(
  answers: SessionAnswer[],
  reviewEvents: ReturnType<typeof readReviewEvents>,
  sessionId: string
) {
  const committedEventIds = new Set(
    reviewEvents
      .filter((event) => event.sessionId === sessionId)
      .map((event) => event.eventId)
  );

  return answers.filter((answer) => committedEventIds.has(answer.eventId));
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getNextReviewMessage(nextDueAt?: string, word?: string) {
  if (!nextDueAt) {
    return undefined;
  }

  const label = formatDateLabel(nextDueAt);

  if (!label) {
    return undefined;
  }

  return word ? `${word} is next due ${label}.` : `Next review is due ${label}.`;
}

function getNextDueExplanation(summary: SessionSummary) {
  const nextReview = getNextReviewMessage(summary.nextDueAt, summary.nextDueWord);

  if (nextReview) {
    return `${nextReview} This comes from the updated memory schedule.`;
  }

  return "No next due time was scheduled because no committed answer had a due date.";
}

function formatWordCount(value: number) {
  return `${value} ${value === 1 ? "word" : "words"}`;
}

function getSessionSummaryHeadline(summary: SessionSummary) {
  if (summary.reviewed === 0) {
    return "No committed answers were saved.";
  }

  return `${formatWordCount(summary.reviewed)} reviewed. ${summary.correct} correct, ${summary.wrong} wrong.`;
}

function formatConfidence(confidence: VlxReviewConfidence) {
  if (confidence === "knew") {
    return "I knew it";
  }

  if (confidence === "guessed") {
    return "I guessed";
  }

  return "I forgot";
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getReviewFeedbackKind({
  confidence,
  responseMs,
  result
}: {
  confidence: VlxReviewConfidence;
  responseMs: number;
  result: VlxReviewResult;
}): ReviewFeedbackKind {
  if (result === "wrong") {
    return "wrong";
  }

  if (confidence === "guessed" || confidence === "forgot") {
    return "guessed";
  }

  return responseMs <= VLX_FAST_RESPONSE_MS ? "correct-fast" : "correct-slow";
}

function getFeedbackLabel(kind: ReviewFeedbackKind) {
  if (kind === "correct-fast") {
    return "Correct fast";
  }

  if (kind === "correct-slow") {
    return "Correct slow";
  }

  if (kind === "guessed") {
    return "Guessed";
  }

  return "Wrong";
}

function getFeedbackTitle(kind: ReviewFeedbackKind) {
  if (kind === "correct-fast") {
    return "Fast recall moved this card forward.";
  }

  if (kind === "correct-slow") {
    return "Correct, but still close to review.";
  }

  if (kind === "guessed") {
    return "Guess recorded without fake progress.";
  }

  return "Wrong answer recorded.";
}

function getFeedbackExplanation(
  question: ReviewQuestion,
  kind: ReviewFeedbackKind
) {
  const hook = question.memoryHook
    ? `Memory hook: ${question.memoryHook}`
    : question.definition
      ? `Definition: ${question.definition}`
      : "This feedback uses only the existing static card data.";

  if (kind === "correct-fast") {
    return `${hook} Fast confident recall can move the box forward and schedule a longer gap.`;
  }

  if (kind === "correct-slow") {
    return `${hook} Slow correct recall is saved, but the card stays closer until recall is steadier.`;
  }

  if (kind === "guessed") {
    return `${hook} Guessed correct answers are recorded, but they do not inflate the SRS box.`;
  }

  return `${hook} Wrong answers increase weakness and bring the card back sooner.`;
}

function getReviewSummaryPaywallSurface({
  packId,
  routeSource,
  sessionId
}: {
  packId?: string;
  routeSource?: string;
  sessionId: string;
}): ReviewPaywallSurface | null {
  const userState = readLocalPlanState().plan;

  if (packId && routeSource === "pack_preview") {
    const prompt = evaluateExamPackPreviewEndPaywall({
      plan: userState,
      packId,
      previewCompleted: true,
      source: "review_exam_pack_preview_end"
    });

    if (prompt) {
      return { prompt, userState };
    }
  }

  const dailyReviewedCount = getReviewedToday(readDailyStats());
  const reviewLimitPrompt = evaluateReviewLimitPaywall({
    plan: userState,
    dailyReviewedCount,
    source: "review_limit"
  });

  if (reviewLimitPrompt) {
    return { prompt: reviewLimitPrompt, userState };
  }

  const sessionWrongEvents = readReviewEvents().filter(
    (event) => event.sessionId === sessionId && event.result === "wrong"
  );
  const lastWrongEvent = sessionWrongEvents.at(-1);

  if (!lastWrongEvent) {
    return null;
  }

  const mistakePrompt = evaluateMistakeExplanationLockedPaywall({
    plan: userState,
    wrongCount: sessionWrongEvents.length,
    slug: lastWrongEvent.slug,
    source: "review_mistake_explanation"
  });

  return mistakePrompt ? { prompt: mistakePrompt, userState } : null;
}

function getReviewAnswerLiveMessage(answer: SessionAnswer) {
  const result = getFeedbackLabel(answer.feedbackKind);
  const nextDue = answer.nextDueAt
    ? `Next due ${formatDateLabel(answer.nextDueAt) ?? "soon"}.`
    : "Next due was not scheduled.";

  return `${result}. ${answer.word}. Memory state updated to ${answer.masteryAfter}. Box ${answer.boxBefore} to ${answer.boxAfter}. Weak score ${formatPercent(answer.weakScoreAfter)}. ${nextDue}`;
}

function getReviewSummaryLiveMessage(summary: SessionSummary) {
  return `Session complete. ${summary.reviewed} reviewed. ${summary.correct} correct. ${summary.wrong} wrong. ${summary.weakRemaining} weak words remain.`;
}

function getReviewPersistenceError(error: unknown): ReviewPersistenceError {
  if (error instanceof VlxReviewStorageError) {
    return {
      fatal: error.fatal,
      message: error.message
    };
  }

  return {
    fatal: false,
    message:
      "Memory state could not be saved. Your card did not advance; retry saving this answer."
  };
}

function getReviewShellActiveItem(mode: ReviewMode): TrackBNavigationItemId {
  return "review";
}

function getReviewShellPath(mode: ReviewMode) {
  if (mode === "due") {
    return "/review/due";
  }

  if (mode === "weak") {
    return "/review/weak";
  }

  if (mode === "weak-sprint") {
    return "/review/weak-sprint";
  }

  return "/review";
}

export function ReviewSessionView({
  limit = SESSION_SIZE,
  mode,
  packId,
  routeSession,
  routeSource
}: {
  limit?: number;
  mode: ReviewMode;
  packId?: string;
  routeSession?: ReviewRouteSession;
  routeSource?: string;
}) {
  const copy = modeCopy[mode];
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.floor(limit))
    : SESSION_SIZE;
  const sessionLimit =
    mode === "weak-sprint"
      ? Math.min(normalizedLimit, WEAK_SPRINT_SIZE)
      : normalizedLimit;
  const emptyTitle = routeSession?.emptyTitle ?? copy.emptyTitle;
  const emptyBody = routeSession?.emptyBody ?? copy.emptyBody;
  const cardStartedAt = useRef(getNowMs());
  const sessionStartedAtMs = useRef<number | null>(null);
  const completionRecordedSessionId = useRef<string | null>(null);
  const completionAnalyticsSessionId = useRef<string | null>(null);
  const reviewStartAnalyticsSessionIds = useRef(new Set<string>());
  const answerSubmissionLocked = useRef(false);
  const nextActionLocked = useRef(false);
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);
  const feedbackActionRef = useRef<HTMLButtonElement | null>(null);
  const summaryHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const storageErrorRef = useRef<HTMLDivElement | null>(null);
  const emptyPanelRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(
    null
  );
  const [pendingConfidence, setPendingConfidence] =
    useState<VlxReviewConfidence | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<SessionAnswer | null>(null);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [completedSummary, setCompletedSummary] = useState<SessionSummary | null>(
    null
  );
  const [availabilityStats, setAvailabilityStats] =
    useState<AvailabilityStats | null>(null);
  const [isPersistingAnswer, setIsPersistingAnswer] = useState(false);
  const [reviewPersistenceError, setReviewPersistenceError] =
    useState<ReviewPersistenceError | null>(null);
  const [summaryPaywallSurface, setSummaryPaywallSurface] =
    useState<ReviewPaywallSurface | null>(null);
  const [queueLabel, setQueueLabel] = useState(copy.sourceLabel);
  const [liveMessage, setLiveMessage] = useState(
    "Loading review state from local storage."
  );
  const [focusTarget, setFocusTarget] = useState<
    | "first-option"
    | "feedback-action"
    | "summary-heading"
    | "storage-error"
    | "empty-panel"
    | null
  >(null);

  const resetCardTimer = useCallback(() => {
    cardStartedAt.current = getNowMs();
  }, []);

  const startSession = useCallback(
    (
      words: ReviewableWord[],
      label: string,
      stats?: AvailabilityStats
    ) => {
      const nextQuestions = buildQuestions(
        dedupeBySlug(words).slice(0, sessionLimit),
        mode
      );
      answerSubmissionLocked.current = false;
      nextActionLocked.current = false;
      setIsPersistingAnswer(false);
      setReviewPersistenceError(null);

      if (!nextQuestions.length) {
        setStatus("empty");
        setCompletedSummary(null);
        setSummaryPaywallSurface(null);
        setPendingSelection(null);
        setPendingConfidence(null);
        setCurrentAnswer(null);
        setAvailabilityStats(null);
        setLiveMessage(`${copy.emptyTitle}. ${copy.emptyBody}`);
        completionRecordedSessionId.current = null;
        completionAnalyticsSessionId.current = null;
        sessionStartedAtMs.current = null;
        return;
      }

      const nextSessionId = createSessionId(mode);

      setQuestions(nextQuestions);
      setCurrentIndex(0);
      setSessionId(nextSessionId);
      setPendingSelection(null);
      setPendingConfidence(null);
      setCurrentAnswer(null);
      setAnswers([]);
      setCompletedSummary(null);
      setAvailabilityStats(stats ?? null);
      setReviewPersistenceError(null);
      setSummaryPaywallSurface(null);
      setQueueLabel(label);
      setStatus("active");
      setLiveMessage(
        `Review session ready. ${nextQuestions.length} ${nextQuestions.length === 1 ? "card" : "cards"} from ${label}.`
      );
      completionRecordedSessionId.current = null;
      completionAnalyticsSessionId.current = null;
      sessionStartedAtMs.current = getNowMs();
      resetCardTimer();
    },
    [copy.emptyBody, copy.emptyTitle, mode, resetCardTimer, sessionLimit]
  );

  const loadLocalSession = useCallback(() => {
    const savedWords = readSavedWords();
    const reviewState = readReviewState();
    const nextAvailability = getAvailability(savedWords, reviewState);

    if (routeSession) {
      const source = mode === "hub" ? "hub" : "word";
      const routeWords = routeSession.words.map((word) =>
        fromPackWord(word, source)
      );

      if (!routeWords.length) {
        answerSubmissionLocked.current = false;
        nextActionLocked.current = false;
        setIsPersistingAnswer(false);
        setReviewPersistenceError(null);
        setStatus("empty");
        setQuestions([]);
        setAnswers([]);
        setCompletedSummary(null);
        setSummaryPaywallSurface(null);
        setCurrentAnswer(null);
        setPendingSelection(null);
        setPendingConfidence(null);
        setAvailabilityStats(null);
        setLiveMessage(`${routeSession.emptyTitle}. ${routeSession.emptyBody}`);
        completionRecordedSessionId.current = null;
        completionAnalyticsSessionId.current = null;
        sessionStartedAtMs.current = null;
        return;
      }

      startSession(routeWords, routeSession.label, nextAvailability);
      return;
    }

    const localWords = buildLocalWords(mode, savedWords, reviewState, sessionLimit);

    if (!localWords.length) {
      answerSubmissionLocked.current = false;
      nextActionLocked.current = false;
      setIsPersistingAnswer(false);
      setReviewPersistenceError(null);
      setStatus("empty");
      setQuestions([]);
      setAnswers([]);
      setCompletedSummary(null);
      setSummaryPaywallSurface(null);
      setCurrentAnswer(null);
      setPendingSelection(null);
      setPendingConfidence(null);
      setAvailabilityStats(null);
      setLiveMessage(`${emptyTitle}. ${emptyBody}`);
      completionRecordedSessionId.current = null;
      completionAnalyticsSessionId.current = null;
      sessionStartedAtMs.current = null;
      return;
    }

    startSession(localWords, copy.sourceLabel, nextAvailability);
  }, [
    copy.sourceLabel,
    emptyBody,
    emptyTitle,
    mode,
    routeSession,
    sessionLimit,
    startSession
  ]);

  useEffect(() => {
    loadLocalSession();
  }, [loadLocalSession]);

  useEffect(() => {
    if (status !== "active" || !sessionId || !questions.length) {
      return;
    }

    const startTimer = window.setTimeout(() => {
      if (reviewStartAnalyticsSessionIds.current.has(sessionId)) {
        return;
      }

      reviewStartAnalyticsSessionIds.current.add(sessionId);
      emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewStart, {
        eventId: `vlx_review_start_${sessionId}`,
        sessionId,
        source: routeSource ?? queueLabel,
        mode,
        packId,
        queueSize: questions.length,
        dueCount: availabilityStats?.dueCount,
        weakCount: availabilityStats?.weakCount,
        hasLocalReviewState: questions.some(
          (question) => question.source === "due" || question.source === "weak"
        )
      });
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [
    availabilityStats?.dueCount,
    availabilityStats?.weakCount,
    mode,
    packId,
    questions,
    queueLabel,
    routeSource,
    sessionId,
    status
  ]);

  useEffect(() => {
    nextActionLocked.current = false;
  }, [currentIndex, status]);

  useEffect(() => {
    if (!focusTarget) {
      return;
    }

    const focusElement =
      focusTarget === "first-option"
        ? firstOptionRef.current
        : focusTarget === "feedback-action"
          ? feedbackActionRef.current
          : focusTarget === "summary-heading"
            ? summaryHeadingRef.current
            : focusTarget === "storage-error"
              ? storageErrorRef.current
              : emptyPanelRef.current;

    focusElement?.focus({ preventScroll: false });
    setFocusTarget(null);
  }, [currentAnswer, currentIndex, focusTarget, status]);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentAnswer?.selected ?? pendingSelection?.selected ?? null;
  const liveSummary = useMemo(() => getAnswerSummary(answers), [answers]);
  const summary = completedSummary ?? liveSummary;
  const nextDueExplanation = getNextDueExplanation(summary);

  function handleSelect(option: string) {
    if (
      !currentQuestion ||
      currentAnswer ||
      pendingSelection ||
      isPersistingAnswer
    ) {
      return;
    }

    setPendingSelection({
      eventId: createReviewEventId(sessionId, currentQuestion.slug, currentIndex),
      selected: option,
      selectedAt: new Date().toISOString(),
      responseMs: Math.max(0, Math.round(getNowMs() - cardStartedAt.current)),
      result: isCorrectSelection(option, currentQuestion.word)
        ? "correct"
        : "wrong"
    });
    setPendingConfidence(null);
    setReviewPersistenceError(null);
  }

  function commitPendingAnswer(confidence: VlxReviewConfidence) {
    if (
      !currentQuestion ||
      !pendingSelection ||
      currentAnswer ||
      answerSubmissionLocked.current
    ) {
      return;
    }

    answerSubmissionLocked.current = true;
    setIsPersistingAnswer(true);
    setPendingConfidence(confidence);
    setReviewPersistenceError(null);

    try {
      const previousState = readReviewState()[currentQuestion.slug];
      const output = applyReviewAnswer({
        eventId: pendingSelection.eventId,
        sessionId,
        slug: currentQuestion.slug,
        word: currentQuestion.word,
        image: currentQuestion.image,
        definition: currentQuestion.definition,
        hub: currentQuestion.hub,
        questionType: currentQuestion.questionType,
        selected: pendingSelection.selected,
        answer: currentQuestion.word,
        result: pendingSelection.result,
        responseMs: pendingSelection.responseMs,
        confidence,
        createdAt: pendingSelection.selectedAt
      });
      const feedbackKind = getReviewFeedbackKind({
        confidence: output.event.confidence ?? confidence,
        responseMs: output.event.responseMs,
        result: output.event.result
      });
      const answer: SessionAnswer = {
        eventId: output.event.eventId,
        slug: output.state.slug,
        word: output.state.word,
        selected: pendingSelection.selected,
        answer: output.event.answer,
        result: output.event.result,
        responseMs: output.event.responseMs,
        confidence: output.event.confidence ?? confidence,
        questionType: output.event.questionType,
        boxBefore: output.event.boxBefore,
        boxAfter: output.event.boxAfter,
        weakScoreBefore: output.event.weakScoreBefore,
        weakScoreAfter: output.event.weakScoreAfter,
        weakAdded:
          previousState?.mastery !== "Weak" && output.state.mastery === "Weak",
        weakImproved:
          output.event.weakScoreAfter < output.event.weakScoreBefore ||
          output.event.boxAfter > output.event.boxBefore,
        movedForward: output.event.boxAfter > output.event.boxBefore,
        masteryAfter: output.state.mastery,
        nextDueAt: output.state.nextDueAt,
        feedbackKind,
        explanation: getFeedbackExplanation(currentQuestion, feedbackKind)
      };

      setCurrentAnswer(answer);
      setAnswers((previousAnswers) =>
        previousAnswers.some(
          (previousAnswer) => previousAnswer.eventId === answer.eventId
        )
          ? previousAnswers
          : [...previousAnswers, answer]
      );
      setLiveMessage(getReviewAnswerLiveMessage(answer));
      setFocusTarget("feedback-action");

      emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewAnswer, {
        eventId: output.event.eventId,
        sessionId: output.event.sessionId,
        source: currentQuestion.source,
        slug: output.event.slug,
        mode,
        questionType: output.event.questionType,
        result: output.event.result,
        responseMs: output.event.responseMs,
        confidence: output.event.confidence ?? confidence,
        boxBefore: output.event.boxBefore,
        boxAfter: output.event.boxAfter,
        weakScoreBefore: output.event.weakScoreBefore,
        weakScoreAfter: output.event.weakScoreAfter,
        masteryAfter: output.state.mastery
      });
    } catch (error) {
      const persistenceError = getReviewPersistenceError(error);

      answerSubmissionLocked.current = false;
      setReviewPersistenceError(persistenceError);
      setLiveMessage(persistenceError.message);
      setFocusTarget("storage-error");
    } finally {
      setIsPersistingAnswer(false);
    }
  }

  function handleConfidence(confidence: VlxReviewConfidence) {
    commitPendingAnswer(confidence);
  }

  function handleRetryPersistence() {
    if (!pendingConfidence) {
      return;
    }

    commitPendingAnswer(pendingConfidence);
  }

  function handleNext() {
    if (!currentAnswer || nextActionLocked.current) {
      return;
    }

    nextActionLocked.current = true;

    if (currentIndex + 1 >= questions.length) {
      const committedAnswers = getCommittedSessionAnswers(
        answers,
        readReviewEvents(),
        sessionId
      );
      const nextSummary = buildCompletedSummary(
        committedAnswers,
        readReviewState()
      );
      const completedAt = new Date().toISOString();
      const isCompleteSession =
        committedAnswers.length === questions.length &&
        nextSummary.reviewed > 0 &&
        nextSummary.reviewed === nextSummary.correct + nextSummary.wrong;
      const durationMs =
        sessionStartedAtMs.current === null
          ? undefined
          : Math.max(0, Math.round(getNowMs() - sessionStartedAtMs.current));

      setAnswers(committedAnswers);
      setCompletedSummary(nextSummary);
      setLiveMessage(getReviewSummaryLiveMessage(nextSummary));

      if (packId && completionRecordedSessionId.current !== sessionId) {
        recordPackReviewCompleted({
          packId,
          reviewedCount: nextSummary.reviewed,
          correctCount: nextSummary.correct,
          reviewedAt: completedAt,
          source: "review"
        });
        completionRecordedSessionId.current = sessionId;
      }

      if (
        isCompleteSession &&
        completionAnalyticsSessionId.current !== sessionId
      ) {
        emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewComplete, {
          eventId: `vlx_review_complete_${sessionId}`,
          sessionId,
          source: routeSource ?? queueLabel,
          mode,
          packId,
          reviewedCount: nextSummary.reviewed,
          correctCount: nextSummary.correct,
          wrongCount: nextSummary.wrong,
          durationMs
        });
        completionAnalyticsSessionId.current = sessionId;
      }

      if (packId && routeSource === "pack_preview") {
        emitVlxEvent(VLX_ANALYTICS_EVENTS.packPreviewComplete, {
          source: "pack_preview",
          mode,
          packId,
          reviewedCount: nextSummary.reviewed,
          correctCount: nextSummary.correct,
          wrongCount: nextSummary.wrong
        });
      }
      setSummaryPaywallSurface(
        getReviewSummaryPaywallSurface({
          packId,
          routeSource,
          sessionId
        })
      );
      setStatus("summary");
      setFocusTarget("summary-heading");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setPendingSelection(null);
    setPendingConfidence(null);
    setCurrentAnswer(null);
    setReviewPersistenceError(null);
    setLiveMessage(
      `Next card. Card ${currentIndex + 2} of ${questions.length}.`
    );
    setFocusTarget("first-option");
    answerSubmissionLocked.current = false;
    resetCardTimer();
  }

  function getOptionClass(option: string) {
    if (!currentAnswer || !currentQuestion) {
      return selectedAnswer === option
        ? "review-option review-option--selected"
        : "review-option";
    }

    if (isCorrectSelection(option, currentQuestion.word)) {
      return "review-option review-option--correct";
    }

    if (option === selectedAnswer) {
      return "review-option review-option--wrong";
    }

    return "review-option";
  }

  return (
    <TrackBAppShell
      activeItemId={getReviewShellActiveItem(mode)}
      currentPath={getReviewShellPath(mode)}
    >
      <div className="review-v2-page">
        <h1 className="sr-only">{copy.title}</h1>
        <div
          aria-atomic="true"
          aria-live="polite"
          className="sr-only"
          data-testid="review-live-region"
          role="status"
        >
          {liveMessage}
        </div>

        {status === "loading" ? (
          <section className="review-v2-empty" aria-busy="true">
            <h2>Loading review state</h2>
            <p>Reading saved words and memory state from local storage.</p>
          </section>
        ) : null}

        {status === "empty" ? (
          <section
            className="review-v2-empty review-v2-focus-anchor"
            ref={emptyPanelRef}
            tabIndex={-1}
          >
            <p className="track-b-eyebrow">{copy.modeLabel}</p>
            <h2>{emptyTitle}</h2>
            <p>{emptyBody}</p>
            <div className="track-b-action-row">
              <Link
                aria-label="Back to Today"
                className="track-b-button track-b-button--primary"
                href="/dashboard"
                prefetch={false}
              >
                Back to dashboard
              </Link>
              <Link
                className="track-b-button track-b-button--quiet"
                href="/saved"
                prefetch={false}
              >
                Memory queue
              </Link>
              <Link
                className="track-b-button track-b-button--quiet"
                href="/packs"
                prefetch={false}
              >
                Browse packs
              </Link>
            </div>
          </section>
        ) : null}

        {status === "active" && currentQuestion ? (
          <section
            className="review-session review-v2-session"
            aria-labelledby="review-session-title"
          >
            <h2 className="sr-only">
              Card {currentIndex + 1} of {questions.length}
            </h2>
            <p className="sr-only">{copy.description}</p>
            <div
              aria-valuemax={questions.length}
              aria-valuemin={1}
              aria-valuenow={currentIndex + 1}
              aria-valuetext={`Card ${currentIndex + 1} of ${questions.length}`}
              className="review-v2-progress"
              role="progressbar"
            >
              <div aria-hidden="true">
                {questions.map((question, index) => {
                  const completedAnswer = answers[index];

                  return (
                    <span
                      className={
                        index === currentIndex
                          ? "review-v2-progress__bar review-v2-progress__bar--current"
                          : completedAnswer?.result === "correct"
                            ? "review-v2-progress__bar review-v2-progress__bar--correct"
                            : completedAnswer?.result === "wrong"
                              ? "review-v2-progress__bar review-v2-progress__bar--wrong"
                              : "review-v2-progress__bar"
                      }
                      key={question.slug}
                    />
                  );
                })}
              </div>
              <span>
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            <article className="review-v2-card" aria-label="Review card">
              <ReviewQuestionVisual question={currentQuestion} />
              <div className="review-v2-card__body">
                <h2 id="review-session-title">{currentQuestion.word}</h2>
                <p className="review-v2-card__phonetic">
                  /{currentQuestion.word.toLocaleLowerCase()}/
                </p>
                <p className="review-v2-card__question">
                  What does this word mean?
                </p>
                <p className="review-card__clue">{getClue(currentQuestion)}</p>

                {currentAnswer ? (
                  <div
                    className={`review-v2-inline-feedback review-v2-inline-feedback--${currentAnswer.result}`}
                  >
                    <span aria-hidden="true">
                      {currentAnswer.result === "correct" ? (
                        <CheckIcon size={11} strokeWidth={3} />
                      ) : (
                        <XIcon size={11} strokeWidth={3} />
                      )}
                    </span>
                    <div>
                      <h3>
                        {getFeedbackLabel(currentAnswer.feedbackKind)}
                      </h3>
                      <p>
                        {currentQuestion.definition ??
                          "This answer updated the local memory state."}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>

            <div className="review-v2-answer-block">
              <div className="review-v2-answer-heading sr-only">
                <h3>Answer</h3>
                <span>{currentQuestion.optionSourceLabel}</span>
              </div>
              <div className="review-options" aria-label="Answer choices">
                {currentQuestion.options.map((option, index) => (
                  <button
                    aria-pressed={selectedAnswer === option}
                    className={getOptionClass(option)}
                    disabled={
                      Boolean(currentAnswer) ||
                      Boolean(pendingSelection) ||
                      isPersistingAnswer
                    }
                    key={option}
                    onClick={() => handleSelect(option)}
                    ref={index === 0 ? firstOptionRef : undefined}
                    type="button"
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>

            {pendingSelection && !currentAnswer ? (
              <div
                className="review-v2-confidence"
                aria-labelledby="review-confidence-title"
              >
                <h3 className="sr-only" id="review-confidence-title">
                  How did that recall feel?
                </h3>
                <p>
                  {pendingSelection.result === "correct"
                    ? "How confident did you feel?"
                    : "How close were you?"}
                </p>
                <div className="review-v2-confidence__buttons">
                  {confidenceOptions.map((option) => {
                    const visibleLabel =
                      option.value === "knew"
                        ? "Knew it"
                        : option.value === "guessed"
                          ? "Sort of"
                          : "Not at all";

                    return (
                      <button
                        aria-label={option.label}
                        className="review-v2-confidence-button"
                        disabled={isPersistingAnswer || Boolean(pendingConfidence)}
                        key={option.value}
                        onClick={() => handleConfidence(option.value)}
                        type="button"
                      >
                        {visibleLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {reviewPersistenceError ? (
              <div
                className={`review-v2-storage-alert${
                  reviewPersistenceError.fatal
                    ? " review-v2-storage-alert--fatal"
                    : ""
                }`}
                ref={storageErrorRef}
                role="alert"
                tabIndex={-1}
              >
                <p>{reviewPersistenceError.message}</p>
                <button
                  className="track-b-button track-b-button--quiet"
                  disabled={isPersistingAnswer || !pendingConfidence}
                  onClick={handleRetryPersistence}
                  type="button"
                >
                  Retry save
                </button>
              </div>
            ) : null}

            {currentAnswer ? (
              <div
                className={`review-feedback review-v2-feedback review-v2-feedback--${currentAnswer.result}`}
              >
                <div className="review-v2-feedback__copy">
                  <p className="track-b-eyebrow">
                    {getFeedbackLabel(currentAnswer.feedbackKind)}
                  </p>
                  <h3>{getFeedbackTitle(currentAnswer.feedbackKind)}</h3>
                  <p>{currentAnswer.explanation}</p>
                  <p className="sr-only">
                    Memory state updated from this answer and confidence.
                  </p>
                  <dl className="review-v2-feedback__state">
                    <div>
                      <dt>Answer</dt>
                      <dd>{currentAnswer.answer}</dd>
                    </div>
                    <div>
                      <dt>Confidence</dt>
                      <dd>{formatConfidence(currentAnswer.confidence)}</dd>
                    </div>
                    <div>
                      <dt>Box</dt>
                      <dd>
                        {currentAnswer.boxBefore} to {currentAnswer.boxAfter}
                      </dd>
                    </div>
                    <div>
                      <dt>Next due</dt>
                      <dd>
                        {currentAnswer.nextDueAt
                          ? formatDateLabel(currentAnswer.nextDueAt)
                          : "Not scheduled"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <button
                  aria-label={
                    currentIndex + 1 >= questions.length
                      ? "View summary"
                      : "Next card"
                  }
                  className="track-b-button track-b-button--primary"
                  disabled={isPersistingAnswer}
                  onClick={handleNext}
                  ref={feedbackActionRef}
                  type="button"
                >
                  {currentIndex + 1 >= questions.length ? "View summary" : "Next word"}
                  <ChevronRightIcon size={16} />
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {status === "summary" ? (
          <section className="review-v2-summary" aria-labelledby="session-summary">
            <h2 className="sr-only" id="session-summary">
              Session summary
            </h2>
            <div className="review-v2-summary-card">
              <div className="review-v2-summary__header">
                <p className="track-b-eyebrow">Review complete</p>
                <h3
                  className="review-v2-focus-anchor"
                  ref={summaryHeadingRef}
                  tabIndex={-1}
                >
                  {getSessionSummaryHeadline(summary)}
                </h3>
                <p>{nextDueExplanation}</p>
              </div>

              <div
                aria-label="Session results"
                className="review-v2-summary-stats"
                data-testid="review-summary-stats"
              >
                <MetricPill
                  detail="answers committed"
                  label="Reviewed"
                  value={summary.reviewed}
                />
                <MetricPill
                  detail="answers marked correct"
                  label="Correct"
                  tone="strong"
                  value={summary.correct}
                />
                <MetricPill
                  detail="answers marked wrong"
                  label="Wrong"
                  tone="weak"
                  value={summary.wrong}
                />
                <MetricPill
                  detail="box or weak score improved"
                  label="Improved"
                  tone="learning"
                  value={summary.weakImproved}
                />
                <MetricPill
                  detail="still needs review evidence"
                  label="Still weak"
                  tone="weak"
                  value={summary.stillWeak}
                />
              </div>

              <div className="review-results" aria-label="Reviewed cards">
                {answers.map((answer) => (
                  <div
                    className={`review-result-row review-result-row--${answer.result}`}
                    key={answer.eventId}
                  >
                    <ReviewResultThumbnail answer={answer} />
                    <div>
                      <strong>{answer.word}</strong>
                      <span>
                        {answer.result === "correct"
                          ? answer.confidence === "knew"
                            ? "Recalled easily"
                            : "Recalled - keep going"
                          : "Will return sooner"}
                      </span>
                    </div>
                    <span aria-hidden="true">
                      {answer.result === "correct" ? (
                        <CheckIcon size={12} strokeWidth={2.5} />
                      ) : (
                        <RotateCcwIcon size={12} strokeWidth={2.5} />
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {summaryPaywallSurface ? (
                <PaywallPrompt
                  prompt={summaryPaywallSurface.prompt}
                  userState={summaryPaywallSurface.userState}
                />
              ) : null}

              <div className="track-b-action-row">
                <Link
                  className="track-b-button track-b-button--primary"
                  href="/dashboard"
                  prefetch={false}
                >
                  Back to dashboard
                </Link>
                <button
                  className="track-b-button track-b-button--quiet"
                  onClick={loadLocalSession}
                  type="button"
                >
                  <RotateCcwIcon size={13} />
                  Review again
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </TrackBAppShell>
  );
}
