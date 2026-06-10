import { expect, test, type Page } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const storageKeys = [
  'vlx_saved_words_v1',
  'vlx_review_state_v1',
  'vlx_review_events_v1',
  'vlx_daily_stats_v1',
  'vlx_pack_progress_v1',
  'vlx_plan_state_v1',
  'vlx_upgrade_interest_v1',
] as const;

const oneHourAgo = () => new Date(Date.now() - 60 * 60_000).toISOString();
const oneDayFromNow = () =>
  new Date(Date.now() + 24 * 60 * 60_000).toISOString();

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    source: 'word_page',
    savedAt: oneHourAgo(),
    ...overrides,
  };
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === 'string' ? overrides.createdAt : oneHourAgo();

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

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function seedVlxLocalStorage(
  page: Page,
  values: {
    savedWords?: Record<string, unknown>;
    reviewState?: Record<string, unknown>;
    reviewEvents?: unknown[];
  },
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(({ savedWords, reviewState, reviewEvents }) => {
    localStorage.setItem(
      'vlx_saved_words_v1',
      JSON.stringify(savedWords ?? {}),
    );
    localStorage.setItem(
      'vlx_review_state_v1',
      JSON.stringify(reviewState ?? {}),
    );
    localStorage.setItem(
      'vlx_review_events_v1',
      JSON.stringify(reviewEvents ?? []),
    );
    localStorage.setItem('vlx_daily_stats_v1', '{}');
  }, values);
}

async function waitForSavedSlug(page: Page, slug: string) {
  await page.waitForFunction(
    (targetSlug) => {
      const rawSaved = localStorage.getItem('vlx_saved_words_v1');
      const rawState = localStorage.getItem('vlx_review_state_v1');

      if (!rawSaved || !rawState) return false;

      try {
        const saved = JSON.parse(rawSaved);
        const state = JSON.parse(rawState);

        return Boolean(saved?.[targetSlug] && state?.[targetSlug]);
      } catch {
        return false;
      }
    },
    slug,
    { timeout: 15000 },
  );
}

function memoryPanel(page: Page) {
  return page.locator('.word-memory-state');
}

const localMemoryLoadingText = 'Reading local saved and review stores.';

async function waitForMemoryPanelResolved(
  page: Page,
  expectedText?: string,
) {
  await expect
    .poll(
      async () => {
        const text = await memoryPanel(page)
          .innerText()
          .catch(() => '');

        if (!text) return false;

        return expectedText
          ? text.includes(expectedText)
          : !text.includes(localMemoryLoadingText);
      },
      { timeout: 15000 },
    )
    .toBe(true);
}

test.describe('Word detail local memory state', () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test('clear localStorage does not show fake mastery, box, or saved state', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/word/dissonance`, {
      waitUntil: 'domcontentloaded',
    });

    const panel = memoryPanel(page);
    const staticCard = page.locator('.word-card').first();

    await waitForMemoryPanelResolved(page);
    await expect(panel).toContainText('No local memory state yet', {
      timeout: 15000,
    });
    await expect(panel).not.toContainText('Saved locally');
    await expect(panel).not.toContainText('Weak');
    await expect(panel).not.toContainText('Box 1');
    await expect(staticCard).not.toContainText('Weak');
    await expect(staticCard).not.toContainText('Box 1');
  });

  test('save route creates local review state shown on word detail', async ({
    page,
  }) => {
    const response = await page.goto(
      `${baseUrl}/save?slug=dissonance&source=word_page`,
      { waitUntil: 'domcontentloaded' },
    );

    expect(response?.status()).toBe(200);
    await waitForSavedSlug(page, 'dissonance');

    await page.goto(`${baseUrl}/word/dissonance`, {
      waitUntil: 'domcontentloaded',
    });

    const panel = memoryPanel(page);

    await waitForMemoryPanelResolved(page, 'Saved locally');
    await expect(panel).toContainText('Saved locally');
    await expect(panel).toContainText('Source: Word page');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Mastery' }))
      .toContainText('New');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Box' }))
      .toContainText('Box 0');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Weak score' }))
      .toContainText('0');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Recall' }))
      .toContainText('0 correct, 0 wrong');
    await expect(
      panel.getByRole('link', { name: 'Review this word' }),
    ).toHaveAttribute('href', '/review?mode=word&slug=dissonance');
  });

  test('seeded weak review state renders weak state truthfully', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({ source: 'extension' }),
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          box: 2,
          mastery: 'Weak',
          correct: 2,
          wrong: 3,
          weakScore: 0.72,
          lastReviewedAt: oneHourAgo(),
          nextDueAt: oneDayFromNow(),
        }),
      },
      reviewEvents: [
        { slug: 'dissonance', createdAt: oneHourAgo() },
        { slug: 'dissonance', createdAt: oneHourAgo() },
        { slug: 'lucid', createdAt: oneHourAgo() },
      ],
    });

    await page.goto(`${baseUrl}/word/dissonance`, {
      waitUntil: 'domcontentloaded',
    });

    const panel = memoryPanel(page);

    await waitForMemoryPanelResolved(page, 'Saved locally');
    await expect(panel).toContainText('Saved locally');
    await expect(panel).toContainText('Source: Extension');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Mastery' }))
      .toContainText('Weak');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Box' }))
      .toContainText('Box 2');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Weak score' }))
      .toContainText('0.72');
    await expect(panel.locator('.detail-row').filter({ hasText: 'Recall' }))
      .toContainText('2 correct, 3 wrong');
    await expect(
      panel.locator('.detail-row').filter({ hasText: 'Review events' }),
    ).toContainText('2');
  });

  test('saved-only record does not inherit mock box or mastery', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: 'lucid',
          word: 'Lucid',
          image: 'https://cdn.visuallexicon.org/images/lucid.webp',
          definition: 'Clear and easy to understand.',
          source: 'word_page',
        }),
      },
      reviewState: {},
    });

    await page.goto(`${baseUrl}/word/lucid`, {
      waitUntil: 'domcontentloaded',
    });

    const panel = memoryPanel(page);
    const staticCard = page.locator('.word-card').first();

    await waitForMemoryPanelResolved(page, 'Saved locally');
    await expect(panel).toContainText('Saved locally');
    await expect(panel).toContainText('No local review state yet');
    await expect(panel).not.toContainText('Box 0');
    await expect(panel).not.toContainText('Mastered');
    await expect(staticCard).not.toContainText('Mastered');
    await expect(staticCard).not.toContainText('Box 5');
  });

  test('saved source labels render for word page, alias search, and extension', async ({
    page,
  }) => {
    const sourceCases = [
      {
        slug: 'dissonance',
        word: 'Dissonance',
        source: 'word_page',
        label: 'Source: Word page',
      },
      {
        slug: 'obfuscate',
        word: 'Obfuscate',
        source: 'alias_search',
        label: 'Source: Alias search',
      },
      {
        slug: 'lucid',
        word: 'Lucid',
        source: 'extension',
        label: 'Source: Extension',
      },
    ];

    for (const sourceCase of sourceCases) {
      await seedVlxLocalStorage(page, {
        savedWords: {
          [sourceCase.slug]: makeSavedWord({
            slug: sourceCase.slug,
            word: sourceCase.word,
            source: sourceCase.source,
          }),
        },
        reviewState: {},
      });

      await page.goto(`${baseUrl}/word/${sourceCase.slug}`, {
        waitUntil: 'domcontentloaded',
      });

      await waitForMemoryPanelResolved(page, sourceCase.label);
      await expect(memoryPanel(page)).toContainText(sourceCase.label);
    }
  });

  test('unknown slug shows safe word-not-found state without crashing', async ({
    page,
  }) => {
    const response = await page.goto(`${baseUrl}/word/not-a-real-word`, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: 'Word not found.' }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText('No word content available');
  });
});
