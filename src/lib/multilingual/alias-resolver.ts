import { mockQuizWords } from "@/lib/packs/mock-data";
import { mockAliasEntries } from "@/lib/multilingual/mock-aliases";
import type {
  VlxAliasEntry,
  VlxAliasMatch,
  VlxLanguageCode
} from "@/lib/multilingual/types";

const defaultKnownSlugs = mockQuizWords.map((word) => word.slug);

export type VlxAliasResolveOptions = {
  entries?: readonly VlxAliasEntry[];
  knownSlugs?: readonly string[];
  sourceLanguage?: VlxLanguageCode;
  targetLanguage?: VlxLanguageCode;
  limit?: number;
};

export type VlxAliasesForSlugOptions = {
  entries?: readonly VlxAliasEntry[];
  knownSlugs?: readonly string[];
  sourceLanguages?: readonly VlxLanguageCode[];
  targetLanguage?: VlxLanguageCode;
};

export function normalizeAliasQuery(
  query: string,
  languageCode?: VlxLanguageCode
): string {
  const normalizedWhitespace = query.trim().replace(/\s+/g, " ");

  if (languageCode && languageCode !== "en") {
    return normalizedWhitespace;
  }

  return normalizedWhitespace.toLocaleLowerCase("en-US");
}

export function resolveAliasQuery(
  query: string,
  options: VlxAliasResolveOptions = {}
): VlxAliasMatch | null {
  return resolveAliasMatches(query, {
    ...options,
    limit: 1
  })[0] ?? null;
}

export function getAliasesForSlug(
  slug: string,
  options: VlxAliasesForSlugOptions = {}
): VlxAliasEntry[] {
  const entries = options.entries ?? mockAliasEntries;
  const knownSlugs = makeKnownSlugSet(options.knownSlugs);
  const normalizedSlug = normalizeAliasQuery(slug, "en");
  const sourceLanguages = options.sourceLanguages ?? (["ko", "ja"] as const);

  if (!knownSlugs.has(normalizedSlug)) {
    return [];
  }

  return entries.filter((entry) => {
    return (
      normalizeAliasQuery(entry.slug, "en") === normalizedSlug &&
      knownSlugs.has(normalizeAliasQuery(entry.slug, "en")) &&
      sourceLanguages.includes(entry.sourceLanguage) &&
      (!options.targetLanguage || entry.targetLanguage === options.targetLanguage)
    );
  });
}

export function resolveAliasMatches(
  query: string,
  options: VlxAliasResolveOptions = {}
): VlxAliasMatch[] {
  const entries = options.entries ?? mockAliasEntries;
  const knownSlugs = makeKnownSlugSet(options.knownSlugs);
  const limit = options.limit ?? Number.POSITIVE_INFINITY;

  if (!query.trim()) {
    return [];
  }

  const matches: VlxAliasMatch[] = [];

  for (const entry of entries) {
    if (matches.length >= limit) {
      break;
    }

    const normalizedSlug = normalizeAliasQuery(entry.slug, "en");

    if (!knownSlugs.has(normalizedSlug)) {
      continue;
    }

    if (
      options.sourceLanguage &&
      entry.sourceLanguage !== options.sourceLanguage
    ) {
      continue;
    }

    if (
      options.targetLanguage &&
      entry.targetLanguage !== options.targetLanguage
    ) {
      continue;
    }

    const normalizedQuery = normalizeAliasQuery(query, entry.sourceLanguage);
    const normalizedAlias = normalizeAliasQuery(entry.alias, entry.sourceLanguage);

    if (normalizedQuery !== normalizedAlias) {
      continue;
    }

    matches.push({
      ...entry,
      normalizedQuery,
      matchSource: "alias_pack"
    });
  }

  return matches;
}

function makeKnownSlugSet(
  knownSlugs: readonly string[] = defaultKnownSlugs
) {
  return new Set(knownSlugs.map((slug) => normalizeAliasQuery(slug, "en")));
}
