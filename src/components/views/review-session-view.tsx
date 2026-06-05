"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { mockQuizWords } from "@/lib/packs/mock-data";
import type { VlxQuizWord } from "@/lib/packs/types";
import { getDueToday, getNewSaved, getWeakWords } from "@/lib/srs/selectors";
import {
  applyReviewAnswer,
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

type ReviewMode = "mixed" | "due" | "weak";
type ReviewSource = "due" | "weak" | "saved" | "starter";
type SessionStatus = "loading" | "empty" | "active" | "summary";

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
  due: {
    eyebrow: "Due review",
    title: "Review words scheduled for today.",
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
  source: Exclude<ReviewSource, "saved" | "starter">
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

function fromSavedWord(savedWord: VlxSavedWord): ReviewableWord {
  const packWord = mergePackWord(savedWord.slug);

  return {
    slug: savedWord.slug,
    word: savedWord.word || packWord?.word || savedWord.slug,
    image: savedWord.image ?? packWord?.image,
    definition: savedWord.definition ?? packWord?.definition,
    memoryHook: packWord?.memoryHook,
    hub: savedWord.hub ?? packWord?.hub,
    confusableWords: packWord?.confusableWords,
    distractors: packWord?.distractors,
    mastery: "New",
    source: "saved"
  };
}

function fromPackWord(packWord: VlxQuizWord): ReviewableWord {
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
    source: "starter"
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
      ...getNewSaved(savedWords, reviewState).map(fromSavedWord)
    ]).length
  };
}

function buildLocalWords(
  mode: ReviewMode,
  savedWords: VlxSavedWordsStore,
  reviewState: VlxReviewStateStore
) {
  const dueWords = getDueToday(reviewState).map((item) =>
    fromStateItem(item, "due")
  );
  const weakWords = getWeakWords(reviewState).map((item) =>
    fromStateItem(item, "weak")
  );
  const savedReviewWords = getNewSaved(savedWords, reviewState).map(fromSavedWord);

  if (mode === "due") {
    return dedupeBySlug(dueWords).slice(0, SESSION_SIZE);
  }

  if (mode === "weak") {
    return dedupeBySlug(weakWords).slice(0, SESSION_SIZE);
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

export function ReviewSessionView({ mode }: { mode: ReviewMode }) {
  const copy = modeCopy[mode];
  const cardStartedAt = useRef(getNowMs());
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<SessionAnswer | null>(null);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
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
    (words: ReviewableWord[], label: string) => {
      const nextQuestions = buildQuestions(words.slice(0, SESSION_SIZE), mode);

      if (!nextQuestions.length) {
        setStatus("empty");
        return;
      }

      setQuestions(nextQuestions);
      setCurrentIndex(0);
      setSessionId(createSessionId(mode));
      setSelectedAnswer(null);
      setCurrentAnswer(null);
      setAnswers([]);
      setQueueLabel(label);
      setStatus("active");
      resetCardTimer();
    },
    [mode, resetCardTimer]
  );

  const loadLocalSession = useCallback(() => {
    const savedWords = readSavedWords();
    const reviewState = readReviewState();
    const nextAvailability = getAvailability(savedWords, reviewState);
    const localWords = buildLocalWords(mode, savedWords, reviewState);

    setAvailability(nextAvailability);

    if (!localWords.length) {
      setStatus("empty");
      setQuestions([]);
      setAnswers([]);
      setCurrentAnswer(null);
      setSelectedAnswer(null);
      return;
    }

    startSession(localWords, copy.sourceLabel);
  }, [copy.sourceLabel, mode, startSession]);

  useEffect(() => {
    loadLocalSession();
  }, [loadLocalSession]);

  const currentQuestion = questions[currentIndex];
  const summary = useMemo(
    () => ({
      reviewed: answers.length,
      correct: answers.filter((answer) => answer.result === "correct").length,
      wrong: answers.filter((answer) => answer.result === "wrong").length,
      weakAdded: answers.filter((answer) => answer.weakAdded).length,
      movedForward: answers.filter((answer) => answer.movedForward).length
    }),
    [answers]
  );

  function startStarterDeck() {
    startSession(
      mockQuizWords.slice(0, SESSION_SIZE).map(fromPackWord),
      "Mock starter deck"
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
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
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
          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyBody}</p>
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
