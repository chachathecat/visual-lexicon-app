"use client";

import { useEffect, useState } from "react";

import {
  hasVisiblePackProgress,
  readPackProgress,
  recordPackOpened,
  type VlxPackProgressItem
} from "@/lib/packs/progress";

type PackProgressSummaryProps = {
  packId: string;
  title?: string;
  recordOpen?: boolean;
  variant?: "card" | "detail";
};

function getProgressLabel(progress: VlxPackProgressItem) {
  if (progress.previewCompletedAt) {
    return "Preview completed";
  }

  if (progress.reviewedCount > 0) {
    return `${progress.reviewedCount} reviewed`;
  }

  return "Preview started";
}

function getProgressMeta(progress: VlxPackProgressItem) {
  if (progress.reviewedCount > 0) {
    return `${progress.correctCount} correct locally`;
  }

  return "Ready to continue";
}

export function PackProgressSummary({
  packId,
  title,
  recordOpen = false,
  variant = "card"
}: PackProgressSummaryProps) {
  const [progress, setProgress] = useState<VlxPackProgressItem | undefined>();

  useEffect(() => {
    const nextProgress = recordOpen
      ? recordPackOpened(packId)
      : readPackProgress(packId);

    setProgress(nextProgress);
  }, [packId, recordOpen]);

  if (!hasVisiblePackProgress(progress)) {
    return null;
  }

  return (
    <div
      aria-label={`${title ?? packId} local pack progress`}
      className={`pack-progress pack-progress--${variant}`}
    >
      <span className="tag tag--strong">{getProgressLabel(progress)}</span>
      <span className="pack-progress__meta">{getProgressMeta(progress)}</span>
    </div>
  );
}
