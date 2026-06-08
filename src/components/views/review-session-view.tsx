"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { PaywallPrompt } from "@/components/paywall-prompt";
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
  VlxReviewResult,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

const SESSION_SIZE = 5;
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
  questionType: VlxQuestionType;
};

type AvailabilityStats = {
  dueCount: number;
  weakCount: number;
  savedCount: number;
  localCandidateCount: number;
};

type SessionAnswer = {
  slug: string;
  word: string;
  selected: string;
  answer: string;
  result: VlxReviewResult;
  responseMs: number;
  questionType: VlxQuestionType;
  boxBefore: number;
  boxAfter: number;
  weakScoreAfter: number;
  weakAdded: boolean;
  movedForward: boolean;
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
  movedForward: number;
  weakSpotlight?: SessionSummarySpotlight;
  nextDueAt?: string;
  nextDueWord?: string;
};

type ReviewPaywallSurface = {
  prompt: VlxPaywallPrompt;
  userState: VlxPlanId;
};

const modeCopy = {
  mixed: {
    eyebrow: "Review",
    title: "Five cards for today's memory loop.",
    description:
      "A short recall session built from saved words, due reviews, and weak words.",
    emptyTitle: "No saved, due, or weak words yet",
    emptyBody:
      "The review loop starts after a word is saved or a starter deck is opened.",
    sourceLabel: "Saved, due, and weak queues"
  },
  saved: {
    eyebrow: "Saved review",
    title: "Review words from your saved library.",
    description:
      "Saved sessions use local saved words and continue to update memory state after each answer.",
    emptyTitle: "No saved words yet",
    emptyBody:
      "Saved words appear here after a word is added to the local review loop.",
    sourceLabel: "Saved words"
  },
  due: {
    eyebrow: "Due review",
    title: "Review words due right now.",
    description:
      "Due cards use the existing SRS schedule and update memory state after each answer.",
    emptyTitle: "No words due right now",
    emptyBody:
      "Due words appear here when their next review time arrives. You can still try the starter deck.",
    sourceLabel: "Due queue"
  },
  weak: {
    eyebrow: "Weak words",
    title: "Practice words with fragile recall.",
    description:
      "Weak sessions focus on words with repeated mistakes or high weakScore.",
    emptyTitle: "No weak words right now",
    emptyBody:
      "Weak words appear after missed answers. The starter deck can create real review state.",
    sourceLabel: "Weak queue"
  },
  word: {
    eyebrow: "Focused review",
    title: "Review one word in focus.",
    description:
      "Focused sessions start from pack data and still write review events and memory state locally.",
    emptyTitle: "No focused word available",
    emptyBody:
      "This focused review link did not resolve to a pack word.",
    sourceLabel: "Focused word"
  },
  hub: {
    eyebrow: "Hub review",
    title: "Review a vocabulary hub.",
    description:
      "Hub sessions use pack data for a deterministic short review set.",
    emptyTitle: "No hub cards available",
    emptyBody:
      "This hub review link did not resolve to any pack cards.",
    sourceLabel: "Hub pack"
  }
} satisfies Record<ReviewMode, Record<string, string>>;

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

function buildOptions(word: ReviewableWord) {
  const answer = toOptionLabel(word.word);
  const sameHubWords = mockQuizWords
    .filter((packWord) => packWord.slug !== word.slug && packWord.hub === word.hub)
    .map((packWord) => packWord.word);
  const fallbackWords = mockQuizWords
    .filter((packWord) => packWord.slug !== word.slug)
    .map((packWord) => packWord.word);
  const candidates = [
    answer,
    ...(word.confusableWords ?? []),
    ...(word.distractors ?? []),
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

  return rotateDeterministically(uniqueOptions, word.slug);
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

  if (word.source === "weak" || mode === "weak") {
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
      return "This card needs reinforcement. Choose the word that matches the clue.";
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

  return dedupeBySlug([
    ...dueWords,
    ...weakWords,
    ...savedReviewWords
  ]).slice(0, SESSION_SIZE);
}

function buildQuestions(words: ReviewableWord[], mode: ReviewMode) {
  return words.map((word, index) => ({
    ...word,
    options: buildOptions(word),
    questionType: getQuestionType(word, mode, index)
  }));
}

function isCorrectSelection(selected: string, answer: string) {
  return normalizeTerm(selected) === normalizeTerm(answer);
}

function getVisualClass(slug: string) {
  return visualCueSlugs.has(slug) ? ` word-card__visual--${slug}` : "";
}

function getAnswerSummary(answers: SessionAnswer[]): SessionSummary {
  return {
    reviewed: answers.length,
    correct: answers.filter((answer) => answer.result === "correct").length,
    wrong: answers.filter((answer) => answer.result === "wrong").length,
    weakAdded: answers.filter((answer) => answer.weakAdded).length,
    movedForward: answers.filter((answer) => answer.movedForward).length
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

  return {
    ...answerSummary,
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
  const sessionLimit = Number.isFinite(limit)
    ? Math.max(1, Math.floor(limit))
    : SESSION_SIZE;
  const emptyTitle = routeSession?.emptyTitle ?? copy.emptyTitle;
  const emptyBody = routeSession?.emptyBody ?? copy.emptyBody;
  const cardStartedAt = useRef(getNowMs());
  const completionRecordedSessionId = useRef<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
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
      setSelectedAnswer(null);
      setCurrentAnswer(null);
      setAnswers([]);
      setCompletedSummary(null);
      setSummaryPaywallSurface(null);
      setQueueLabel(label);
      setStatus("active");
      completionRecordedSessionId.current = null;
      resetCardTimer();

      emitVlxEvent(VLX_ANALYTICS_EVENTS.quizStart, {
        sessionId: nextSessionId,
        userState: "guest",
        source: routeSource ?? label,
        mode,
        cardsSeen: nextQuestions.length,
        dueCount: stats?.dueCount,
        weakWordsCount: stats?.weakCount,
        savedWordsCount: stats?.savedCount,
        localCandidateCount: stats?.localCandidateCount
      });

      if (mode === "due" && hasDueCards) {
        emitVlxEvent(VLX_ANALYTICS_EVENTS.dueReviewStart, {
          sessionId: nextSessionId,
          userState: "guest",
          source: routeSource ?? label,
          mode,
          cardsSeen: nextQuestions.length,
          dueCount: stats?.dueCount,
          weakWordsCount: stats?.weakCount
        });
      }

      if (mode === "weak" && hasWeakCards) {
        emitVlxEvent(VLX_ANALYTICS_EVENTS.weakReviewStart, {
          sessionId: nextSessionId,
          userState: "guest",
          source: routeSource ?? label,
          mode,
          cardsSeen: nextQuestions.length,
          dueCount: stats?.dueCount,
          weakWordsCount: stats?.weakCount
        });
      }
    },
    [mode, resetCardTimer, routeSource, sessionLimit]
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
        setSelectedAnswer(null);
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
      setSelectedAnswer(null);
      completionRecordedSessionId.current = null;
      return;
    }

    startSession(localWords, copy.sourceLabel, nextAvailability);
  }, [copy.sourceLabel, mode, routeSession, sessionLimit, startSession]);

  useEffect(() => {
    loadLocalSession();
  }, [loadLocalSession]);

  const currentQuestion = questions[currentIndex];
  const liveSummary = useMemo(() => getAnswerSummary(answers), [answers]);
  const summary = completedSummary ?? liveSummary;
  const nextReviewMessage = getNextReviewMessage(
    summary.nextDueAt,
    summary.nextDueWord
  );

  function startStarterDeck() {
    startSession(
      mockQuizWords.slice(0, SESSION_SIZE).map((word) => fromPackWord(word)),
      "Mock starter deck",
      availability
    );
  }

  function handleSelect(option: string) {
    if (!currentQuestion || currentAnswer) {
      return;
    }

    const selectedAt = new Date().toISOString();
    const responseMs = Math.max(
      0,
      Math.round(getNowMs() - cardStartedAt.current)
    );
    const result: VlxReviewResult = isCorrectSelection(
      option,
      currentQuestion.word
    )
      ? "correct"
      : "wrong";
    const previousState = readReviewState()[currentQuestion.slug];
    const output = applyReviewAnswer({
      sessionId,
      slug: currentQuestion.slug,
      word: currentQuestion.word,
      image: currentQuestion.image,
      definition: currentQuestion.definition,
      hub: currentQuestion.hub,
      questionType: currentQuestion.questionType,
      selected: option,
      answer: currentQuestion.word,
      result,
      responseMs,
      confidence: result === "correct" ? "knew" : "forgot",
      createdAt: selectedAt
    });
    const answer: SessionAnswer = {
      slug: output.state.slug,
      word: output.state.word,
      selected: option,
      answer: output.event.answer,
      result: output.event.result,
      responseMs: output.event.responseMs,
      questionType: output.event.questionType,
      boxBefore: output.event.boxBefore,
      boxAfter: output.event.boxAfter,
      weakScoreAfter: output.event.weakScoreAfter,
      weakAdded:
        previousState?.mastery !== "Weak" && output.state.mastery === "Weak",
      movedForward: output.event.boxAfter > output.event.boxBefore
    };

    setSelectedAnswer(option);
    setCurrentAnswer(answer);
    setAnswers((previousAnswers) => [...previousAnswers, answer]);

    emitVlxEvent(VLX_ANALYTICS_EVENTS.quizAnswer, {
      sessionId: output.event.sessionId,
      userState: "guest",
      source: currentQuestion.source,
      slug: output.event.slug,
      word: output.event.word,
      hub: output.event.hub,
      mode,
      questionType: output.event.questionType,
      result: output.event.result,
      correct: output.event.result === "correct",
      responseMs: output.event.responseMs
    });

    emitVlxEvent(VLX_ANALYTICS_EVENTS.reviewStateUpdate, {
      sessionId: output.event.sessionId,
      userState: "guest",
      source: currentQuestion.source,
      slug: output.state.slug,
      word: output.state.word,
      hub: output.state.hub,
      mode,
      questionType: output.event.questionType,
      result: output.event.result,
      boxBefore: output.event.boxBefore,
      boxAfter: output.event.boxAfter,
      weakScoreBefore: output.event.weakScoreBefore,
      weakScoreAfter: output.event.weakScoreAfter,
      masteryAfter: output.state.mastery
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

      emitVlxEvent(VLX_ANALYTICS_EVENTS.quizComplete, {
        sessionId,
        userState: "guest",
        source: routeSource ?? queueLabel,
        mode,
        cardsSeen: nextSummary.reviewed,
        correctCount: nextSummary.correct,
        wrongCount: nextSummary.wrong,
        weakWordsCount: nextSummary.weakAdded
      });
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
    setSelectedAnswer(null);
    setCurrentAnswer(null);
    resetCardTimer();
  }

  function getOptionClass(option: string) {
    if (!currentAnswer || !currentQuestion) {
      return "review-option";
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
    <div className="page">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Link className="button" href="/review">
              All Review
            </Link>
            <Link className="button" href="/review/due">
              Due
            </Link>
            <Link className="button" href="/review/weak">
              Weak
            </Link>
          </>
        }
      />

      <section className="section" aria-labelledby="review-availability">
        <div className="section-heading">
          <h2 className="section-title" id="review-availability">
            Review queues
          </h2>
          <span className="section-note">
            {availability.localCandidateCount} local cards ready
          </span>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-card__value">{availability.dueCount}</span>
            <span className="metric-card__label">Due</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">{availability.weakCount}</span>
            <span className="metric-card__label">Weak</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">{availability.savedCount}</span>
            <span className="metric-card__label">New saved</span>
          </div>
        </div>
      </section>

      {status === "loading" ? (
        <section className="empty-state" aria-live="polite">
          <h3>Loading review state</h3>
          <p>Reading saved words and memory state from local storage.</p>
        </section>
      ) : null}

      {status === "empty" ? (
        <section className="empty-state" aria-live="polite">
          <h3>{emptyTitle}</h3>
          <p>{emptyBody}</p>
          <div className="actions">
            <button className="button button--primary" onClick={startStarterDeck} type="button">
              Start starter deck
            </button>
            <Link className="button button--quiet" href="/packs">
              Browse packs
            </Link>
          </div>
        </section>
      ) : null}

      {status === "active" && currentQuestion ? (
        <section className="review-session" aria-labelledby="review-session-title">
          <div className="review-session__topline">
            <div>
              <span className="eyebrow">{queueLabel}</span>
              <h2 className="section-title" id="review-session-title">
                Card {currentIndex + 1} of {questions.length}
              </h2>
            </div>
            <span className="tag">
              {getQuestionTypeLabel(currentQuestion.questionType)}
            </span>
          </div>

          <div className="review-card">
            <div
              aria-label={`Visual cue for ${currentQuestion.word}`}
              className={`word-card__visual review-card__visual${getVisualClass(
                currentQuestion.slug
              )}`}
              role="img"
            />
            <div className="review-card__body">
              <p className="review-card__prompt">
                {getPrompt(currentQuestion.questionType)}
              </p>
              <p className="review-card__clue">{getClue(currentQuestion)}</p>
              <div className="tag-row">
                {currentQuestion.mastery ? (
                  <span className="tag">{currentQuestion.mastery}</span>
                ) : null}
                {typeof currentQuestion.box === "number" ? (
                  <span className="tag">Box {currentQuestion.box}</span>
                ) : null}
                {currentQuestion.hub ? (
                  <span className="tag">{currentQuestion.hub}</span>
                ) : null}
              </div>
            </div>
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

          {currentAnswer ? (
            <div className="review-feedback" aria-live="polite">
              <div>
                <span className="eyebrow">
                  {currentAnswer.result === "correct" ? "Correct" : "Review again"}
                </span>
                <p>
                  Answer: <strong>{currentAnswer.answer}</strong> | Response:{" "}
                  {currentAnswer.responseMs} ms | Box {currentAnswer.boxBefore} to{" "}
                  {currentAnswer.boxAfter}
                </p>
              </div>
              <button className="button button--primary" onClick={handleNext} type="button">
                {currentIndex + 1 >= questions.length ? "View summary" : "Next card"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {status === "summary" ? (
        <section className="section" aria-labelledby="session-summary">
          <div className="section-heading">
            <h2 className="section-title" id="session-summary">
              Session summary
            </h2>
            <span className="section-note">{sessionId}</span>
          </div>

          <div className="summary-grid">
            <div className="metric-card">
              <span className="metric-card__value">{summary.reviewed}</span>
              <span className="metric-card__label">Cards reviewed</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__value">{summary.correct}</span>
              <span className="metric-card__label">Correct</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__value">{summary.wrong}</span>
              <span className="metric-card__label">Wrong</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__value">{summary.weakAdded}</span>
              <span className="metric-card__label">Weak words added</span>
            </div>
            <div className="metric-card">
              <span className="metric-card__value">{summary.movedForward}</span>
              <span className="metric-card__label">Words moved forward</span>
            </div>
          </div>

          {summary.weakSpotlight || nextReviewMessage ? (
            <div className="session-summary-insights">
              {summary.weakSpotlight ? (
                <div className="session-summary-insight session-summary-insight--weak">
                  <span className="eyebrow">Weak word spotlight</span>
                  <h3>{summary.weakSpotlight.word}</h3>
                  <p>
                    {summary.weakSpotlight.result === "wrong"
                      ? "Missed in this session"
                      : "Still needs reinforcement"}{" "}
                    | {summary.weakSpotlight.mastery ?? "Learning"} | Weak score{" "}
                    {summary.weakSpotlight.weakScore.toFixed(2)} |{" "}
                    {summary.weakSpotlight.wrong} misses recorded
                  </p>
                </div>
              ) : null}

              {nextReviewMessage ? (
                <div className="session-summary-insight">
                  <span className="eyebrow">Next review</span>
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
                </div>
                <div>
                  <span className={answer.result === "correct" ? "tag tag--strong" : "tag tag--weak"}>
                    {answer.result}
                  </span>
                  <span className="tag">
                    Box {answer.boxBefore} to {answer.boxAfter}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button className="button button--primary" onClick={loadLocalSession} type="button">
              Start next session
            </button>
            <Link className="button" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
