"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  hasVisiblePackProgress,
  readPackProgress,
  recordPackPreviewStarted
} from "@/lib/packs/progress";
import type { VlxPackPreviewStatus } from "@/lib/packs/preview";

type PackPreviewActionsProps = {
  packId: string;
  title: string;
  targetLabel?: string;
  wordCount?: number;
  previewCount?: number;
  status: VlxPackPreviewStatus;
  reviewHref: string;
  reviewFallbackNote?: string;
};

export function PackPreviewActions({
  packId,
  title,
  targetLabel,
  wordCount,
  previewCount,
  status,
  reviewHref,
  reviewFallbackNote
}: PackPreviewActionsProps) {
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.examPackPreviewView, {
      packId,
      title,
      targetLabel,
      wordCount,
      previewCount,
      status,
      userState: "guest",
      source: "pack_preview"
    });

    setHasProgress(hasVisiblePackProgress(readPackProgress(packId)));
  }, [packId, previewCount, status, targetLabel, title, wordCount]);

  function handleStartPreview() {
    const progress = recordPackPreviewStarted(packId, "pack_detail");

    setHasProgress(hasVisiblePackProgress(progress));
    emitVlxEvent(VLX_ANALYTICS_EVENTS.examPackPreviewStart, {
      packId,
      title,
      targetLabel,
      wordCount,
      previewCount,
      status,
      reviewHref,
      userState: "guest",
      source: "pack_preview"
    });
  }

  return (
    <div className="pack-preview-actions">
      <Link
        className="button button--primary"
        href={reviewHref}
        onClick={handleStartPreview}
      >
        {hasProgress ? "Continue preview" : "Start preview review"}
      </Link>
      {reviewFallbackNote ? (
        <p className="pack-preview-actions__note">{reviewFallbackNote}</p>
      ) : null}
    </div>
  );
}
