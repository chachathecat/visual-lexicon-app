"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PackProgressSummary } from "@/components/pack-progress-summary";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  hasVisiblePackProgress,
  readPackProgress,
  recordPackPreviewStarted
} from "@/lib/packs/progress";
import type { VlxPackPreview } from "@/lib/packs/preview";
import type { VlxPackProgressItem } from "@/lib/packs/progress";

function formatCount(value: number | undefined, label: string) {
  return typeof value === "number" ? `${value} ${label}` : undefined;
}

function getStatusLabel(status: VlxPackPreview["status"]) {
  if (status === "available") {
    return "Preview ready";
  }

  if (status === "empty") {
    return "No words yet";
  }

  return "Data pending";
}

export function PackCard({ pack }: { pack: VlxPackPreview }) {
  const [progress, setProgress] = useState<VlxPackProgressItem | undefined>();
  const wordCount = formatCount(pack.wordCount, "words");
  const previewCount = formatCount(pack.previewCount, "preview words");
  const hasProgress = hasVisiblePackProgress(progress);
  const canStartPreview = pack.status === "available";

  useEffect(() => {
    setProgress(readPackProgress(pack.packId));
  }, [pack.packId]);

  function handleStartPreview() {
    setProgress(recordPackPreviewStarted(pack.packId, "packs_page"));
    emitVlxEvent(VLX_ANALYTICS_EVENTS.packPreviewStart, {
      source: "pack_preview",
      mode: "hub",
      packId: pack.packId
    });
  }

  return (
    <article className="pack-card">
      <div className="pack-card__topline">
        <span className="eyebrow">
          {pack.kind === "exam" ? "Exam preview" : "Learning deck"}
        </span>
        <span className="tag">{getStatusLabel(pack.status)}</span>
      </div>
      <h3>{pack.title}</h3>
      <p>{pack.description}</p>
      <div className="tag-row">
        {wordCount ? <span className="tag">{wordCount}</span> : null}
        {previewCount ? <span className="tag">{previewCount}</span> : null}
        {pack.targetLabel ? <span className="tag">{pack.targetLabel}</span> : null}
        {pack.levelLabel ? <span className="tag">{pack.levelLabel}</span> : null}
        {pack.difficultyLabel ? (
          <span className="tag">{pack.difficultyLabel}</span>
        ) : null}
        {!wordCount ? <span className="tag">Word count pending</span> : null}
      </div>
      <PackProgressSummary packId={pack.packId} title={pack.title} />
      <div className="actions">
        {canStartPreview ? (
          <Link
            className="button button--primary"
            href={pack.reviewHref}
            onClick={handleStartPreview}
          >
            {hasProgress ? "Continue preview" : "Start preview review"}
          </Link>
        ) : null}
        <Link className="button button--quiet" href={`/packs/${pack.packId}`}>
          View pack
        </Link>
      </div>
    </article>
  );
}
