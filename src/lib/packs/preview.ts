import {
  getCorePack,
  getExamPack,
  getHomePack,
  getHubPack
} from "@/lib/packs/pack-reader";
import type {
  VlxExamPack,
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
  reviewEnabled: boolean;
  wordSlugs: string[];
  previewWords: VlxQuizWord[];
  sourceLabel: string;
  contentStatusLabel?: string;
  contentSafetyNote?: string;
  planFraming?: string;
  themes?: string[];
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
  planDays?: number;
  sourceLabel: string;
  resolver: "academic" | "core" | "exam" | "home" | "placeholder";
  examPackId?: string;
  reviewHub?: string;
  fallbackReviewHref?: string;
  reviewEnabled?: boolean;
  contentStatusLabel?: string;
  contentSafetyNote?: string;
  planFraming?: string;
  themes?: string[];
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
    planDays: 30,
    sourceLabel: "Exam pack and academic hub",
    resolver: "academic",
    reviewHub: "academic-vocabulary",
    contentStatusLabel: "Active starter pack",
    planFraming:
      "This 30-day visual learning plan surface is the active Academic starter preview. Its review action uses the existing Academic Vocabulary hub route and current static Academic word data.",
    themes: ["abstract essay words", "lecture vocabulary", "exam reading"]
  },
  {
    packId: "ielts-writing-vocabulary",
    title: "IELTS Writing",
    description:
      "Preview-only content v1 for a planned 30-day IELTS Writing path: argument, evidence, contrast, and policy/society language.",
    kind: "exam",
    targetLabel: "IELTS Writing",
    targetExam: "ielts",
    planDays: 30,
    sourceLabel: "Exam Pack Content v1 static preview",
    resolver: "exam",
    examPackId: "ielts-writing-vocabulary-preview",
    reviewEnabled: false,
    fallbackReviewHref: MIXED_REVIEW_FALLBACK,
    contentStatusLabel: "Preview of planned 30-day path",
    contentSafetyNote:
      "Preview-only content v1 from current static words. Full IELTS Writing pack is planned, not live. Private/manual beta requires owner approval. This does not grant paid access or real paid entitlement.",
    planFraming:
      "This is a preview of a planned 30-day path. It shows real preview words, but a pack-specific IELTS review route and full IELTS content are not live.",
    themes: ["argument", "evidence", "contrast", "policy/society"],
    emptyTitle: "IELTS Writing preview content is not available yet",
    emptyBody:
      "Preview plan is being prepared. Private/manual beta requires owner approval. Full IELTS content is not implied by this planned pack surface."
  },
  {
    packId: "gre-visual-verbal",
    title: "GRE Visual Verbal",
    description:
      "Preview-only content v1 for a planned 30-day GRE Visual Verbal path: nuance, logic, contrast, and confusable advanced words.",
    kind: "exam",
    targetLabel: "GRE Verbal",
    targetExam: "gre",
    planDays: 30,
    sourceLabel: "Exam Pack Content v1 static preview",
    resolver: "exam",
    examPackId: "gre-visual-verbal-preview",
    reviewEnabled: false,
    fallbackReviewHref: MIXED_REVIEW_FALLBACK,
    contentStatusLabel: "Preview of planned 30-day path",
    contentSafetyNote:
      "Preview-only content v1 from current static words. Full GRE Visual Verbal pack is planned, not live. Private/manual beta requires owner approval. This does not grant paid access or real paid entitlement.",
    planFraming:
      "This is a preview of a planned 30-day path. It shows real preview words, but a pack-specific GRE review route and full GRE content are not live.",
    themes: ["nuance", "logic", "contrast", "confusable advanced words"],
    emptyTitle: "GRE Visual Verbal preview content is not available yet",
    emptyBody:
      "Preview plan is being prepared. Private/manual beta requires owner approval. Full GRE content is not implied by this planned pack surface."
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
    planDays: definition.planDays,
    reviewHref: getReviewHref(definition),
    reviewFallbackNote: getReviewFallbackNote(definition),
    reviewEnabled: definition.reviewEnabled ?? true,
    wordSlugs: words.map((word) => word.slug),
    previewWords,
    sourceLabel: definition.sourceLabel,
    contentStatusLabel: definition.contentStatusLabel,
    contentSafetyNote: definition.contentSafetyNote,
    planFraming: definition.planFraming,
    themes: definition.themes,
    emptyTitle: definition.emptyTitle ?? "No preview words available",
    emptyBody:
      definition.emptyBody ??
      "This pack resolved through the pack reader, but no preview words are available in the current data."
  } satisfies VlxPackPreview;
}

function mergeExamPackPreview(
  definition: StarterPackDefinition,
  pack: VlxExamPack | null
): VlxPackPreview {
  const base = buildBasePreview(definition, pack?.words ?? [], Boolean(pack));
  const previewCount = pack?.words.length
    ? Math.min(base.previewWords.length, pack.freePreviewCount, PREVIEW_LIMIT)
    : undefined;

  return {
    ...base,
    title: pack?.title ?? base.title,
    wordCount: pack?.words.length,
    previewCount,
    planDays: definition.planDays ?? pack?.days,
    priceTier: pack?.priceTier,
    updatedAt: pack?.updatedAt
  } satisfies VlxPackPreview;
}

function mergeQuizPackPreview(
  definition: StarterPackDefinition,
  pack: VlxQuizPack | null
): VlxPackPreview {
  const base = buildBasePreview(definition, pack?.words ?? [], Boolean(pack));
  const previewCount = pack?.words.length
    ? Math.min(base.previewWords.length, pack.words.length, PREVIEW_LIMIT)
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
    previewCount: words.length
      ? Math.min(
          examPack?.freePreviewCount ?? words.length,
          base.previewWords.length,
          PREVIEW_LIMIT
        )
      : undefined,
    planDays: definition.planDays ?? examPack?.days,
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

  if (definition.resolver === "exam") {
    return mergeExamPackPreview(
      definition,
      await getExamPack(definition.examPackId ?? definition.packId)
    );
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
