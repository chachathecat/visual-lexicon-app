export const VLX_PACK_PATHS = {
  quizManifest: "/quiz-pack/manifest.json",
  core: "/quiz-pack/core-v1.json",
  home: "/quiz-pack/home-v1.json",
  examManifest: "/exam-packs/manifest.json",
  searchLite: "/search/search-lite-v1.json"
} as const;

export type VlxStaticPackPath =
  | "/quiz-pack/manifest.json"
  | "/quiz-pack/core-v1.json"
  | "/quiz-pack/home-v1.json"
  | `/quiz-pack/hubs/${string}.json`
  | `/quiz-pack/words/${string}.json`
  | "/exam-packs/manifest.json"
  | `/exam-packs/${string}.json`
  | "/search/search-lite-v1.json";

export type VlxPackSource = "mock" | "r2" | "webflow_export" | "manual";

export type VlxCefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type VlxWordDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "exam"
  | "expert";

export type VlxQuizPackMode =
  | "home"
  | "core"
  | "hub"
  | "word"
  | "exam"
  | "language_pair";

export type VlxPriceTier = "free" | "lite" | "pro" | "one_time";

export type VlxTargetExam =
  | "academic"
  | "ielts"
  | "gre"
  | "toefl"
  | "sat"
  | "essay"
  | "custom";

export type VlxQuizWord = {
  slug: string;
  word: string;
  url: string;
  image: string;
  definition: string;
  example: string;
  memoryHook: string;
  hub: string;
  hubs: string[];
  partOfSpeech: string;
  cefr: VlxCefrLevel;
  difficulty: VlxWordDifficulty;
  relatedWords: string[];
  confusableWords: string[];
  distractors: string[];
  updatedAt: string;
};

export type VlxQuizPackManifest = {
  version: string;
  buildId: string;
  builtAt: string;
  source: VlxPackSource;
  wordCount: number;
  hubCount: number;
  packs: {
    core?: VlxStaticPackPath;
    home?: VlxStaticPackPath;
    hubs?: Record<string, VlxStaticPackPath>;
    words?: Record<string, VlxStaticPackPath>;
    examPacks?: Record<string, VlxStaticPackPath>;
    searchLite?: VlxStaticPackPath;
  };
};

export type VlxQuizPack = {
  packId: string;
  title: string;
  description: string;
  mode: VlxQuizPackMode;
  hub?: string;
  words: VlxQuizWord[];
  updatedAt: string;
};

export type VlxExamPackManifest = {
  version: string;
  buildId: string;
  builtAt: string;
  source: VlxPackSource;
  packCount: number;
  packs: Record<string, VlxStaticPackPath>;
};

export type VlxPackScheduleDay = {
  day: number;
  title: string;
  newWords: string[];
  reviewWords?: string[];
};

export type VlxExamPack = {
  packId: string;
  title: string;
  subtitle?: string;
  targetExam?: VlxTargetExam;
  description: string;
  priceTier: VlxPriceTier;
  freePreviewCount: number;
  wordCount: number;
  days?: number;
  words: VlxQuizWord[];
  reviewSchedule?: VlxPackScheduleDay[];
  updatedAt: string;
};

export type VlxSearchLiteWord = {
  slug: string;
  word: string;
  definition: string;
  hub: string;
  hubs: string[];
  image: string;
  url: string;
  difficulty: VlxWordDifficulty;
  updatedAt: string;
};

export type VlxSearchLiteIndex = {
  version: string;
  buildId: string;
  builtAt: string;
  source: VlxPackSource;
  wordCount: number;
  words: VlxSearchLiteWord[];
};

export type VlxPackFilePayload =
  | VlxQuizPackManifest
  | VlxQuizPack
  | VlxExamPackManifest
  | VlxExamPack
  | VlxQuizWord
  | VlxSearchLiteIndex;

