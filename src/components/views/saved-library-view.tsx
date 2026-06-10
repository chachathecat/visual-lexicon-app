"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  getDueToday,
  getNewSaved,
  getSavedLibrary,
  getWeakWords
} from "@/lib/srs/selectors";
import {
  readReviewEvents,
  readReviewState,
  readSavedWords
} from "@/lib/srs/storage";
import type {
  VlxMasteryLabel,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

type SavedLibrarySnapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  savedLibrary: VlxSavedWord[];
  newSaved: VlxSavedWord[];
  dueCount: number;
  weakCount: number;
  reviewEventCount: number;
  hasReviewData: boolean;
};

type SavedLibraryWord = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  source?: string;
  savedAt?: string;
  mastery?: VlxMasteryLabel;
  box?: number;
  weakScore?: number;
  correct?: number;
  wrong?: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  hasReviewState: boolean;
};

const visualCueSlugs = new Set([
  "dissonance",
  "abundance",
  "resilient",
  "laconic",
  "obfuscate",
  "lucid"
]);

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function readSavedLibrarySnapshot(): SavedLibrarySnapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();

  return {
    savedWords,
    reviewState,
    savedLibrary: getSavedLibrary(savedWords),
    newSaved: getNewSaved(savedWords, reviewState),
    dueCount: getDueToday(reviewState, now).length,
    weakCount: getWeakWords(reviewState).length,
    reviewEventCount: reviewEvents.length,
    hasReviewData: hasKeys(reviewState) || reviewEvents.length > 0
  };
}

function formatHubLabel(hub?: string) {
  if (!hub) {
    return "Unsorted";
  }

  return hub
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .join(" ");
}

function formatShortDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatSourceLabel(source?: string) {
  const normalizedSource = source?.trim();

  if (!normalizedSource) {
    return undefined;
  }

  const sourceLabels: Record<string, string> = {
    alias_search: "Alias search",
    extension: "Extension",
    word_page: "Word page"
  };

  return `Source: ${sourceLabels[normalizedSource] ?? normalizedSource}`;
}

function getVisualClass(slug: string, image?: string) {
  if (image || !visualCueSlugs.has(slug)) {
    return "";
  }

  return ` word-card__visual--${slug}`;
}

function masteryClass(mastery?: VlxMasteryLabel) {
  if (mastery === "Weak") {
    return "tag tag--weak";
  }

  if (mastery === "Strong" || mastery === "Mastered") {
    return "tag tag--strong";
  }

  return "tag";
}

function toSavedLibraryWord(
  savedWord: VlxSavedWord,
  reviewStateItem?: VlxReviewStateItem
): SavedLibraryWord {
  return {
    slug: savedWord.slug,
    word: reviewStateItem?.word || savedWord.word || savedWord.slug,
    definition: reviewStateItem?.definition ?? savedWord.definition,
    image: reviewStateItem?.image ?? savedWord.image,
    hub: reviewStateItem?.hub ?? savedWord.hub,
    source:
      typeof savedWord.source === "string" ? savedWord.source : undefined,
    savedAt: savedWord.savedAt,
    mastery: reviewStateItem?.mastery,
    box: reviewStateItem?.box,
    weakScore: reviewStateItem?.weakScore,
    correct: reviewStateItem?.correct,
    wrong: reviewStateItem?.wrong,
    lastReviewedAt: reviewStateItem?.lastReviewedAt,
    nextDueAt: reviewStateItem?.nextDueAt,
    hasReviewState: Boolean(reviewStateItem)
  };
}

function SavedWordCard({ word }: { word: SavedLibraryWord }) {
  const savedDate = formatShortDate(word.savedAt);
  const reviewedDate = formatShortDate(word.lastReviewedAt);
  const dueDate = formatShortDate(word.nextDueAt);
  const sourceLabel = formatSourceLabel(word.source);

  return (
    <article className="word-card saved-word-card">
      <div
        aria-label={`Visual cue for ${word.word}`}
        className={`word-card__visual${getVisualClass(
          word.slug,
          word.image
        )}${word.image ? " word-card__visual--image" : ""}`}
        role="img"
        style={word.image ? { backgroundImage: `url(${word.image})` } : undefined}
      />
      <div className="word-card__body">
        <div className="word-card__topline">
          <h3>{word.word}</h3>
          {word.mastery ? (
            <span className={masteryClass(word.mastery)}>{word.mastery}</span>
          ) : (
            <span className="tag">No review state yet</span>
          )}
        </div>
        {word.definition ? <p>{word.definition}</p> : null}
        <div className="tag-row">
          {typeof word.box === "number" ? (
            <span className="tag">Box {word.box}</span>
          ) : null}
          {typeof word.weakScore === "number" ? (
            <span className="tag">
              Weak {Math.round(word.weakScore * 100)}%
            </span>
          ) : null}
          {typeof word.correct === "number" && typeof word.wrong === "number" ? (
            <span className="tag">
              {word.correct} correct / {word.wrong} wrong
            </span>
          ) : null}
          <span className="tag">{formatHubLabel(word.hub)}</span>
          {sourceLabel ? <span className="tag">{sourceLabel}</span> : null}
          {savedDate ? <span className="tag">Saved {savedDate}</span> : null}
          {reviewedDate ? (
            <span className="tag">Reviewed {reviewedDate}</span>
          ) : null}
          {word.hasReviewState && dueDate ? (
            <span className="tag">Due {dueDate}</span>
          ) : null}
        </div>
        <div className="actions">
          <Link className="button button--quiet" href={`/word/${word.slug}`}>
            Word detail
          </Link>
          <Link className="button button--quiet" href="/review?mode=saved">
            Review saved
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SavedLibraryView() {
  const [snapshot, setSnapshot] = useState<SavedLibrarySnapshot | null>(null);

  useEffect(() => {
    const nextSnapshot = readSavedLibrarySnapshot();

    setSnapshot(nextSnapshot);
    emitVlxEvent(VLX_ANALYTICS_EVENTS.savedLibraryView, {
      source: "saved_library",
      savedCount: nextSnapshot.savedLibrary.length,
      dueCount: nextSnapshot.dueCount,
      weakCount: nextSnapshot.weakCount,
      reviewEventCount: nextSnapshot.reviewEventCount,
      hasLocalReviewState: hasKeys(nextSnapshot.reviewState),
      hasLocalSavedWord: nextSnapshot.savedLibrary.length > 0
    });
  }, []);

  const savedWords = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.savedLibrary.map((savedWord) =>
      toSavedLibraryWord(savedWord, snapshot.reviewState[savedWord.slug])
    );
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="page">
        <section className="empty-state" aria-live="polite">
          <h1>Loading saved words</h1>
          <p>Reading saved words, review state, and review events.</p>
        </section>
      </div>
    );
  }

  const hasSavedWords = savedWords.length > 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Saved words"
        title="Saved words from this browser."
        description="This library reads local saved words and real SRS state. Mastery, boxes, weak words, and due counts are shown only when they exist in review state."
        actions={
          <>
            <Link className="button button--primary" href="/review?mode=saved">
              Review saved
            </Link>
            <Link className="button" href="/review?mode=due">
              Due review
            </Link>
            <Link className="button" href="/review?mode=weak">
              Weak words
            </Link>
          </>
        }
      />

      <section className="section" aria-labelledby="saved-queues">
        <div className="section-heading">
          <h2 className="section-title" id="saved-queues">
            Local review queues
          </h2>
          <span className="section-note">Counts come from local SRS stores</span>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-card__value">{savedWords.length}</span>
            <span className="metric-card__label">Saved words</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">{snapshot.newSaved.length}</span>
            <span className="metric-card__label">New saved</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">{snapshot.dueCount}</span>
            <span className="metric-card__label">Due</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">{snapshot.weakCount}</span>
            <span className="metric-card__label">Weak</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">
              {snapshot.reviewEventCount}
            </span>
            <span className="metric-card__label">Review events</span>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="saved-library">
        <div className="section-heading">
          <h2 className="section-title" id="saved-library">
            Saved Library
          </h2>
          <span className="section-note">
            {savedWords.length} local saved words
          </span>
        </div>
        {hasSavedWords ? (
          <div className="card-grid">
            {savedWords.map((word) => (
              <SavedWordCard key={word.slug} word={word} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/packs"
            actionLabel="Browse packs"
            body={
              snapshot.hasReviewData
                ? "There is local review history in this browser, but no local saved words. This page does not show sample words as saved."
                : "No words have been saved in local storage yet. This page does not show sample words as saved."
            }
            title="No saved words in this browser"
          />
        )}
      </section>
    </div>
  );
}
