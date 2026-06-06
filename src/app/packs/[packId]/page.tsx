import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PackPreviewActions } from "@/components/pack-preview-actions";
import { PageHeader } from "@/components/page-header";
import {
  getPackPreviewById,
  packPreviewIds,
  type VlxPackPreview
} from "@/lib/packs/preview";
import type { VlxQuizWord } from "@/lib/packs/types";

type PackPageProps = {
  params: {
    packId: string;
  };
};

const visualCueSlugs = new Set([
  "dissonance",
  "abundance",
  "resilient",
  "laconic",
  "obfuscate",
  "lucid"
]);

export function generateStaticParams() {
  return packPreviewIds.map((packId) => ({
    packId
  }));
}

export async function generateMetadata({
  params
}: PackPageProps): Promise<Metadata> {
  const pack = await getPackPreviewById(params.packId);

  return {
    title: pack ? pack.title : "Pack"
  };
}

function formatCount(value: number | undefined, fallback = "Not available yet") {
  return typeof value === "number" ? value.toLocaleString() : fallback;
}

function getKindLabel(kind: VlxPackPreview["kind"]) {
  return kind === "exam" ? "Exam pack preview" : "Learning pack preview";
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

function formatToken(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getVisualClass(slug: string) {
  return visualCueSlugs.has(slug) ? ` word-card__visual--${slug}` : "";
}

function getImageStyle(word: VlxQuizWord) {
  if (!word.image) {
    return undefined;
  }

  return {
    backgroundImage: `url("${word.image}")`
  } satisfies CSSProperties;
}

function PreviewWordCard({ word }: { word: VlxQuizWord }) {
  const imageStyle = getImageStyle(word);
  const visualClass = imageStyle
    ? " pack-preview-word__visual--image"
    : getVisualClass(word.slug);

  return (
    <article className="pack-preview-word">
      <div
        aria-label={`Preview image for ${word.word}`}
        className={`word-card__visual pack-preview-word__visual${visualClass}`}
        role="img"
        style={imageStyle}
      />
      <div className="word-card__body">
        <div className="word-card__topline">
          <h3>{word.word}</h3>
          <span className="tag">{word.cefr}</span>
        </div>
        <p>{word.definition}</p>
        <div className="tag-row">
          <span className="tag">{formatToken(word.hub)}</span>
          <span className="tag">{formatToken(word.difficulty)}</span>
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  label,
  value
}: {
  label: string;
  value?: string | number;
}) {
  if (value === undefined || value === "") {
    return null;
  }

  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function PackDetailPage({ params }: PackPageProps) {
  const pack = await getPackPreviewById(params.packId);

  if (!pack) {
    notFound();
  }

  return (
    <div className="page">
      <PageHeader
        actions={
          <PackPreviewActions
            packId={pack.packId}
            previewCount={pack.previewCount}
            reviewFallbackNote={pack.reviewFallbackNote}
            reviewHref={pack.reviewHref}
            status={pack.status}
            targetLabel={pack.targetLabel}
            title={pack.title}
            wordCount={pack.wordCount}
          />
        }
        description={pack.description}
        eyebrow={getKindLabel(pack.kind)}
        title={pack.title}
      />

      <section className="section" aria-labelledby="pack-detail">
        <div className="detail-grid">
          <div className="settings-panel">
            <div className="pack-detail-heading">
              <h2 className="section-title" id="pack-detail">
                Pack details
              </h2>
              <span className="tag">{getStatusLabel(pack.status)}</span>
            </div>
            <dl className="detail-list">
              <DetailRow label="Pack ID" value={pack.packId} />
              <DetailRow label="Target" value={pack.targetLabel} />
              <DetailRow
                label="Target exam"
                value={pack.targetExam ? formatToken(pack.targetExam) : undefined}
              />
              <DetailRow label="Words" value={formatCount(pack.wordCount)} />
              <DetailRow
                label="Preview"
                value={formatCount(pack.previewCount)}
              />
              <DetailRow label="Level" value={pack.levelLabel} />
              <DetailRow label="Difficulty" value={pack.difficultyLabel} />
              <DetailRow label="Source" value={pack.sourceLabel} />
              <DetailRow label="Updated" value={pack.updatedAt} />
            </dl>
          </div>

          <div className="section">
            <div className="section-heading">
              <h2 className="section-title">Preview words</h2>
              {pack.previewWords.length ? (
                <span className="section-note">
                  Showing {pack.previewWords.length} of up to 10
                </span>
              ) : null}
            </div>
            {pack.previewWords.length ? (
              <div className="card-grid card-grid--two">
                {pack.previewWords.map((word) => (
                  <PreviewWordCard key={word.slug} word={word} />
                ))}
              </div>
            ) : (
              <EmptyState body={pack.emptyBody} title={pack.emptyTitle} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
