import { expect, test, type Page } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const packProgressStorageKey = 'vlx_pack_progress_v1';
const vlxLocalStorageKeys = [
  'vlx_saved_words_v1',
  'vlx_review_state_v1',
  'vlx_review_events_v1',
  'vlx_daily_stats_v1',
  packProgressStorageKey,
] as const;
const academicPreviewReviewHref =
  '/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview';

const requiredPackRoutes = [
  {
    path: '/packs/academic-vocabulary',
    heading: 'Academic Vocabulary',
  },
  {
    path: '/packs/home-v1',
    heading: 'Everyday Memory Deck',
  },
  {
    path: '/packs/core-v1',
    heading: 'Core Visual Vocabulary',
  },
] as const;

const plannedPlaceholderRoutes = [
  {
    path: '/packs/ielts-writing-vocabulary',
    heading: 'IELTS Writing Vocabulary',
    emptyHeading: 'IELTS pack data is not available yet',
  },
  {
    path: '/packs/gre-visual-verbal',
    heading: 'GRE Visual Verbal',
    emptyHeading: 'GRE pack data is not available yet',
  },
] as const;

async function readLocalJson<T = unknown>(
  page: Page,
  key: string,
): Promise<T | null> {
  return await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, key);
}

async function clearPackProgress(page: Page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate((storageKeys) => {
    for (const storageKey of storageKeys) {
      localStorage.removeItem(storageKey);
    }
  }, vlxLocalStorageKeys);
}

async function completeReviewSession(page: Page) {
  let answeredCards = 0;

  for (let index = 0; index < 20; index += 1) {
    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });

    const firstChoice = page.locator('.review-option').first();

    await expect(firstChoice).toBeVisible();
    await firstChoice.click();
    answeredCards += 1;

    const nextButton = page.getByRole('button', {
      name: /Next card|View summary/i,
    });

    await expect(nextButton).toBeVisible();

    const buttonLabel = await nextButton.innerText();

    await nextButton.click();

    if (/View summary/i.test(buttonLabel)) {
      break;
    }
  }

  await expect(
    page.getByRole('heading', { name: 'Session summary' }),
  ).toBeVisible();

  return answeredCards;
}

test.describe('Visual Lexicon exam pack preview MVP', () => {
  test('/packs renders starter pack cards or a safe fallback', async ({ page }) => {
    const response = await page.goto(`${baseUrl}/packs`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Starter pack previews/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Academic Vocabulary' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'IELTS Writing Vocabulary' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'GRE Visual Verbal' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View pack' }).first(),
    ).toBeVisible();
  });

  for (const route of requiredPackRoutes) {
    test(`${route.path} renders metadata or a safe fallback`, async ({
      page,
    }) => {
      const response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: 'networkidle',
      });

      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole('heading', { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Pack details' }),
      ).toBeVisible();
      await expect(page.getByText('Pack ID')).toBeVisible();
      await expect(page.locator('dt').filter({ hasText: 'Words' })).toBeVisible();
      await expect(
        page.locator('dt').filter({ hasText: 'Preview' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Start preview review' }),
      ).toBeVisible();
    });
  }

  test('preview words render when pack data is available', async ({ page }) => {
    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.getByRole('heading', { name: 'Preview words' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dissonance' })).toBeVisible();
    await expect(
      page.getByText('A clash between sounds, ideas, or feelings.'),
    ).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Preview image for Dissonance' }),
    ).toBeVisible();
  });

  test('Start preview review CTA navigates to a supported review route', async ({
    page,
  }) => {
    await clearPackProgress(page);
    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: 'networkidle',
    });

    const startReview = page.getByRole('link', {
      name: 'Start preview review',
    });

    await expect(startReview).toHaveAttribute(
      'href',
      academicPreviewReviewHref,
    );
    await startReview.click();
    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview$/,
    );
    await expect(
      page.getByRole('heading', { name: /Review a vocabulary hub/i }),
    ).toBeVisible();

    const progressStore = await readLocalJson<Record<string, Record<string, unknown>>>(
      page,
      packProgressStorageKey,
    );
    const academicProgress = progressStore?.['academic-vocabulary'];

    expect(academicProgress?.source).toBe('pack_detail');
    expect(typeof academicProgress?.previewStartedAt).toBe('string');
    expect(academicProgress?.previewCompletedAt).toBeUndefined();
  });

  test('starting Academic preview records local pack progress and exposes a continue state', async ({
    page,
  }) => {
    await clearPackProgress(page);
    await page.goto(`${baseUrl}/packs`, {
      waitUntil: 'networkidle',
    });

    const academicCard = page
      .locator('article.pack-card')
      .filter({ hasText: 'Academic Vocabulary' });

    await academicCard
      .getByRole('link', { name: 'Start preview review' })
      .click();
    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview$/,
    );

    await expect
      .poll(async () => {
        const progressStore = await readLocalJson<Record<string, unknown>>(
          page,
          packProgressStorageKey,
        );

        return Boolean(progressStore?.['academic-vocabulary']);
      })
      .toBe(true);

    const progressStore = await readLocalJson<Record<string, Record<string, unknown>>>(
      page,
      packProgressStorageKey,
    );
    const academicProgress = progressStore?.['academic-vocabulary'];

    expect(academicProgress?.packId).toBe('academic-vocabulary');
    expect(typeof academicProgress?.startedAt).toBe('string');
    expect(typeof academicProgress?.previewStartedAt).toBe('string');
    expect(academicProgress?.reviewedCount).toBe(0);
    expect(academicProgress?.correctCount).toBe(0);
    expect(academicProgress?.source).toBe('packs_page');

    await page.goto(`${baseUrl}/packs`, { waitUntil: 'networkidle' });

    const updatedAcademicCard = page
      .locator('article.pack-card')
      .filter({ hasText: 'Academic Vocabulary' });

    await expect(
      updatedAcademicCard.getByRole('link', { name: 'Continue preview' }),
    ).toBeVisible();
    await expect(updatedAcademicCard.getByText('Preview started')).toBeVisible();
  });

  test('completing Academic preview review writes pack progress from real answers', async ({
    page,
  }) => {
    await clearPackProgress(page);
    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: 'networkidle',
    });

    await page
      .getByRole('link', { name: 'Start preview review' })
      .click();
    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview$/,
    );

    const progressBeforeSummary = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, packProgressStorageKey);

    expect(
      progressBeforeSummary?.['academic-vocabulary']?.previewCompletedAt,
    ).toBeUndefined();

    const answeredCards = await completeReviewSession(page);
    const reviewEvents = await readLocalJson<Record<string, unknown>[]>(
      page,
      'vlx_review_events_v1',
    );
    const actualCorrectAnswers = (reviewEvents ?? []).filter(
      (event) => event.result === 'correct',
    ).length;
    const progressStore = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, packProgressStorageKey);
    const academicProgress = progressStore?.['academic-vocabulary'];

    expect(reviewEvents).toHaveLength(answeredCards);
    expect(academicProgress?.reviewedCount).toBe(answeredCards);
    expect(academicProgress?.correctCount).toBe(actualCorrectAnswers);
    expect(typeof academicProgress?.previewCompletedAt).toBe('string');
    expect(typeof academicProgress?.lastReviewedAt).toBe('string');
    expect(academicProgress?.source).toBe('review');
  });

  test('missing planned exam pack data uses a clear empty state', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/packs/ielts-writing-vocabulary`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.getByRole('heading', { level: 1, name: 'IELTS Writing Vocabulary' }),
    ).toBeVisible();
    await expect(page.getByText('Data pending')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'IELTS pack data is not available yet',
      }),
    ).toBeVisible();
    await expect(page.getByText(/safest existing mixed review route/i)).toBeVisible();
  });

  test('planned IELTS and GRE placeholders remain honest without fake progress', async ({
    page,
  }) => {
    await clearPackProgress(page);
    await page.goto(`${baseUrl}/packs`, { waitUntil: 'networkidle' });

    for (const route of plannedPlaceholderRoutes) {
      const card = page
        .locator('article.pack-card')
        .filter({ hasText: route.heading });

      await expect(card.getByText('Data pending')).toBeVisible();
      await expect(card.getByText('Word count pending')).toBeVisible();
      await expect(card.getByText(/preview words/i)).toHaveCount(0);
      await expect(
        card.getByRole('link', { name: 'Start preview review' }),
      ).toHaveCount(0);
      await expect(
        card.getByText(/Continue preview|Preview started|Preview completed|\d+ reviewed/i),
      ).toHaveCount(0);
    }

    for (const route of plannedPlaceholderRoutes) {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });

      await expect(
        page.getByRole('heading', { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(page.getByText('Data pending')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: route.emptyHeading }),
      ).toBeVisible();
      await expect(
        page
          .locator('.detail-row')
          .filter({ hasText: 'Words' })
          .getByText('Not available yet'),
      ).toBeVisible();
      await expect(
        page
          .locator('.detail-row')
          .filter({ hasText: 'Preview' })
          .getByText('Not available yet'),
      ).toBeVisible();
      await expect(
        page.getByText(/Continue preview|Preview started|Preview completed|\d+ reviewed/i),
      ).toHaveCount(0);
    }
  });
});
