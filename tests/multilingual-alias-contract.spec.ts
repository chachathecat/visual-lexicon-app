import { expect, test } from '@playwright/test';

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
