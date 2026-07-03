"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  ErrorState,
  LoadingState,
  TrackBAppShell,
  TrackBEmptyState,
  TrackBUpgradeNudge
} from "@/components/track-b";
import { ArrowRightIcon, BookOpenIcon, LayersIcon } from "@/components/track-b/icons";
import { WordVisualImage } from "@/components/word-visual-image";
import {
  getMockQuizWordBySlug,
  mockExamPacks,
  mockQuizPacks
} from "@/lib/packs/mock-data";
import type { VlxPackProgress } from "@/lib/packs/progress";
import {
  readDashboardV2BrowserReadModel,
  type DashboardV2ReadIssue,
  type DashboardV2ReadModel
} from "@/lib/dashboard-v2/read-model";
import type {
  VlxMasteryLabel,
  VlxReviewStateItem,
  VlxSavedWord
} from "@/lib/srs/types";
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

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

type DashboardSavedWord = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  detail: string;
};

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

function getQueueSize(snapshot: DashboardV2ReadModel) {
  const queuedSlugs = new Set([
    ...Object.keys(snapshot.savedWords),
    ...Object.keys(snapshot.reviewState)
  ]);

  return queuedSlugs.size;
}

function getQueueSummary(snapshot: DashboardV2ReadModel, previewCount: number) {
  const queueSize = getQueueSize(snapshot);
  const remainder = Math.max(0, queueSize - previewCount);

  if (remainder > 0) {
    return `+ ${formatCount(remainder, "more word")} in your queue`;
  }

  if (queueSize > 0) {
    return "All local queue words are shown here";
  }

  return "No local review queue yet";
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

function getMissionTitle(snapshot: DashboardV2ReadModel) {
  if (snapshot.dueWords.length > 0) {
    return {
      primary: `Review ${formatCount(snapshot.dueWords.length, "word")}`,
      secondary: "before they fade."
    };
  }

  if (!snapshot.hasAnyLocalData) {
    return {
      primary: "Build your first",
      secondary: "memory loop."
    };
  }

  return {
    primary: "Your due queue",
    secondary: "is clear."
  };
}

function getMissionBody(snapshot: DashboardV2ReadModel) {
  if (snapshot.dueWords.length > 0) {
    return `${formatCount(
      snapshot.dueWords.length,
      "word"
    )} should be reviewed now based on nextDueAt. Every answer writes a review event and updates memory state.`;
  }

  if (!snapshot.hasAnyLocalData) {
    return "Save one word to create the first local review item. The next mission will come from real review state.";
  }

  return "Your due queue is clear from local SRS state. Save a word or open the queue when you are ready for the next review item.";
}

function DashboardWordVisual({
  className,
  image,
  sizes,
  slug,
  word
}: {
  className: string;
  image?: string;
  sizes: string;
  slug: string;
  word: string;
}) {
  const visualImage = getWordVisualImage(slug);
  const externalImage = visualImage ? undefined : image;
  const visualClass = visualImage
    ? " word-card__visual--image"
    : externalImage
      ? " word-card__visual--image"
      : getWordVisualFallbackClass(slug);
  const style: CSSProperties | undefined = externalImage
    ? { backgroundImage: `url("${externalImage}")` }
    : undefined;

  return (
    <div
      aria-label={`Visual cue for ${word}`}
      className={`word-card__visual ${className}${visualClass}`}
      role="img"
      style={style}
    >
      {visualImage ? (
        <WordVisualImage sizes={sizes} src={visualImage} />
      ) : (
        !externalImage ? <span aria-hidden="true">{word.slice(0, 1)}</span> : null
      )}
    </div>
  );
}

function DueWordThumbnail({ word }: { word: DashboardDueWord }) {
  return (
    <DashboardWordVisual
      className="dashboard-v2-due-row__image"
      image={word.image}
      sizes="76px"
      slug={word.slug}
      word={word.word}
    />
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

function toSavedWord(savedWord: VlxSavedWord): DashboardSavedWord {
  const savedDate = formatShortDate(savedWord.savedAt);

  return {
    slug: savedWord.slug,
    word: savedWord.word,
    definition: savedWord.definition,
    image: savedWord.image,
    hub: savedWord.hub,
    detail: savedDate ? `Saved ${savedDate}` : "Saved"
  };
}

function DashboardSavedWordCard({ word }: { word: DashboardSavedWord }) {
  return (
    <article className="dashboard-v2-word-card">
      <DashboardWordVisual
        className="dashboard-v2-word-card__image"
        image={word.image}
        sizes="112px"
        slug={word.slug}
        word={word.word}
      />
      <div className="dashboard-v2-word-card__body">
        <div className="dashboard-v2-word-card__topline">
          <strong className="dashboard-v2-word-card__title">{word.word}</strong>
        </div>
        {word.definition ? <p>{word.definition}</p> : null}
        <div className="dashboard-v2-token-row">
          <span className="dashboard-v2-token">{word.detail}</span>
          <span className="dashboard-v2-token">{formatHubLabel(word.hub)}</span>
        </div>
        <Link
          className="dashboard-v2-inline-link"
          href={`/word/${word.slug}`}
          prefetch={false}
        >
          Open word
        </Link>
      </div>
    </article>
  );
}

function DashboardRecentSavedWords({ words }: { words: DashboardSavedWord[] }) {
  if (!words.length) {
    return (
      <TrackBEmptyState
        body="Recent saved words appear here only after vlx_saved_words_v1 contains local saved-word records."
        className="dashboard-v2-empty-panel"
        headingLevel={3}
        title="No saved words yet"
      />
    );
  }

  return (
    <div className="dashboard-v2-word-grid">
      {words.map((word) => (
        <DashboardSavedWordCard key={word.slug} word={word} />
      ))}
    </div>
  );
}

function getPackTitle(packId: string) {
  const pack = [...mockQuizPacks, ...mockExamPacks].find(
    (candidate) => candidate.packId === packId
  );

  return pack?.title ?? formatHubLabel(packId);
}

function getPackProgressLabel(progress: VlxPackProgress) {
  if (progress.reviewedCount > 0) {
    return `${formatCount(progress.reviewedCount, "word")} reviewed`;
  }

  if (progress.previewCompletedAt) {
    return "Preview completed";
  }

  return "Preview started";
}

function getPackProgressDetail(progress: VlxPackProgress) {
  if (progress.reviewedCount > 0) {
    return `${progress.correctCount.toLocaleString()} correct locally`;
  }

  if (progress.previewCompletedAt) {
    return "Ready for the next review pass";
  }

  return "Ready to continue";
}

function DashboardPackProgress({ items }: { items: VlxPackProgress[] }) {
  if (!items.length) {
    return (
      <TrackBEmptyState
        body="No started, previewed, or reviewed pack progress was found in vlx_pack_progress_v1."
        className="dashboard-v2-empty-panel"
        headingLevel={3}
        title="No active pack progress"
      />
    );
  }

  return (
    <div className="dashboard-v2-pack-grid">
      {items.map((item) => (
        <article className="dashboard-v2-pack-card" key={item.packId}>
          <div className="dashboard-v2-pack-card__topline">
            <h3>{getPackTitle(item.packId)}</h3>
            <span className="dashboard-v2-token">{getPackProgressLabel(item)}</span>
          </div>
          <p>{getPackProgressDetail(item)}</p>
          <div className="dashboard-v2-token-row">
            <span className="dashboard-v2-token">
              {item.source.replaceAll("_", " ")}
            </span>
            {item.lastReviewedAt ? (
              <span className="dashboard-v2-token">
                Reviewed {formatShortDate(item.lastReviewedAt)}
              </span>
            ) : null}
          </div>
          <Link
            className="dashboard-v2-inline-link"
            href={`/packs/${item.packId}`}
            prefetch={false}
          >
            Continue pack
          </Link>
        </article>
      ))}
    </div>
  );
}

function DashboardReadIssues({ issues }: { issues: DashboardV2ReadIssue[] }) {
  if (!issues.length) {
    return null;
  }

  return (
    <ErrorState
      body="Malformed or stale local records were excluded from dashboard counts. The learning loop can continue with the valid local state that remains."
      className="dashboard-v2-read-issue"
      headingLevel={3}
      title="Some local dashboard data was ignored"
    />
  );
}

function DashboardUpgradeNudge({ snapshot }: { snapshot: DashboardV2ReadModel }) {
  const prompt = snapshot.upgradePrompt;

  if (!prompt) {
    return null;
  }

  return (
    <TrackBUpgradeNudge
      action={{
        href: "/pricing",
        label: prompt.primaryCtaLabel,
        ariaLabel: `${prompt.primaryCtaLabel} on pricing`
      }}
      badgeLabel={prompt.recommendedPlan.toUpperCase()}
      body={prompt.body}
      className="dashboard-v2-upgrade-nudge"
      title={prompt.title}
    />
  );
}

function DashboardLoading() {
  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <div className="dashboard-v2-home" aria-label="Loading today's memory mission">
        <LoadingState
          body="Reading local saved words, review state, and review events."
          className="dashboard-v2-loading"
          title="Loading today's memory mission"
        />
      </div>
    </TrackBAppShell>
  );
}

export function DashboardV2View() {
  const [snapshot, setSnapshot] = useState<DashboardV2ReadModel | null>(null);

  useEffect(() => {
    setSnapshot(readDashboardV2BrowserReadModel());
  }, []);

  const previewWords = useMemo(() => {
    return snapshot ? snapshot.dueWords.slice(0, 3).map(toDueWord) : [];
  }, [snapshot]);

  const recentSavedWords = useMemo(() => {
    return snapshot
      ? snapshot.recentSavedWords.slice(0, 3).map(toSavedWord)
      : [];
  }, [snapshot]);

  if (!snapshot) {
    return <DashboardLoading />;
  }

  const missionTitle = getMissionTitle(snapshot);
  const reviewHref = snapshot.dueWords.length ? "/review/due" : "/review";

  return (
    <TrackBAppShell activeItemId="today" currentPath="/dashboard">
      <div className="dashboard-v2-home">
        <DashboardReadIssues issues={snapshot.issues} />

        <section
          aria-labelledby="dashboard-v2-mission-heading"
          className="dashboard-v2-mission-card"
        >
          <div className="dashboard-v2-mission-card__copy">
            <p className="track-b-eyebrow">Today&apos;s Memory Mission</p>
            <h1 id="dashboard-v2-mission-heading">
              <span>{missionTitle.primary}</span>
              <em>{missionTitle.secondary}</em>
            </h1>
            <p>{getMissionBody(snapshot)}</p>
          </div>

          <DueWordRows words={previewWords} />

          <div className="dashboard-v2-queue-row">
            <span>{getQueueSummary(snapshot, previewWords.length)}</span>
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
            <span>{snapshot.dueWords.length ? "Start due review" : "Start review"}</span>
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
            count={snapshot.dueWords.length}
            label="Due"
            note="ready now"
            state="due"
          />
          <DashboardStateCard
            count={snapshot.weakWords.length}
            label="Weak"
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

        <section
          aria-labelledby="dashboard-v2-pack-progress-heading"
          className="dashboard-v2-section dashboard-v2-section--deferred"
        >
          <div className="dashboard-v2-section__header">
            <div>
              <p className="track-b-eyebrow">Continue</p>
              <h2
                className="dashboard-v2-section__title"
                id="dashboard-v2-pack-progress-heading"
              >
                Pack progress
              </h2>
              <p className="dashboard-v2-section__description">
                Shown only from visible local pack progress.
              </p>
            </div>
          </div>
          <DashboardPackProgress
            items={snapshot.visiblePackProgress.slice(0, 2)}
          />
        </section>

        <section
          aria-labelledby="dashboard-v2-recent-saved-heading"
          className="dashboard-v2-section dashboard-v2-section--deferred"
        >
          <div className="dashboard-v2-section__header">
            <div>
              <p className="track-b-eyebrow">Saved</p>
              <h2
                className="dashboard-v2-section__title"
                id="dashboard-v2-recent-saved-heading"
              >
                Recent saved words
              </h2>
              <p className="dashboard-v2-section__description">
                The library stays secondary to today&apos;s review mission.
              </p>
            </div>
            <Link className="dashboard-v2-inline-link" href="/saved" prefetch={false}>
              View queue
            </Link>
          </div>
          <DashboardRecentSavedWords words={recentSavedWords} />
        </section>

        <DashboardUpgradeNudge snapshot={snapshot} />

        <p className="dashboard-v2-footer-note">
          Come back tomorrow; we&apos;ll surface your next words at the right moment.
        </p>
      </div>
    </TrackBAppShell>
  );
}
