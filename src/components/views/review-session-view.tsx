"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PaywallPrompt } from "@/components/paywall-prompt";
import {
  TrackBMetricCard,
  TrackBPageHeader,
  TrackBStatusBadge,
  type TrackBStatusTone
} from "@/components/track-b";
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
  readSavedWords
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

const SESSION_SIZE = 5;
const WEAK_SPRINT_SIZE = 5;
const visualCueSlugs = new Set([
  "dissonance",
  "abundance",
  "resilient",
  "laconic",
  "obfuscate",
  "lucid"
]);

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
  selected: string;
  result: VlxReviewResult;
  responseMs: number;
  selectedAt: string;
};

type SessionAnswer = {
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
      "One card at a time: answer, mark confidence, then see the real memory-state consequence.",
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
      "Saved sessions use local saved words and write review events only after confidence is recorded.",
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
      "Due cards come from the existing SRS schedule and update memory state after each answer.",
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
      "Weak sessions focus on real mistakes, weakScore, and low-confidence memory state.",
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
      "Weak Sprint is short, state-driven, and limited to real local weak-word evidence.",
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
      "Focused sessions start from pack data and still write review events and memory state locally.",
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
      "Hub sessions use static pack data for a deterministic short review set.",
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

function getVisualClass(slug: string) {
  return visualCueSlugs.has(slug) ? ` word-card__visual--${slug}` : "";
}

function getVisualStyle(question: ReviewQuestion): CSSProperties | undefined {
  return question.image
    ? {
        backgroundImage: `url(${question.image})`
      }
    : undefined;
}

function getMasteryTone(mastery?: VlxMasteryLabel): TrackBStatusTone {
  if (mastery === "Weak") {
    return "weak";
  }

  if (mastery === "Learning") {
    return "learning";
  }

  if (mastery === "Strong") {
    return "strong";
  }

  if (mastery === "Mastered") {
    return "mastered";
  }

  return "new";
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

function getFeedbackExplanation(question: ReviewQuestion, confidence: VlxReviewConfidence) {
  const hook = question.memoryHook
    ? `Memory hook: ${question.memoryHook}`
    : question.definition
      ? `Definition: ${question.definition}`
      : "This feedback uses only the existing static card data.";

  if (confidence === "guessed") {
    return `${hook} Guessed correct answers are recorded, but they do not inflate the SRS box.`;
  }

  if (confidence === "forgot") {
    return `${hook} Forgotten answers stay closer to review so the mistake record remains honest.`;
  }

  return hook;
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
  const completionRecordedSessionId = useRef<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(
    null
  );
  const [currentAnswer, setCurrentAnswer] = useState<SessionAnswer | null>(null);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [completedSummary, setCompletedSummary] = useState<SessionSummary | null>(
    null
  );
  const [summaryPaywallSurface, setSummaryPaywallSurface] =
    useState<ReviewPaywallSurface | null>(null);
  const [queueLabel, setQueueLabel] = useState(copy.sourceLabel);
  const [availability, setAvailability] = useState<AvailabilityStats>({
    dueCount: 0,
    weakCount: 0,
    savedCount: 0,
    localCandidateCount: 0
  });

  const resetCardTimer = useCallback(() => {
    cardStartedAt.current = getNowMs();
  }, []);

  const startSession = useCallback(
    (
      words: ReviewableWord[],
      label: string,
      stats?: AvailabilityStats
    ) => {
      const nextQuestions = buildQuestions(words.slice(0, sessionLimit), mode);

      if (!nextQuestions.length) {
        setStatus("empty");
        setCompletedSummary(null);
        setSummaryPaywallSurface(null);
        setPendingSelection(null);
        setCurrentAnswer(null);
        completionRecordedSessionId.current = null;
        return;
      }

      const nextSessionId = createSessionId(mode);
      const hasDueCards = nextQuestions.some((question) => question.source === "due");
      const hasWeakCards = nextQuestions.some(
        (question) => question.source === "weak"
      );

      setQuestions(nextQuestions);
      setCurrentIndex(0);
      setSessionId(nextSessionId);
      setPendingSelection(null);
      setCurrentAnswer(null);
      setAnswers([]);
      setCompletedSummary(null);
      setSummaryPaywallSurface(null);
      setQueueLabel(label);
      setStatus("active");
      completionRecordedSessionId.current = null;
      resetCardTimer();

      emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewStart, {
        source: routeSource ?? label,
        mode,
        packId,
        reviewedCount: nextQuestions.length,
        dueCount: stats?.dueCount,
        weakCount: stats?.weakCount,
        savedCount: stats?.savedCount,
        hasLocalReviewState: hasDueCards || hasWeakCards
      });
    },
    [mode, packId, resetCardTimer, routeSource, sessionLimit]
  );

  const loadLocalSession = useCallback(() => {
    const savedWords = readSavedWords();
    const reviewState = readReviewState();
    const nextAvailability = getAvailability(savedWords, reviewState);

    setAvailability(nextAvailability);

    if (routeSession) {
      const source = mode === "hub" ? "hub" : "word";
      const routeWords = routeSession.words.map((word) =>
        fromPackWord(word, source)
      );

      if (!routeWords.length) {
        setStatus("empty");
        setQuestions([]);
        setAnswers([]);
        setCompletedSummary(null);
        setSummaryPaywallSurface(null);
        setCurrentAnswer(null);
        setPendingSelection(null);
        completionRecordedSessionId.current = null;
        return;
      }

      startSession(routeWords, routeSession.label, nextAvailability);
      return;
    }

    const localWords = buildLocalWords(mode, savedWords, reviewState, sessionLimit);

    if (!localWords.length) {
      setStatus("empty");
      setQuestions([]);
      setAnswers([]);
      setCompletedSummary(null);
      setSummaryPaywallSurface(null);
      setCurrentAnswer(null);
      setPendingSelection(null);
      completionRecordedSessionId.current = null;
      return;
    }

    startSession(localWords, copy.sourceLabel, nextAvailability);
  }, [copy.sourceLabel, mode, routeSession, sessionLimit, startSession]);

  useEffect(() => {
    loadLocalSession();
  }, [loadLocalSession]);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = currentAnswer?.selected ?? pendingSelection?.selected ?? null;
  const liveSummary = useMemo(() => getAnswerSummary(answers), [answers]);
  const summary = completedSummary ?? liveSummary;
  const nextReviewMessage = getNextReviewMessage(
    summary.nextDueAt,
    summary.nextDueWord
  );

  function handleSelect(option: string) {
    if (!currentQuestion || currentAnswer) {
      return;
    }

    setPendingSelection({
      selected: option,
      selectedAt: new Date().toISOString(),
      responseMs: Math.max(0, Math.round(getNowMs() - cardStartedAt.current)),
      result: isCorrectSelection(option, currentQuestion.word)
        ? "correct"
        : "wrong"
    });
  }

  function handleConfidence(confidence: VlxReviewConfidence) {
    if (!currentQuestion || !pendingSelection || currentAnswer) {
      return;
    }

    const previousState = readReviewState()[currentQuestion.slug];
    const output = applyReviewAnswer({
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
    const answer: SessionAnswer = {
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
      explanation: getFeedbackExplanation(currentQuestion, confidence)
    };

    setCurrentAnswer(answer);
    setAnswers((previousAnswers) => [...previousAnswers, answer]);

    emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewAnswer, {
      source: currentQuestion.source,
      slug: output.event.slug,
      word: output.event.word,
      mode,
      questionType: output.event.questionType,
      result: output.event.result,
      boxBefore: output.event.boxBefore,
      boxAfter: output.event.boxAfter,
      weakScoreAfter: output.event.weakScoreAfter,
      mastery: output.state.mastery
    });
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      const nextSummary = buildCompletedSummary(answers, readReviewState());
      const completedAt = new Date().toISOString();

      setCompletedSummary(nextSummary);

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

      emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewComplete, {
        source: routeSource ?? queueLabel,
        mode,
        packId,
        reviewedCount: nextSummary.reviewed,
        correctCount: nextSummary.correct,
        wrongCount: nextSummary.wrong,
        weakCount: nextSummary.weakRemaining
      });

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
      return;
    }

    setCurrentIndex((index) => index + 1);
    setPendingSelection(null);
    setCurrentAnswer(null);
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
    <div className="page review-v2-page">
      <TrackBPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Link className="track-b-button track-b-button--quiet" href="/dashboard">
              Today
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/review/due">
              Due
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/review/weak">
              Weak
            </Link>
          </>
        }
        meta={
          <div className="review-v2-header-metrics" aria-label="Local review queues">
            <span>{availability.dueCount} due</span>
            <span>{availability.weakCount} weak</span>
            <span>{availability.savedCount} new saved</span>
          </div>
        }
      />

      {status === "loading" ? (
        <section className="review-v2-empty" aria-live="polite">
          <h2>Loading review state</h2>
          <p>Reading saved words and memory state from local storage.</p>
        </section>
      ) : null}

      {status === "empty" ? (
        <section className="review-v2-empty" aria-live="polite">
          <p className="track-b-eyebrow">{copy.modeLabel}</p>
          <h2>{emptyTitle}</h2>
          <p>{emptyBody}</p>
          <div className="track-b-action-row">
            <Link className="track-b-button track-b-button--primary" href="/dashboard">
              Back to Today
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/saved">
              Saved library
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/packs">
              Browse packs
            </Link>
          </div>
        </section>
      ) : null}

      {status === "active" && currentQuestion ? (
        <section className="review-session review-v2-session" aria-labelledby="review-session-title">
          <header className="review-session__topline review-v2-session__header">
            <div>
              <p className="track-b-eyebrow">{copy.modeLabel}</p>
              <h2 id="review-session-title">
                Card {currentIndex + 1} of {questions.length}
              </h2>
              <p>{queueLabel}. {copy.sourceDetail}.</p>
            </div>
            <div className="review-v2-session__badges" aria-label="Current card state">
              <span className="track-b-status-badge track-b-status-badge--due">
                {getQuestionTypeLabel(currentQuestion.questionType)}
              </span>
              {currentQuestion.mastery ? (
                <TrackBStatusBadge status={getMasteryTone(currentQuestion.mastery)} />
              ) : null}
            </div>
          </header>

          <article className="review-card review-v2-card" aria-label="Review card">
            <div
              aria-label={`Visual cue for ${currentQuestion.word}`}
              className={`word-card__visual review-card__visual review-v2-card__visual${getVisualClass(
                currentQuestion.slug
              )}${currentQuestion.image ? " word-card__visual--image" : ""}`}
              role="img"
              style={getVisualStyle(currentQuestion)}
            />
            <div className="review-card__body review-v2-card__body">
              <p className="track-b-eyebrow">
                {getPrompt(currentQuestion.questionType)}
              </p>
              <p className="review-card__clue">{getClue(currentQuestion)}</p>
              <dl className="review-v2-card__state">
                <div>
                  <dt>Source</dt>
                  <dd>{currentQuestion.source}</dd>
                </div>
                {typeof currentQuestion.box === "number" ? (
                  <div>
                    <dt>Box</dt>
                    <dd>{currentQuestion.box}</dd>
                  </div>
                ) : null}
                {typeof currentQuestion.weakScore === "number" ? (
                  <div>
                    <dt>Weak</dt>
                    <dd>{formatPercent(currentQuestion.weakScore)}</dd>
                  </div>
                ) : null}
                {currentQuestion.hub ? (
                  <div>
                    <dt>Hub</dt>
                    <dd>{currentQuestion.hub}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </article>

          <div className="review-v2-answer-block">
            <div className="review-v2-answer-heading">
              <h3>Answer</h3>
              <span>{currentQuestion.optionSourceLabel}</span>
            </div>
            <div className="review-options" aria-label="Answer choices">
              {currentQuestion.options.map((option) => (
                <button
                  aria-pressed={selectedAnswer === option}
                  className={getOptionClass(option)}
                  disabled={Boolean(currentAnswer)}
                  key={option}
                  onClick={() => handleSelect(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {pendingSelection && !currentAnswer ? (
            <div className="review-v2-confidence" aria-labelledby="review-confidence-title">
              <div>
                <p className="track-b-eyebrow">Confidence</p>
                <h3 id="review-confidence-title">How did that recall feel?</h3>
              </div>
              <div className="review-v2-confidence__buttons">
                {confidenceOptions.map((option) => (
                  <button
                    className="review-v2-confidence-button"
                    key={option.value}
                    onClick={() => handleConfidence(option.value)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    <small>{option.detail}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {currentAnswer ? (
            <div className="review-feedback review-v2-feedback" aria-live="polite">
              <div className="review-v2-feedback__copy">
                <p className="track-b-eyebrow">
                  {currentAnswer.result === "correct" ? "Correct" : "Review again"}
                </p>
                <h3>
                  {currentAnswer.result === "correct"
                    ? "Answer recorded"
                    : "Mistake recorded"}
                </h3>
                <p>{currentAnswer.explanation}</p>
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
                    <dt>Weak score</dt>
                    <dd>
                      {formatPercent(currentAnswer.weakScoreBefore)} to{" "}
                      {formatPercent(currentAnswer.weakScoreAfter)}
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
                className="track-b-button track-b-button--primary"
                onClick={handleNext}
                type="button"
              >
                {currentIndex + 1 >= questions.length ? "View summary" : "Next card"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {status === "summary" ? (
        <section className="review-v2-summary" aria-labelledby="session-summary">
          <div className="review-v2-summary__header">
            <div>
              <p className="track-b-eyebrow">Memory state updated</p>
              <h2 id="session-summary">Session summary</h2>
            </div>
            <span>{sessionId}</span>
          </div>

          <div className="summary-grid review-v2-summary__metrics">
            <TrackBMetricCard label="Reviewed" value={summary.reviewed} />
            <TrackBMetricCard label="Correct" value={summary.correct} tone="strong" />
            <TrackBMetricCard label="Wrong" value={summary.wrong} tone="weak" />
            <TrackBMetricCard
              label="Improved"
              value={summary.movedForward}
              description="Words that moved to a higher SRS box."
              tone="learning"
            />
            <TrackBMetricCard
              label="Weak remaining"
              value={summary.weakRemaining}
              description="Real weak words still in local review state."
              tone="weak"
            />
          </div>

          {summary.weakSpotlight || nextReviewMessage ? (
            <div className="session-summary-insights">
              {summary.weakSpotlight ? (
                <div className="session-summary-insight session-summary-insight--weak">
                  <span className="track-b-eyebrow">Weak word spotlight</span>
                  <h3>{summary.weakSpotlight.word}</h3>
                  <p>
                    {summary.weakSpotlight.result === "wrong"
                      ? "Missed in this session"
                      : "Still needs reinforcement"}{" "}
                    | {summary.weakSpotlight.mastery ?? "Learning"} | Weak score{" "}
                    {formatPercent(summary.weakSpotlight.weakScore)} |{" "}
                    {summary.weakSpotlight.wrong} misses recorded
                  </p>
                </div>
              ) : null}

              {nextReviewMessage ? (
                <div className="session-summary-insight">
                  <span className="track-b-eyebrow">Next review</span>
                  <p>{nextReviewMessage}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {summaryPaywallSurface ? (
            <PaywallPrompt
              prompt={summaryPaywallSurface.prompt}
              userState={summaryPaywallSurface.userState}
            />
          ) : null}

          <div className="review-results" aria-label="Reviewed cards">
            {answers.map((answer) => (
              <div className="review-result-row" key={`${answer.slug}-${answer.responseMs}`}>
                <div>
                  <strong>{answer.word}</strong>
                  <span>{getQuestionTypeLabel(answer.questionType)}</span>
                  <span>{formatConfidence(answer.confidence)}</span>
                </div>
                <div>
                  <span className={answer.result === "correct" ? "tag tag--strong" : "tag tag--weak"}>
                    {answer.result}
                  </span>
                  <span className="tag">
                    Box {answer.boxBefore} to {answer.boxAfter}
                  </span>
                  <span className="tag">{answer.masteryAfter}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="track-b-action-row">
            <Link className="track-b-button track-b-button--primary" href="/dashboard">
              Back to Today
            </Link>
            {summary.weakRemaining > 0 ? (
              <Link className="track-b-button track-b-button--quiet" href="/review/weak">
                Review weak words
              </Link>
            ) : null}
            <button className="track-b-button track-b-button--quiet" onClick={loadLocalSession} type="button">
              Start next session
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
