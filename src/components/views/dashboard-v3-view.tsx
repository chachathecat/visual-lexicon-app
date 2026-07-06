"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  TrackBAppShell,
  TrackBEmptyState
} from "@/components/track-b";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClockIcon,
  LayersIcon
} from "@/components/track-b/icons";
import { WordVisualImage } from "@/components/word-visual-image";
import { getMockQuizWordBySlug } from "@/lib/packs/mock-data";
import {
  hasVisiblePackProgress,
  readPackProgressStore,
  type VlxPackProgressItem,
  type VlxPackProgressStore
} from "@/lib/packs/progress";
import {
  getDueToday,
  getMastered,
  getNewSaved,
  getSavedLibrary,
  getWeakWords,
  getWeeklyReviewedWords
} from "@/lib/srs/selectors";
import {
  readDailyStats,
  readReviewEvents,
  readReviewState,
  readSavedWords
} from "@/lib/srs/storage";
import type {
  VlxDailyStatsStore,
  VlxMasteryLabel,
  VlxReviewEventsStore,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

type DashboardV3PrimaryAction = {
  href: string;
  label: string;
  source: "due" | "weak" | "new-saved" | "empty";
  estimateWordCount: number;
};

type DashboardV3Snapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: VlxReviewEventsStore;
  dailyStats: VlxDailyStatsStore;
  packProgressStore: VlxPackProgressStore;
  dueToday: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  masteredWords: VlxReviewStateItem[];
  recentSaved: VlxSavedWord[];
  weeklyReviewedWords: number;
  continuePack?: VlxPackProgressItem;
  hasAnyLocalData: boolean;
};

type DashboardV3Word = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  mastery?: VlxMasteryLabel;
  box?: number;
  weakScore?: number;
  detail: string;
};

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function toTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getPackActivityTimestamp(progress: VlxPackProgressItem) {
  return Math.max(
    toTimestamp(progress.lastReviewedAt),
    toTimestamp(progress.previewCompletedAt),
    toTimestamp(progress.lastOpenedAt),
    toTimestamp(progress.previewStartedAt),
    toTimestamp(progress.startedAt)
  );
}

function getContinuePack(
  packProgressStore: VlxPackProgressStore
): VlxPackProgressItem | undefined {
  return Object.values(packProgressStore)
    .filter(hasVisiblePackProgress)
    .sort(
      (first, second) =>
        getPackActivityTimestamp(second) - getPackActivityTimestamp(first)
    )[0];
}

function readDashboardV3Snapshot(): DashboardV3Snapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const dailyStats = readDailyStats();
  const packProgressStore = readPackProgressStore();

  return {
    savedWords,
    reviewState,
    reviewEvents,
    dailyStats,
    packProgressStore,
    dueToday: getDueToday(reviewState, now),
    weakWords: getWeakWords(reviewState),
    newSaved: getNewSaved(savedWords, reviewState),
    masteredWords: getMastered(reviewState),
    recentSaved: getSavedLibrary(savedWords),
    weeklyReviewedWords: getWeeklyReviewedWords(reviewEvents, now),
    continuePack: getContinuePack(packProgressStore),
    hasAnyLocalData:
      hasKeys(savedWords) ||
      hasKeys(reviewState) ||
      reviewEvents.length > 0 ||
      hasKeys(dailyStats) ||
      hasKeys(packProgressStore)
  };
}

function getPrimaryAction(
  snapshot: DashboardV3Snapshot
): DashboardV3PrimaryAction {
  if (snapshot.dueToday.length > 0) {
    return {
      href: "/review/due",
      label: "Start due review",
      source: "due",
      estimateWordCount: snapshot.dueToday.length
    };
  }

  if (snapshot.weakWords.length > 0) {
    return {
      href: "/review/weak",
      label: "Practice weak words",
      source: "weak",
      estimateWordCount: snapshot.weakWords.length
    };
  }

  if (snapshot.newSaved.length > 0) {
    return {
      href: "/review",
      label: "Review new saved words",
      source: "new-saved",
      estimateWordCount: snapshot.newSaved.length
    };
  }

  return {
    href: "/saved",
    label: "Save a word to start",
    source: "empty",
    estimateWordCount: 0
  };
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function formatMinutes(wordCount: number) {
  if (wordCount <= 0) {
    return "about 0 minutes";
  }

  const minutes = Math.max(1, Math.ceil(wordCount / 4));

  return `about ${formatCount(minutes, "minute")}`;
}

function getMissionCopy(
  snapshot: DashboardV3Snapshot,
  primaryAction: DashboardV3PrimaryAction
) {
  if (primaryAction.source === "empty") {
    return "No words due yet. Save a word or start a pack to build your review queue.";
  }

  const baseParts = [
    `${formatCount(snapshot.dueToday.length, "word")} due`,
    `${snapshot.weakWords.length.toLocaleString()} weak`
  ];

  if (snapshot.newSaved.length > 0) {
    baseParts.push(
      `${formatCount(snapshot.newSaved.length, "new saved word", "new saved words")}`
    );
  }

  baseParts.push(formatMinutes(primaryAction.estimateWordCount));

  return baseParts.join(" - ");
}

function getMissionWords(
  snapshot: DashboardV3Snapshot,
  primaryAction: DashboardV3PrimaryAction
) {
  if (primaryAction.source === "due") {
    return snapshot.dueToday.slice(0, 3).map(fromStateItem);
  }

  if (primaryAction.source === "weak") {
    return snapshot.weakWords.slice(0, 3).map(fromStateItem);
  }

  if (primaryAction.source === "new-saved") {
    return snapshot.newSaved.slice(0, 3).map(fromSavedWord);
  }

  return [];
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

function formatToken(value?: string) {
  if (!value) {
    return undefined;
  }

  return value
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

function fromStateItem(item: VlxReviewStateItem): DashboardV3Word {
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
    detail: item.mastery === "Mastered" ? "Delayed recall passed" : getDueDetail(item)
  };
}

function fromSavedWord(savedWord: VlxSavedWord): DashboardV3Word {
  const savedDate = formatShortDate(savedWord.savedAt);

  return {
    slug: savedWord.slug,
    word: savedWord.word,
    definition: savedWord.definition,
    image: savedWord.image,
    hub: savedWord.hub,
    mastery: "New",
    box: 0,
    weakScore: 0,
    detail: savedDate ? `Saved ${savedDate}` : "Saved locally"
  };
}

function getWordVisualStyle(word: DashboardV3Word) {
  return word.image
    ? ({
        backgroundImage: `url("${word.image}")`
      } satisfies CSSProperties)
    : undefined;
}

function WordThumbnail({ word }: { word: DashboardV3Word }) {
  const visualImage = getWordVisualImage(word.slug);
  const externalImage = visualImage ? undefined : word.image;
  const visualClass = visualImage
    ? " word-card__visual--image"
    : externalImage
      ? " word-card__visual--image"
      : getWordVisualFallbackClass(word.slug);
  const style = externalImage ? getWordVisualStyle(word) : undefined;

  return (
    <div
      aria-label={`Visual cue for ${word.word}`}
      className={`word-card__visual dashboard-v3-word-thumb${visualClass}`}
      role="img"
      style={style}
    >
      {visualImage ? (
        <WordVisualImage sizes="72px" src={visualImage} />
      ) : !externalImage ? (
        <span aria-hidden="true">{word.word.slice(0, 1)}</span>
      ) : null}
    </div>
  );
}

function DashboardWordRow({ word }: { word: DashboardV3Word }) {
  return (
    <li>
      <Link className="dashboard-v3-word-row" href={`/word/${word.slug}`}>
        <WordThumbnail word={word} />
        <span className="dashboard-v3-word-row__copy">
          <strong>{word.word}</strong>
          {word.definition ? <span>{word.definition}</span> : null}
        </span>
        <span className="dashboard-v3-word-row__meta">{word.detail}</span>
      </Link>
    </li>
  );
}

function MissionWordList({
  emptyText,
  words
}: {
  emptyText: string;
  words: DashboardV3Word[];
}) {
  if (!words.length) {
    return <p className="dashboard-v3-empty-note">{emptyText}</p>;
  }

  return (
    <ul className="dashboard-v3-word-list" aria-label="Next memory words">
      {words.map((word) => (
        <DashboardWordRow key={word.slug} word={word} />
      ))}
    </ul>
  );
}

function DashboardV3Loading() {
  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <div className="dashboard-v3-home" aria-label="Loading dashboard">
        <TrackBEmptyState
          body="Reading local saved words, review state, review events, daily stats, and pack progress without changing them."
          title="Loading today's memory mission"
        />
      </div>
    </TrackBAppShell>
  );
}

function MissionHero({
  primaryAction,
  snapshot,
  words
}: {
  primaryAction: DashboardV3PrimaryAction;
  snapshot: DashboardV3Snapshot;
  words: DashboardV3Word[];
}) {
  return (
    <section
      aria-labelledby="dashboard-v3-mission-heading"
      className="dashboard-v3-mission"
    >
      <div className="dashboard-v3-mission__copy">
        <p className="track-b-eyebrow">Today</p>
        <h1 id="dashboard-v3-mission-heading">Today&apos;s Memory Mission</h1>
        <p>{getMissionCopy(snapshot, primaryAction)}</p>
      </div>

      <div className="dashboard-v3-mission__stats" aria-label="Mission counts">
        <span>
          <strong>{snapshot.dueToday.length}</strong>
          Due count
        </span>
        <span>
          <strong>{snapshot.weakWords.length}</strong>
          Weak count
        </span>
        <span>
          <strong>{formatMinutes(primaryAction.estimateWordCount)}</strong>
          Estimated time
        </span>
      </div>

      <MissionWordList
        emptyText="No due, weak, or new saved words were found in local learning state."
        words={words}
      />

      <Link
        aria-label={primaryAction.label}
        className="track-b-button track-b-button--primary dashboard-v3-primary-cta"
        href={primaryAction.href}
        prefetch={false}
      >
        <span>{primaryAction.label}</span>
        <ArrowRightIcon size={16} />
      </Link>
    </section>
  );
}

function DashboardMetricCard({
  description,
  label,
  state,
  value
}: {
  description: string;
  label: string;
  state: "due" | "weak" | "new" | "mastered" | "weekly";
  value: number;
}) {
  return (
    <article
      aria-label={`${label}: ${value}`}
      className={`dashboard-v3-card dashboard-v3-card--${state}`}
    >
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <p>{description}</p>
    </article>
  );
}

function getPackLabel(packId: string) {
  return formatToken(packId) ?? packId;
}

function getPackProgressLabel(progress: VlxPackProgressItem) {
  if (progress.reviewedCount > 0) {
    return `${formatCount(progress.reviewedCount, "card")} reviewed`;
  }

  if (progress.previewCompletedAt) {
    return "Preview completed";
  }

  return "Preview started";
}

function ContinuePackCard({ progress }: { progress: VlxPackProgressItem }) {
  return (
    <article className="dashboard-v3-card dashboard-v3-card--continue">
      <span>Continue Pack</span>
      <strong>{getPackLabel(progress.packId)}</strong>
      <p>
        {getPackProgressLabel(progress)} from real local pack progress.
        {progress.reviewedCount > 0
          ? ` ${formatCount(progress.correctCount, "correct answer")} recorded.`
          : ""}
      </p>
      <Link
        className="track-b-button track-b-button--quiet"
        href={`/packs/${progress.packId}`}
        prefetch={false}
      >
        <LayersIcon size={14} />
        Open pack
      </Link>
    </article>
  );
}

function RecentSavedCard({ words }: { words: DashboardV3Word[] }) {
  return (
    <article className="dashboard-v3-card dashboard-v3-card--recent">
      <span>Recent Saved</span>
      <strong>{words.length.toLocaleString()}</strong>
      <p>Recently saved words from local saved-word storage.</p>
      <MissionWordList emptyText="No saved words found." words={words} />
      <Link
        className="track-b-button track-b-button--quiet"
        href="/saved"
        prefetch={false}
      >
        <BookOpenIcon size={14} />
        View saved
      </Link>
    </article>
  );
}

function DashboardV3Cards({ snapshot }: { snapshot: DashboardV3Snapshot }) {
  const recentSavedWords = snapshot.recentSaved.slice(0, 3).map(fromSavedWord);

  return (
    <section
      aria-labelledby="dashboard-v3-evidence-heading"
      className="dashboard-v3-evidence"
    >
      <div className="dashboard-v3-section-heading">
        <h2 id="dashboard-v3-evidence-heading">Review evidence</h2>
        <p>Counts below are derived from local review and saved-word state.</p>
      </div>

      <div className="dashboard-v3-card-grid">
        <DashboardMetricCard
          description="Scheduled by nextDueAt through today, excluding Mastered."
          label="Due Today"
          state="due"
          value={snapshot.dueToday.length}
        />
        <DashboardMetricCard
          description="Weak mastery, repeated misses, or high weakScore."
          label="Weak Words"
          state="weak"
          value={snapshot.weakWords.length}
        />
        <DashboardMetricCard
          description="Saved words that have not yet been reviewed."
          label="New Saved"
          state="new"
          value={snapshot.newSaved.length}
        />
        <DashboardMetricCard
          description="Only box 5 words with Mastered memory state."
          label="Mastered"
          state="mastered"
          value={snapshot.masteredWords.length}
        />
        <DashboardMetricCard
          description="Unique reviewed words from review events in the last seven days."
          label="Weekly Reviewed Words"
          state="weekly"
          value={snapshot.weeklyReviewedWords}
        />
        {snapshot.continuePack ? (
          <ContinuePackCard progress={snapshot.continuePack} />
        ) : null}
        {recentSavedWords.length ? <RecentSavedCard words={recentSavedWords} /> : null}
      </div>
    </section>
  );
}

function DashboardV3EmptyGuide() {
  return (
    <section
      aria-labelledby="dashboard-v3-empty-heading"
      className="dashboard-v3-empty-guide"
    >
      <ClockIcon size={18} />
      <div>
        <h2 id="dashboard-v3-empty-heading">Build your first review queue</h2>
        <p>
          Save a word or start a pack. The dashboard will show due, weak, and
          mastered counts only after local review state exists.
        </p>
      </div>
      <div className="dashboard-v3-empty-guide__actions">
        <Link className="track-b-button track-b-button--primary" href="/saved">
          Save a word to start
        </Link>
        <Link className="track-b-button track-b-button--quiet" href="/packs">
          Start a pack
        </Link>
      </div>
    </section>
  );
}

export function DashboardV3View() {
  const [snapshot, setSnapshot] = useState<DashboardV3Snapshot | null>(null);

  useEffect(() => {
    setSnapshot(readDashboardV3Snapshot());
  }, []);

  const primaryAction = useMemo(
    () => (snapshot ? getPrimaryAction(snapshot) : null),
    [snapshot]
  );
  const missionWords = useMemo(
    () =>
      snapshot && primaryAction ? getMissionWords(snapshot, primaryAction) : [],
    [primaryAction, snapshot]
  );

  if (!snapshot || !primaryAction) {
    return <DashboardV3Loading />;
  }

  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <div className="dashboard-v3-home">
        <MissionHero
          primaryAction={primaryAction}
          snapshot={snapshot}
          words={missionWords}
        />

        {!snapshot.hasAnyLocalData ? <DashboardV3EmptyGuide /> : null}

        <DashboardV3Cards snapshot={snapshot} />
      </div>
    </TrackBAppShell>
  );
}
