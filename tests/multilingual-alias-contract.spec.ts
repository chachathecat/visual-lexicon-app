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

function getRequiredAlias(slug: string, sourceLanguage: 'ko' | 'ja') {
  const aliasEntry = mockAliasEntries.find(
    (entry) => entry.slug === slug && entry.sourceLanguage === sourceLanguage,
  );

  expect(aliasEntry, `${sourceLanguage} alias for ${slug}`).toBeTruthy();

  return aliasEntry!;
}

function getSafeAliasTargets(slug: string) {
  return {
    saveHref: `/save?slug=${slug}&source=alias_search`,
    wordHref: `/word/${slug}`,
  };
}

test.describe('Visual Lexicon multilingual alias contract', () => {
  test('Korean aliases resolve to existing English visual card slugs', () => {
    const dissonanceAlias = getRequiredAlias('dissonance', 'ko');
    const obfuscateAlias = getRequiredAlias('obfuscate', 'ko');

    expect(resolveAliasQuery(dissonanceAlias.alias)).toMatchObject({
      slug: 'dissonance',
      word: 'Dissonance',
      sourceLanguage: 'ko',
      targetLanguage: 'en',
      matchSource: 'alias_pack',
    });
    expect(resolveAliasQuery('불협화음')).toMatchObject({
      slug: 'dissonance',
      sourceLanguage: 'ko',
    });

    expect(resolveAliasQuery(obfuscateAlias.alias)).toMatchObject({
      slug: 'obfuscate',
      word: 'Obfuscate',
      sourceLanguage: 'ko',
      targetLanguage: 'en',
    });
  });

  test('Japanese aliases resolve to existing English visual card slugs', () => {
    const dissonanceAlias = getRequiredAlias('dissonance', 'ja');
    const obfuscateAlias = getRequiredAlias('obfuscate', 'ja');

    expect(resolveAliasQuery(dissonanceAlias.alias)).toMatchObject({
      slug: 'dissonance',
      word: 'Dissonance',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      matchSource: 'alias_pack',
    });

    expect(resolveAliasQuery(obfuscateAlias.alias)).toMatchObject({
      slug: 'obfuscate',
      word: 'Obfuscate',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
    });
    expect(resolveAliasQuery('曖昧にする')).toMatchObject({
      slug: 'obfuscate',
      sourceLanguage: 'ja',
    });
  });

  test('unknown aliases return null and empty match lists', () => {
    expect(resolveAliasQuery('not-a-visual-lexicon-alias')).toBeNull();
    expect(resolveAliasMatches('not-a-visual-lexicon-alias')).toEqual([]);
  });

  test('getAliasesForSlug returns Korean and Japanese aliases for known slugs', () => {
    const aliases = getAliasesForSlug('dissonance');
    const expectedAliases = [
      getRequiredAlias('dissonance', 'ko').alias,
      getRequiredAlias('dissonance', 'ja').alias,
    ];

    expect(aliases.map((entry) => entry.alias)).toEqual(
      expect.arrayContaining(expectedAliases),
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
    const koAlias = getRequiredAlias('obfuscate', 'ko').alias;
    const expandedKoAlias = koAlias.replace(' ', '    ');

    expect(normalizeAliasQuery('  DISSONANCE  ', 'en')).toBe('dissonance');
    expect(normalizeAliasQuery(`  ${expandedKoAlias}  `, 'ko')).toBe(koAlias);

    expect(resolveAliasQuery(`  ${expandedKoAlias}  `)).toMatchObject({
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
      alias: 'missing-card-alias',
      slug: 'missing-card',
      word: 'Missing Card',
    };

    expect(
      resolveAliasQuery('missing-card-alias', {
        entries: [missingSlugEntry],
        knownSlugs: [...knownMockSlugs],
      }),
    ).toBeNull();
  });
});

test.describe('Visual Lexicon multilingual alias route-independent actions', () => {
  test('Korean alias resolves to the existing Dissonance safe action targets', () => {
    const aliasEntry = getRequiredAlias('dissonance', 'ko');
    const match = resolveAliasQuery(aliasEntry.alias);

    expect(match).toMatchObject({
      slug: 'dissonance',
      word: 'Dissonance',
      sourceLanguage: 'ko',
      targetLanguage: 'en',
    });
    expect(knownMockSlugs.has(match!.slug)).toBe(true);
    expect(getSafeAliasTargets(match!.slug)).toEqual({
      saveHref: '/save?slug=dissonance&source=alias_search',
      wordHref: '/word/dissonance',
    });
  });

  test('Japanese alias resolves to the existing Obfuscate safe action targets', () => {
    const aliasEntry = getRequiredAlias('obfuscate', 'ja');
    const match = resolveAliasQuery(aliasEntry.alias);

    expect(match).toMatchObject({
      slug: 'obfuscate',
      word: 'Obfuscate',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
    });
    expect(knownMockSlugs.has(match!.slug)).toBe(true);
    expect(getSafeAliasTargets(match!.slug)).toEqual({
      saveHref: '/save?slug=obfuscate&source=alias_search',
      wordHref: '/word/obfuscate',
    });
  });

  test('unknown alias creates no card or save action target', () => {
    const match = resolveAliasQuery('not-a-visual-lexicon-alias');

    expect(match).toBeNull();
    expect(resolveAliasMatches('not-a-visual-lexicon-alias')).toEqual([]);
    expect(match ? getSafeAliasTargets(match.slug) : null).toBeNull();
  });
});
