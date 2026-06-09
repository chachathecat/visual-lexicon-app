import { expect, test, type Page } from '@playwright/test';

import {
  getAliasesForSlug,
  mockAliasEntries,
  normalizeAliasQuery,
  resolveAliasMatches,
  resolveAliasQuery,
  type VlxAliasEntry,
} from '../src/lib/multilingual';
import { mockQuizWords } from '../src/lib/packs/mock-data';

const knownMockSlugs = new Set(mockQuizWords.map((word) => word.slug));
const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

async function openAliasSearch(page: Page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

  return page.getByRole('region', { name: 'Alias search' });
}

test.describe('Visual Lexicon multilingual alias contract', () => {
  test('Korean aliases resolve to existing English visual card slugs', () => {
    expect(resolveAliasQuery('불협화음')).toMatchObject({
      slug: 'dissonance',
      word: 'Dissonance',
      sourceLanguage: 'ko',
      targetLanguage: 'en',
      matchSource: 'alias_pack',
    });

    expect(resolveAliasQuery('모호하게 하다')).toMatchObject({
      slug: 'obfuscate',
      word: 'Obfuscate',
      sourceLanguage: 'ko',
      targetLanguage: 'en',
    });
  });

  test('Japanese aliases resolve to existing English visual card slugs', () => {
    expect(resolveAliasQuery('不協和音')).toMatchObject({
      slug: 'dissonance',
      word: 'Dissonance',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      matchSource: 'alias_pack',
    });

    expect(resolveAliasQuery('曖昧にする')).toMatchObject({
      slug: 'obfuscate',
      word: 'Obfuscate',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
    });
  });

  test('unknown aliases return null and empty match lists', () => {
    expect(resolveAliasQuery('없는 별칭')).toBeNull();
    expect(resolveAliasMatches('not-a-visual-lexicon-alias')).toEqual([]);
  });

  test('getAliasesForSlug returns Korean and Japanese aliases for known slugs', () => {
    const aliases = getAliasesForSlug('dissonance');

    expect(aliases.map((entry) => entry.alias)).toEqual(
      expect.arrayContaining(['불협화음', '不協和音']),
    );
    expect(aliases.every((entry) => entry.slug === 'dissonance')).toBe(true);
    expect(aliases.every((entry) => entry.sourceLanguage !== 'en')).toBe(true);
  });

  test('alias entries only point to known mock pack slugs', () => {
    expect(mockAliasEntries.length).toBeGreaterThan(0);

    for (const entry of mockAliasEntries) {
      expect(knownMockSlugs.has(entry.slug)).toBe(true);
    }
  });

  test('normalization handles extra spaces and English casing', () => {
    expect(normalizeAliasQuery('  DISSONANCE  ', 'en')).toBe('dissonance');
    expect(normalizeAliasQuery('  모호하게    하다  ', 'ko')).toBe(
      '모호하게 하다',
    );

    expect(resolveAliasQuery('  모호하게    하다  ')).toMatchObject({
      slug: 'obfuscate',
      sourceLanguage: 'ko',
    });
    expect(resolveAliasMatches('  DISSONANCE  ').map((match) => match.slug)).toEqual([
      'dissonance',
      'dissonance',
    ]);
  });

  test('resolver skips alias entries that point to missing slugs', () => {
    const missingSlugEntry: VlxAliasEntry = {
      sourceLanguage: 'ko',
      targetLanguage: 'en',
      alias: '존재하지 않는 카드',
      slug: 'missing-card',
      word: 'Missing Card',
    };

    expect(
      resolveAliasQuery('존재하지 않는 카드', {
        entries: [missingSlugEntry],
        knownSlugs: [...knownMockSlugs],
      }),
    ).toBeNull();
  });
});

test.describe('Visual Lexicon multilingual alias search UI', () => {
  test('Korean alias resolves to the existing Dissonance card actions', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });

    const aliasSearch = await openAliasSearch(page);

    await aliasSearch.getByLabel('Search alias').fill('불협화음');

    await expect(aliasSearch.getByText('불협화음')).toBeVisible();
    await expect(
      aliasSearch.getByRole('heading', { name: 'Dissonance' }),
    ).toBeVisible();
    await expect(aliasSearch.getByText('Korean to English')).toBeVisible();
    await expect(aliasSearch.getByText('slug: dissonance')).toBeVisible();

    await expect(aliasSearch.getByRole('link', { name: 'View card' })).toHaveAttribute(
      'href',
      '/word/dissonance',
    );
    await expect(
      aliasSearch.getByRole('link', { name: 'Save to review' }),
    ).toHaveAttribute('href', '/save?slug=dissonance&source=alias_search');

    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const dataLayer = (window as Window & { dataLayer?: unknown[] })
            .dataLayer;

          if (!Array.isArray(dataLayer)) return null;

          return (
            dataLayer.find((item) => {
              if (!item || typeof item !== 'object' || Array.isArray(item)) {
                return false;
              }

              const event = item as Record<string, unknown>;

              return (
                event.event === 'vlx_alias_search' &&
                event.source === 'alias_search' &&
                event.query_language === 'ko' &&
                event.matched_slug === 'dissonance' &&
                event.result === 'matched'
              );
            }) ?? null
          );
        });
      })
      .toBeTruthy();
  });

  test('Japanese alias resolves to the existing Obfuscate card actions', async ({
    page,
  }) => {
    const aliasSearch = await openAliasSearch(page);

    await aliasSearch.getByLabel('Search alias').fill('曖昧にする');

    await expect(aliasSearch.getByText('曖昧にする')).toBeVisible();
    await expect(
      aliasSearch.getByRole('heading', { name: 'Obfuscate' }),
    ).toBeVisible();
    await expect(aliasSearch.getByText('Japanese to English')).toBeVisible();
    await expect(aliasSearch.getByText('slug: obfuscate')).toBeVisible();

    await expect(aliasSearch.getByRole('link', { name: 'View card' })).toHaveAttribute(
      'href',
      '/word/obfuscate',
    );
    await expect(
      aliasSearch.getByRole('link', { name: 'Save to review' }),
    ).toHaveAttribute('href', '/save?slug=obfuscate&source=alias_search');
  });

  test('unknown alias shows the no-match state without fake actions', async ({
    page,
  }) => {
    const aliasSearch = await openAliasSearch(page);

    await aliasSearch.getByLabel('Search alias').fill('없는 별칭');

    await expect(aliasSearch.getByText('No alias match found')).toBeVisible();
    await expect(aliasSearch.getByRole('link', { name: 'View card' })).toHaveCount(
      0,
    );
    await expect(
      aliasSearch.getByRole('link', { name: 'Save to review' }),
    ).toHaveCount(0);
  });
});
