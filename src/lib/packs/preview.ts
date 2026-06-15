import {
  getCorePack,
  getExamPack,
  getHomePack,
  getHubPack
} from "@/lib/packs/pack-reader";
import type {
  VlxPriceTier,
  VlxQuizPack,
  VlxQuizWord,
  VlxTargetExam,
  VlxWordDifficulty
} from "@/lib/packs/types";

export type VlxPackPreviewStatus = "available" | "empty" | "placeholder";
export type VlxPackPreviewKind = "exam" | "learning";

export type VlxPackPreview = {
  packId: string;
  title: string;
  description: string;
  kind: VlxPackPreviewKind;
  status: VlxPackPreviewStatus;
  targetLabel?: string;
  targetExam?: VlxTargetExam;
  levelLabel?: string;
  difficultyLabel?: string;
  wordCount?: number;
  previewCount?: number;
  planDays?: number;
  priceTier?: VlxPriceTier;
  updatedAt?: string;
  reviewHref: string;
  reviewFallbackNote?: string;
  wordSlugs: string[];
  previewWords: VlxQuizWord[];
  sourceLabel: string;
  emptyTitle: string;
  emptyBody: string;
};

type StarterPackDefinition = {
  packId: string;
  title: string;
  description: string;
  kind: VlxPackPreviewKind;
  targetLabel?: string;
  targetExam?: VlxTargetExam;
  sourceLabel: string;
  resolver: "academic" | "core" | "home" | "placeholder";
  reviewHub?: string;
  fallbackReviewHref?: string;
  emptyTitle?: string;
  emptyBody?: string;
};

const PREVIEW_LIMIT = 10;
const MIXED_REVIEW_FALLBACK = "/review?limit=10";

const starterPackDefinitions = [
  {
    packId: "academic-vocabulary",
    title: "Academic Vocabulary",
    description:
      "A guided visual plan for abstract words in essays, lectures, and exam reading passages.",
    kind: "exam",
    targetLabel: "Academic essays and lectures",
    targetExam: "academic",
    sourceLabel: "Exam pack and academic hub",
    resolver: "academic",
    reviewHub: "academic-vocabulary"
  },
  {
    packId: "ielts-writing-vocabulary",
    title: "IELTS Writing Vocabulary",
    description:
      "A planned writing-focused visual vocabulary plan for IELTS Task 1 and Task 2.",
    kind: "exam",
    targetLabel: "IELTS Writing",
    targetExam: "ielts",
    sourceLabel: "Planned exam pack",
    resolver: "placeholder",
    fallbackReviewHref: MIXED_REVIEW_FALLBACK,
    emptyTitle: "IELTS pack data is not available yet",
    emptyBody:
      "The current pack reader and mock fallback do not include IELTS words, so this preview does not show word counts or sample cards."
  },
  {
    packId: "gre-visual-verbal",
    title: "GRE Visual Verbal",
    description:
      "A planned visual verbal plan for abstract GRE words and mistake-prone choices.",
    kind: "exam",
    targetLabel: "GRE Verbal",
    targetExam: "gre",
    sourceLabel: "Planned exam pack",
    resolver: "placeholder",
    fallbackReviewHref: MIXED_REVIEW_FALLBACK,
    emptyTitle: "GRE pack data is not available yet",
    emptyBody:
      "The current pack reader and mock fallback do not include GRE words, so this preview does not show word counts or sample cards."
  },
  {
    packId: "core-v1",
    title: "Core Visual Vocabulary",
    description: "High-utility visual words for the first learning loop.",
    kind: "learning",
    targetLabel: "Starter visual vocabulary",
    sourceLabel: "Core quiz pack",
    resolver: "core",
    reviewHub: "core-vocabulary"
  },
  {
    packId: "home-v1",
    title: "Everyday Memory Deck",
    description: "A calm daily deck for short recall practice.",
    kind: "learning",
    targetLabel: "Daily recall habit",
    sourceLabel: "Home quiz pack",
    resolver: "home",
    fallbackReviewHref: MIXED_REVIEW_FALLBACK
  }
] as const satisfies readonly StarterPackDefinition[];

export const packPreviewIds = starterPackDefinitions.map(
  (definition) => definition.packId
);

function uniqueDefined<T>(values: (T | undefined)[]) {
  return Array.from(new Set(values.filter((value): value is T => Boolean(value))));
}

function formatToken(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDifficulty(value: VlxWordDifficulty) {
  return formatToken(value);
}

function summarizeLevels(words: VlxQuizWord[]) {
  const cefrLevels = uniqueDefined(words.map((word) => word.cefr));

  return cefrLevels.length ? cefrLevels.join(" / ") : undefined;
}

function summarizeDifficulties(words: VlxQuizWord[]) {
  const difficulties = uniqueDefined(words.map((word) => word.difficulty));

  return difficulties.length
    ? difficulties.map((difficulty) => formatDifficulty(difficulty)).join(" / ")
    : undefined;
}

function getReviewHref(definition: StarterPackDefinition) {
  if (definition.reviewHub) {
    const params = new URLSearchParams({
      mode: "hub",
      hub: definition.reviewHub,
      limit: String(PREVIEW_LIMIT),
      packId: definition.packId,
      source: "pack_preview"
    });

    return `/review?${params.toString()}`;
  }

  return definition.fallbackReviewHref ?? MIXED_REVIEW_FALLBACK;
}

function getReviewFallbackNote(definition: StarterPackDefinition) {
  if (definition.reviewHub) {
    return undefined;
  }

  return "No pack-specific hub route is mapped yet, so this starts the safest existing mixed review route.";
}

function getStatusFromWords(words: VlxQuizWord[], hasPackData: boolean) {
  if (words.length) {
    return "available" satisfies VlxPackPreviewStatus;
  }

  return hasPackData
    ? ("empty" satisfies VlxPackPreviewStatus)
    : ("placeholder" satisfies VlxPackPreviewStatus);
}

function buildBasePreview(
  definition: StarterPackDefinition,
  words: VlxQuizWord[],
  hasPackData: boolean
): VlxPackPreview {
  const previewWords = words.slice(0, PREVIEW_LIMIT);

  return {
    packId: definition.packId,
    title: definition.title,
    description: definition.description,
    kind: definition.kind,
    status: getStatusFromWords(previewWords, hasPackData),
    targetLabel: definition.targetLabel,
    targetExam: definition.targetExam,
    levelLabel: summarizeLevels(previewWords),
    difficultyLabel: summarizeDifficulties(previewWords),
    reviewHref: getReviewHref(definition),
    reviewFallbackNote: getReviewFallbackNote(definition),
    wordSlugs: words.map((word) => word.slug),
    previewWords,
    sourceLabel: definition.sourceLabel,
    emptyTitle: definition.emptyTitle ?? "No preview words available",
    emptyBody:
      definition.emptyBody ??
      "This pack resolved through the pack reader, but no preview words are available in the current data."
  } satisfies VlxPackPreview;
}

function mergeQuizPackPreview(
  definition: StarterPackDefinition,
  pack: VlxQuizPack | null
): VlxPackPreview {
  const base = buildBasePreview(definition, pack?.words ?? [], Boolean(pack));
  const previewCount = pack?.words.length
    ? Math.min(pack.words.length, PREVIEW_LIMIT)
    : undefined;

  return {
    ...base,
    title: pack?.title ?? base.title,
    description: pack?.description ?? base.description,
    wordCount: pack?.words.length,
    previewCount,
    updatedAt: pack?.updatedAt
  } satisfies VlxPackPreview;
}

async function getAcademicPreview(
  definition: StarterPackDefinition
): Promise<VlxPackPreview> {
  const [examPack, hubPack] = await Promise.all([
    getExamPack("academic-vocabulary-pack"),
    getHubPack("academic-vocabulary")
  ]);
  const words = examPack?.words.length ? examPack.words : (hubPack?.words ?? []);
  const base = buildBasePreview(definition, words, Boolean(examPack ?? hubPack));

  return {
    ...base,
    description: examPack?.subtitle ?? hubPack?.description ?? base.description,
    wordCount: examPack?.wordCount ?? hubPack?.words.length,
    previewCount:
      examPack?.freePreviewCount ??
      (words.length ? Math.min(words.length, PREVIEW_LIMIT) : undefined),
    planDays: examPack?.days,
    priceTier: examPack?.priceTier,
    updatedAt: examPack?.updatedAt ?? hubPack?.updatedAt
  } satisfies VlxPackPreview;
}

async function resolvePackPreview(
  definition: StarterPackDefinition
): Promise<VlxPackPreview> {
  if (definition.resolver === "academic") {
    return getAcademicPreview(definition);
  }

  if (definition.resolver === "core") {
    return mergeQuizPackPreview(definition, await getCorePack());
  }

  if (definition.resolver === "home") {
    return mergeQuizPackPreview(definition, await getHomePack());
  }

  return buildBasePreview(definition, [], false);
}

export async function getPackPreviewCatalog(): Promise<VlxPackPreview[]> {
  return Promise.all(starterPackDefinitions.map(resolvePackPreview));
}

export async function getPackPreviewById(
  packId: string
): Promise<VlxPackPreview | null> {
  const definition = starterPackDefinitions.find(
    (item) => item.packId === packId
  );

  return definition ? resolvePackPreview(definition) : null;
}
