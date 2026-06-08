export const VLX_ALIAS_PACK_PATHS = {
  manifest: "/aliases/manifest.json",
  koEn: "/aliases/ko-en-v1.json",
  jaEn: "/aliases/ja-en-v1.json",
  enKo: "/aliases/en-ko-v1.json",
  enJa: "/aliases/en-ja-v1.json"
} as const;

export type VlxAliasPackPath =
  (typeof VLX_ALIAS_PACK_PATHS)[keyof typeof VLX_ALIAS_PACK_PATHS];
