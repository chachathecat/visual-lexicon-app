"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

import {
  TrackBAppShell,
  TrackBEmptyState,
  TrackBMetricCard,
  TrackBPageHeader,
  TrackBStatusBadge,
  TrackBUpgradeNudge,
  type TrackBStatusTone
} from "@/components/track-b";
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
  VlxMasteryLabel,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

const savedLibraryTabs = [
  {
    id: "due",
    label: "Due",
    description: "Saved words due from review state.",
    tone: "due"
  },
  {
    id: "weak",
    label: "Weak",
    description: "Mistake-backed weak words.",
    tone: "weak"
  },
  {
    id: "new",
    label: "New",
    description: "Saved before first recall.",
    tone: "new"
  },
  {
    id: "learning",
    label: "Learning",
    description: "Reviewed words still building recall.",
    tone: "learning"
  },
  {
    id: "mastered",
    label: "Mastered",
    description: "Only box 5 with Mastered state.",
    tone: "mastered"
  },
  {
    id: "all",
    label: "All",
    description: "Recently saved local cards.",
    tone: "strong"
  }
] as const;

type SavedLibraryTabId = (typeof savedLibraryTabs)[number]["id"];

type SavedLibrarySnapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  savedLibrary: VlxSavedWord[];
  dueItems: VlxReviewStateItem[];
  weakItems: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  learningItems: VlxReviewStateItem[];
  masteredItems: VlxReviewStateItem[];
  dueSlugs: Set<string>;
  weakSlugs: Set<string>;
  newSlugs: Set<string>;
  masteredSlugs: Set<string>;
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
  isDue: boolean;
  isWeak: boolean;
  isNew: boolean;
  isMastered: boolean;
};

type SavedLibraryCounts = Record<SavedLibraryTabId, number>;

type SavedLibraryMetric = {
  label: string;
  value: number;
  description: string;
  tone: TrackBStatusTone;
};

type SavedLibraryEmptyState = {
  title: string;
  body: string;
  action: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
};

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function getTime(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortReviewStateByUpdatedDesc(
  first: VlxReviewStateItem,
  second: VlxReviewStateItem
) {
  return getTime(second.updatedAt) - getTime(first.updatedAt);
}

function toSlugSet(items: Array<{ slug: string }>) {
  return new Set(items.map((item) => item.slug));
}

function getSavedReviewItems(
  savedWords: VlxSavedWordsStore,
  items: VlxReviewStateItem[]
) {
  return items.filter((item) => Boolean(savedWords[item.slug]));
}

function readSavedLibrarySnapshot(): SavedLibrarySnapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const savedLibrary = getSavedLibrary(savedWords);
  const masteredItems = getSavedReviewItems(savedWords, getMastered(reviewState));
  const masteredSlugs = toSlugSet(masteredItems);
  const dueItems = getSavedReviewItems(savedWords, getDueToday(reviewState, now));
  const weakItems = getSavedReviewItems(
    savedWords,
    getWeakWords(reviewState).filter((item) => !masteredSlugs.has(item.slug))
  );
  const newSaved = getNewSaved(savedWords, reviewState);
  const dueSlugs = toSlugSet(dueItems);
  const weakSlugs = toSlugSet(weakItems);
  const newSlugs = toSlugSet(newSaved);
  const learningItems = Object.values(reviewState)
    .filter((item) => {
      return (
        Boolean(savedWords[item.slug]) &&
        !newSlugs.has(item.slug) &&
        !weakSlugs.has(item.slug) &&
        !masteredSlugs.has(item.slug) &&
        (item.mastery === "Learning" || item.mastery === "Strong")
      );
    })
    .sort(sortReviewStateByUpdatedDesc);

  return {
    savedWords,
    reviewState,
    savedLibrary,
    dueItems,
    weakItems,
    newSaved,
    learningItems,
    masteredItems,
    dueSlugs,
    weakSlugs,
    newSlugs,
    masteredSlugs,
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
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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
    app: "App",
    exam_pack: "Exam pack",
    extension: "Extension",
    hub_page: "Hub page",
    manual: "Manual",
    word_page: "Word page"
  };

  return `Source: ${sourceLabels[normalizedSource] ?? normalizedSource}`;
}

function formatWeakScore(value?: number) {
  if (typeof value !== "number") {
    return undefined;
  }

  return `Weak score ${Math.round(value * 100)}%`;
}

function formatReviewCount(correct?: number, wrong?: number) {
  if (typeof correct !== "number" || typeof wrong !== "number") {
    return undefined;
  }

  return `${correct} correct / ${wrong} wrong`;
}

function getDueLabel(word: SavedLibraryWord) {
  if (!word.hasReviewState) {
    return undefined;
  }

  const dueDate = formatShortDate(word.nextDueAt);

  if (!word.nextDueAt || word.isDue) {
    return dueDate ? `Due ${dueDate}` : "Due now";
  }

  return dueDate ? `Next due ${dueDate}` : undefined;
}

function getCardStatus(
  word: SavedLibraryWord,
  activeTab: SavedLibraryTabId
): {
  tone: TrackBStatusTone;
  detail: string;
} {
  if (activeTab === "due" && word.isDue) {
    return { tone: "due", detail: "ready now" };
  }

  if (activeTab === "weak" && word.isWeak) {
    return { tone: "weak", detail: "mistake evidence" };
  }

  if (activeTab === "new" && word.isNew) {
    return {
      tone: "new",
      detail: word.hasReviewState ? "unreviewed" : "saved only"
    };
  }

  if (activeTab === "mastered" && word.isMastered) {
    return { tone: "mastered", detail: "box 5" };
  }

  if (word.isMastered) {
    return { tone: "mastered", detail: "box 5" };
  }

  if (word.isWeak) {
    return { tone: "weak", detail: "mistake evidence" };
  }

  if (word.isDue) {
    return { tone: "due", detail: "ready now" };
  }

  if (word.isNew) {
    return {
      tone: "new",
      detail: word.hasReviewState ? "unreviewed" : "saved only"
    };
  }

  if (word.mastery === "Strong") {
    return { tone: "strong", detail: "stable" };
  }

  return { tone: "learning", detail: "in review" };
}

function toSavedLibraryWord(
  savedWord: VlxSavedWord,
  reviewStateItem: VlxReviewStateItem | undefined,
  snapshot: Pick<
    SavedLibrarySnapshot,
    "dueSlugs" | "masteredSlugs" | "newSlugs" | "weakSlugs"
  >
): SavedLibraryWord {
  const slug = savedWord.slug;

  return {
    slug,
    word: reviewStateItem?.word || savedWord.word || slug,
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
    hasReviewState: Boolean(reviewStateItem),
    isDue: snapshot.dueSlugs.has(slug),
    isWeak: snapshot.weakSlugs.has(slug),
    isNew: snapshot.newSlugs.has(slug),
    isMastered: snapshot.masteredSlugs.has(slug)
  };
}

function toSavedLibraryWordFromState(
  item: VlxReviewStateItem,
  snapshot: SavedLibrarySnapshot
) {
  return toSavedLibraryWord(snapshot.savedWords[item.slug], item, snapshot);
}

function getWordsForTab(
  snapshot: SavedLibrarySnapshot,
  activeTab: SavedLibraryTabId
) {
  if (activeTab === "due") {
    return snapshot.dueItems.map((item) =>
      toSavedLibraryWordFromState(item, snapshot)
    );
  }

  if (activeTab === "weak") {
    return snapshot.weakItems.map((item) =>
      toSavedLibraryWordFromState(item, snapshot)
    );
  }

  if (activeTab === "new") {
    return snapshot.newSaved.map((savedWord) =>
      toSavedLibraryWord(savedWord, snapshot.reviewState[savedWord.slug], snapshot)
    );
  }

  if (activeTab === "learning") {
    return snapshot.learningItems.map((item) =>
      toSavedLibraryWordFromState(item, snapshot)
    );
  }

  if (activeTab === "mastered") {
    return snapshot.masteredItems.map((item) =>
      toSavedLibraryWordFromState(item, snapshot)
    );
  }

  return snapshot.savedLibrary.map((savedWord) =>
    toSavedLibraryWord(savedWord, snapshot.reviewState[savedWord.slug], snapshot)
  );
}

function getCounts(snapshot: SavedLibrarySnapshot): SavedLibraryCounts {
  return {
    all: snapshot.savedLibrary.length,
    due: snapshot.dueItems.length,
    learning: snapshot.learningItems.length,
    mastered: snapshot.masteredItems.length,
    new: snapshot.newSaved.length,
    weak: snapshot.weakItems.length
  };
}

function getSummaryMetrics(snapshot: SavedLibrarySnapshot): SavedLibraryMetric[] {
  return [
    {
      label: "Due now",
      value: snapshot.dueItems.length,
      description: "Saved cards due through today.",
      tone: "due"
    },
    {
      label: "Weak words",
      value: snapshot.weakItems.length,
      description: "Weak mastery, misses, or high weakScore.",
      tone: "weak"
    },
    {
      label: "New saved",
      value: snapshot.newSaved.length,
      description: "Saved before a first recall.",
      tone: "new"
    },
    {
      label: "Learning",
      value: snapshot.learningItems.length,
      description: "Reviewed cards still building recall.",
      tone: "learning"
    },
    {
      label: "Mastered",
      value: snapshot.masteredItems.length,
      description: "Only box 5 with Mastered state.",
      tone: "mastered"
    }
  ];
}

function getEmptyState(
  activeTab: SavedLibraryTabId,
  snapshot: SavedLibrarySnapshot
): SavedLibraryEmptyState {
  if (snapshot.savedLibrary.length === 0) {
    return {
      title: "No saved words yet",
      body: snapshot.hasReviewData
        ? "There is local review history in this browser, but no local saved words. This page does not show sample words as saved."
        : "No words have been saved in local storage yet. This page does not show sample words as saved.",
      action: { href: "/packs", label: "Browse packs" },
      secondaryAction: { href: "/dashboard", label: "Back to Today" }
    };
  }

  if (activeTab === "due") {
    return {
      title: "No saved words due now",
      body: "Due cards appear only when saved words have review_state with nextDueAt through today or no next due date. The saved library is not inventing due work.",
      action: { href: "/dashboard", label: "Back to Today" },
      secondaryAction: { href: "/packs", label: "Find new words" }
    };
  }

  if (activeTab === "weak") {
    return {
      title: "No weak saved words right now",
      body: "Weak cards appear after missed recall, repeated mistakes, Weak mastery, or a high weakScore in local review state.",
      action: { href: "/review/due", label: "Check due review" },
      secondaryAction: { href: "/dashboard", label: "Back to Today" }
    };
  }

  if (activeTab === "new") {
    return {
      title: "No new saved words",
      body: "New saved cards appear before a first review answer exists. Reviewed cards move into learning, weak, due, or mastered queues from real state.",
      action: { href: "/packs", label: "Find words" },
      secondaryAction: { href: "/dashboard", label: "Back to Today" }
    };
  }

  if (activeTab === "learning") {
    return {
      title: "No saved words are learning yet",
      body: "Learning cards appear after saved words have review state and are not weak, new, or mastered.",
      action: { href: "/review?mode=saved", label: "Review saved" },
      secondaryAction: { href: "/packs", label: "Find words" }
    };
  }

  return {
    title: "No mastered saved words yet",
    body: "Mastered cards appear only when existing review state has box 5 and mastery Mastered. Saving alone never creates mastery.",
    action: { href: "/review/due", label: "Start due review" },
    secondaryAction: { href: "/dashboard", label: "Back to Today" }
  };
}

function getPrimaryAction(
  word: SavedLibraryWord,
  activeTab: SavedLibraryTabId
) {
  if (activeTab === "due" && word.isDue) {
    return {
      href: "/review/due",
      label: "Review now",
      ariaLabel: `Review ${word.word} now`
    };
  }

  if (activeTab === "weak" && word.isWeak) {
    return {
      href: "/review/weak",
      label: "Review now",
      ariaLabel: `Review ${word.word} in weak review`
    };
  }

  if (word.isDue) {
    return {
      href: "/review/due",
      label: "Review now",
      ariaLabel: `Review ${word.word} now`
    };
  }

  if (word.isWeak) {
    return {
      href: "/review/weak",
      label: "Review now",
      ariaLabel: `Review ${word.word} in weak review`
    };
  }

  if (word.isNew) {
    return {
      href: "/review?mode=saved",
      label: "Review now",
      ariaLabel: `Review saved word ${word.word}`
    };
  }

  if (word.isMastered) {
    return {
      href: `/word/${word.slug}`,
      label: "View word",
      ariaLabel: `View ${word.word}`
    };
  }

  return {
    href: "/review?mode=saved",
    label: "Continue",
    ariaLabel: `Continue review with ${word.word}`
  };
}

function SavedWordVisual({ word }: { word: SavedLibraryWord }) {
  const style = word.image
    ? {
        backgroundImage: `url("${word.image}")`
      }
    : undefined;

  return (
    <div
      aria-label={`Visual cue for ${word.word}`}
      className="saved-v2-word-card__image"
      role="img"
      style={style}
    >
      {!word.image ? <span aria-hidden="true">{word.word.slice(0, 1)}</span> : null}
    </div>
  );
}

function SavedWordCard({
  activeTab,
  word
}: {
  activeTab: SavedLibraryTabId;
  word: SavedLibraryWord;
}) {
  const primaryAction = getPrimaryAction(word, activeTab);
  const secondaryAction =
    primaryAction.label === "View word"
      ? {
          href: "/dashboard",
          label: "Continue",
          ariaLabel: "Continue to Today"
        }
      : {
          href: `/word/${word.slug}`,
          label: "View word",
          ariaLabel: `View ${word.word}`
        };
  const status = getCardStatus(word, activeTab);
  const savedDate = formatShortDate(word.savedAt);
  const reviewedDate = formatShortDate(word.lastReviewedAt);
  const sourceLabel = formatSourceLabel(word.source);
  const weakScoreLabel = formatWeakScore(word.weakScore);
  const reviewCountLabel = formatReviewCount(word.correct, word.wrong);
  const dueLabel = getDueLabel(word);

  return (
    <article className="saved-v2-word-card">
      <SavedWordVisual word={word} />
      <div className="saved-v2-word-card__body">
        <div className="saved-v2-word-card__topline">
          <h3>{word.word}</h3>
          <TrackBStatusBadge detail={status.detail} status={status.tone} />
        </div>
        {word.definition ? (
          <p className="saved-v2-word-card__definition">{word.definition}</p>
        ) : null}
        <div className="saved-v2-token-row">
          {typeof word.box === "number" ? (
            <span className="saved-v2-token">Box {word.box}</span>
          ) : null}
          {weakScoreLabel ? (
            <span className="saved-v2-token">{weakScoreLabel}</span>
          ) : null}
          {dueLabel ? <span className="saved-v2-token">{dueLabel}</span> : null}
          {reviewCountLabel ? (
            <span className="saved-v2-token">{reviewCountLabel}</span>
          ) : null}
          {word.hasReviewState ? null : (
            <span className="saved-v2-token">No review state yet</span>
          )}
          <span className="saved-v2-token">{formatHubLabel(word.hub)}</span>
          {sourceLabel ? (
            <span className="saved-v2-token">{sourceLabel}</span>
          ) : null}
          {savedDate ? (
            <span className="saved-v2-token">Saved {savedDate}</span>
          ) : null}
          {reviewedDate ? (
            <span className="saved-v2-token">Reviewed {reviewedDate}</span>
          ) : null}
        </div>
        <div className="track-b-action-row saved-v2-word-card__actions">
          <Link
            aria-label={primaryAction.ariaLabel}
            className="track-b-button track-b-button--primary"
            href={primaryAction.href}
          >
            {primaryAction.label}
          </Link>
          <Link
            aria-label={secondaryAction.ariaLabel}
            className="track-b-button track-b-button--quiet"
            href={secondaryAction.href}
          >
            {secondaryAction.label}
          </Link>
        </div>
      </div>
    </article>
  );
}

function SavedLibraryTabs({
  activeTab,
  counts,
  onChange
}: {
  activeTab: SavedLibraryTabId;
  counts: SavedLibraryCounts;
  onChange: (tab: SavedLibraryTabId) => void;
}) {
  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: SavedLibraryTabId
  ) {
    const currentIndex = savedLibraryTabs.findIndex((tab) => tab.id === tabId);
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % savedLibraryTabs.length;
    }

    if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + savedLibraryTabs.length) % savedLibraryTabs.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = savedLibraryTabs.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();

    const nextTab = savedLibraryTabs[nextIndex];
    onChange(nextTab.id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  }

  return (
    <div
      aria-label="Memory queue status tabs"
      className="saved-v2-tabs"
      role="tablist"
    >
      {savedLibraryTabs.map((tab) => {
        const selected = activeTab === tab.id;

        return (
          <button
            aria-controls="saved-v2-panel"
            aria-selected={selected}
            className={`saved-v2-tab saved-v2-tab--${tab.tone}`}
            id={`saved-v2-tab-${tab.id}`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, tab.id)}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            <span className="saved-v2-tab__label">{tab.label}</span>
            <span className="saved-v2-tab__count">{counts[tab.id]}</span>
            <span className="saved-v2-tab__description">{tab.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function SavedLibraryPanel({
  activeTab,
  snapshot,
  words
}: {
  activeTab: SavedLibraryTabId;
  snapshot: SavedLibrarySnapshot;
  words: SavedLibraryWord[];
}) {
  if (words.length === 0) {
    const emptyState = getEmptyState(activeTab, snapshot);

    return (
      <div
        aria-labelledby={`saved-v2-tab-${activeTab}`}
        className="saved-v2-panel"
        id="saved-v2-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <TrackBEmptyState
          action={emptyState.action}
          body={emptyState.body}
          secondaryAction={emptyState.secondaryAction}
          title={emptyState.title}
        />
      </div>
    );
  }

  return (
    <div
      aria-labelledby={`saved-v2-tab-${activeTab}`}
      className="saved-v2-panel"
      id="saved-v2-panel"
      role="tabpanel"
      tabIndex={0}
    >
      <div
        aria-label={`${savedLibraryTabs.find((tab) => tab.id === activeTab)?.label} saved words`}
        className="saved-v2-word-list"
        role="list"
      >
        {words.map((word) => (
          <div key={word.slug} role="listitem">
            <SavedWordCard activeTab={activeTab} word={word} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedLibraryLoading() {
  return (
    <TrackBAppShell activeItemId="saved" currentPath="/saved">
      <TrackBPageHeader
        description="Saved is a review queue, not bookmarks. Saved words are waiting to be reviewed."
        eyebrow="Memory queue"
        title="Memory queue"
      />
      <TrackBEmptyState
        body="Reading local saved words, review state, and review events without writing to them."
        title="Loading memory queue"
      />
    </TrackBAppShell>
  );
}

export function SavedLibraryView() {
  const [activeTab, setActiveTab] = useState<SavedLibraryTabId>("due");
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
      hasLocalReviewState: hasKeys(nextSnapshot.reviewState),
      hasLocalSavedWord: nextSnapshot.savedLibrary.length > 0
    });
  }, []);

  const counts = useMemo(() => {
    return snapshot ? getCounts(snapshot) : null;
  }, [snapshot]);
  const words = useMemo(() => {
    return snapshot ? getWordsForTab(snapshot, activeTab) : [];
  }, [activeTab, snapshot]);
  const summaryMetrics = useMemo(() => {
    return snapshot ? getSummaryMetrics(snapshot) : [];
  }, [snapshot]);

  if (!snapshot || !counts) {
    return <SavedLibraryLoading />;
  }

  return (
    <TrackBAppShell activeItemId="saved" currentPath="/saved">
      <TrackBPageHeader
        actions={
          <>
            <Link className="track-b-button track-b-button--primary" href="/review?mode=saved">
              Review now
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/review/due">
              Review due
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/review/weak">
              Practice weak
            </Link>
            <Link className="track-b-button track-b-button--quiet" href="/packs">
              Find words
            </Link>
          </>
        }
        description="Saved is a review queue, not bookmarks. Saved words are waiting to be reviewed."
        eyebrow="Memory queue"
        meta={
          <span>
            {snapshot.savedLibrary.length} saved | {snapshot.reviewEventCount} review events
          </span>
        }
        title="Memory queue"
      />

      <section
        aria-labelledby="saved-v2-summary-heading"
        className="saved-v2-section"
      >
        <div className="saved-v2-section__header">
          <div>
            <p className="track-b-eyebrow">Memory state</p>
            <h2 className="saved-v2-section__title" id="saved-v2-summary-heading">
              Saved words by review readiness
            </h2>
          </div>
          <p className="saved-v2-section__description">
            Counts are read from saved words and existing review state so saved
            words move toward review, not a bookmark shelf. Mastered requires
            box 5 and Mastered state.
          </p>
        </div>
        <div className="saved-v2-status-grid">
          {summaryMetrics.map((metric) => (
            <TrackBMetricCard
              description={metric.description}
              key={metric.label}
              label={metric.label}
              tone={metric.tone}
              value={metric.value}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="saved-v2-queue-heading" className="saved-v2-section">
        <div className="saved-v2-section__header">
          <div>
            <p className="track-b-eyebrow">Review queue</p>
            <h2 className="saved-v2-section__title" id="saved-v2-queue-heading">
              Open the right saved-word queue
            </h2>
          </div>
          <p className="saved-v2-section__description">
            Review now starts the saved-word queue. Due, Weak, New, Learning,
            Mastered, and All are secondary views of that queue.
          </p>
        </div>
        <SavedLibraryTabs
          activeTab={activeTab}
          counts={counts}
          onChange={setActiveTab}
        />
        <SavedLibraryPanel
          activeTab={activeTab}
          snapshot={snapshot}
          words={words}
        />
      </section>

      <TrackBUpgradeNudge
        action={{
          href: "/pricing",
          label: "View pricing"
        }}
        badgeLabel="Beta"
        body="This is a visual-only upgrade note. It links to the existing pricing page and does not grant paid access from the saved library."
        title="Want every saved word to stay in review?"
      />
    </TrackBAppShell>
  );
}
