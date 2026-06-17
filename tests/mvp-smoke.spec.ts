import { expect, test, type Page } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const testSlug = 'dissonance';

const storageKeys = [
  'vlx_saved_words_v1',
  'vlx_review_state_v1',
  'vlx_review_events_v1',
  'vlx_daily_stats_v1',
  'vlx_pack_progress_v1',
  'vlx_plan_state_v1',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasSavedSlug(saved: unknown, slug: string): boolean {
  if (Array.isArray(saved)) {
    return saved.some((item) => {
      if (typeof item === 'string') return item === slug;
      if (!isRecord(item)) return false;
      return item.slug === slug;
    });
  }

  if (isRecord(saved)) {
    return Boolean(saved[slug]);
  }

  return false;
}

function countSavedSlug(saved: unknown, slug: string): number {
  if (Array.isArray(saved)) {
    return saved.filter((item) => {
      if (typeof item === 'string') return item === slug;
      if (!isRecord(item)) return false;
      return item.slug === slug;
    }).length;
  }

  if (isRecord(saved)) {
    return saved[slug] ? 1 : 0;
  }

  return 0;
}

function getReviewedCount(dailyStats: unknown): number {
  if (!isRecord(dailyStats)) return 0;

  if (typeof dailyStats.reviewed === 'number') {
    return dailyStats.reviewed;
  }

  return Object.values(dailyStats).reduce<number>((sum, value) => {
    if (!isRecord(value)) return sum;
    return sum + (typeof value.reviewed === 'number' ? value.reviewed : 0);
  }, 0);
}

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

async function clearVlxLocalStorage(page: Page): Promise<void> {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function getReviewEventCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem('vlx_review_events_v1') || '[]',
      );

      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  });
}

async function getSaveAnalyticsEvents(page: Page): Promise<
  Record<string, unknown>[]
> {
  return await page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;

    if (!Array.isArray(dataLayer)) return [];

    return dataLayer.filter((item): item is Record<string, unknown> => {
      return Boolean(
        item &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          (item as Record<string, unknown>).event === 'vlx_save_word',
      );
    });
  });
}

test.describe('Visual Lexicon local MVP smoke', () => {
  test('extension save route stores saved word source as extension', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });
    await clearVlxLocalStorage(page);

    const response = await page.goto(
      `${baseUrl}/save?slug=${testSlug}&source=extension`,
      { waitUntil: 'domcontentloaded' },
    );

    expect(response?.status()).toBe(200);

    await page.waitForFunction(
      (slug) => {
        const rawSaved = localStorage.getItem('vlx_saved_words_v1');
        const rawState = localStorage.getItem('vlx_review_state_v1');

        if (!rawSaved || !rawState) return false;

        try {
          const saved = JSON.parse(rawSaved);
          const state = JSON.parse(rawState);

          return saved?.[slug]?.source === 'extension' && Boolean(state?.[slug]);
        } catch {
          return false;
        }
      },
      testSlug,
      { timeout: 15000 },
    );

    const savedWords = await readLocalJson<Record<string, Record<string, unknown>>>(
      page,
      'vlx_saved_words_v1',
    );
    const saveAnalyticsEvents = await getSaveAnalyticsEvents(page);
    const extensionSaveEvent = saveAnalyticsEvents.find(
      (event) =>
        event.slug === testSlug &&
        event.source === 'extension' &&
        event.result === 'saved',
    );

    expect(savedWords?.[testSlug]?.source).toBe('extension');
    expect(extensionSaveEvent).toBeTruthy();
  });

  test('save route creates local review item and review session writes events/stats', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });
    await clearVlxLocalStorage(page);

    const saveUrl = `${baseUrl}/save?slug=${testSlug}&source=word_page`;
    const saveResponse = await page.goto(saveUrl, {
      waitUntil: 'domcontentloaded',
    });

    expect(saveResponse).not.toBeNull();
    expect(saveResponse!.status()).toBe(200);

    const savePageText = await page.locator('body').innerText();
    expect(savePageText.toLowerCase()).not.toContain(
      'this page could not be found',
    );

    await page.waitForFunction(
      (slug) => {
        const savedRaw = localStorage.getItem('vlx_saved_words_v1');
        const stateRaw = localStorage.getItem('vlx_review_state_v1');

        if (!savedRaw || !stateRaw) return false;

        try {
          const saved = JSON.parse(savedRaw);
          const state = JSON.parse(stateRaw);

          const hasSaved =
            Boolean(saved?.[slug]) ||
            (Array.isArray(saved) &&
              saved.some((item) =>
                typeof item === 'string'
                  ? item === slug
                  : item?.slug === slug,
              ));

          return Boolean(hasSaved && state?.[slug]);
        } catch {
          return false;
        }
      },
      testSlug,
      { timeout: 15000 },
    );

    await expect(page.locator('body')).toContainText(
      'This word is now in your review queue.',
    );
    await expect(
      page.getByRole('link', { name: 'Review now' }),
    ).toHaveAttribute('href', `/review?mode=word&slug=${testSlug}&limit=5`);
    await expect(
      page.getByRole('link', { name: 'Go to dashboard' }),
    ).toHaveAttribute('href', '/dashboard');

    await page.waitForFunction(
      (slug) => {
        const dataLayer = (window as Window & { dataLayer?: unknown[] })
          .dataLayer;

        if (!Array.isArray(dataLayer)) return false;

        return dataLayer.some((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return false;
          }

          const event = item as Record<string, unknown>;

          return (
            event.event === 'vlx_save_word' &&
            event.slug === slug &&
            event.result === 'saved'
          );
        });
      },
      testSlug,
      { timeout: 15000 },
    );

    const saveAnalyticsEvents = await getSaveAnalyticsEvents(page);
    const firstSaveAnalytics = saveAnalyticsEvents.find(
      (event) => event.slug === testSlug && event.result === 'saved',
    );

    expect(firstSaveAnalytics).toBeTruthy();
    expect(firstSaveAnalytics?.source).toBe('word_page');
    expect(firstSaveAnalytics?.route).toBe('/save');
    expect(firstSaveAnalytics?.hasLocalReviewState).toBe(true);
    expect(firstSaveAnalytics?.hasLocalSavedWord).toBe(true);

    const savedWords = await readLocalJson(page, 'vlx_saved_words_v1');
    expect(hasSavedSlug(savedWords, testSlug)).toBe(true);

    const reviewState =
      await readLocalJson<Record<string, unknown>>(
        page,
        'vlx_review_state_v1',
      );

    expect(reviewState?.[testSlug]).toBeTruthy();

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    const dashboardDissonance = page.getByText(/dissonance/i);
    expect(await dashboardDissonance.count()).toBeGreaterThan(0);
    await expect(dashboardDissonance.first()).toBeVisible();

    await page.goto(`${baseUrl}/review`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', {
        name: /A focused recall session for today's memory loop/i,
      }),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });

    const initialEventCount = await getReviewEventCount(page);
    let clickedChoices = 0;

    for (let i = 0; i < 10; i += 1) {
      const firstChoice = page.locator('.review-option').first();

      if (!(await firstChoice.isVisible().catch(() => false))) {
        break;
      }

      await firstChoice.click();
      await expect(
        page.getByRole('heading', { name: 'How did that recall feel?' }),
      ).toBeVisible();
      await page.getByRole('button', { name: /I knew it/i }).click();
      clickedChoices += 1;

      await expect
        .poll(async () => await getReviewEventCount(page), {
          timeout: 10000,
        })
        .toBeGreaterThanOrEqual(initialEventCount + clickedChoices);

      const nextButton = page.getByRole('button', {
        name: /Next card|View summary/i,
      });

      if (await nextButton.isVisible().catch(() => false)) {
        const label = await nextButton.innerText();
        await nextButton.click();

        if (/View summary/i.test(label)) {
          break;
        }

        await page.waitForTimeout(100);
        continue;
      }

      break;
    }

    expect(clickedChoices).toBeGreaterThan(0);

    const reviewEvents = await readLocalJson<unknown[]>(
      page,
      'vlx_review_events_v1',
    );

    expect(Array.isArray(reviewEvents)).toBe(true);
    expect(reviewEvents?.length ?? 0).toBeGreaterThan(0);

    const dailyStats = await readLocalJson(page, 'vlx_daily_stats_v1');
    const reviewedCount: number = getReviewedCount(dailyStats);

    expect(reviewedCount).toBeGreaterThan(0);

    const finalReviewState =
      await readLocalJson<Record<string, unknown>>(
        page,
        'vlx_review_state_v1',
      );

    const dissonanceState = finalReviewState?.[testSlug];

    expect(dissonanceState).toBeTruthy();

    if (isRecord(dissonanceState)) {
      expect(typeof dissonanceState.nextDueAt).toBe('string');
    }

    await page.goto(saveUrl, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(
      (slug) => {
        const dataLayer = (window as Window & { dataLayer?: unknown[] })
          .dataLayer;

        if (!Array.isArray(dataLayer)) return false;

        return dataLayer.some((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return false;
          }

          const event = item as Record<string, unknown>;

          return (
            event.event === 'vlx_save_word' &&
            event.slug === slug &&
            event.result === 'duplicate'
          );
        });
      },
      testSlug,
      { timeout: 15000 },
    );

    const duplicateReviewState =
      await readLocalJson<Record<string, unknown>>(
        page,
        'vlx_review_state_v1',
      );
    const duplicateSavedWords = await readLocalJson(
      page,
      'vlx_saved_words_v1',
    );

    expect(duplicateReviewState?.[testSlug]).toEqual(dissonanceState);
    expect(countSavedSlug(duplicateSavedWords, testSlug)).toBe(1);
  });
});
