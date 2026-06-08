import type {
  VlxAliasEntry,
  VlxAliasPack,
  VlxLanguageCode,
  VlxLanguagePair
} from "@/lib/multilingual/types";

const updatedAt = "2026-06-08T00:00:00.000Z";

const aliasPairs = [
  {
    slug: "dissonance",
    word: "Dissonance",
    ko: "불협화음",
    ja: "不協和音"
  },
  {
    slug: "obfuscate",
    word: "Obfuscate",
    ko: "모호하게 하다",
    ja: "曖昧にする"
  },
  {
    slug: "lucid",
    word: "Lucid",
    ko: "명료한",
    ja: "明快な"
  },
  {
    slug: "abundance",
    word: "Abundance",
    ko: "풍부함",
    ja: "豊富"
  }
] as const;

function makeAliasEntry(
  pair: VlxLanguagePair,
  alias: string,
  slug: string,
  word: string,
  targetAlias?: string
): VlxAliasEntry {
  return {
    ...pair,
    alias,
    slug,
    word,
    targetAlias
  };
}

function makeAliasPack(
  packId: string,
  pair: VlxLanguagePair,
  aliases: VlxAliasEntry[]
): VlxAliasPack {
  return {
    packId,
    version: "v1",
    languagePair: pair,
    aliases,
    updatedAt
  };
}

function pair(
  sourceLanguage: VlxLanguageCode,
  targetLanguage: VlxLanguageCode
): VlxLanguagePair {
  return {
    sourceLanguage,
    targetLanguage
  };
}

const koEnPair = pair("ko", "en");
const jaEnPair = pair("ja", "en");
const enKoPair = pair("en", "ko");
const enJaPair = pair("en", "ja");

export const mockKoEnAliasPack = makeAliasPack(
  "ko-en-v1",
  koEnPair,
  aliasPairs.map(({ ko, slug, word }) =>
    makeAliasEntry(koEnPair, ko, slug, word)
  )
);

export const mockJaEnAliasPack = makeAliasPack(
  "ja-en-v1",
  jaEnPair,
  aliasPairs.map(({ ja, slug, word }) =>
    makeAliasEntry(jaEnPair, ja, slug, word)
  )
);

export const mockEnKoAliasPack = makeAliasPack(
  "en-ko-v1",
  enKoPair,
  aliasPairs.map(({ ko, slug, word }) =>
    makeAliasEntry(enKoPair, slug, slug, word, ko)
  )
);

export const mockEnJaAliasPack = makeAliasPack(
  "en-ja-v1",
  enJaPair,
  aliasPairs.map(({ ja, slug, word }) =>
    makeAliasEntry(enJaPair, slug, slug, word, ja)
  )
);

export const mockAliasPacks = [
  mockKoEnAliasPack,
  mockJaEnAliasPack,
  mockEnKoAliasPack,
  mockEnJaAliasPack
] satisfies VlxAliasPack[];

export const mockAliasEntries = mockAliasPacks.flatMap((pack) => pack.aliases);
