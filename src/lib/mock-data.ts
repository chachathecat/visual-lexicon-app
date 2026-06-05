export type MasteryLabel = "New" | "Learning" | "Weak" | "Strong" | "Mastered";

export type VisualCue =
  | "dissonance"
  | "abundance"
  | "resilient"
  | "laconic"
  | "obfuscate"
  | "lucid";

export type MockReviewItem = {
  slug: string;
  word: string;
  definition: string;
  example: string;
  memoryHook: string;
  hub: string;
  box: 0 | 1 | 2 | 3 | 4 | 5;
  mastery: MasteryLabel;
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: string;
  visual: VisualCue;
};

export type MockPack = {
  packId: string;
  title: string;
  description: string;
  mode: "core" | "home" | "exam";
  priceTier: "free" | "lite" | "pro";
  wordCount: number;
  updatedAt: string;
  wordSlugs: string[];
};

export const mockReviewItems: MockReviewItem[] = [
  {
    slug: "dissonance",
    word: "Dissonance",
    definition: "A clash between sounds, ideas, or feelings.",
    example: "There was dissonance between the promise and the result.",
    memoryHook: "Two notes pulling against each other instead of resolving.",
    hub: "academic-vocabulary",
    box: 1,
    mastery: "Weak",
    correct: 3,
    wrong: 2,
    streakCorrect: 0,
    lastReviewedAt: "2026-06-04T09:00:00.000Z",
    nextDueAt: "2026-06-05T09:00:00.000Z",
    weakScore: 0.72,
    avgResponseMs: 6100,
    lastQuestionType: "image_to_word",
    visual: "dissonance"
  },
  {
    slug: "abundance",
    word: "Abundance",
    definition: "A large quantity of something useful or valuable.",
    example: "The report found an abundance of evidence.",
    memoryHook: "A full circle that keeps spilling into another full circle.",
    hub: "core-vocabulary",
    box: 3,
    mastery: "Strong",
    correct: 6,
    wrong: 1,
    streakCorrect: 4,
    lastReviewedAt: "2026-06-03T09:00:00.000Z",
    nextDueAt: "2026-06-12T09:00:00.000Z",
    weakScore: 0.16,
    avgResponseMs: 3200,
    lastQuestionType: "definition_to_word",
    visual: "abundance"
  },
  {
    slug: "resilient",
    word: "Resilient",
    definition: "Able to recover after pressure, shock, or difficulty.",
    example: "The team stayed resilient after the failed launch.",
    memoryHook: "A stem bending under pressure and growing upright again.",
    hub: "workplace-english",
    box: 2,
    mastery: "Learning",
    correct: 4,
    wrong: 1,
    streakCorrect: 2,
    lastReviewedAt: "2026-06-05T08:00:00.000Z",
    nextDueAt: "2026-06-08T08:00:00.000Z",
    weakScore: 0.28,
    avgResponseMs: 4500,
    lastQuestionType: "saved_review",
    visual: "resilient"
  },
  {
    slug: "laconic",
    word: "Laconic",
    definition: "Using very few words.",
    example: "Her laconic reply ended the meeting.",
    memoryHook: "One spare line doing the work of a paragraph.",
    hub: "exam-vocabulary",
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: "2026-06-05T09:00:00.000Z",
    weakScore: 0,
    visual: "laconic"
  },
  {
    slug: "obfuscate",
    word: "Obfuscate",
    definition: "To make something unclear or difficult to understand.",
    example: "The memo obfuscated the actual costs.",
    memoryHook: "A sharp outline hidden behind a blurred frame.",
    hub: "academic-vocabulary",
    box: 0,
    mastery: "Weak",
    correct: 1,
    wrong: 3,
    streakCorrect: 0,
    lastReviewedAt: "2026-06-05T07:30:00.000Z",
    nextDueAt: "2026-06-05T10:00:00.000Z",
    weakScore: 0.88,
    avgResponseMs: 7200,
    lastQuestionType: "definition_to_word",
    visual: "obfuscate"
  },
  {
    slug: "lucid",
    word: "Lucid",
    definition: "Clear and easy to understand.",
    example: "The analyst gave a lucid explanation of the risk.",
    memoryHook: "A clear circle with the noise removed.",
    hub: "academic-vocabulary",
    box: 5,
    mastery: "Mastered",
    correct: 9,
    wrong: 0,
    streakCorrect: 6,
    lastReviewedAt: "2026-06-04T11:00:00.000Z",
    nextDueAt: "2026-07-04T11:00:00.000Z",
    weakScore: 0.04,
    avgResponseMs: 2600,
    lastQuestionType: "due_review",
    visual: "lucid"
  }
];

export const dueReviewItems = mockReviewItems.filter((item) =>
  ["Weak", "New"].includes(item.mastery)
);

export const weakReviewItems = mockReviewItems.filter(
  (item) => item.mastery === "Weak"
);

export const newSavedItems = mockReviewItems.filter(
  (item) => item.mastery === "New"
);

export const masteredItems = mockReviewItems.filter(
  (item) => item.mastery === "Mastered"
);

export const dashboardStats = {
  dueCount: dueReviewItems.length,
  weakCount: weakReviewItems.length,
  masteredCount: masteredItems.length,
  savedCount: mockReviewItems.length,
  weeklyReviewedWords: 18
};

export const mockPacks: MockPack[] = [
  {
    packId: "core-v1",
    title: "Core Visual Vocabulary",
    description: "A compact starter set for high-utility words with visual hooks.",
    mode: "core",
    priceTier: "free",
    wordCount: 120,
    updatedAt: "2026-06-05",
    wordSlugs: ["abundance", "resilient", "lucid"]
  },
  {
    packId: "academic-vocabulary",
    title: "Academic Vocabulary Pack",
    description: "Abstract words that often appear in essays, lectures, and exams.",
    mode: "exam",
    priceTier: "pro",
    wordCount: 240,
    updatedAt: "2026-06-05",
    wordSlugs: ["dissonance", "obfuscate", "lucid"]
  },
  {
    packId: "home-v1",
    title: "Everyday Memory Deck",
    description: "A warm daily deck for saved words and short recall sessions.",
    mode: "home",
    priceTier: "lite",
    wordCount: 80,
    updatedAt: "2026-06-05",
    wordSlugs: ["laconic", "abundance", "resilient"]
  }
];

export function getWordBySlug(slug: string) {
  return mockReviewItems.find((item) => item.slug === slug);
}

export function getPackById(packId: string) {
  return mockPacks.find((pack) => pack.packId === packId);
}

export function getPackWords(pack: MockPack) {
  return pack.wordSlugs
    .map((slug) => getWordBySlug(slug))
    .filter((item): item is MockReviewItem => Boolean(item));
}
