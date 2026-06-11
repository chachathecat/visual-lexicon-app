import { expect, test } from '@playwright/test';

import {
  countSnapshotItems,
  createGuestSnapshotFromStores,
  hasGuestLearningState,
  summarizeGuestSnapshot,
} from '../src/lib/account-persistence/local-snapshot';
import { createAccountMergePlan } from '../src/lib/account-persistence/merge-contracts';
import {
  applyMockMergePlan,
  createMockAccountProfile,
  createMockAccountStore,
} from '../src/lib/account-persistence/mock-adapter';
import type {
  VlxReviewEvent,
  VlxReviewStateItem,
  VlxSavedWord,
} from '../src/lib/srs/types';
import type { VlxUpgradeInterestRecord } from '../src/lib/upgrade/upgrade-interest';

const now = '2026-06-11T12:00:00.000Z';

function makeSavedWord(overrides: Partial<VlxSavedWord> = {}): VlxSavedWord {
  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    source: 'word_page',
    savedAt: now,
    ...overrides,
  };
}

function makeReviewState(
  overrides: Partial<VlxReviewStateItem> = {},
): VlxReviewStateItem {
  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    box: 1,
    mastery: 'Learning',
    correct: 1,
    wrong: 0,
    streakCorrect: 1,
    lastReviewedAt: now,
    nextDueAt: '2026-06-12T12:00:00.000Z',
    weakScore: 0,
    avgResponseMs: 3200,
    lastQuestionType: 'saved_review',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeReviewEvent(overrides: Partial<VlxReviewEvent> = {}): VlxReviewEvent {
  return {
    eventId: 'event-1',
    sessionId: 'session-1',
    slug: 'dissonance',
    word: 'Dissonance',
    hub: 'academic-vocabulary',
    questionType: 'saved_review',
    selected: 'Dissonance',
    answer: 'Dissonance',
    result: 'correct',
    responseMs: 3200,
    createdAt: now,
    boxBefore: 0,
    boxAfter: 1,
    weakScoreBefore: 0,
    weakScoreAfter: 0,
    ...overrides,
  };
}

function makeUpgradeInterest(
  overrides: Partial<VlxUpgradeInterestRecord> = {},
): VlxUpgradeInterestRecord {
  return {
    id: 'upgrade-1',
    plan: 'lite',
    source: 'pricing_page',
    trigger: 'save_limit',
    createdAt: now,
    pagePath: '/pricing',
    ...overrides,
  };
}

test.describe('account persistence planning contracts', () => {
  test('empty guest snapshot reports no learning state', () => {
    const snapshot = createGuestSnapshotFromStores({ capturedAt: now });

    expect(hasGuestLearningState(snapshot)).toBe(false);
    expect(summarizeGuestSnapshot(snapshot)).toMatchObject({
      savedWords: 0,
      reviewState: 0,
      reviewEvents: 0,
      dailyStats: 0,
      packProgress: 0,
      upgradeInterest: 0,
      totalLearningItems: 0,
      hasLearningState: false,
      hasUpgradeInterestOnly: false,
    });
  });

  test('saved words and review state are counted', () => {
    const snapshot = createGuestSnapshotFromStores({
      capturedAt: now,
      savedWords: {
        dissonance: makeSavedWord(),
      },
      reviewState: {
        dissonance: makeReviewState(),
        obfuscate: makeReviewState({
          slug: 'obfuscate',
          word: 'Obfuscate',
          wrong: 1,
          weakScore: 0.4,
        }),
      },
    });

    expect(countSnapshotItems(snapshot)).toMatchObject({
      savedWords: 1,
      reviewState: 2,
      totalLearningItems: 3,
      totalItems: 3,
    });
    expect(hasGuestLearningState(snapshot)).toBe(true);
  });

  test('review events are counted', () => {
    const snapshot = createGuestSnapshotFromStores({
      capturedAt: now,
      reviewEvents: [
        makeReviewEvent({ eventId: 'event-1' }),
        makeReviewEvent({ eventId: 'event-2', result: 'wrong' }),
      ],
    });

    expect(countSnapshotItems(snapshot)).toMatchObject({
      reviewEvents: 2,
      totalLearningItems: 2,
    });
  });

  test('merge plan detects duplicate saved words', () => {
    const snapshot = createGuestSnapshotFromStores({
      capturedAt: now,
      savedWords: {
        dissonance: makeSavedWord(),
      },
    });
    const accountProfile = createMockAccountProfile({
      accountStateDigest: {
        savedWordSlugs: ['dissonance'],
      },
    });

    const plan = createAccountMergePlan(snapshot, accountProfile);

    expect(plan.conflicts).toContainEqual(
      expect.objectContaining({
        category: 'duplicate_saved_word',
        slug: 'dissonance',
      }),
    );
    expect(plan.operations).toContainEqual(
      expect.objectContaining({
        kind: 'resolve_duplicate_saved_word',
        slug: 'dissonance',
      }),
    );
  });

  test('merge plan imports review events before materialized review state', () => {
    const snapshot = createGuestSnapshotFromStores({
      capturedAt: now,
      reviewEvents: [makeReviewEvent({ eventId: 'event-1' })],
      reviewState: {
        dissonance: makeReviewState(),
      },
    });
    const plan = createAccountMergePlan(snapshot, createMockAccountProfile());
    const operationKinds = plan.operations.map((operation) => operation.kind);

    expect(operationKinds.indexOf('import_review_event')).toBeGreaterThanOrEqual(0);
    expect(operationKinds.indexOf('import_review_state')).toBeGreaterThanOrEqual(0);
    expect(operationKinds.indexOf('import_review_event')).toBeLessThan(
      operationKinds.indexOf('import_review_state'),
    );
  });

  test('mock adapter applies a merge plan in memory', () => {
    const snapshot = createGuestSnapshotFromStores({
      capturedAt: now,
      savedWords: {
        dissonance: makeSavedWord(),
      },
      reviewEvents: [makeReviewEvent()],
      reviewState: {
        dissonance: makeReviewState(),
      },
    });
    const accountProfile = createMockAccountProfile();
    const plan = createAccountMergePlan(snapshot, accountProfile);
    const store = createMockAccountStore({ accountProfile });

    const updatedStore = applyMockMergePlan(store, plan);

    expect(store.savedWords.dissonance).toBeUndefined();
    expect(updatedStore.savedWords.dissonance?.word).toBe('Dissonance');
    expect(updatedStore.reviewEvents).toHaveLength(1);
    expect(updatedStore.reviewState.dissonance?.mastery).toBe('Learning');
    expect(updatedStore.appliedMergeBatchIds).toEqual([plan.batchId]);
    expect(updatedStore.entitlement.paid).toBe(false);
  });

  test('no helper fakes mastery or paid entitlement', () => {
    const snapshot = createGuestSnapshotFromStores({
      capturedAt: now,
      savedWords: {
        lucid: makeSavedWord({
          slug: 'lucid',
          word: 'Lucid',
        }),
      },
      upgradeInterest: [makeUpgradeInterest()],
    });
    const accountProfile = createMockAccountProfile();
    const plan = createAccountMergePlan(snapshot, accountProfile);

    expect(plan.operations.every((operation) => !operation.synthesizesMastery)).toBe(
      true,
    );
    expect(
      plan.operations.every((operation) => !operation.grantsPaidEntitlement),
    ).toBe(true);
    expect(plan.operations.map((operation) => operation.kind)).not.toContain(
      'import_review_state',
    );

    const updatedStore = applyMockMergePlan(
      createMockAccountStore({ accountProfile }),
      plan,
    );

    expect(updatedStore.reviewState.lucid).toBeUndefined();
    expect(updatedStore.upgradeInterest).toHaveLength(1);
    expect(updatedStore.entitlement).toEqual({
      paid: false,
      source: 'not_in_mock_contract',
    });
  });
});
