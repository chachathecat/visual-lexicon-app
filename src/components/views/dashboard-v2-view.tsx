"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  TrackBAppShell,
  TrackBEmptyState
} from "@/components/track-b";
import { ArrowRightIcon, BookOpenIcon, LayersIcon } from "@/components/track-b/icons";
import { WordVisualImage } from "@/components/word-visual-image";
import { getMockQuizWordBySlug } from "@/lib/packs/mock-data";
import {
  getDueToday,
  getMastered,
  getNewSaved,
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
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

type DashboardV2Snapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  dueToday: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  masteredWords: VlxReviewStateItem[];
  hasAnyLocalData: boolean;
};

type DashboardDueWord = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  mastery: VlxMasteryLabel;
  box: number;
  weakScore: number;
  detail: string;
  memoryState: "due" | "weak";
};

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function readDashboardV2Snapshot(): DashboardV2Snapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const dueToday = getDueToday(reviewState, now);

  return {
    savedWords,
    reviewState,
    dueToday,
    weakWords: getWeakWords(reviewState),
    newSaved: getNewSaved(savedWords, reviewState),
    masteredWords: getMastered(reviewState),
    hasAnyLocalData:
      hasKeys(savedWords) || hasKeys(reviewState) || reviewEvents.length > 0
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

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function formatHubLabel(hub?: string) {
  if (!hub) {
    return "Unsorted";
  }

  return hub
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDueDetail(item: VlxReviewStateItem) {
  if (!item.nextDueAt || Date.parse(item.nextDueAt) <= Date.now()) {
    return "Due now";
  }

  const dueDate = formatShortDate(item.nextDueAt);

  return dueDate ? `Due ${dueDate}` : "Due now";
}

function toDueWord(item: VlxReviewStateItem): DashboardDueWord {
  const packWord = getMockQuizWordBySlug(item.slug);

  return {
    slug: item.slug,
    word: item.word || packWord?.word || item.slug,
    definition: item.definition ?? packWord?.definition,
    image: item.image ?? packWord?.image,
    hub: item.hub ?? packWord?.hub,
    mastery: item.mastery,
    box: item.box,
    weakScore: item.weakScore,
    detail: getDueDetail(item),
    memoryState: item.mastery === "Weak" || item.weakScore > 0 ? "weak" : "due"
  };
}

function getQueueRemainder(snapshot: DashboardV2Snapshot, previewCount: number) {
  const queuedSlugs = new Set([
    ...Object.keys(snapshot.savedWords),
    ...Object.keys(snapshot.reviewState)
  ]);

  return Math.max(0, queuedSlugs.size - previewCount);
}

function DashboardMemoryPill({
  state,
  label
}: {
  state: "due" | "weak";
  label?: string;
}) {
  return (
    <span className={`dashboard-v2-memory-pill dashboard-v2-memory-pill--${state}`}>
      <span aria-hidden="true" />
      {label ?? (state === "weak" ? "Needs work" : "Due now")}
    </span>
  );
}

function getMissionBody(snapshot: DashboardV2Snapshot) {
  if (snapshot.dueToday.length > 0) {
    return `${formatCount(
      snapshot.dueToday.length,
      "word"
    )} should be reviewed now. Every answer writes a review event and updates memory state.`;
  }

  if (!snapshot.hasAnyLocalData) {
    return "Save one word to create the first local review item. The next mission will come from real review state.";
  }

  return "Your due queue is clear from local SRS state. Save a word or open the queue when you are ready for the next review item.";
}

function DueWordThumbnail({ word }: { word: DashboardDueWord }) {
  const visualImage = getWordVisualImage(word.slug);
  const externalImage = visualImage ? undefined : word.image;
  const visualClass = visualImage
    ? " word-card__visual--image"
    : externalImage
      ? " word-card__visual--image"
      : getWordVisualFallbackClass(word.slug);
  const style: CSSProperties | undefined = externalImage
    ? { backgroundImage: `url("${externalImage}")` }
    : undefined;

  return (
    <div
      aria-label={`Visual cue for ${word.word}`}
      className={`word-card__visual dashboard-v2-due-row__image${visualClass}`}
      role="img"
      style={style}
    >
      {visualImage ? (
        <WordVisualImage sizes="76px" src={visualImage} />
      ) : (
        !externalImage ? <span aria-hidden="true">{word.word.slice(0, 1)}</span> : null
      )}
    </div>
  );
}

function DueWordRows({ words }: { words: DashboardDueWord[] }) {
  if (!words.length) {
    return (
      <TrackBEmptyState
        body="No due words were found in vlx_review_state_v1."
        className="dashboard-v2-empty-mission"
        headingLevel={3}
        title="Due queue is clear"
      />
    );
  }

  return (
    <ul className="dashboard-v2-due-list" aria-label="Due words preview">
      {words.map((word) => (
        <li key={word.slug}>
          <Link className="dashboard-v2-due-row" href="/review/due" prefetch={false}>
            <DueWordThumbnail word={word} />
            <div className="dashboard-v2-due-row__copy">
              <h2>{word.word}</h2>
              {word.definition ? <p>{word.definition}</p> : null}
            </div>
            <DashboardMemoryPill label={word.detail} state={word.memoryState} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DashboardStateCard({
  count,
  label,
  note,
  state
}: {
  count: number;
  label: string;
  note: string;
  state: "due" | "weak" | "new" | "mastered";
}) {
  return (
    <article className={`dashboard-v2-state-card dashboard-v2-state-card--${state}`}>
      <strong>{count}</strong>
      <span>{label}</span>
      <p>{note}</p>
    </article>
  );
}

function DashboardLoading() {
  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <div className="dashboard-v2-home" aria-label="Loading today's memory mission">
        <TrackBEmptyState
          body="Reading local saved words, review state, and review events."
          title="Loading today's memory mission"
        />
      </div>
    </TrackBAppShell>
  );
}

export function DashboardV2View() {
  const [snapshot, setSnapshot] = useState<DashboardV2Snapshot | null>(null);

  useEffect(() => {
    setSnapshot(readDashboardV2Snapshot());
  }, []);

  const previewWords = useMemo(() => {
    return snapshot ? snapshot.dueToday.slice(0, 3).map(toDueWord) : [];
  }, [snapshot]);

  if (!snapshot) {
    return <DashboardLoading />;
  }

  const reviewHref = snapshot.dueToday.length ? "/review/due" : "/review";
  const queueRemainder = getQueueRemainder(snapshot, previewWords.length);

  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <div className="dashboard-v2-home">
        <section
          aria-labelledby="dashboard-v2-mission-heading"
          className="dashboard-v2-mission-card"
        >
          <div className="dashboard-v2-mission-card__copy">
            <p className="track-b-eyebrow">Today&apos;s Memory Mission</p>
            <h1 id="dashboard-v2-mission-heading">
              <span>Review 5 words</span>
              <em>before they fade.</em>
            </h1>
            <p>{getMissionBody(snapshot)}</p>
          </div>

          <DueWordRows words={previewWords} />

          <div className="dashboard-v2-queue-row">
            <span>+ {queueRemainder} more in your queue</span>
            <Link href="/saved" prefetch={false}>
              See all
            </Link>
          </div>

          <Link
            aria-label="Start review"
            className="track-b-button track-b-button--primary dashboard-v2-review-cta"
            href={reviewHref}
            prefetch={false}
          >
            <span>Start today&apos;s review</span>
            <ArrowRightIcon size={16} />
          </Link>
        </section>

        <section
          aria-labelledby="dashboard-v2-memory-state-heading"
          className="dashboard-v2-status-grid"
        >
          <h2 className="sr-only" id="dashboard-v2-memory-state-heading">
            Memory state
          </h2>
          <DashboardStateCard
            count={snapshot.dueToday.length}
            label="Due now"
            note="ready now"
            state="due"
          />
          <DashboardStateCard
            count={snapshot.weakWords.length}
            label="Needs work"
            note="need more passes"
            state="weak"
          />
          <DashboardStateCard
            count={snapshot.newSaved.length}
            label="New"
            note="not yet seen"
            state="new"
          />
          <DashboardStateCard
            count={snapshot.masteredWords.length}
            label="Mastered"
            note="in long memory"
            state="mastered"
          />
        </section>

        <nav
          aria-label="Dashboard secondary actions"
          className="dashboard-v2-secondary-actions"
        >
          <Link
            className="track-b-button track-b-button--quiet"
            href="/saved"
            prefetch={false}
          >
            <LayersIcon size={14} />
            Memory queue
          </Link>
          <Link
            className="track-b-button track-b-button--quiet"
            href="/save?slug=dissonance&source=app"
            prefetch={false}
          >
            <BookOpenIcon size={14} />
            Save a word
          </Link>
        </nav>

        <p className="dashboard-v2-footer-note">
          Come back tomorrow - we&apos;ll surface your next words at the right moment.
        </p>
      </div>
    </TrackBAppShell>
  );
}
