"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent
} from "react";

import { TrackBAppShell, TrackBEmptyState } from "@/components/track-b";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/track-b/icons";
import { WordVisualImage } from "@/components/word-visual-image";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  getDueToday,
  getMastered,
  getNewSaved,
  getWeakWords
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
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

const savedLibraryTabs = [
  {
    id: "due",
    label: "Due",
    description: "ready now",
    emptyTitle: "No words due right now.",
    emptyBody:
      "You're caught up. Come back after your next review is ready."
  },
  {
    id: "weak",
    label: "Weak",
    description: "needs repair",
    emptyTitle: "No words need extra practice right now.",
    emptyBody:
      "Keep reviewing. Words that need extra practice will appear here."
  },
  {
    id: "new",
    label: "New",
    description: "not reviewed",
    emptyTitle: "Save a word to start your memory queue.",
    emptyBody:
      "Save a word from a word page or pack to begin."
  },
  {
    id: "learning",
    label: "Learning",
    description: "in progress",
    emptyTitle: "Review saved words to build learning progress.",
    emptyBody:
      "Complete a review and the words you are building will appear here."
  },
  {
    id: "mastered",
    label: "Mastered",
    description: "delayed recall",
    emptyTitle: "Keep reviewing to build lasting recall.",
    emptyBody:
      "Keep reviewing over time. Strong delayed recall will move words here."
  },
  {
    id: "all",
    label: "All",
    description: "saved cards",
    emptyTitle: "Your saved words will appear here.",
    emptyBody:
      "Save a word from a word page or pack to build your library."
  }
] as const;

type SavedLibraryTabId = (typeof savedLibraryTabs)[number]["id"];
type ReviewStateStatus = "valid" | "missing" | "stale";
type MasteryDisplay = VlxMasteryLabel | "Needs review";
type MemoryTone =
  | "due"
  | "weak"
  | "new"
  | "learning"
  | "strong"
  | "mastered"
  | "unknown";

type SavedWordEvidence = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  source?: string;
  savedAt?: string;
};

type ReviewStateEvidence = Pick<
  VlxReviewStateItem,
  | "slug"
  | "word"
  | "image"
  | "definition"
  | "hub"
  | "box"
  | "mastery"
  | "correct"
  | "wrong"
  | "streakCorrect"
  | "lastReviewedAt"
  | "nextDueAt"
  | "weakScore"
  | "avgResponseMs"
  | "lastQuestionType"
  | "createdAt"
  | "updatedAt"
>;

type SavedLibraryCard = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  source?: string;
  savedAt?: string;
  reviewState?: ReviewStateEvidence;
  reviewStateStatus: ReviewStateStatus;
  masteryLabel: MasteryDisplay;
  memoryTone: MemoryTone;
  reviewCount: number;
  isDue: boolean;
  isWeak: boolean;
};

type SavedLibrarySnapshot = {
  tabs: Record<SavedLibraryTabId, SavedLibraryCard[]>;
  reviewEventCount: number;
  reviewedCount: number;
  hasLocalReviewState: boolean;
  hasLocalSavedWord: boolean;
};

const masteryLabels = new Set<VlxMasteryLabel>([
  "New",
  "Learning",
  "Weak",
  "Strong",
  "Mastered"
]);

const tabIndexById = new Map(
  savedLibraryTabs.map((tab, index) => [tab.id, index])
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function getValidDateString(value: unknown) {
  const stringValue = getTrimmedString(value);

  if (!stringValue || Number.isNaN(Date.parse(stringValue))) {
    return undefined;
  }

  return stringValue;
}

function getNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function getOptionalNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function getWeakScore(value: unknown) {
  const number = getOptionalNonNegativeNumber(value);

  if (number === undefined) {
    return 0;
  }

  return Math.min(1, number);
}

function getSrsBox(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 5
    ? (value as ReviewStateEvidence["box"])
    : undefined;
}

function getMastery(value: unknown) {
  const stringValue = getTrimmedString(value);

  return stringValue && masteryLabels.has(stringValue as VlxMasteryLabel)
    ? (stringValue as VlxMasteryLabel)
    : undefined;
}

function normalizeSavedWord(
  rawSavedWord: unknown,
  fallbackSlug: string
): SavedWordEvidence | null {
  if (!isRecord(rawSavedWord)) {
    return null;
  }

  const slug = getTrimmedString(rawSavedWord.slug) ?? fallbackSlug;
  const word = getTrimmedString(rawSavedWord.word) ?? slug;

  if (!slug) {
    return null;
  }

  return {
    slug,
    word,
    image: getTrimmedString(rawSavedWord.image),
    definition: getTrimmedString(rawSavedWord.definition),
    hub: getTrimmedString(rawSavedWord.hub),
    source: getTrimmedString(rawSavedWord.source),
    savedAt: getValidDateString(rawSavedWord.savedAt)
  };
}

function normalizeReviewStateItem(
  rawStateItem: unknown,
  fallbackSlug: string
): ReviewStateEvidence | null {
  if (!isRecord(rawStateItem)) {
    return null;
  }

  const slug = getTrimmedString(rawStateItem.slug) ?? fallbackSlug;
  const mastery = getMastery(rawStateItem.mastery);
  const box = getSrsBox(rawStateItem.box);

  if (!slug || !mastery || box === undefined) {
    return null;
  }

  const word = getTrimmedString(rawStateItem.word) ?? slug;

  return {
    slug,
    word,
    image: getTrimmedString(rawStateItem.image),
    definition: getTrimmedString(rawStateItem.definition),
    hub: getTrimmedString(rawStateItem.hub),
    box,
    mastery,
    correct: getNonNegativeInteger(rawStateItem.correct),
    wrong: getNonNegativeInteger(rawStateItem.wrong),
    streakCorrect: getNonNegativeInteger(rawStateItem.streakCorrect),
    lastReviewedAt: getValidDateString(rawStateItem.lastReviewedAt),
    nextDueAt: getValidDateString(rawStateItem.nextDueAt),
    weakScore: getWeakScore(rawStateItem.weakScore),
    avgResponseMs: getOptionalNonNegativeNumber(rawStateItem.avgResponseMs),
    lastQuestionType: getTrimmedString(rawStateItem.lastQuestionType) as
      | ReviewStateEvidence["lastQuestionType"]
      | undefined,
    createdAt: getValidDateString(rawStateItem.createdAt) ?? "",
    updatedAt: getValidDateString(rawStateItem.updatedAt) ?? ""
  };
}

function getSavedWords(savedWords: VlxSavedWordsStore) {
  return Object.entries(savedWords)
    .map(([slug, savedWord]) => normalizeSavedWord(savedWord, slug))
    .filter((savedWord): savedWord is SavedWordEvidence => Boolean(savedWord))
    .sort(sortSavedCardsBySavedAtDesc);
}

function toSavedWordsStore(savedWords: SavedWordEvidence[]) {
  return savedWords.reduce<VlxSavedWordsStore>((store, savedWord) => {
    store[savedWord.slug] = {
      slug: savedWord.slug,
      word: savedWord.word,
      image: savedWord.image,
      definition: savedWord.definition,
      hub: savedWord.hub,
      source: savedWord.source as VlxSavedWord["source"],
      savedAt: savedWord.savedAt ?? ""
    };

    return store;
  }, {});
}

function getReviewStateMap(reviewState: VlxReviewStateStore) {
  const normalized = new Map<string, ReviewStateEvidence>();

  Object.entries(reviewState).forEach(([slug, stateItem]) => {
    const normalizedItem = normalizeReviewStateItem(stateItem, slug);

    if (normalizedItem) {
      normalized.set(normalizedItem.slug, normalizedItem);
    }
  });

  return normalized;
}

function toReviewStateStore(reviewState: Map<string, ReviewStateEvidence>) {
  return Array.from(reviewState.values()).reduce<VlxReviewStateStore>(
    (store, stateItem) => {
      store[stateItem.slug] = stateItem;
      return store;
    },
    {}
  );
}

function getDailyReviewedTotal(dailyStats: VlxDailyStatsStore) {
  return Object.values(dailyStats).reduce((total, item) => {
    if (!isRecord(item)) {
      return total;
    }

    const reviewed = item.reviewed;

    return typeof reviewed === "number" && Number.isFinite(reviewed) && reviewed > 0
      ? total + reviewed
      : total;
  }, 0);
}

function isDueNow(state: ReviewStateEvidence, now: Date) {
  if (state.mastery === "Mastered" || !state.nextDueAt) {
    return false;
  }

  const nextDueAt = Date.parse(state.nextDueAt);

  return Number.isFinite(nextDueAt) && nextDueAt <= now.getTime();
}

function isWeakState(state: ReviewStateEvidence) {
  return (
    state.mastery !== "Mastered" &&
    (state.mastery === "Weak" || state.weakScore > 0 || state.wrong > 0)
  );
}

function getMemoryTone(
  state: ReviewStateEvidence | undefined,
  status: ReviewStateStatus,
  isDue: boolean,
  isWeak: boolean
): MemoryTone {
  if (
    status === "stale" ||
    (state?.mastery === "Mastered" && state.box !== 5)
  ) {
    return "unknown";
  }

  if (isDue) {
    return "due";
  }

  if (isWeak) {
    return "weak";
  }

  if (!state || state.mastery === "New") {
    return "new";
  }

  if (state.mastery === "Mastered" && state.box === 5) {
    return "mastered";
  }

  if (state.mastery === "Strong") {
    return "strong";
  }

  return "learning";
}

function toSavedLibraryCard(
  savedWord: SavedWordEvidence,
  reviewState: ReviewStateEvidence | undefined,
  reviewStateStatus: ReviewStateStatus,
  now: Date
): SavedLibraryCard {
  const isDue = reviewState ? isDueNow(reviewState, now) : false;
  const isWeak = reviewState ? isWeakState(reviewState) : false;
  const masteryLabel: MasteryDisplay =
    reviewStateStatus === "stale" ||
    (reviewState?.mastery === "Mastered" && reviewState.box !== 5)
      ? "Needs review"
      : reviewState?.mastery ?? "New";

  return {
    slug: savedWord.slug,
    word: reviewState?.word || savedWord.word,
    definition: reviewState?.definition ?? savedWord.definition,
    image: reviewState?.image ?? savedWord.image,
    hub: reviewState?.hub ?? savedWord.hub,
    source: savedWord.source,
    savedAt: savedWord.savedAt,
    reviewState,
    reviewStateStatus,
    masteryLabel,
    memoryTone: getMemoryTone(reviewState, reviewStateStatus, isDue, isWeak),
    reviewCount: reviewState ? reviewState.correct + reviewState.wrong : 0,
    isDue,
    isWeak
  };
}

function compareDateAsc(first?: string, second?: string) {
  const firstTime = first ? Date.parse(first) : Number.POSITIVE_INFINITY;
  const secondTime = second ? Date.parse(second) : Number.POSITIVE_INFINITY;

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  return 0;
}

function compareDateDesc(first?: string, second?: string) {
  const firstTime = first ? Date.parse(first) : Number.NEGATIVE_INFINITY;
  const secondTime = second ? Date.parse(second) : Number.NEGATIVE_INFINITY;

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return 0;
}

function sortSavedCardsBySavedAtDesc(
  first: SavedWordEvidence | SavedLibraryCard,
  second: SavedWordEvidence | SavedLibraryCard
) {
  return compareDateDesc(first.savedAt, second.savedAt) || first.slug.localeCompare(second.slug);
}

function sortDueCards(first: SavedLibraryCard, second: SavedLibraryCard) {
  return (
    compareDateAsc(first.reviewState?.nextDueAt, second.reviewState?.nextDueAt) ||
    (second.reviewState?.weakScore ?? 0) - (first.reviewState?.weakScore ?? 0) ||
    first.slug.localeCompare(second.slug)
  );
}

function sortWeakCards(first: SavedLibraryCard, second: SavedLibraryCard) {
  return (
    (second.reviewState?.weakScore ?? 0) - (first.reviewState?.weakScore ?? 0) ||
    (second.reviewState?.wrong ?? 0) - (first.reviewState?.wrong ?? 0) ||
    (first.reviewState?.box ?? 5) - (second.reviewState?.box ?? 5) ||
    first.slug.localeCompare(second.slug)
  );
}

function sortReviewedCards(first: SavedLibraryCard, second: SavedLibraryCard) {
  return (
    compareDateDesc(first.reviewState?.updatedAt, second.reviewState?.updatedAt) ||
    sortSavedCardsBySavedAtDesc(first, second)
  );
}

function buildTabs(
  cards: SavedLibraryCard[],
  savedWordsStore: VlxSavedWordsStore,
  reviewStateStore: VlxReviewStateStore,
  now: Date
) {
  const savedSlugs = new Set(cards.map((card) => card.slug));
  const dueSlugs = new Set(
    getDueToday(reviewStateStore, now)
      .filter(
        (item) =>
          savedSlugs.has(item.slug) &&
          isDueNow(item, now)
      )
      .map((item) => item.slug)
  );
  const weakSlugs = new Set(
    getWeakWords(reviewStateStore)
      .filter(
        (item) =>
          savedSlugs.has(item.slug) &&
          isWeakState(item)
      )
      .map((item) => item.slug)
  );

  Object.values(reviewStateStore).forEach((item) => {
    if (savedSlugs.has(item.slug) && isWeakState(item)) {
      weakSlugs.add(item.slug);
    }
  });

  const newSavedSlugs = new Set(
    getNewSaved(savedWordsStore, reviewStateStore).map((item) => item.slug)
  );
  const masteredSlugs = new Set(
    getMastered(reviewStateStore)
      .filter((item) => savedSlugs.has(item.slug))
      .map((item) => item.slug)
  );

  return {
    due: cards.filter((card) => dueSlugs.has(card.slug)).sort(sortDueCards),
    weak: cards.filter((card) => weakSlugs.has(card.slug)).sort(sortWeakCards),
    new: cards
      .filter((card) => newSavedSlugs.has(card.slug))
      .sort(sortSavedCardsBySavedAtDesc),
    learning: cards
      .filter(
        (card) =>
          Boolean(card.reviewState) &&
          card.reviewState?.mastery !== "Mastered" &&
          !weakSlugs.has(card.slug) &&
          !newSavedSlugs.has(card.slug) &&
          !masteredSlugs.has(card.slug)
      )
      .sort(sortReviewedCards),
    mastered: cards
      .filter((card) => masteredSlugs.has(card.slug))
      .sort(sortReviewedCards),
    all: [...cards].sort(sortSavedCardsBySavedAtDesc)
  } satisfies Record<SavedLibraryTabId, SavedLibraryCard[]>;
}

function readSavedLibrarySnapshot(): SavedLibrarySnapshot {
  const now = new Date();
  const savedWordsStore = readSavedWords();
  const reviewStateStore = readReviewState();
  const reviewEvents = readReviewEvents();
  const dailyStats = readDailyStats();
  const savedWords = getSavedWords(savedWordsStore);
  const reviewState = getReviewStateMap(reviewStateStore);
  const normalizedSavedWordsStore = toSavedWordsStore(savedWords);
  const normalizedReviewStateStore = toReviewStateStore(reviewState);
  const cards = savedWords.map((savedWord) => {
    const rawStateExists = Object.prototype.hasOwnProperty.call(
      reviewStateStore,
      savedWord.slug
    );
    const state = reviewState.get(savedWord.slug);
    const stateStatus: ReviewStateStatus = state
      ? "valid"
      : rawStateExists
        ? "stale"
        : "missing";

    return toSavedLibraryCard(savedWord, state, stateStatus, now);
  });

  return {
    tabs: buildTabs(
      cards,
      normalizedSavedWordsStore,
      normalizedReviewStateStore,
      now
    ),
    reviewEventCount: reviewEvents.length,
    reviewedCount: getDailyReviewedTotal(dailyStats),
    hasLocalReviewState: Object.keys(reviewStateStore).length > 0,
    hasLocalSavedWord: savedWords.length > 0
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

function formatSourceLabel(source?: string) {
  if (!source) {
    return undefined;
  }

  const labels: Record<string, string> = {
    alias_search: "Alias search",
    extension: "Extension",
    exam_pack: "Pack",
    hub_page: "Pack",
    pack: "Pack",
    word_page: "Word page"
  };
  const normalized = source.trim().toLowerCase();

  if (labels[normalized]) {
    return labels[normalized];
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getReviewHref(card: SavedLibraryCard) {
  if (card.isDue) {
    return "/review/due";
  }

  if (card.isWeak) {
    return "/review/weak";
  }

  return "/review";
}

function getReviewAriaLabel(card: SavedLibraryCard) {
  return `Review ${card.word}`;
}

function getViewWordAriaLabel(card: SavedLibraryCard) {
  return `View word ${card.word}`;
}

function getWordHref(card: SavedLibraryCard) {
  return `/word/${encodeURIComponent(card.slug)}`;
}

function SavedQueueVisual({ word }: { word: SavedLibraryCard }) {
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
        <WordVisualImage sizes="64px" src={visualImage} />
      ) : (
        !externalImage ? (
          <span aria-hidden="true">{word.word.slice(0, 1).toUpperCase()}</span>
        ) : null
      )}
    </div>
  );
}

function MasteryPill({ label, tone }: { label: MasteryDisplay; tone: MemoryTone }) {
  return (
    <span className={`saved-v2-memory-pill saved-v2-memory-pill--${tone}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

function CardMeta({ word }: { word: SavedLibraryCard }) {
  const state = word.reviewState;
  const savedDate = formatShortDate(word.savedAt);
  const dueDate = formatShortDate(state?.nextDueAt);
  const sourceLabel = formatSourceLabel(word.source);
  const sourceSuffix =
    sourceLabel && sourceLabel !== "Word page" ? ` · ${sourceLabel}` : "";
  const reviewCountLabel =
    word.reviewCount === 1
      ? "1 review"
      : `${word.reviewCount.toLocaleString()} reviews`;

  return (
    <div className="saved-v2-token-row" aria-label={`${word.word} memory details`}>
      <span className="saved-v2-token">{formatHubLabel(word.hub)}</span>
      {state ? (
        <span className="saved-v2-token">
          {word.isDue
            ? "Ready to review"
            : dueDate
              ? `Next review ${dueDate}`
              : "Review when you're ready"}
        </span>
      ) : word.reviewStateStatus === "stale" ? (
        <span className="saved-v2-token saved-v2-token--warning">
          Review history needs refresh
        </span>
      ) : (
        <span className="saved-v2-token">Ready for first review</span>
      )}
      <span className="saved-v2-token">
        {state
          ? `${reviewCountLabel}${sourceSuffix}`
          : savedDate
            ? `Saved ${savedDate}${sourceSuffix}`
            : sourceLabel ?? "Saved word"}
      </span>
    </div>
  );
}

function SavedWordCard({ word }: { word: SavedLibraryCard }) {
  const reviewHref = getReviewHref(word);
  const wordHref = getWordHref(word);

  return (
    <article className="saved-v2-word-card" data-saved-word={word.slug}>
      <SavedQueueVisual word={word} />
      <div className="saved-v2-word-card__body">
        <div className="saved-v2-word-card__topline">
          <h3>{word.word}</h3>
          <MasteryPill label={word.masteryLabel} tone={word.memoryTone} />
        </div>
        {word.definition ? (
          <p className="saved-v2-word-card__definition">{word.definition}</p>
        ) : (
          <p className="saved-v2-word-card__definition">
            No definition saved for this word.
          </p>
        )}
        <CardMeta word={word} />
      </div>
      <div className="saved-v2-word-card__actions">
        <Link
          aria-label={getReviewAriaLabel(word)}
          className="track-b-button track-b-button--primary saved-v2-word-card__review"
          href={reviewHref}
          prefetch={false}
        >
          <span>Review now</span>
          <ChevronRightIcon size={15} />
        </Link>
        <Link
          aria-label={getViewWordAriaLabel(word)}
          className="track-b-button track-b-button--quiet saved-v2-word-card__review"
          href={wordHref}
          prefetch={false}
        >
          <span>View word</span>
        </Link>
      </div>
    </article>
  );
}

function SavedQueueStatCard({
  count,
  label,
  note,
  state
}: {
  count: number;
  label: string;
  note: string;
  state: "due" | "weak" | "new" | "learning" | "mastered" | "all";
}) {
  return (
    <article className={`saved-v2-state-card saved-v2-state-card--${state}`}>
      <strong>{count.toLocaleString()}</strong>
      <span>{label}</span>
      <p>{note}</p>
    </article>
  );
}

function getPrimaryAction(snapshot: SavedLibrarySnapshot) {
  const dueCount = snapshot.tabs.due.length;
  const weakCount = snapshot.tabs.weak.length;
  const newCount = snapshot.tabs.new.length;

  if (dueCount > 0) {
    return {
      href: "/review/due",
      label: "Start due review"
    };
  }

  if (weakCount > 0) {
    return {
      href: "/review/weak",
      label: "Practice weak words"
    };
  }

  if (newCount > 0) {
    return {
      href: "/review",
      label: "Review new saved words"
    };
  }

  return {
    href: "/packs",
    label: "Find words to save"
  };
}

function PrimarySavedAction({ snapshot }: { snapshot: SavedLibrarySnapshot }) {
  const action = getPrimaryAction(snapshot);

  return (
    <div className="saved-v2-bulk-actions" aria-label="Saved library primary action">
      <Link
        aria-label={action.label}
        className="track-b-button track-b-button--primary"
        href={action.href}
        prefetch={false}
      >
        <span>{action.label}</span>
        <ArrowRightIcon size={15} />
      </Link>
    </div>
  );
}

function SavedLibraryLoading() {
  return (
    <TrackBAppShell activeItemId="saved" currentPath="/saved">
      <div className="saved-v2-queue">
        <TrackBEmptyState
          body="Getting your saved words ready."
          title="Loading memory queue"
        />
      </div>
    </TrackBAppShell>
  );
}

function getTabPanelId(tabId: SavedLibraryTabId) {
  return `saved-v2-panel-${tabId}`;
}

function getTabButtonId(tabId: SavedLibraryTabId) {
  return `saved-v2-tab-${tabId}`;
}

export function SavedLibraryView() {
  const [snapshot, setSnapshot] = useState<SavedLibrarySnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<SavedLibraryTabId>("due");
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const nextSnapshot = readSavedLibrarySnapshot();

    setSnapshot(nextSnapshot);
    emitVlxEvent(VLX_ANALYTICS_EVENTS.savedLibraryView, {
      source: "saved_library",
      savedCount: nextSnapshot.tabs.all.length,
      dueCount: nextSnapshot.tabs.due.length,
      weakCount: nextSnapshot.tabs.weak.length,
      reviewedCount: nextSnapshot.reviewedCount,
      reviewEventCount: nextSnapshot.reviewEventCount,
      queueSize: nextSnapshot.tabs.all.length,
      hasLocalReviewState: nextSnapshot.hasLocalReviewState,
      hasLocalSavedWord: nextSnapshot.hasLocalSavedWord
    });
  }, []);

  const activeTabConfig = useMemo(
    () => savedLibraryTabs.find((tab) => tab.id === activeTab) ?? savedLibraryTabs[0],
    [activeTab]
  );
  const activeWords = snapshot?.tabs[activeTab] ?? [];
  const activeTabIndex = tabIndexById.get(activeTab) ?? 0;

  const focusTab = useCallback((index: number) => {
    tabButtonRefs.current[index]?.focus();
  }, []);

  const selectTabByIndex = useCallback(
    (index: number) => {
      const nextTab = savedLibraryTabs[index];

      if (!nextTab) {
        return;
      }

      setActiveTab(nextTab.id);
      window.requestAnimationFrame(() => focusTab(index));
    },
    [focusTab]
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        selectTabByIndex((activeTabIndex + 1) % savedLibraryTabs.length);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectTabByIndex(
          (activeTabIndex - 1 + savedLibraryTabs.length) %
            savedLibraryTabs.length
        );
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        selectTabByIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        selectTabByIndex(savedLibraryTabs.length - 1);
      }
    },
    [activeTabIndex, selectTabByIndex]
  );

  if (!snapshot) {
    return <SavedLibraryLoading />;
  }

  return (
    <TrackBAppShell activeItemId="saved" currentPath="/saved">
      <div className="saved-v2-queue">
        <header className="saved-v2-queue-hero">
          <div className="saved-v2-queue-hero__copy">
            <p className="track-b-eyebrow">Memory Queue</p>
            <h1>Saved Library</h1>
            <p>Saved words become review cards.</p>
          </div>
          <PrimarySavedAction snapshot={snapshot} />
        </header>

        <section
          aria-label="Saved memory queue counts"
          className="saved-v2-status-grid"
        >
          <SavedQueueStatCard
            count={snapshot.tabs.due.length}
            label="Due"
            note="ready to review"
            state="due"
          />
          <SavedQueueStatCard
            count={snapshot.tabs.weak.length}
            label="Weak"
            note="mistake evidence"
            state="weak"
          />
          <SavedQueueStatCard
            count={snapshot.tabs.new.length}
            label="New"
            note="not reviewed yet"
            state="new"
          />
        </section>

        <section className="saved-v2-panel" aria-labelledby="saved-v2-tabs-heading">
          <div className="saved-v2-panel__header">
            <h2 id="saved-v2-tabs-heading">Memory queues</h2>
            <span>{snapshot.tabs.all.length.toLocaleString()} saved</span>
          </div>
          <div
            aria-label="Saved library filters"
            className="saved-v2-tabs"
            role="tablist"
          >
            {savedLibraryTabs.map((tab, index) => (
              <button
                aria-controls={getTabPanelId(tab.id)}
                aria-selected={activeTab === tab.id}
                className="saved-v2-tab"
                id={getTabButtonId(tab.id)}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={handleTabKeyDown}
                ref={(button) => {
                  tabButtonRefs.current[index] = button;
                }}
                role="tab"
                tabIndex={activeTab === tab.id ? 0 : -1}
                type="button"
              >
                <span className="saved-v2-tab__label">{tab.label}</span>
                <span className="saved-v2-tab__count">
                  {snapshot.tabs[tab.id].length.toLocaleString()}
                </span>
                <span className="saved-v2-tab__description">
                  {tab.description}
                </span>
              </button>
            ))}
          </div>

          <div
            aria-labelledby={getTabButtonId(activeTab)}
            className="saved-v2-tab-panel"
            id={getTabPanelId(activeTab)}
            role="tabpanel"
            tabIndex={0}
          >
            {activeWords.length > 0 ? (
              <div className="saved-v2-word-list" role="list">
                {activeWords.map((word) => (
                  <div key={word.slug} role="listitem">
                    <SavedWordCard word={word} />
                  </div>
                ))}
              </div>
            ) : (
              <TrackBEmptyState
                body={activeTabConfig.emptyBody}
                headingLevel={3}
                title={activeTabConfig.emptyTitle}
              />
            )}
          </div>
        </section>
      </div>
    </TrackBAppShell>
  );
}
