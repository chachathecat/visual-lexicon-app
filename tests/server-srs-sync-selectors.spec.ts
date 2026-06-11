import { expect, test } from '@playwright/test';

import {
  selectDueReviewState,
  selectMasteredReviewState,
  selectWeakReviewState,
} from '../src/lib/server-srs-sync/selectors';
import type {
  VlxReviewStateItem,
  VlxReviewStateStore,
} from '../src/lib/srs/types';

const now = '2026-06-11T12:00:00.000Z';
const createdAt = '2026-06-01T09:00:00.000Z';

function makeReviewStateItem(
  overrides: Partial<VlxReviewStateItem> = {},
): VlxReviewStateItem {
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

test.describe('server SRS sync selector contracts', () => {
  test('selects due words from review state and excludes mastered state', () => {
    const reviewState = {
      noDueDate: makeReviewStateItem({
        slug: 'no-due-date',
        word: 'No Due Date',
        nextDueAt: undefined,
        weakScore: 0.4,
      }),
      earlyWeak: makeReviewStateItem({
        slug: 'early-weak',
        word: 'Early Weak',
        mastery: 'Weak',
        nextDueAt: '2026-06-11T08:00:00.000Z',
        weakScore: 0.8,
        wrong: 3,
      }),
      earlyStable: makeReviewStateItem({
        slug: 'early-stable',
        word: 'Early Stable',
        mastery: 'Learning',
        nextDueAt: '2026-06-11T08:00:00.000Z',
        weakScore: 0.2,
      }),
      future: makeReviewStateItem({
        slug: 'future',
        word: 'Future',
        mastery: 'Strong',
        box: 3,
        nextDueAt: '2026-06-12T08:00:00.000Z',
      }),
      mastered: makeReviewStateItem({
        slug: 'mastered',
        word: 'Mastered',
        box: 5,
        mastery: 'Mastered',
        nextDueAt: '2026-06-11T08:00:00.000Z',
      }),
    } satisfies VlxReviewStateStore;

    expect(selectDueReviewState(reviewState, now).map((item) => item.slug))
      .toEqual(['no-due-date', 'early-weak', 'early-stable']);
  });

  test('selects weak words from real recall state rather than fake summaries', () => {
    const reviewState = [
      makeReviewStateItem({
        slug: 'explicit-weak',
        word: 'Explicit Weak',
        mastery: 'Weak',
        weakScore: 0.3,
      }),
      makeReviewStateItem({
        slug: 'high-weak-score',
        word: 'High Weak Score',
        mastery: 'Learning',
        weakScore: 0.72,
      }),
      makeReviewStateItem({
        slug: 'wrong-heavy',
        word: 'Wrong Heavy',
        mastery: 'Learning',
        correct: 1,
        wrong: 2,
        weakScore: 0.2,
      }),
      makeReviewStateItem({
        slug: 'stable',
        word: 'Stable',
        mastery: 'Strong',
        box: 3,
        correct: 8,
        wrong: 1,
        weakScore: 0.1,
      }),
    ];

    expect(selectWeakReviewState(reviewState).map((item) => item.slug)).toEqual([
      'high-weak-score',
      'explicit-weak',
      'wrong-heavy',
    ]);
  });

  test('selects mastered words only when box and mastery both prove mastery', () => {
    const reviewState = {
      masteredRecent: makeReviewStateItem({
        slug: 'mastered-recent',
        word: 'Mastered Recent',
        box: 5,
        mastery: 'Mastered',
        updatedAt: '2026-06-10T09:00:00.000Z',
      }),
      masteredOlder: makeReviewStateItem({
        slug: 'mastered-older',
        word: 'Mastered Older',
        box: 5,
        mastery: 'Mastered',
        updatedAt: '2026-06-09T09:00:00.000Z',
      }),
      fakeMasteryLabel: makeReviewStateItem({
        slug: 'fake-mastery-label',
        word: 'Fake Mastery Label',
        box: 4,
        mastery: 'Mastered',
        updatedAt: '2026-06-11T09:00:00.000Z',
      }),
      fakeBox: makeReviewStateItem({
        slug: 'fake-box',
        word: 'Fake Box',
        box: 5,
        mastery: 'Strong',
        updatedAt: '2026-06-11T10:00:00.000Z',
      }),
    } satisfies VlxReviewStateStore;

    expect(selectMasteredReviewState(reviewState).map((item) => item.slug))
      .toEqual(['mastered-recent', 'mastered-older']);
  });
});
