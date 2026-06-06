import { expect, test } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

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
    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: 'networkidle',
    });

    const startReview = page.getByRole('link', {
      name: 'Start preview review',
    });

    await expect(startReview).toHaveAttribute(
      'href',
      '/review?mode=hub&hub=academic-vocabulary&limit=10',
    );
    await startReview.click();
    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10$/,
    );
    await expect(
      page.getByRole('heading', { name: /Review a vocabulary hub/i }),
    ).toBeVisible();
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
});
