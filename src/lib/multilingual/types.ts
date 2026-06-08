export type VlxLanguageCode = "en" | "ko" | "ja";

export type VlxLanguagePair = {
  sourceLanguage: VlxLanguageCode;
  targetLanguage: VlxLanguageCode;
};

export type VlxAliasMatchSource = "alias_pack";

export type VlxAliasEntry = VlxLanguagePair & {
  alias: string;
  slug: string;
  word: string;
  targetAlias?: string;
};

export type VlxAliasMatch = VlxAliasEntry & {
  normalizedQuery: string;
  matchSource: VlxAliasMatchSource;
};

export type VlxAliasPack = {
  packId: string;
  version: string;
  languagePair: VlxLanguagePair;
  aliases: VlxAliasEntry[];
  updatedAt: string;
};
