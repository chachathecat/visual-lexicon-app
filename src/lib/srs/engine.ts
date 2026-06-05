import type {
  VlxApplyReviewAnswerOptions,
  VlxDailyStatsItem,
  VlxMasteryLabel,
  VlxReviewAnswerInput,
  VlxReviewEvent,
  VlxReviewStateItem,
  VlxReviewUpdateOutput,
  VlxSavedWord,
  VlxSrsBox
} from "@/lib/srs/types";
import {
  VLX_BOX_INTERVAL_DAYS,
  VLX_BOX_ZERO_DUE_MINUTES,
  VLX_FAST_RESPONSE_MS,
  VLX_SLOW_RESPONSE_MS
} from "@/lib/srs/types";

const MAX_BOX = 5;
const MIN_BOX = 0;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampBox(value: number): VlxSrsBox {
  return clamp(value, MIN_BOX, MAX_BOX) as VlxSrsBox;
}

function clampWeakScore(value: number) {
  return Number(clamp(value, 0, 1).toFixed(2));
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function addMinutes(value: string, minutes: number) {
  const date = new Date(value);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function getIsoDate(value: string) {
  return value.slice(0, 10);
}

function createId(prefix: string, createdAt: string) {
  const datePart = getIsoDate(createdAt).replaceAll("-", "");
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${datePart}_${randomPart}`;
}

function hasDelayedRecallDue(
  previousState: VlxReviewStateItem,
  reviewedAt: string
) {
  const reviewedAtDate = toDate(reviewedAt);

  if (!isValidDate(reviewedAtDate)) {
    return false;
  }

  if (previousState.nextDueAt) {
    const dueAtDate = toDate(previousState.nextDueAt);
    return isValidDate(dueAtDate) && dueAtDate.getTime() <= reviewedAtDate.getTime();
  }

  if (!previousState.lastReviewedAt) {
    return false;
  }

  const lastReviewedAtDate = toDate(previousState.lastReviewedAt);

  if (!isValidDate(lastReviewedAtDate)) {
    return false;
  }

  const delayedRecallMs =
    VLX_BOX_INTERVAL_DAYS[4] * 24 * 60 * 60 * 1000;

  return (
    reviewedAtDate.getTime() - lastReviewedAtDate.getTime() >= delayedRecallMs
  );
}

function shouldAdvanceFromCorrect(input: VlxReviewAnswerInput) {
  const confidence = input.confidence ?? "knew";

  if (input.usedHint || confidence === "guessed") {
    return false;
  }

  return confidence === "knew" && input.responseMs <= VLX_FAST_RESPONSE_MS;
}

function shouldAllowSmallImprovement(
  previousState: VlxReviewStateItem,
  input: VlxReviewAnswerInput
) {
  const confidence = input.confidence ?? "knew";

  if (input.usedHint || confidence !== "knew") {
    return false;
  }

  return (
    previousState.box <= 1 &&
    input.responseMs > VLX_FAST_RESPONSE_MS &&
    input.responseMs <= VLX_SLOW_RESPONSE_MS
  );
}

function getBoxAfter(
  previousState: VlxReviewStateItem,
  input: VlxReviewAnswerInput,
  reviewedAt: string
) {
  if (input.result === "wrong") {
    const repeatedMistake =
      previousState.wrong > 0 && previousState.streakCorrect === 0;

    return repeatedMistake
      ? 0
      : clampBox(previousState.box - 1);
  }

  const shouldImprove =
    shouldAdvanceFromCorrect(input) ||
    shouldAllowSmallImprovement(previousState, input);

  const proposedBox = shouldImprove
    ? clampBox(previousState.box + 1)
    : previousState.box;

  if (
    proposedBox === 5 &&
    previousState.box < 5 &&
    !hasDelayedRecallDue(previousState, reviewedAt)
  ) {
    return 4;
  }

  return proposedBox;
}

function getWeakScoreAfter(
  previousState: VlxReviewStateItem,
  input: VlxReviewAnswerInput
) {
  if (input.result === "wrong") {
    const repeatedMistake =
      previousState.wrong > 0 && previousState.streakCorrect === 0;
    const confidencePenalty = input.confidence === "forgot" ? 0.08 : 0;
    const slowPenalty = input.responseMs > VLX_SLOW_RESPONSE_MS ? 0.04 : 0;
    const increase = repeatedMistake ? 0.24 : 0.16;

    return clampWeakScore(
      previousState.weakScore + increase + confidencePenalty + slowPenalty
    );
  }

  if (input.usedHint || input.confidence === "guessed") {
    return clampWeakScore(previousState.weakScore - 0.02);
  }

  const decrease =
    input.responseMs <= VLX_FAST_RESPONSE_MS
      ? 0.16
      : input.responseMs <= VLX_SLOW_RESPONSE_MS
        ? 0.08
        : 0.03;

  return clampWeakScore(previousState.weakScore - decrease);
}

function getNextDueAt(
  box: VlxSrsBox,
  reviewedAt: string,
  result: VlxReviewAnswerInput["result"]
) {
  if (box === 0) {
    return result === "wrong"
      ? addMinutes(reviewedAt, VLX_BOX_ZERO_DUE_MINUTES)
      : reviewedAt;
  }

  return addDays(reviewedAt, VLX_BOX_INTERVAL_DAYS[box]);
}

export function getMasteryLabel(state: VlxReviewStateItem): VlxMasteryLabel {
  const reviewCount = state.correct + state.wrong;

  if (state.box === 5) {
    return "Mastered";
  }

  if (
    state.weakScore >= 0.6 ||
    state.wrong >= 3 ||
    (state.wrong > 0 && state.wrong >= state.correct && reviewCount > 1)
  ) {
    return "Weak";
  }

  if (state.box === 0 && reviewCount === 0) {
    return "New";
  }

  if (state.box >= 3 && state.weakScore < 0.4) {
    return "Strong";
  }

  return "Learning";
}

export function createReviewItemFromSavedWord(
  savedWord: VlxSavedWord,
  createdAt = new Date().toISOString()
): VlxReviewStateItem {
  return {
    slug: savedWord.slug,
    word: savedWord.word,
    image: savedWord.image,
    definition: savedWord.definition,
    hub: savedWord.hub,
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: createdAt,
    weakScore: 0,
    createdAt,
    updatedAt: createdAt
  };
}

function createReviewItemFromAnswer(
  input: VlxReviewAnswerInput,
  createdAt: string
): VlxReviewStateItem {
  return createReviewItemFromSavedWord(
    {
      slug: input.slug,
      word: input.word,
      image: input.image,
      definition: input.definition,
      hub: input.hub,
      savedAt: createdAt,
      source: "app"
    },
    createdAt
  );
}

function createEmptyDailyStats(date: string): VlxDailyStatsItem {
  return {
    date,
    reviewed: 0,
    correct: 0,
    wrong: 0,
    mastered: 0,
    weakAdded: 0,
    minutes: 0,
    sessions: 0
  };
}

function updateAverageResponseMs(
  previousState: VlxReviewStateItem,
  input: VlxReviewAnswerInput
) {
  const previousAverage = previousState.avgResponseMs ?? input.responseMs;
  const previousCount = previousState.correct + previousState.wrong;

  if (previousCount === 0) {
    return input.responseMs;
  }

  return Math.round(
    (previousAverage * previousCount + input.responseMs) / (previousCount + 1)
  );
}

function updateDailyStats(
  previousDailyStats: VlxDailyStatsItem | undefined,
  previousState: VlxReviewStateItem,
  nextState: VlxReviewStateItem,
  input: VlxReviewAnswerInput,
  reviewedAt: string,
  countSession: boolean
) {
  const date = getIsoDate(reviewedAt);
  const dailyStats = previousDailyStats ?? createEmptyDailyStats(date);
  const becameMastered =
    previousState.mastery !== "Mastered" && nextState.mastery === "Mastered";
  const becameWeak =
    previousState.mastery !== "Weak" && nextState.mastery === "Weak";

  return {
    ...dailyStats,
    date,
    reviewed: dailyStats.reviewed + 1,
    correct: dailyStats.correct + (input.result === "correct" ? 1 : 0),
    wrong: dailyStats.wrong + (input.result === "wrong" ? 1 : 0),
    mastered: dailyStats.mastered + (becameMastered ? 1 : 0),
    weakAdded: dailyStats.weakAdded + (becameWeak ? 1 : 0),
    minutes: Number(
      (dailyStats.minutes + input.responseMs / 60000).toFixed(2)
    ),
    sessions: dailyStats.sessions + (countSession ? 1 : 0)
  };
}

export function applyReviewAnswer(
  input: VlxReviewAnswerInput,
  options: VlxApplyReviewAnswerOptions = {}
): VlxReviewUpdateOutput {
  const reviewedAt = input.createdAt ?? new Date().toISOString();
  const previousState =
    options.currentState ?? createReviewItemFromAnswer(input, reviewedAt);
  const boxBefore = previousState.box;
  const weakScoreBefore = previousState.weakScore;
  const boxAfter = getBoxAfter(previousState, input, reviewedAt);
  const weakScoreAfter = getWeakScoreAfter(previousState, input);
  const correct = previousState.correct + (input.result === "correct" ? 1 : 0);
  const wrong = previousState.wrong + (input.result === "wrong" ? 1 : 0);
  const streakCorrect =
    input.result === "correct" ? previousState.streakCorrect + 1 : 0;
  const nextDueAt = getNextDueAt(boxAfter, reviewedAt, input.result);
  const stateBeforeMastery: VlxReviewStateItem = {
    ...previousState,
    image: input.image ?? previousState.image,
    definition: input.definition ?? previousState.definition,
    hub: input.hub ?? previousState.hub,
    box: boxAfter,
    correct,
    wrong,
    streakCorrect,
    lastReviewedAt: reviewedAt,
    nextDueAt,
    weakScore: weakScoreAfter,
    avgResponseMs: updateAverageResponseMs(previousState, input),
    lastQuestionType: input.questionType,
    updatedAt: reviewedAt
  };
  const state = {
    ...stateBeforeMastery,
    mastery: getMasteryLabel(stateBeforeMastery)
  };
  const event: VlxReviewEvent = {
    eventId: input.eventId ?? createId("evt", reviewedAt),
    sessionId: input.sessionId ?? createId("s", reviewedAt),
    slug: state.slug,
    word: state.word,
    hub: state.hub,
    questionType: input.questionType,
    selected: input.selected,
    answer: input.answer,
    result: input.result,
    responseMs: input.responseMs,
    usedHint: input.usedHint,
    confidence: input.confidence,
    createdAt: reviewedAt,
    boxBefore,
    boxAfter,
    weakScoreBefore,
    weakScoreAfter
  };
  const dailyStats = updateDailyStats(
    options.dailyStats,
    previousState,
    state,
    input,
    reviewedAt,
    options.countSession ?? true
  );

  return {
    event,
    state,
    dailyStats
  };
}
