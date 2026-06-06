import Link from "next/link";

import type { VlxPackPreview } from "@/lib/packs/preview";

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
  const wordCount = formatCount(pack.wordCount, "words");
  const previewCount = formatCount(pack.previewCount, "preview words");

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
      <div className="actions">
        <Link className="button button--quiet" href={`/packs/${pack.packId}`}>
          View pack
        </Link>
      </div>
    </article>
  );
}
