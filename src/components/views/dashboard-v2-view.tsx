"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MultilingualAliasSearch } from "@/components/multilingual-alias-search";
import {
  TrackBAppShell,
  TrackBEmptyState,
  TrackBMetricCard,
  TrackBPageHeader,
  TrackBPrimaryActionCard,
  TrackBStatusBadge,
  TrackBUpgradeNudge,
  type TrackBStatusTone
} from "@/components/track-b";
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
  getReviewedToday,
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
  VlxMasteryLabel,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

export type DashboardV2PackPreview = {
  packId: string;
  title: string;
  description: string;
  kind: "exam" | "learning";
  status: "available" | "empty" | "placeholder";
  reviewHref: string;
  wordCount?: number;
  previewCount?: number;
  targetLabel?: string;
  levelLabel?: string;
  difficultyLabel?: string;
};

type DashboardV2Snapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  dueToday: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  learning: VlxReviewStateItem[];
  mastered: VlxReviewStateItem[];
  savedLibrary: VlxSavedWord[];
  reviewedToday: number;
  weeklyReviewedWords: number;
  visiblePackProgress: VlxPackProgressItem[];
  hasAnyLocalData: boolean;
};

type DashboardV2Word = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  mastery?: VlxMasteryLabel;
  box?: number;
  weakScore?: number;
  detail?: string;
  secondaryDetail?: string;
};

type ActionLink = {
  href: string;
  label: string;
  ariaLabel?: string;
};

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function sortByRecentPackActivity(
  first: VlxPackProgressItem,
  second: VlxPackProgressItem
) {
  return getPackActivityTime(second) - getPackActivityTime(first);
}

function getPackActivityTime(progress: VlxPackProgressItem) {
  const dateValue =
    progress.lastReviewedAt ??
    progress.previewCompletedAt ??
    progress.lastOpenedAt ??
    progress.previewStartedAt ??
    progress.startedAt;

  if (!dateValue) {
    return 0;
  }

  const parsed = Date.parse(dateValue);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getVisiblePackProgress(progressStore: VlxPackProgressStore) {
  return Object.values(progressStore)
    .filter(hasVisiblePackProgress)
    .sort(sortByRecentPackActivity);
}

function readDashboardV2Snapshot(): DashboardV2Snapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const dailyStats = readDailyStats();
  const visiblePackProgress = getVisiblePackProgress(readPackProgressStore());

  return {
    savedWords,
    reviewState,
    dueToday: getDueToday(reviewState, now),
    weakWords: getWeakWords(reviewState),
    newSaved: getNewSaved(savedWords, reviewState),
    learning: Object.values(reviewState).filter(
      (item) => item.mastery === "Learning"
    ),
    mastered: getMastered(reviewState),
    savedLibrary: getSavedLibrary(savedWords),
    reviewedToday: getReviewedToday(dailyStats, now),
    weeklyReviewedWords: getWeeklyReviewedWords(reviewEvents, now),
    visiblePackProgress,
    hasAnyLocalData:
      hasKeys(savedWords) ||
      hasKeys(reviewState) ||
      reviewEvents.length > 0 ||
      hasKeys(dailyStats) ||
      visiblePackProgress.length > 0
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

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function formatPackStatus(status: DashboardV2PackPreview["status"]) {
  if (status === "available") {
    return "Preview ready";
  }

  if (status === "empty") {
    return "No words yet";
  }

  return "Data pending";
}

function getMasteryTone(mastery?: VlxMasteryLabel): TrackBStatusTone {
  if (mastery === "Weak") {
    return "weak";
  }

  if (mastery === "Learning") {
    return "learning";
  }

  if (mastery === "Strong") {
    return "strong";
  }

  if (mastery === "Mastered") {
    return "mastered";
  }

  return "new";
}

function getStateWordDetail(item: VlxReviewStateItem) {
  const dueDate = formatShortDate(item.nextDueAt);

  if (!item.nextDueAt) {
    return "Due now";
  }

  return dueDate ? `Due ${dueDate}` : "Due date unavailable";
}

function fromStateItem(item: VlxReviewStateItem): DashboardV2Word {
  return {
    slug: item.slug,
    word: item.word,
    definition: item.definition,
    image: item.image,
    hub: item.hub,
    mastery: item.mastery,
    box: item.box,
    weakScore: item.weakScore,
    detail: getStateWordDetail(item),
    secondaryDetail:
      item.wrong > 0
        ? `${formatCount(item.wrong, "miss", "misses")}`
        : undefined
  };
}

function fromSavedWord(
  savedWord: VlxSavedWord,
  reviewState?: VlxReviewStateItem
): DashboardV2Word {
  const savedDate = formatShortDate(savedWord.savedAt);

  if (reviewState) {
    return {
      ...fromStateItem(reviewState),
      detail: savedDate ? `Saved ${savedDate}` : "Saved"
    };
  }

  return {
    slug: savedWord.slug,
    word: savedWord.word,
    definition: savedWord.definition,
    image: savedWord.image,
    hub: savedWord.hub,
    detail: savedDate ? `Saved ${savedDate}` : "Saved",
    secondaryDetail: "No review state yet"
  };
}

function getMissionSecondaryAction(
  snapshot: DashboardV2Snapshot
): ActionLink | undefined {
  if (snapshot.weakWords.length > 0) {
    return {
      href: "/review/weak",
      label: "Review weak words",
      ariaLabel: "Review weak words from real local memory state"
    };
  }

  if (snapshot.dueToday.length === 0 && snapshot.newSaved.length > 0) {
    return {
      href: "/review?mode=saved",
      label: "Review saved words",
      ariaLabel: "Review saved words that are ready to enter memory state"
    };
  }

  if (
    snapshot.dueToday.length === 0 &&
    snapshot.weakWords.length === 0 &&
    snapshot.savedLibrary.length === 0
  ) {
    return {
      href: "/packs",
      label: "Save new words",
      ariaLabel: "Open packs to find words to save"
    };
  }

  return undefined;
}

function getMissionTitle(snapshot: DashboardV2Snapshot) {
  if (snapshot.dueToday.length > 0) {
    return "Today's Memory Mission";
  }

  return "No words are due right now";
}

function getMissionBody(snapshot: DashboardV2Snapshot) {
  if (snapshot.dueToday.length > 0) {
    return `${formatCount(
      snapshot.dueToday.length,
      "word"
    )} should be reviewed before browsing packs or saved words.`;
  }

  if (!snapshot.hasAnyLocalData) {
    return "No local memory state exists yet. Start with a due review check or save a word from a pack to create the first review item. The dashboard is not inventing extra review work.";
  }

  return "Your scheduled due queue is clear. The dashboard is not inventing extra review work, so use weak repair or add new words when it helps the learning loop.";
}

function MiniDueQueue({ words }: { words: DashboardV2Word[] }) {
  if (!words.length) {
    return (
      <p className="dashboard-v2-note">
        No due words were found in vlx_review_state_v1.
      </p>
    );
  }

  return (
    <ul className="dashboard-v2-mini-list" aria-label="Due words preview">
      {words.map((word) => (
        <li className="dashboard-v2-mini-list__item" key={word.slug}>
          <span>
            <strong>{word.word}</strong>
            {word.detail ? <span>{word.detail}</span> : null}
          </span>
          <Link
            aria-label={`Open ${word.word}`}
            className="dashboard-v2-inline-link"
            href={`/word/${word.slug}`}
          >
            Open
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TodayMissionCard({ snapshot }: { snapshot: DashboardV2Snapshot }) {
  const dueWords = snapshot.dueToday.slice(0, 3).map(fromStateItem);

  return (
    <TrackBPrimaryActionCard
      action={{
        href: "/review/due",
        label: "Start due review",
        ariaLabel: "Start due review from the dashboard"
      }}
      body={getMissionBody(snapshot)}
      className="dashboard-v2-mission"
      eyebrow="Memory mission"
      metric={{
        label: "due today",
        value: snapshot.dueToday.length
      }}
      secondaryAction={getMissionSecondaryAction(snapshot)}
      status="due"
      title={getMissionTitle(snapshot)}
    >
      <MiniDueQueue words={dueWords} />
    </TrackBPrimaryActionCard>
  );
}

function MemoryStatusRow({ snapshot }: { snapshot: DashboardV2Snapshot }) {
  return (
    <section
      aria-labelledby="dashboard-v2-status-heading"
      className="dashboard-v2-section"
      id="progress"
    >
      <div className="dashboard-v2-section__header">
        <div>
          <p className="track-b-eyebrow">Memory state</p>
          <h2
            className="dashboard-v2-section__title"
            id="dashboard-v2-status-heading"
          >
            Status from real review state
          </h2>
        </div>
        <p className="dashboard-v2-section__description">
          Due, Weak, New, Learning, and Mastered are read from local SRS state
          and review events.
        </p>
      </div>
      <div className="dashboard-v2-status-grid">
        <TrackBMetricCard
          description="Scheduled by nextDueAt through today."
          label="Due"
          tone="due"
          value={snapshot.dueToday.length}
        />
        <TrackBMetricCard
          description="Mistakes, Weak mastery, or high weakScore."
          label="Weak"
          tone="weak"
          value={snapshot.weakWords.length}
        />
        <TrackBMetricCard
          description="Saved words before a first review."
          label="New"
          tone="new"
          value={snapshot.newSaved.length}
        />
        <TrackBMetricCard
          description="Reviewed words still building recall."
          label="Learning"
          tone="learning"
          value={snapshot.learning.length}
        />
        <TrackBMetricCard
          description="Only box 5 with Mastered state."
          label="Mastered"
          tone="mastered"
          value={snapshot.mastered.length}
        />
      </div>
    </section>
  );
}

function WordImage({ word }: { word: DashboardV2Word }) {
  const style = word.image
    ? {
        backgroundImage: `url("${word.image}")`
      }
    : undefined;

  return (
    <div
      aria-label={`Visual cue for ${word.word}`}
      className="dashboard-v2-word-card__image"
      role="img"
      style={style}
    >
      {!word.image ? <span aria-hidden="true">{word.word.slice(0, 1)}</span> : null}
    </div>
  );
}

function WordCard({ word }: { word: DashboardV2Word }) {
  const weakDetail =
    typeof word.weakScore === "number"
      ? `Weak ${Math.round(word.weakScore * 100)}%`
      : undefined;

  return (
    <article className="dashboard-v2-word-card">
      <WordImage word={word} />
      <div className="dashboard-v2-word-card__body">
        <div className="dashboard-v2-word-card__topline">
          <h3>{word.word}</h3>
          {word.mastery ? (
            <TrackBStatusBadge
              detail={typeof word.box === "number" ? `Box ${word.box}` : undefined}
              status={getMasteryTone(word.mastery)}
            />
          ) : null}
        </div>
        {word.definition ? <p>{word.definition}</p> : null}
        <div className="dashboard-v2-token-row">
          {word.hub ? (
            <span className="dashboard-v2-token">{formatHubLabel(word.hub)}</span>
          ) : null}
          {weakDetail ? (
            <span className="dashboard-v2-token">{weakDetail}</span>
          ) : null}
          {word.detail ? (
            <span className="dashboard-v2-token">{word.detail}</span>
          ) : null}
          {word.secondaryDetail ? (
            <span className="dashboard-v2-token">{word.secondaryDetail}</span>
          ) : null}
        </div>
        <Link
          className="track-b-button track-b-button--quiet"
          href={`/word/${word.slug}`}
        >
          Word detail
        </Link>
      </div>
    </article>
  );
}

function WordCardList({
  ariaLabel,
  words
}: {
  ariaLabel: string;
  words: DashboardV2Word[];
}) {
  return (
    <div aria-label={ariaLabel} className="dashboard-v2-word-grid" role="list">
      {words.map((word) => (
        <div key={word.slug} role="listitem">
          <WordCard word={word} />
        </div>
      ))}
    </div>
  );
}

function getPackProgressLabel(progress: VlxPackProgressItem) {
  if (progress.reviewedCount > 0) {
    return `${formatCount(progress.reviewedCount, "word")} reviewed locally`;
  }

  if (progress.previewCompletedAt) {
    return "Preview completed locally";
  }

  return "Preview started locally";
}

function getPackProgressDetail(progress: VlxPackProgressItem) {
  if (progress.reviewedCount > 0) {
    return `${formatCount(progress.correctCount, "correct answer")} recorded`;
  }

  const activeDate = formatShortDate(
    progress.lastOpenedAt ?? progress.previewStartedAt ?? progress.startedAt
  );

  return activeDate ? `Last opened ${activeDate}` : "Ready to continue";
}

function ContinueActivePack({
  pack,
  progress
}: {
  pack?: DashboardV2PackPreview;
  progress: VlxPackProgressItem;
}) {
  const packTitle = pack?.title ?? progress.packId;
  const continueHref = pack?.reviewHref ?? `/packs/${progress.packId}`;

  return (
    <article className="dashboard-v2-continue-panel">
      <div className="dashboard-v2-continue-panel__copy">
        <p className="track-b-eyebrow">Continue active pack</p>
        <h3>{packTitle}</h3>
        <p>{pack?.description ?? "Local pack progress exists for this pack."}</p>
        <div className="dashboard-v2-token-row">
          <span className="dashboard-v2-token">
            {getPackProgressLabel(progress)}
          </span>
          <span className="dashboard-v2-token">
            {getPackProgressDetail(progress)}
          </span>
          {pack?.targetLabel ? (
            <span className="dashboard-v2-token">{pack.targetLabel}</span>
          ) : null}
        </div>
      </div>
      <div className="track-b-action-row">
        <Link className="track-b-button track-b-button--primary" href={continueHref}>
          Continue pack
        </Link>
        <Link
          className="track-b-button track-b-button--quiet"
          href={`/packs/${progress.packId}`}
        >
          View pack
        </Link>
      </div>
    </article>
  );
}

function PackPreviewCard({ pack }: { pack: DashboardV2PackPreview }) {
  return (
    <article className="dashboard-v2-pack-card">
      <div className="dashboard-v2-pack-card__topline">
        <span className="track-b-eyebrow">
          {pack.kind === "exam" ? "Exam preview" : "Learning deck"}
        </span>
        <span className="dashboard-v2-token">{formatPackStatus(pack.status)}</span>
      </div>
      <h3>{pack.title}</h3>
      <p>{pack.description}</p>
      <div className="dashboard-v2-token-row">
        {typeof pack.wordCount === "number" ? (
          <span className="dashboard-v2-token">
            {formatCount(pack.wordCount, "word")}
          </span>
        ) : (
          <span className="dashboard-v2-token">Word count pending</span>
        )}
        {typeof pack.previewCount === "number" ? (
          <span className="dashboard-v2-token">
            {formatCount(pack.previewCount, "preview word")}
          </span>
        ) : null}
        {pack.targetLabel ? (
          <span className="dashboard-v2-token">{pack.targetLabel}</span>
        ) : null}
      </div>
      <div className="track-b-action-row">
        {pack.status === "available" ? (
          <Link
            className="track-b-button track-b-button--primary"
            href={pack.reviewHref}
          >
            Start preview
          </Link>
        ) : null}
        <Link
          className="track-b-button track-b-button--quiet"
          href={`/packs/${pack.packId}`}
        >
          View pack
        </Link>
      </div>
    </article>
  );
}

function ContinueSection({
  packs,
  snapshot
}: {
  packs: DashboardV2PackPreview[];
  snapshot: DashboardV2Snapshot;
}) {
  const packById = useMemo(
    () => new Map(packs.map((pack) => [pack.packId, pack])),
    [packs]
  );
  const activePackProgress = snapshot.visiblePackProgress[0];
  const previewPacks = packs
    .filter((pack) => pack.status === "available")
    .slice(0, 3);
  const fallbackPacks = previewPacks.length ? previewPacks : packs.slice(0, 3);

  return (
    <section
      aria-labelledby="dashboard-v2-continue-heading"
      className="dashboard-v2-section"
    >
      <div className="dashboard-v2-section__header">
        <div>
          <p className="track-b-eyebrow">Continue</p>
          <h2
            className="dashboard-v2-section__title"
            id="dashboard-v2-continue-heading"
          >
            Keep the learning loop moving
          </h2>
        </div>
        <p className="dashboard-v2-section__description">
          Pack progress appears only when local pack activity exists.
        </p>
      </div>
      {activePackProgress ? (
        <ContinueActivePack
          pack={packById.get(activePackProgress.packId)}
          progress={activePackProgress}
        />
      ) : fallbackPacks.length ? (
        <div className="dashboard-v2-pack-grid">
          {fallbackPacks.map((pack) => (
            <PackPreviewCard key={pack.packId} pack={pack} />
          ))}
        </div>
      ) : (
        <TrackBEmptyState
          action={{ href: "/packs", label: "Open packs" }}
          body="No pack previews are available from the current pack reader data."
          title="No pack previews ready"
        />
      )}
    </section>
  );
}

function WeakSpotlight({ snapshot }: { snapshot: DashboardV2Snapshot }) {
  const weakWords = snapshot.weakWords.slice(0, 3).map(fromStateItem);

  return (
    <section
      aria-labelledby="dashboard-v2-weak-heading"
      className="dashboard-v2-section"
    >
      <div className="dashboard-v2-section__header">
        <div>
          <p className="track-b-eyebrow">Weak spotlight</p>
          <h2
            className="dashboard-v2-section__title"
            id="dashboard-v2-weak-heading"
          >
            Repair fragile recall
          </h2>
        </div>
        {snapshot.weakWords.length > 0 ? (
          <div className="track-b-action-row">
            <Link className="track-b-button track-b-button--primary" href="/review/weak">
              Review weak words
            </Link>
            <Link
              className="track-b-button track-b-button--quiet"
              href="/review/weak-sprint"
            >
              Start Weak Sprint
            </Link>
          </div>
        ) : null}
      </div>
      {weakWords.length ? (
        <WordCardList ariaLabel="Weak words from review state" words={weakWords} />
      ) : (
        <TrackBEmptyState
          action={{ href: "/review/due", label: "Check due review" }}
          body="Weak words appear after missed recall, repeated mistakes, Weak mastery, or a high weakScore. Nothing is shown here until that evidence exists."
          title="No weak words yet"
        />
      )}
    </section>
  );
}

function RecentlySaved({ snapshot }: { snapshot: DashboardV2Snapshot }) {
  const savedWords = snapshot.savedLibrary
    .slice(0, 4)
    .map((word) => fromSavedWord(word, snapshot.reviewState[word.slug]));

  return (
    <section
      aria-labelledby="dashboard-v2-saved-heading"
      className="dashboard-v2-section"
    >
      <div className="dashboard-v2-section__header">
        <div>
          <p className="track-b-eyebrow">Recently saved</p>
          <h2
            className="dashboard-v2-section__title"
            id="dashboard-v2-saved-heading"
          >
            Words waiting for review
          </h2>
        </div>
        <Link className="track-b-button track-b-button--quiet" href="/saved">
          View saved library
        </Link>
      </div>
      {savedWords.length ? (
        <WordCardList ariaLabel="Recently saved words" words={savedWords} />
      ) : (
        <TrackBEmptyState
          action={{ href: "/packs", label: "Save your first word" }}
          body="Saved words appear here only after this browser has local saved-word state."
          secondaryAction={{ href: "/saved", label: "Open saved library" }}
          title="Save your first word"
        />
      )}
    </section>
  );
}

function DashboardLoading() {
  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <TrackBPageHeader
        description="Reading local saved words, review state, review events, and pack progress."
        eyebrow="Today"
        title="Today"
      />
      <TrackBEmptyState
        body="The dashboard uses browser-local learning state and does not write to it."
        className="dashboard-v2-loading"
        title="Loading today's memory mission"
      />
    </TrackBAppShell>
  );
}

export function DashboardV2View({
  packs
}: {
  packs: DashboardV2PackPreview[];
}) {
  const [snapshot, setSnapshot] = useState<DashboardV2Snapshot | null>(null);

  useEffect(() => {
    setSnapshot(readDashboardV2Snapshot());
  }, []);

  if (!snapshot) {
    return <DashboardLoading />;
  }

  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <TrackBPageHeader
        description="Review what is due first, then repair weak words or continue a pack. The dashboard stays anchored to real local memory state."
        eyebrow="Today"
        meta={
          <span>
            Weekly Reviewed Words: {snapshot.weeklyReviewedWords} | Reviewed today:{" "}
            {snapshot.reviewedToday}
          </span>
        }
        title="Today"
      />
      <TodayMissionCard snapshot={snapshot} />
      <MemoryStatusRow snapshot={snapshot} />
      <ContinueSection packs={packs} snapshot={snapshot} />
      <MultilingualAliasSearch />
      <WeakSpotlight snapshot={snapshot} />
      <RecentlySaved snapshot={snapshot} />
      <TrackBUpgradeNudge
        action={{
          href: "/pricing",
          label: "View pricing"
        }}
        badgeLabel="Beta"
        body="This is a visual-only upgrade note. It links to the existing pricing page and does not grant paid access from the dashboard."
        title="Want a larger review habit later?"
      />
    </TrackBAppShell>
  );
}
