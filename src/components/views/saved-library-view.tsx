"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { TrackBAppShell, TrackBEmptyState } from "@/components/track-b";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/track-b/icons";
import { WordVisualImage } from "@/components/word-visual-image";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  getDueToday,
  getMastered,
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
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

type QueueMemoryState = "due" | "weak" | "new" | "mastered";

type SavedLibrarySnapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  savedLibrary: VlxSavedWord[];
  dueItems: VlxReviewStateItem[];
  weakItems: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  masteredItems: VlxReviewStateItem[];
  reviewEventCount: number;
};

type QueueWord = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  savedAt?: string;
  lastReviewedAt?: string;
  nextDueAt?: string;
  reviewCount: number;
  state: QueueMemoryState;
};

type QueueSection = {
  state: QueueMemoryState;
  heading: string;
  subcopy: string;
  words: QueueWord[];
};

function readSavedLibrarySnapshot(): SavedLibrarySnapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const savedLibrary = getSavedLibrary(savedWords);
  const masteredItems = getMastered(reviewState).filter((item) =>
    Boolean(savedWords[item.slug])
  );
  const masteredSlugs = new Set(masteredItems.map((item) => item.slug));
  const dueItems = getDueToday(reviewState, now).filter((item) =>
    Boolean(savedWords[item.slug])
  );
  const weakItems = getWeakWords(reviewState).filter(
    (item) => Boolean(savedWords[item.slug]) && !masteredSlugs.has(item.slug)
  );
  const newSaved = getNewSaved(savedWords, reviewState);

  return {
    savedWords,
    reviewState,
    savedLibrary,
    dueItems,
    weakItems,
    newSaved,
    masteredItems,
    reviewEventCount: reviewEvents.length
  };
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

function toQueueWordFromState(
  item: VlxReviewStateItem,
  savedWord: VlxSavedWord,
  state: QueueMemoryState
): QueueWord {
  return {
    slug: item.slug,
    word: item.word || savedWord.word || item.slug,
    definition: item.definition ?? savedWord.definition,
    image: item.image ?? savedWord.image,
    hub: item.hub ?? savedWord.hub,
    savedAt: savedWord.savedAt,
    lastReviewedAt: item.lastReviewedAt,
    nextDueAt: item.nextDueAt,
    reviewCount: item.correct + item.wrong,
    state
  };
}

function toQueueWordFromSaved(savedWord: VlxSavedWord): QueueWord {
  return {
    slug: savedWord.slug,
    word: savedWord.word || savedWord.slug,
    definition: savedWord.definition,
    image: savedWord.image,
    hub: savedWord.hub,
    savedAt: savedWord.savedAt,
    reviewCount: 0,
    state: "new"
  };
}

function dedupeBySlug(words: QueueWord[]) {
  const seen = new Set<string>();

  return words.filter((word) => {
    if (seen.has(word.slug)) {
      return false;
    }

    seen.add(word.slug);
    return true;
  });
}

function getQueueSections(snapshot: SavedLibrarySnapshot): QueueSection[] {
  const weakSlugs = new Set(snapshot.weakItems.map((item) => item.slug));
  const dueSlugs = new Set(snapshot.dueItems.map((item) => item.slug));
  const masteredSlugs = new Set(snapshot.masteredItems.map((item) => item.slug));
  const dueWords = snapshot.dueItems
    .filter((item) => !weakSlugs.has(item.slug))
    .map((item) =>
      toQueueWordFromState(item, snapshot.savedWords[item.slug], "due")
    );
  const weakWords = snapshot.weakItems.map((item) =>
    toQueueWordFromState(item, snapshot.savedWords[item.slug], "weak")
  );
  const masteredWords = snapshot.masteredItems.map((item) =>
    toQueueWordFromState(item, snapshot.savedWords[item.slug], "mastered")
  );
  const newWords = snapshot.newSaved.filter(
    (word) =>
      !dueSlugs.has(word.slug) &&
      !weakSlugs.has(word.slug) &&
      !masteredSlugs.has(word.slug)
  );
  const sections: QueueSection[] = [
    {
      state: "due",
      heading: "Review now",
      subcopy: "These words are fading. A quick review brings them back.",
      words: dedupeBySlug(dueWords)
    },
    {
      state: "weak",
      heading: "Needs another pass",
      subcopy: "You have seen these, but they are not solid yet.",
      words: dedupeBySlug(weakWords)
    },
    {
      state: "new",
      heading: "Saved and waiting",
      subcopy: "Not yet reviewed. Your first look builds the foundation.",
      words: newWords.map(toQueueWordFromSaved)
    },
    {
      state: "mastered",
      heading: "Held in memory",
      subcopy: "These words are moving into long-term retention.",
      words: dedupeBySlug(masteredWords)
    }
  ];

  return sections.filter((section) => section.words.length > 0);
}

function getReviewableCount(snapshot: SavedLibrarySnapshot) {
  return new Set([
    ...snapshot.dueItems.map((item) => item.slug),
    ...snapshot.weakItems.map((item) => item.slug)
  ]).size;
}

function getQueueReviewHref(snapshot: SavedLibrarySnapshot) {
  return snapshot.dueItems.length > 0 ? "/review/due" : "/review?mode=saved";
}

function SavedQueueVisual({ word }: { word: QueueWord }) {
  const visualImage = getWordVisualImage(word.slug);
  const externalImage = visualImage ? undefined : word.image;
  const visualClass = visualImage
    ? " word-card__visual--image"
    : externalImage
      ? " word-card__visual--image"
      : getWordVisualFallbackClass(word.slug);
  const style: CSSProperties | undefined = externalImage
    ? {
        backgroundImage: `url("${externalImage}")`
      }
    : undefined;

  return (
    <div
      aria-label={`Visual cue for ${word.word}`}
      className={`word-card__visual saved-v2-word-card__image${visualClass}`}
      role="img"
      style={style}
    >
      {visualImage ? (
        <WordVisualImage sizes="72px" src={visualImage} />
      ) : (
        !externalImage ? <span aria-hidden="true">{word.word.slice(0, 1)}</span> : null
      )}
    </div>
  );
}

function QueueMemoryPill({ state }: { state: QueueMemoryState }) {
  const label =
    state === "weak"
      ? "Needs work"
      : state === "new"
        ? "New"
        : state === "mastered"
          ? "Mastered"
          : "Due now";

  return (
    <span className={`saved-v2-memory-pill saved-v2-memory-pill--${state}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

function QueueWordCard({ word }: { word: QueueWord }) {
  const dueLabel = word.nextDueAt
    ? `Due ${formatShortDate(word.nextDueAt) ?? "soon"}`
    : word.state === "new"
      ? "First review"
      : "Due now";
  const reviewedLabel =
    word.reviewCount === 1
      ? "1x reviewed"
      : `${word.reviewCount.toLocaleString()}x reviewed`;
  const actionHref =
    word.state === "weak"
      ? "/review/weak"
      : word.state === "mastered"
        ? `/word/${word.slug}`
        : "/review/due";

  return (
    <article className="saved-v2-word-card">
      <SavedQueueVisual word={word} />
      <div className="saved-v2-word-card__body">
        <div className="saved-v2-word-card__topline">
          <h3>{word.word}</h3>
          <QueueMemoryPill state={word.state} />
        </div>
        {word.definition ? (
          <p className="saved-v2-word-card__definition">{word.definition}</p>
        ) : null}
        <div className="saved-v2-word-card__meta">
          <span>{dueLabel}</span>
          <span aria-hidden="true">/</span>
          <span>{reviewedLabel}</span>
        </div>
      </div>
      <Link
        aria-label={`Review ${word.word}`}
        className="saved-v2-word-card__action"
        href={actionHref}
      >
        <ChevronRightIcon size={15} />
      </Link>
    </article>
  );
}

function SavedLibraryLoading() {
  return (
    <TrackBAppShell activeItemId="saved" currentPath="/saved">
      <div className="saved-v2-queue">
        <TrackBEmptyState
          body="Reading local saved words, review state, and review events without writing to them."
          title="Loading memory queue"
        />
      </div>
    </TrackBAppShell>
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
      dueCount: nextSnapshot.dueItems.length,
      weakCount: nextSnapshot.weakItems.length,
      reviewEventCount: nextSnapshot.reviewEventCount,
      hasLocalReviewState: Object.keys(nextSnapshot.reviewState).length > 0,
      hasLocalSavedWord: nextSnapshot.savedLibrary.length > 0
    });
  }, []);

  const sections = useMemo(
    () => (snapshot ? getQueueSections(snapshot) : []),
    [snapshot]
  );

  if (!snapshot) {
    return <SavedLibraryLoading />;
  }

  const reviewableCount = getReviewableCount(snapshot);
  const reviewHref = getQueueReviewHref(snapshot);

  return (
    <TrackBAppShell activeItemId="saved" currentPath="/saved">
      <div className="saved-v2-queue">
        <header className="saved-v2-queue-hero">
          <div className="saved-v2-queue-hero__copy">
            <h1>Your memory queue</h1>
            <p>
              These words are working their way into memory. Each review moves
              them forward.
            </p>
          </div>
          {reviewableCount > 0 ? (
            <Link className="track-b-button track-b-button--primary" href={reviewHref}>
              <span>
                Review {reviewableCount} ready{" "}
                {reviewableCount === 1 ? "word" : "words"}
              </span>
              <ArrowRightIcon size={15} />
            </Link>
          ) : null}
        </header>

        {sections.length > 0 ? (
          <div className="saved-v2-section-list">
            {sections.map((section) => (
              <section className="saved-v2-section" key={section.state}>
                <div className="saved-v2-section__header">
                  <span
                    aria-hidden="true"
                    className={`saved-v2-section__dot saved-v2-section__dot--${section.state}`}
                  />
                  <h2>{section.heading}</h2>
                  <span>{section.words.length}</span>
                </div>
                <p className="saved-v2-section__description">
                  {section.subcopy}
                </p>
                <div className="saved-v2-word-list" role="list">
                  {section.words.map((word) => (
                    <div key={word.slug} role="listitem">
                      <QueueWordCard word={word} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <TrackBEmptyState
            action={{ href: "/dashboard", label: "Back to dashboard" }}
            body="No saved words were found in local storage. Save a word to create the first review card."
            title="No words in queue"
          />
        )}
      </div>
    </TrackBAppShell>
  );
}
