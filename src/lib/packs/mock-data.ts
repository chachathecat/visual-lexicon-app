import type {
  VlxExamPack,
  VlxExamPackManifest,
  VlxQuizPack,
  VlxQuizPackManifest,
  VlxQuizWord,
  VlxSearchLiteIndex,
  VlxStaticPackPath
} from "@/lib/packs/types";

export const mockQuizWords = [
  {
    slug: "dissonance",
    word: "Dissonance",
    url: "https://www.visuallexicon.org/photos/dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    example: "There was dissonance between the promise and the result.",
    memoryHook: "Two notes pulling against each other instead of resolving.",
    hub: "academic-vocabulary",
    hubs: ["academic-vocabulary", "abstract-words"],
    partOfSpeech: "noun",
    cefr: "C1",
    difficulty: "advanced",
    relatedWords: ["discord", "conflict", "tension"],
    confusableWords: ["resonance", "harmony"],
    distractors: ["harmony", "resonance", "melody"],
    updatedAt: "2026-06-05T09:00:00.000Z"
  },
  {
    slug: "abundance",
    word: "Abundance",
    url: "https://www.visuallexicon.org/photos/abundance",
    image: "https://cdn.visuallexicon.org/images/abundance.webp",
    definition: "A large quantity of something useful or valuable.",
    example: "The report found an abundance of evidence.",
    memoryHook: "A full circle that keeps spilling into another full circle.",
    hub: "core-vocabulary",
    hubs: ["core-vocabulary", "essay-words"],
    partOfSpeech: "noun",
    cefr: "B2",
    difficulty: "intermediate",
    relatedWords: ["plenty", "surplus", "wealth"],
    confusableWords: ["scarcity", "quantity"],
    distractors: ["scarcity", "shortage", "absence"],
    updatedAt: "2026-06-05T09:00:00.000Z"
  },
  {
    slug: "resilient",
    word: "Resilient",
    url: "https://www.visuallexicon.org/photos/resilient",
    image: "https://cdn.visuallexicon.org/images/resilient.webp",
    definition: "Able to recover after pressure, shock, or difficulty.",
    example: "The team stayed resilient after the failed launch.",
    memoryHook: "A stem bending under pressure and growing upright again.",
    hub: "workplace-english",
    hubs: ["workplace-english", "core-vocabulary"],
    partOfSpeech: "adjective",
    cefr: "B2",
    difficulty: "intermediate",
    relatedWords: ["durable", "adaptable", "persistent"],
    confusableWords: ["resistant", "rigid"],
    distractors: ["fragile", "rigid", "brittle"],
    updatedAt: "2026-06-05T09:00:00.000Z"
  },
  {
    slug: "obfuscate",
    word: "Obfuscate",
    url: "https://www.visuallexicon.org/photos/obfuscate",
    image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
    definition: "To make something unclear or difficult to understand.",
    example: "The memo obfuscated the actual costs.",
    memoryHook: "A sharp outline hidden behind a blurred frame.",
    hub: "academic-vocabulary",
    hubs: ["academic-vocabulary", "exam-vocabulary"],
    partOfSpeech: "verb",
    cefr: "C1",
    difficulty: "exam",
    relatedWords: ["cloud", "confuse", "blur"],
    confusableWords: ["clarify", "elaborate"],
    distractors: ["clarify", "summarize", "simplify"],
    updatedAt: "2026-06-05T09:00:00.000Z"
  },
  {
    slug: "lucid",
    word: "Lucid",
    url: "https://www.visuallexicon.org/photos/lucid",
    image: "https://cdn.visuallexicon.org/images/lucid.webp",
    definition: "Clear and easy to understand.",
    example: "The analyst gave a lucid explanation of the risk.",
    memoryHook: "A clear circle with the noise removed.",
    hub: "academic-vocabulary",
    hubs: ["academic-vocabulary", "core-vocabulary"],
    partOfSpeech: "adjective",
    cefr: "C1",
    difficulty: "advanced",
    relatedWords: ["clear", "plain", "coherent"],
    confusableWords: ["lurid", "opaque"],
    distractors: ["opaque", "vague", "confused"],
    updatedAt: "2026-06-05T09:00:00.000Z"
  }
] satisfies VlxQuizWord[];

export function getMockQuizWordBySlug(slug: string) {
  return mockQuizWords.find((word) => word.slug === slug);
}

export const mockQuizPackManifest = {
  version: "v1",
  buildId: "20260605_mock_pack_contract",
  builtAt: "2026-06-05T09:00:00.000Z",
  source: "mock",
  wordCount: mockQuizWords.length,
  hubCount: 3,
  packs: {
    core: "/quiz-pack/core-v1.json",
    home: "/quiz-pack/home-v1.json",
    hubs: {
      "academic-vocabulary": "/quiz-pack/hubs/academic-vocabulary.json",
      "core-vocabulary": "/quiz-pack/hubs/core-vocabulary.json",
      "workplace-english": "/quiz-pack/hubs/workplace-english.json"
    },
    words: Object.fromEntries(
      mockQuizWords.map((word) => [
        word.slug,
        `/quiz-pack/words/${word.slug}.json` as VlxStaticPackPath
      ])
    ),
    examPacks: {
      "academic-vocabulary-pack": "/exam-packs/academic-vocabulary-pack.json"
    },
    searchLite: "/search/search-lite-v1.json"
  }
} satisfies VlxQuizPackManifest;

export const mockCorePack = {
  packId: "core-v1",
  title: "Core Visual Vocabulary",
  description: "A compact starter set for high-utility words with visual hooks.",
  mode: "core",
  words: mockQuizWords.filter((word) => word.hubs.includes("core-vocabulary")),
  updatedAt: "2026-06-05T09:00:00.000Z"
} satisfies VlxQuizPack;

export const mockHomePack = {
  packId: "home-v1",
  title: "Everyday Memory Deck",
  description: "A calm daily deck for short recall sessions.",
  mode: "home",
  words: mockQuizWords.slice(0, 3),
  updatedAt: "2026-06-05T09:00:00.000Z"
} satisfies VlxQuizPack;

export const mockAcademicVocabularyHubPack = {
  packId: "hub-academic-vocabulary",
  title: "Academic Vocabulary",
  description: "Abstract words that often appear in essays, lectures, and exams.",
  mode: "hub",
  hub: "academic-vocabulary",
  words: mockQuizWords.filter((word) =>
    word.hubs.includes("academic-vocabulary")
  ),
  updatedAt: "2026-06-05T09:00:00.000Z"
} satisfies VlxQuizPack;

export const mockExamPackManifest = {
  version: "v1",
  buildId: "20260605_mock_exam_contract",
  builtAt: "2026-06-05T09:00:00.000Z",
  source: "mock",
  packCount: 1,
  packs: {
    "academic-vocabulary-pack": "/exam-packs/academic-vocabulary-pack.json"
  }
} satisfies VlxExamPackManifest;

export const mockAcademicVocabularyExamPack = {
  packId: "academic-vocabulary-pack",
  title: "Academic Vocabulary Pack",
  subtitle: "High-value abstract vocabulary for essays and lectures",
  targetExam: "academic",
  description: "A preview pack for recall-focused academic word practice.",
  priceTier: "pro",
  freePreviewCount: 3,
  wordCount: mockAcademicVocabularyHubPack.words.length,
  days: 14,
  words: mockAcademicVocabularyHubPack.words,
  reviewSchedule: [
    {
      day: 1,
      title: "First recall",
      newWords: ["dissonance", "obfuscate", "lucid"]
    },
    {
      day: 3,
      title: "Delayed recall",
      newWords: [],
      reviewWords: ["dissonance", "obfuscate", "lucid"]
    }
  ],
  updatedAt: "2026-06-05T09:00:00.000Z"
} satisfies VlxExamPack;

export const mockSearchLiteIndex = {
  version: "v1",
  buildId: "20260605_mock_search_lite",
  builtAt: "2026-06-05T09:00:00.000Z",
  source: "mock",
  wordCount: mockQuizWords.length,
  words: mockQuizWords.map((word) => ({
    slug: word.slug,
    word: word.word,
    definition: word.definition,
    hub: word.hub,
    hubs: word.hubs,
    image: word.image,
    url: word.url,
    difficulty: word.difficulty,
    updatedAt: word.updatedAt
  }))
} satisfies VlxSearchLiteIndex;

export const mockQuizPacks = [
  mockCorePack,
  mockHomePack,
  mockAcademicVocabularyHubPack
] satisfies VlxQuizPack[];

export const mockExamPacks = [
  mockAcademicVocabularyExamPack
] satisfies VlxExamPack[];

export const mockPackFiles = {
  "/quiz-pack/manifest.json": mockQuizPackManifest,
  "/quiz-pack/core-v1.json": mockCorePack,
  "/quiz-pack/home-v1.json": mockHomePack,
  "/quiz-pack/hubs/academic-vocabulary.json": mockAcademicVocabularyHubPack,
  "/exam-packs/manifest.json": mockExamPackManifest,
  "/exam-packs/academic-vocabulary-pack.json": mockAcademicVocabularyExamPack,
  "/search/search-lite-v1.json": mockSearchLiteIndex,
  ...Object.fromEntries(
    mockQuizWords.map((word) => [
      `/quiz-pack/words/${word.slug}.json`,
      word
    ])
  )
} satisfies Record<string, unknown>;

