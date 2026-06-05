import { expect, test } from '@playwright/test';

import {
  applyReviewAnswer as applyReviewAnswerPure,
  createReviewItemFromSavedWord as createPureReviewItem,
} from '../src/lib/srs/engine';
import {
  applyReviewAnswer as applyStoredReviewAnswer,
  createReviewItemFromSavedWord as createStoredReviewItem,
  readReviewState,
  writeReviewState,
  writeSavedWords,
} from '../src/lib/srs/storage';
import { getDueToday, getMastered, getWeakWords } from '../src/lib/srs/selectors';
import {
  VLX_STORAGE_KEYS,
  type VlxDailyStatsStore,
  type VlxReviewEventsStore,
  type VlxReviewStateItem,
  type VlxReviewStateStore,
  type VlxSavedWord,
  type VlxSavedWordsStore,
} from '../src/lib/srs/types';

const savedAt = '2026-06-10T08:00:00.000Z';
const reviewedAt = '2026-06-10T12:00:00.000Z';

const dissonanceSavedWord = {
  slug: 'dissonance',
  word: 'Dissonance',
  image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
  definition: 'A clash between sounds, ideas, or feelings.',
  hub: 'academic-vocabulary',
  source: 'word_page',
  savedAt,
} satisfies VlxSavedWord;

const obfuscateSavedWord = {
  slug: 'obfuscate',
  word: 'Obfuscate',
  image: 'https://cdn.visuallexicon.org/images/obfuscate.webp',
  definition: 'To make something unclear or difficult to understand.',
  hub: 'academic-vocabulary',
  source: 'word_page',
  savedAt,
} satisfies VlxSavedWord;

const lucidSavedWord = {
  slug: 'lucid',
  word: 'Lucid',
  image: 'https://cdn.visuallexicon.org/images/lucid.webp',
  definition: 'Clear and easy to understand.',
  hub: 'academic-vocabulary',
  source: 'word_page',
  savedAt,
} satisfies VlxSavedWord;

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'window',
);

function createMemoryLocalStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function installLocalStorage() {
  const localStorage = createMemoryLocalStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });

  return localStorage;
}

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, 'window');
}

function readStorageJson<T>(localStorage: Storage, key: string): T {
  const rawValue = localStorage.getItem(key);

  expect(rawValue).not.toBeNull();

  return JSON.parse(rawValue as string) as T;
}

function makeReviewStateItem(
  overrides: Partial<VlxReviewStateItem> = {},
): VlxReviewStateItem {
  const createdAt = overrides.createdAt ?? savedAt;

  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    box: 0,
    mastery: 'New',
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: createdAt,
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

test.afterEach(() => {
  restoreWindow();
});

test.describe('Visual Lexicon review_state regressions', () => {
  test('saved words become review_state items with the MVP storage key', () => {
    const localStorage = installLocalStorage();

    writeSavedWords({ [dissonanceSavedWord.slug]: dissonanceSavedWord });

    const reviewItem = createStoredReviewItem(dissonanceSavedWord, savedAt);
    const savedWords = readStorageJson<VlxSavedWordsStore>(
      localStorage,
      VLX_STORAGE_KEYS.savedWords,
    );
    const reviewState = readStorageJson<VlxReviewStateStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewState,
    );

    expect(savedWords[dissonanceSavedWord.slug]).toEqual(dissonanceSavedWord);
    expect(reviewItem).toMatchObject({
      slug: 'dissonance',
      word: 'Dissonance',
      box: 0,
      mastery: 'New',
      correct: 0,
      wrong: 0,
      streakCorrect: 0,
      nextDueAt: savedAt,
      weakScore: 0,
      createdAt: savedAt,
      updatedAt: savedAt,
    });
    expect(reviewState[dissonanceSavedWord.slug]).toEqual(reviewItem);
    expect(readReviewState()[dissonanceSavedWord.slug]).toEqual(reviewItem);
  });

  test('duplicate saves preserve meaningful review progress', () => {
    const localStorage = installLocalStorage();
    const progressedState = makeReviewStateItem({
      box: 3,
      mastery: 'Strong',
      correct: 7,
      wrong: 1,
      streakCorrect: 5,
      lastReviewedAt: '2026-06-09T09:00:00.000Z',
      nextDueAt: '2026-06-16T09:00:00.000Z',
      weakScore: 0.12,
      avgResponseMs: 2800,
      lastQuestionType: 'due_review',
      updatedAt: '2026-06-09T09:00:00.000Z',
    });

    writeSavedWords({ [dissonanceSavedWord.slug]: dissonanceSavedWord });
    writeReviewState({ [dissonanceSavedWord.slug]: progressedState });

    const duplicateResult = createStoredReviewItem(
      {
        ...dissonanceSavedWord,
        savedAt: '2026-06-11T08:00:00.000Z',
      },
      '2026-06-11T08:00:00.000Z',
    );
    const reviewState = readStorageJson<VlxReviewStateStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewState,
    );

    expect(duplicateResult).toEqual(progressedState);
    expect(reviewState[dissonanceSavedWord.slug]).toEqual(progressedState);
    expect(reviewState[dissonanceSavedWord.slug]).toMatchObject({
      box: 3,
      mastery: 'Strong',
      correct: 7,
      wrong: 1,
      streakCorrect: 5,
      lastReviewedAt: '2026-06-09T09:00:00.000Z',
      nextDueAt: '2026-06-16T09:00:00.000Z',
      weakScore: 0.12,
    });
  });

  test('correct answers update box, mastery, events, and daily stats', () => {
    const localStorage = installLocalStorage();
    const initialState = createPureReviewItem(dissonanceSavedWord, savedAt);

    writeReviewState({ [dissonanceSavedWord.slug]: initialState });

    const output = applyStoredReviewAnswer({
      eventId: 'evt_correct_1',
      sessionId: 's_correct_1',
      slug: dissonanceSavedWord.slug,
      word: dissonanceSavedWord.word,
      image: dissonanceSavedWord.image,
      definition: dissonanceSavedWord.definition,
      hub: dissonanceSavedWord.hub,
      questionType: 'saved_review',
      selected: 'Dissonance',
      answer: 'Dissonance',
      result: 'correct',
      responseMs: 1200,
      confidence: 'knew',
      createdAt: reviewedAt,
    });
    const reviewState = readStorageJson<VlxReviewStateStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewState,
    );
    const reviewEvents = readStorageJson<VlxReviewEventsStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewEvents,
    );
    const dailyStats = readStorageJson<VlxDailyStatsStore>(
      localStorage,
      VLX_STORAGE_KEYS.dailyStats,
    );
    const state = reviewState[dissonanceSavedWord.slug];

    expect(output.state).toEqual(state);
    expect(state).toMatchObject({
      box: 1,
      mastery: 'Learning',
      correct: 1,
      wrong: 0,
      streakCorrect: 1,
      lastReviewedAt: reviewedAt,
      nextDueAt: '2026-06-11T12:00:00.000Z',
      weakScore: 0,
      avgResponseMs: 1200,
      lastQuestionType: 'saved_review',
      updatedAt: reviewedAt,
    });
    expect(reviewEvents).toHaveLength(1);
    expect(reviewEvents[0]).toMatchObject({
      eventId: 'evt_correct_1',
      sessionId: 's_correct_1',
      slug: 'dissonance',
      word: 'Dissonance',
      hub: 'academic-vocabulary',
      questionType: 'saved_review',
      selected: 'Dissonance',
      answer: 'Dissonance',
      result: 'correct',
      responseMs: 1200,
      createdAt: reviewedAt,
      boxBefore: 0,
      boxAfter: 1,
      weakScoreBefore: 0,
      weakScoreAfter: 0,
    });
    expect(dailyStats['2026-06-10']).toEqual({
      date: '2026-06-10',
      reviewed: 1,
      correct: 1,
      wrong: 0,
      mastered: 0,
      weakAdded: 0,
      minutes: 0.02,
      sessions: 1,
    });
  });

  test('wrong answers increase weakness and return sooner than mastered recall', () => {
    const localStorage = installLocalStorage();
    const fragileState = makeReviewStateItem({
      slug: obfuscateSavedWord.slug,
      word: obfuscateSavedWord.word,
      image: obfuscateSavedWord.image,
      definition: obfuscateSavedWord.definition,
      box: 1,
      mastery: 'Learning',
      correct: 0,
      wrong: 1,
      streakCorrect: 0,
      lastReviewedAt: '2026-06-09T12:00:00.000Z',
      nextDueAt: reviewedAt,
      weakScore: 0.44,
      updatedAt: '2026-06-09T12:00:00.000Z',
    });
    const masteredOutput = applyReviewAnswerPure(
      {
        eventId: 'evt_mastered_1',
        sessionId: 's_mastered_1',
        slug: lucidSavedWord.slug,
        word: lucidSavedWord.word,
        image: lucidSavedWord.image,
        definition: lucidSavedWord.definition,
        hub: lucidSavedWord.hub,
        questionType: 'due_review',
        selected: 'Lucid',
        answer: 'Lucid',
        result: 'correct',
        responseMs: 900,
        confidence: 'knew',
        createdAt: reviewedAt,
      },
      {
        currentState: makeReviewStateItem({
          slug: lucidSavedWord.slug,
          word: lucidSavedWord.word,
          image: lucidSavedWord.image,
          definition: lucidSavedWord.definition,
          box: 4,
          mastery: 'Strong',
          correct: 8,
          wrong: 0,
          streakCorrect: 5,
          lastReviewedAt: '2026-05-20T12:00:00.000Z',
          nextDueAt: '2026-06-09T12:00:00.000Z',
          weakScore: 0.04,
          updatedAt: '2026-05-20T12:00:00.000Z',
        }),
      },
    );

    writeReviewState({ [obfuscateSavedWord.slug]: fragileState });

    const output = applyStoredReviewAnswer({
      eventId: 'evt_wrong_1',
      sessionId: 's_wrong_1',
      slug: obfuscateSavedWord.slug,
      word: obfuscateSavedWord.word,
      image: obfuscateSavedWord.image,
      definition: obfuscateSavedWord.definition,
      hub: obfuscateSavedWord.hub,
      questionType: 'due_review',
      selected: 'Clarify',
      answer: 'Obfuscate',
      result: 'wrong',
      responseMs: 12000,
      confidence: 'forgot',
      createdAt: reviewedAt,
    });
    const reviewState = readStorageJson<VlxReviewStateStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewState,
    );
    const reviewEvents = readStorageJson<VlxReviewEventsStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewEvents,
    );
    const dailyStats = readStorageJson<VlxDailyStatsStore>(
      localStorage,
      VLX_STORAGE_KEYS.dailyStats,
    );
    const state = reviewState[obfuscateSavedWord.slug];

    expect(output.state).toEqual(state);
    expect(state).toMatchObject({
      box: 0,
      mastery: 'Weak',
      correct: 0,
      wrong: 2,
      streakCorrect: 0,
      lastReviewedAt: reviewedAt,
      nextDueAt: '2026-06-10T12:10:00.000Z',
      weakScore: 0.8,
      avgResponseMs: 12000,
      lastQuestionType: 'due_review',
      updatedAt: reviewedAt,
    });
    expect(reviewEvents).toHaveLength(1);
    expect(reviewEvents[0]).toMatchObject({
      eventId: 'evt_wrong_1',
      result: 'wrong',
      boxBefore: 1,
      boxAfter: 0,
      weakScoreBefore: 0.44,
      weakScoreAfter: 0.8,
    });
    expect(dailyStats['2026-06-10']).toEqual({
      date: '2026-06-10',
      reviewed: 1,
      correct: 0,
      wrong: 1,
      mastered: 0,
      weakAdded: 1,
      minutes: 0.2,
      sessions: 1,
    });
    expect(masteredOutput.state).toMatchObject({
      box: 5,
      mastery: 'Mastered',
      nextDueAt: '2026-07-10T12:00:00.000Z',
    });
    expect(Date.parse(state.nextDueAt as string)).toBeLessThan(
      Date.parse(masteredOutput.state.nextDueAt as string),
    );
  });

  test('Due, Weak, and Mastered selectors classify persisted review_state', () => {
    const reviewState = {
      dissonance: makeReviewStateItem({
        slug: 'dissonance',
        word: 'Dissonance',
        box: 0,
        mastery: 'New',
        nextDueAt: '2026-06-10T09:00:00.000Z',
      }),
      obfuscate: makeReviewStateItem({
        slug: 'obfuscate',
        word: 'Obfuscate',
        box: 1,
        mastery: 'Weak',
        correct: 1,
        wrong: 3,
        streakCorrect: 0,
        nextDueAt: '2026-06-10T10:00:00.000Z',
        weakScore: 0.72,
      }),
      resilient: makeReviewStateItem({
        slug: 'resilient',
        word: 'Resilient',
        box: 3,
        mastery: 'Strong',
        correct: 5,
        wrong: 1,
        streakCorrect: 3,
        nextDueAt: '2026-06-11T09:00:00.000Z',
        weakScore: 0.12,
      }),
      lucid: makeReviewStateItem({
        slug: 'lucid',
        word: 'Lucid',
        box: 5,
        mastery: 'Mastered',
        correct: 9,
        wrong: 0,
        streakCorrect: 6,
        nextDueAt: '2026-06-10T08:00:00.000Z',
        weakScore: 0.04,
      }),
    } satisfies VlxReviewStateStore;

    expect(getDueToday(reviewState, reviewedAt).map((item) => item.slug)).toEqual([
      'dissonance',
      'obfuscate',
    ]);
    expect(getWeakWords(reviewState).map((item) => item.slug)).toEqual([
      'obfuscate',
    ]);
    expect(getMastered(reviewState).map((item) => item.slug)).toEqual(['lucid']);
  });
});
