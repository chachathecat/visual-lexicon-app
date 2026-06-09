"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  readReviewEvents,
  readReviewState,
  readSavedWords
} from "@/lib/srs/storage";
import type {
  VlxReviewStateItem,
  VlxSavedWord
} from "@/lib/srs/types";

type WordMemoryStatePanelProps = {
  slug: string;
};

type WordMemorySnapshot = {
  savedWord?: VlxSavedWord;
  reviewItem?: VlxReviewStateItem;
  reviewEventCount: number;
};

const sourceLabels: Record<string, string> = {
  alias_search: "Alias search",
  extension: "Extension",
  word_page: "Word page"
};

function readWordMemorySnapshot(slug: string): WordMemorySnapshot {
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();

  return {
    savedWord: savedWords[slug],
    reviewItem: reviewState[slug],
    reviewEventCount: reviewEvents.filter((event) => event.slug === slug).length
  };
}

function formatSourceLabel(source?: string) {
  const normalizedSource = source?.trim();

  if (!normalizedSource) {
    return undefined;
  }

  return `Source: ${sourceLabels[normalizedSource] ?? normalizedSource}`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function DetailRow({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function memoryTagClass(mastery: VlxReviewStateItem["mastery"]) {
  if (mastery === "Weak") {
    return "tag tag--weak";
  }

  if (mastery === "Strong" || mastery === "Mastered") {
    return "tag tag--strong";
  }

  return "tag";
}

export function WordMemoryStatePanel({ slug }: WordMemoryStatePanelProps) {
  const [snapshot, setSnapshot] = useState<WordMemorySnapshot | null>(null);
  const saveHref = `/save?slug=${encodeURIComponent(slug)}&source=word_page`;
  const reviewHref = `/review?mode=word&slug=${encodeURIComponent(slug)}`;

  useEffect(() => {
    setSnapshot(readWordMemorySnapshot(slug));
  }, [slug]);

  if (!snapshot) {
    return (
      <section
        aria-label="Local memory state"
        aria-live="polite"
        className="detail-panel word-memory-state"
      >
        <h2 className="section-title">Local memory state</h2>
        <p className="section-note">Reading local saved and review stores.</p>
      </section>
    );
  }

  const sourceLabel = formatSourceLabel(snapshot.savedWord?.source);
  const reviewItem = snapshot.reviewItem;

  if (reviewItem) {
    return (
      <section
        aria-label="Local memory state"
        className="detail-panel word-memory-state"
      >
        <div className="section-heading">
          <h2 className="section-title">Local memory state</h2>
          <span className={memoryTagClass(reviewItem.mastery)}>
            {reviewItem.mastery}
          </span>
        </div>
        <div className="tag-row">
          {snapshot.savedWord ? (
            <span className="tag">Saved locally</span>
          ) : (
            <span className="tag">Local review state found</span>
          )}
          {sourceLabel ? <span className="tag">{sourceLabel}</span> : null}
        </div>
        <dl className="detail-list">
          <DetailRow label="Mastery">{reviewItem.mastery}</DetailRow>
          <DetailRow label="Box">Box {reviewItem.box}</DetailRow>
          <DetailRow label="Weak score">{reviewItem.weakScore}</DetailRow>
          <DetailRow label="Recall">
            {reviewItem.correct} correct, {reviewItem.wrong} wrong
          </DetailRow>
          <DetailRow label="Last reviewed">
            {formatDateTime(reviewItem.lastReviewedAt) ?? "Not reviewed yet"}
          </DetailRow>
          <DetailRow label="Next due">
            {formatDateTime(reviewItem.nextDueAt) ?? "Not scheduled"}
          </DetailRow>
          <DetailRow label="Review events">
            {snapshot.reviewEventCount}
          </DetailRow>
        </dl>
        <div className="actions">
          <Link className="button button--primary" href={reviewHref}>
            Review this word
          </Link>
          {!snapshot.savedWord ? (
            <Link className="button" href={saveHref}>
              Save to review
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  if (snapshot.savedWord) {
    return (
      <section
        aria-label="Local memory state"
        className="detail-panel word-memory-state"
      >
        <h2 className="section-title">Local memory state</h2>
        <div className="tag-row">
          <span className="tag">Saved locally</span>
          {sourceLabel ? <span className="tag">{sourceLabel}</span> : null}
        </div>
        <div className="empty-state">
          <h3>No local review state yet</h3>
          <p>
            This browser has a saved record for the word, but no SRS item exists
            for it yet.
          </p>
        </div>
        <div className="actions">
          <Link className="button button--primary" href={reviewHref}>
            Review this word
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Local memory state"
      className="detail-panel word-memory-state"
    >
      <h2 className="section-title">Local memory state</h2>
      <div className="empty-state">
        <h3>No local memory state yet</h3>
        <p>
          This browser has no saved word or review state for this word yet.
        </p>
      </div>
      <div className="actions">
        <Link className="button button--primary" href={saveHref}>
          Save to review
        </Link>
        <Link className="button" href={reviewHref}>
          Review this word
        </Link>
      </div>
    </section>
  );
}
