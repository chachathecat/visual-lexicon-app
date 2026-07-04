export const VLX_PACK_PROGRESS_STORAGE_KEY = "vlx_pack_progress_v1";

export type VlxPackProgressSource = "packs_page" | "pack_detail" | "review";

export type VlxPackProgress = {
  packId: string;
  startedAt?: string;
  lastOpenedAt?: string;
  previewStartedAt?: string;
  previewCompletedAt?: string;
  lastReviewedAt?: string;
  reviewedCount: number;
  correctCount: number;
  source: VlxPackProgressSource;
};

export type VlxPackProgressItem = VlxPackProgress;

export type VlxPackProgressStore = Record<string, VlxPackProgress>;

type ProgressPatch = Partial<
  Omit<VlxPackProgress, "packId" | "reviewedCount" | "correctCount" | "source">
> & {
  reviewedCount?: number;
  correctCount?: number;
  source: VlxPackProgressSource;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPackProgressSource(value: unknown): value is VlxPackProgressSource {
  return value === "packs_page" || value === "pack_detail" || value === "review";
}

function readString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function readCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function normalizePackProgress(
  packId: string,
  value: unknown
): VlxPackProgress | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const source = isPackProgressSource(value.source)
    ? value.source
    : "packs_page";

  return {
    packId,
    startedAt: readString(value.startedAt),
    lastOpenedAt: readString(value.lastOpenedAt),
    previewStartedAt: readString(value.previewStartedAt),
    previewCompletedAt: readString(value.previewCompletedAt),
    lastReviewedAt: readString(value.lastReviewedAt),
    reviewedCount: readCount(value.reviewedCount),
    correctCount: readCount(value.correctCount),
    source
  };
}

function readRawStore(): unknown {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(VLX_PACK_PROGRESS_STORAGE_KEY);

  if (!rawValue) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return undefined;
  }
}

export function readPackProgressStore(): VlxPackProgressStore {
  const value = readRawStore();

  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<VlxPackProgressStore>(
    (store, [packId, progress]) => {
      const normalizedProgress = normalizePackProgress(packId, progress);

      if (normalizedProgress) {
        store[packId] = normalizedProgress;
      }

      return store;
    },
    {}
  );
}

export function writePackProgressStore(progressStore: VlxPackProgressStore) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(
    VLX_PACK_PROGRESS_STORAGE_KEY,
    JSON.stringify(progressStore)
  );
}

export function getPackProgress(packId: string) {
  return readPackProgressStore()[packId];
}

export function readPackProgress(packId: string) {
  return getPackProgress(packId);
}

export function hasVisiblePackProgress(
  progress?: VlxPackProgress
): progress is VlxPackProgress {
  return Boolean(
    progress &&
      (progress.startedAt ||
        progress.previewStartedAt ||
        progress.previewCompletedAt ||
        progress.reviewedCount > 0 ||
        progress.lastReviewedAt)
  );
}

function upsertPackProgress(
  packId: string,
  patch: ProgressPatch,
  now = new Date().toISOString()
) {
  const progressStore = readPackProgressStore();
  const existing = progressStore[packId];
  const updatedProgress: VlxPackProgress = {
    packId,
    startedAt: patch.startedAt ?? existing?.startedAt,
    lastOpenedAt: patch.lastOpenedAt ?? existing?.lastOpenedAt,
    previewStartedAt: patch.previewStartedAt ?? existing?.previewStartedAt,
    previewCompletedAt:
      patch.previewCompletedAt ?? existing?.previewCompletedAt,
    lastReviewedAt: patch.lastReviewedAt ?? existing?.lastReviewedAt,
    reviewedCount: patch.reviewedCount ?? existing?.reviewedCount ?? 0,
    correctCount: patch.correctCount ?? existing?.correctCount ?? 0,
    source: patch.source
  };

  if (!updatedProgress.startedAt && hasVisiblePackProgress(updatedProgress)) {
    updatedProgress.startedAt = now;
  }

  progressStore[packId] = updatedProgress;
  writePackProgressStore(progressStore);

  return updatedProgress;
}

export function recordPackOpened(
  packId: string,
  source: VlxPackProgressSource = "pack_detail",
  openedAt = new Date().toISOString()
) {
  return upsertPackProgress(
    packId,
    {
      lastOpenedAt: openedAt,
      source
    },
    openedAt
  );
}

export function recordPackPreviewStarted(
  packId: string,
  source: VlxPackProgressSource,
  previewStartedAt = new Date().toISOString()
) {
  return upsertPackProgress(
    packId,
    {
      startedAt: getPackProgress(packId)?.startedAt ?? previewStartedAt,
      lastOpenedAt: previewStartedAt,
      previewStartedAt,
      source
    },
    previewStartedAt
  );
}

export function recordPackPreviewCompleted(
  packId: string,
  source: VlxPackProgressSource = "review",
  previewCompletedAt = new Date().toISOString()
) {
  return upsertPackProgress(
    packId,
    {
      previewCompletedAt,
      source
    },
    previewCompletedAt
  );
}

export function recordPackReviewCompleted({
  packId,
  reviewedCount,
  correctCount,
  source = "review",
  reviewedAt = new Date().toISOString()
}: {
  packId: string;
  reviewedCount: number;
  correctCount: number;
  source?: VlxPackProgressSource;
  reviewedAt?: string;
}) {
  const existing = getPackProgress(packId);
  const normalizedReviewedCount = Math.max(0, Math.floor(reviewedCount));
  const normalizedCorrectCount = Math.max(0, Math.floor(correctCount));

  return upsertPackProgress(
    packId,
    {
      previewCompletedAt: reviewedAt,
      lastReviewedAt: reviewedAt,
      reviewedCount: (existing?.reviewedCount ?? 0) + normalizedReviewedCount,
      correctCount: (existing?.correctCount ?? 0) + normalizedCorrectCount,
      source
    },
    reviewedAt
  );
}

export function recordPackReviewResult({
  packId,
  result,
  source = "review",
  reviewedAt = new Date().toISOString()
}: {
  packId: string;
  result: "correct" | "wrong";
  source?: VlxPackProgressSource;
  reviewedAt?: string;
}) {
  const existing = getPackProgress(packId);

  return upsertPackProgress(
    packId,
    {
      lastOpenedAt: reviewedAt,
      reviewedCount: (existing?.reviewedCount ?? 0) + 1,
      correctCount:
        (existing?.correctCount ?? 0) + (result === "correct" ? 1 : 0),
      source
    },
    reviewedAt
  );
}
