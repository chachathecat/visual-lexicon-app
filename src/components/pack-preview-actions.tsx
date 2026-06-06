"use client";

import Link from "next/link";
import { useEffect } from "react";

import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
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
  }, [packId, previewCount, status, targetLabel, title, wordCount]);

  function handleStartPreview() {
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
        Start preview review
      </Link>
      {reviewFallbackNote ? (
        <p className="pack-preview-actions__note">{reviewFallbackNote}</p>
      ) : null}
    </div>
  );
}
