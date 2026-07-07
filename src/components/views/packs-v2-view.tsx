"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";

import {
  MemoryMissionCard,
  TrackBAppShell,
  TrackBEmptyState,
  TrackBMetricCard,
  TrackBPageHeader,
  TrackBSection,
  type MetricPillProps
} from "@/components/track-b";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  hasVisiblePackProgress,
  readPackProgressStore,
  recordPackPreviewStarted,
  type VlxPackProgressItem,
  type VlxPackProgressSource,
  type VlxPackProgressStore
} from "@/lib/packs/progress";
import type { VlxPackPreview, VlxPackPreviewStatus } from "@/lib/packs/preview";
import type { VlxQuizWord } from "@/lib/packs/types";
import {
  getDueToday,
  getMastered,
  getReviewedToday,
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
  VlxReviewEventsStore,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

const featuredPackIds = [
  "academic-vocabulary",
  "ielts-writing-vocabulary",
  "gre-visual-verbal"
] as const;

const visualCueSlugs = new Set([
  "dissonance",
  "abundance",
  "resilient",
  "laconic",
  "obfuscate",
  "lucid"
]);

const fullPackLockedCopy =
  "Longer plan access remains gated for owner-approved beta. This preview surface does not grant entitlement.";
const placeholderPackCopy =
  "Preview plan is being prepared. Private/manual beta requires owner approval. Full pack content is not live. Word count pending. Free preview pending. Progress cannot be computed until this pack has word data. Preview review is unavailable until preview words exist. Owner approval remains required before any beta launch claim.";
const weakReviewRouteNote =
  "Uses the existing weak review route; filtered pack-only weak practice is not connected yet.";

type PacksV2Snapshot = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: VlxReviewEventsStore;
  packProgressStore: VlxPackProgressStore;
  dueToday: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  mastered: VlxReviewStateItem[];
  reviewedToday: number;
  weeklyReviewedWords: number;
};

type PackLocalSummary = {
  knownSlugs: string[];
  computable: boolean;
  savedWords: VlxSavedWord[];
  stateItems: VlxReviewStateItem[];
  dueWords: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  masteredWords: VlxReviewStateItem[];
  reviewEvents: VlxReviewEventsStore;
  progress?: VlxPackProgressItem;
  hasVisibleProgress: boolean;
};

type PacksMissionSummary = {
  activePackCount: number;
  previewProgressCount: number;
  completedPreviewCount: number;
  weakWordsInsidePacks: number;
  reviewedWordsFromProgress: number;
  mostRecentActivePackId?: string;
};

type PackActionSource = Extract<
  VlxPackProgressSource,
  "packs_page" | "pack_detail"
>;

function readPacksV2Snapshot(): PacksV2Snapshot {
  const now = new Date();
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const dailyStats = readDailyStats();

  return {
    savedWords,
    reviewState,
    reviewEvents,
    packProgressStore: readPackProgressStore(),
    dueToday: getDueToday(reviewState, now),
    weakWords: getWeakWords(reviewState),
    mastered: getMastered(reviewState),
    reviewedToday: getReviewedToday(dailyStats, now),
    weeklyReviewedWords: getWeeklyReviewedWords(reviewEvents, now)
  };
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function formatOptionalCount(
  value: number | undefined,
  singular: string,
  plural = `${singular}s`
) {
  return typeof value === "number" ? formatCount(value, singular, plural) : null;
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

function getStatusLabel(status: VlxPackPreviewStatus) {
  if (status === "available") {
    return "Preview ready";
  }

  if (status === "empty") {
    return "No words yet";
  }

  return "Data pending";
}

function getKindLabel(kind: VlxPackPreview["kind"]) {
  return kind === "exam" ? "Exam learning plan" : "Learning plan";
}

function getKnownPackSlugs(pack: VlxPackPreview) {
  if (pack.wordSlugs.length) {
    return pack.wordSlugs;
  }

  return pack.previewWords.map((word) => word.slug);
}

function parseProgressTime(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getProgressSortTime(progress: VlxPackProgressItem) {
  return Math.max(
    parseProgressTime(progress.lastReviewedAt),
    parseProgressTime(progress.previewCompletedAt),
    parseProgressTime(progress.previewStartedAt),
    parseProgressTime(progress.lastOpenedAt),
    parseProgressTime(progress.startedAt)
  );
}

function getPacksMissionSummary(
  packs: VlxPackPreview[],
  snapshot: PacksV2Snapshot
): PacksMissionSummary {
  const packIds = new Set(packs.map((pack) => pack.packId));
  const knownSlugs = new Set(packs.flatMap((pack) => getKnownPackSlugs(pack)));
  const activeProgress = Object.values(snapshot.packProgressStore)
    .filter(
      (progress) =>
        packIds.has(progress.packId) && hasVisiblePackProgress(progress)
    )
    .sort(
      (first, second) =>
        getProgressSortTime(second) - getProgressSortTime(first)
    );
  const weakSlugsInsidePacks = new Set(
    snapshot.weakWords
      .filter((word) => knownSlugs.has(word.slug))
      .map((word) => word.slug)
  );
  const reviewedWordsFromProgress = activeProgress.reduce(
    (total, progress) => total + progress.reviewedCount,
    0
  );

  return {
    activePackCount: activeProgress.length,
    previewProgressCount: activeProgress.filter(
      (progress) => progress.previewStartedAt || progress.previewCompletedAt
    ).length,
    completedPreviewCount: activeProgress.filter(
      (progress) => progress.previewCompletedAt
    ).length,
    weakWordsInsidePacks: weakSlugsInsidePacks.size,
    reviewedWordsFromProgress,
    mostRecentActivePackId: activeProgress[0]?.packId
  };
}

function getMissionAction(summary: PacksMissionSummary) {
  if (summary.mostRecentActivePackId) {
    return {
      label: "Continue learning plan",
      href: `/packs/${summary.mostRecentActivePackId}`
    };
  }

  return {
    label: "Start Academic preview",
    href: "/packs/academic-vocabulary"
  };
}

function getMissionMetrics(summary: PacksMissionSummary): MetricPillProps[] {
  const metrics: MetricPillProps[] = [
    {
      label: "Active packs",
      value: summary.activePackCount,
      detail: "visible local progress"
    },
    {
      label: "Preview progress",
      value: summary.previewProgressCount,
      detail: "from vlx_pack_progress_v1"
    },
    {
      label: "Completed previews",
      value: summary.completedPreviewCount,
      detail: "from vlx_pack_progress_v1"
    }
  ];

  if (summary.weakWordsInsidePacks > 0) {
    metrics.push({
      label: "Weak inside packs",
      value: summary.weakWordsInsidePacks,
      detail: "from review state",
      tone: "weak"
    });
  }

  if (summary.reviewedWordsFromProgress > 0) {
    metrics.push({
      label: "Reviewed from pack progress",
      value: summary.reviewedWordsFromProgress,
      detail: "stored review evidence",
      tone: "learning"
    });
  }

  return metrics;
}

function getPackLocalSummary(
  pack: VlxPackPreview,
  snapshot: PacksV2Snapshot
): PackLocalSummary {
  const knownSlugs = getKnownPackSlugs(pack);
  const knownSlugSet = new Set(knownSlugs);
  const stateItems = knownSlugs
    .map((slug) => snapshot.reviewState[slug])
    .filter((item): item is VlxReviewStateItem => Boolean(item));
  const savedWords = Object.values(snapshot.savedWords).filter((word) =>
    knownSlugSet.has(word.slug)
  );
  const progress = snapshot.packProgressStore[pack.packId];

  return {
    knownSlugs,
    computable: knownSlugs.length > 0,
    savedWords,
    stateItems,
    dueWords: snapshot.dueToday.filter((word) => knownSlugSet.has(word.slug)),
    weakWords: snapshot.weakWords.filter((word) => knownSlugSet.has(word.slug)),
    masteredWords: snapshot.mastered.filter((word) =>
      knownSlugSet.has(word.slug)
    ),
    reviewEvents: snapshot.reviewEvents.filter((event) =>
      knownSlugSet.has(event.slug)
    ),
    progress,
    hasVisibleProgress: hasVisiblePackProgress(progress)
  };
}

function getProgressLabel(progress: VlxPackProgressItem) {
  if (progress.previewCompletedAt) {
    return "Preview completed";
  }

  if (progress.reviewedCount > 0) {
    return `${formatCount(progress.reviewedCount, "card")} reviewed`;
  }

  return "Preview started";
}

function getProgressDetail(progress: VlxPackProgressItem) {
  if (progress.previewCompletedAt) {
    return progress.reviewedCount > 0
      ? `${formatCount(progress.reviewedCount, "card")} reviewed; ${formatCount(
          progress.correctCount,
          "correct answer"
        )} recorded`
      : "Preview completion recorded without review counts.";
  }

  if (progress.reviewedCount > 0) {
    return `${formatCount(progress.correctCount, "correct answer")} recorded`;
  }

  const activeDate = formatShortDate(
    progress.lastOpenedAt ?? progress.previewStartedAt ?? progress.startedAt
  );

  return activeDate ? `Last opened ${activeDate}` : "Ready to continue";
}

function getPreviewAccessLabel(pack: VlxPackPreview) {
  if (pack.status !== "available") {
    return "Free preview pending";
  }

  if (pack.reviewEnabled === false) {
    return typeof pack.previewCount === "number"
      ? `Preview-only: ${formatCount(pack.previewCount, "card")}`
      : "Preview-only content";
  }

  if (pack.priceTier && pack.priceTier !== "free") {
    return typeof pack.previewCount === "number"
      ? `Free preview: ${formatCount(pack.previewCount, "card")}`
      : "Free preview available";
  }

  return typeof pack.previewCount === "number"
    ? `${formatCount(pack.previewCount, "preview card")}`
    : "Preview ready";
}

function getPlanLengthLabel(pack: VlxPackPreview) {
  return typeof pack.planDays === "number"
    ? `${pack.planDays}-day plan`
    : undefined;
}

function getPrimaryActionLabel(
  summary: PackLocalSummary,
  variant: "card" | "detail" = "card"
) {
  if (summary.hasVisibleProgress) {
    return variant === "detail" ? "Continue review" : "Continue";
  }

  return "Start preview";
}

function getVisualClass(slug: string) {
  return visualCueSlugs.has(slug) ? ` word-card__visual--${slug}` : "";
}

function getWordImageStyle(word: Pick<VlxQuizWord, "image">) {
  if (!word.image) {
    return undefined;
  }

  return {
    backgroundImage: `url("${word.image}")`
  } satisfies CSSProperties;
}

function isPremiumPack(pack: VlxPackPreview) {
  return Boolean(pack.priceTier && pack.priceTier !== "free");
}

function PacksV2TokenRow({ children }: { children: ReactNode }) {
  return <div className="packs-v2-token-row">{children}</div>;
}

function PacksV2Token({ children }: { children: ReactNode }) {
  return <span className="packs-v2-token">{children}</span>;
}

function getPackAccessCopy(pack: VlxPackPreview) {
  if (pack.status !== "available") {
    return placeholderPackCopy;
  }

  if (pack.contentSafetyNote) {
    return pack.contentSafetyNote;
  }

  if (isPremiumPack(pack)) {
    return fullPackLockedCopy;
  }

  return null;
}

function PackAccessNote({ pack }: { pack: VlxPackPreview }) {
  const copy = getPackAccessCopy(pack);

  return copy ? <p className="packs-v2-access-note">{copy}</p> : null;
}

function PackProgressFacts({
  progress,
  variant = "card"
}: {
  progress?: VlxPackProgressItem;
  variant?: "card" | "detail";
}) {
  if (!hasVisiblePackProgress(progress)) {
    return null;
  }

  const rows = [
    {
      label: "Started",
      value: formatShortDate(progress.startedAt) ?? "Not recorded"
    },
    {
      label: "Preview completed",
      value: progress.previewCompletedAt ? "Yes" : "No"
    },
    {
      label: "Reviewed count",
      value: progress.reviewedCount
    },
    {
      label: "Correct count",
      value: progress.correctCount
    }
  ];

  if (variant === "detail") {
    rows.push({
      label: "Last reviewed",
      value: formatShortDate(progress.lastReviewedAt) ?? "Not reviewed yet"
    });
  }

  return (
    <dl className={`packs-v2-progress-facts packs-v2-progress-facts--${variant}`}>
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PackProgressNote({
  pack,
  summary,
  variant = "card"
}: {
  pack: VlxPackPreview;
  summary: PackLocalSummary;
  variant?: "card" | "detail";
}) {
  if (summary.hasVisibleProgress && summary.progress) {
    return (
      <div className={`packs-v2-progress-note packs-v2-progress-note--${variant}`}>
        <span>{getProgressLabel(summary.progress)}</span>
        <small>{getProgressDetail(summary.progress)}</small>
        <PackProgressFacts progress={summary.progress} variant={variant} />
      </div>
    );
  }

  return (
    <div className={`packs-v2-progress-note packs-v2-progress-note--${variant}`}>
      <span>No local pack progress yet</span>
      <small>
        {pack.reviewEnabled === false
          ? "Progress stays empty until an approved pack-specific preview or review action exists."
          : "Progress appears after preview or review activity exists."}
      </small>
    </div>
  );
}

function PackStateStrip({ summary }: { summary: PackLocalSummary }) {
  if (!summary.computable) {
    return (
      <p className="packs-v2-state-empty">
        Progress cannot be computed until this pack has word data.
      </p>
    );
  }

  return (
    <dl className="packs-v2-state-strip" aria-label="Local pack memory state">
      <div>
        <dt>Due</dt>
        <dd>{summary.dueWords.length}</dd>
      </div>
      <div>
        <dt>Weak</dt>
        <dd>{summary.weakWords.length}</dd>
      </div>
      <div>
        <dt>Reviewed</dt>
        <dd>{summary.stateItems.filter((item) => item.correct + item.wrong > 0).length}</dd>
      </div>
      <div>
        <dt>Mastered</dt>
        <dd>{summary.masteredWords.length}</dd>
      </div>
    </dl>
  );
}

function PackPrimaryAction({
  pack,
  setSnapshot,
  source,
  summary,
  variant = "card"
}: {
  pack: VlxPackPreview;
  setSnapshot: (snapshot: PacksV2Snapshot) => void;
  source: PackActionSource;
  summary: PackLocalSummary;
  variant?: "card" | "detail";
}) {
  const label = getPrimaryActionLabel(summary, variant);

  function handleStartPack() {
    recordPackPreviewStarted(pack.packId, source);
    emitVlxEvent(VLX_ANALYTICS_EVENTS.packPreviewStart, {
      source: "pack_preview",
      mode: "hub",
      packId: pack.packId
    });
    setSnapshot(readPacksV2Snapshot());
  }

  if (pack.status !== "available") {
    return null;
  }

  if (pack.reviewEnabled === false) {
    return null;
  }

  return (
    <Link
      aria-label={`${label} ${pack.title}`}
      className="track-b-button track-b-button--primary"
      href={pack.reviewHref}
      onClick={handleStartPack}
    >
      {label}
    </Link>
  );
}

function PackCard({
  pack,
  setSnapshot,
  snapshot
}: {
  pack: VlxPackPreview;
  setSnapshot: (snapshot: PacksV2Snapshot) => void;
  snapshot: PacksV2Snapshot;
}) {
  const summary = getPackLocalSummary(pack, snapshot);
  const wordCountLabel = formatOptionalCount(pack.wordCount, "word");
  const previewCountLabel = formatOptionalCount(pack.previewCount, "preview card");
  const planLengthLabel = getPlanLengthLabel(pack);

  return (
    <article className="packs-v2-card pack-card" data-pack-id={pack.packId}>
      <div className="packs-v2-card__topline">
        <span className="track-b-eyebrow">{getKindLabel(pack.kind)}</span>
        <span
          className={`packs-v2-status packs-v2-status--${pack.status}`}
          aria-label={`Pack status: ${getStatusLabel(pack.status)}`}
        >
          {getStatusLabel(pack.status)}
        </span>
      </div>
      <div className="packs-v2-card__copy">
        <h3>
          <Link href={`/packs/${pack.packId}`}>{pack.title}</Link>
        </h3>
        <p>{pack.description}</p>
      </div>
      <PacksV2TokenRow>
        {pack.contentStatusLabel ? (
          <PacksV2Token>{pack.contentStatusLabel}</PacksV2Token>
        ) : null}
        {pack.targetLabel ? <PacksV2Token>{pack.targetLabel}</PacksV2Token> : null}
        {wordCountLabel ? (
          <PacksV2Token>{wordCountLabel}</PacksV2Token>
        ) : (
          <PacksV2Token>Word count pending</PacksV2Token>
        )}
        {previewCountLabel ? <PacksV2Token>{previewCountLabel}</PacksV2Token> : null}
        {planLengthLabel ? <PacksV2Token>{planLengthLabel}</PacksV2Token> : null}
        <PacksV2Token>{getPreviewAccessLabel(pack)}</PacksV2Token>
        {pack.themes?.slice(0, 2).map((theme) => (
          <PacksV2Token key={`${pack.packId}-${theme}`}>
            {formatToken(theme)}
          </PacksV2Token>
        ))}
      </PacksV2TokenRow>
      <PackAccessNote pack={pack} />
      <PackStateStrip summary={summary} />
      <PackProgressNote pack={pack} summary={summary} />
      <div className="track-b-action-row">
        <PackPrimaryAction
          pack={pack}
          setSnapshot={setSnapshot}
          source="packs_page"
          summary={summary}
        />
        <Link
          aria-label={`View ${pack.title} plan`}
          className="track-b-button track-b-button--quiet"
          href={`/packs/${pack.packId}`}
        >
          View plan
        </Link>
        {summary.weakWords.length > 0 ? (
          <Link
            aria-label={`Practice weak ${pack.title}`}
            className="track-b-button track-b-button--quiet"
            href="/review/weak"
          >
            Practice weak
          </Link>
        ) : null}
      </div>
      {summary.weakWords.length > 0 ? (
        <p className="packs-v2-weak-note">{weakReviewRouteNote}</p>
      ) : null}
    </article>
  );
}

function PacksV2Loading({ currentPath }: { currentPath: string }) {
  return (
    <TrackBAppShell activeItemId="packs" currentPath={currentPath}>
      <TrackBPageHeader
        description="Turn saved words into 30-day visual learning plans."
        eyebrow="Packs"
        title="Packs"
      />
      <TrackBEmptyState
        body="Reading local saved words, review state, review events, daily stats, and pack progress without changing review state."
        title="Loading pack plans"
      />
    </TrackBAppShell>
  );
}

export function PacksV2View({ packs }: { packs: VlxPackPreview[] }) {
  const [snapshot, setSnapshotState] = useState<PacksV2Snapshot | null>(null);
  const featuredPacks = useMemo(
    () =>
      featuredPackIds
        .map((packId) => packs.find((pack) => pack.packId === packId))
        .filter((pack): pack is VlxPackPreview => Boolean(pack)),
    [packs]
  );

  useEffect(() => {
    setSnapshotState(readPacksV2Snapshot());
  }, []);

  if (!snapshot) {
    return <PacksV2Loading currentPath="/packs" />;
  }

  const setSnapshot = (nextSnapshot: PacksV2Snapshot) => {
    setSnapshotState(nextSnapshot);
  };
  const missionSummary = getPacksMissionSummary(packs, snapshot);
  const missionAction = getMissionAction(missionSummary);

  return (
    <TrackBAppShell activeItemId="packs" currentPath="/packs">
      <TrackBPageHeader
        description="Turn saved words into 30-day visual learning plans."
        eyebrow="Packs"
        meta={
          <span>
            Weekly Reviewed Words: {snapshot.weeklyReviewedWords} | Reviewed
            today: {snapshot.reviewedToday}
          </span>
        }
        title="Packs"
      />

      <MemoryMissionCard
        action={{
          ariaLabel: missionAction.label,
          href: missionAction.href,
          label: missionAction.label
        }}
        body="Progress is read from local pack progress and real review evidence. Opening this page does not create pack progress."
        className="packs-v2-mission"
        eyebrow="30-day plan surface"
        metrics={getMissionMetrics(missionSummary)}
        title="Learning plans that feed review"
      />

      <TrackBSection
        description="The first Track B plans emphasize Academic Vocabulary, IELTS Writing, and GRE Visual Verbal. Preview-only packs stay clearly marked until full pack content and pack-specific review paths exist."
        id="packs-v2-featured"
        title="Featured learning plans"
      >
        {featuredPacks.length ? (
          <div className="packs-v2-grid packs-v2-grid--featured">
            {featuredPacks.map((pack) => (
              <PackCard
                key={pack.packId}
                pack={pack}
                setSnapshot={setSnapshot}
                snapshot={snapshot}
              />
            ))}
          </div>
        ) : (
          <TrackBEmptyState
            body="The featured Academic, IELTS, and GRE pack records were not returned by the current pack preview catalog."
            title="No featured packs available"
          />
        )}
      </TrackBSection>

      <TrackBSection
        description="Progress below is read from local pack progress and SRS state. Packs with no word data stay in preview or pending states."
        id="packs-v2-all"
        title="All pack plans"
      >
        {packs.length ? (
          <div className="packs-v2-grid">
            {packs.map((pack) => (
              <PackCard
                key={pack.packId}
                pack={pack}
                setSnapshot={setSnapshot}
                snapshot={snapshot}
              />
            ))}
          </div>
        ) : (
          <TrackBEmptyState
            body="Pack plans will appear here when pack reader data or safe mock fallback data is available."
            title="No pack data available"
          />
        )}
      </TrackBSection>
    </TrackBAppShell>
  );
}

function DetailFact({
  label,
  value
}: {
  label: string;
  value?: number | string | null;
}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PackDetailActions({
  pack,
  setSnapshot,
  summary
}: {
  pack: VlxPackPreview;
  setSnapshot: (snapshot: PacksV2Snapshot) => void;
  summary: PackLocalSummary;
}) {
  return (
    <>
      <PackPrimaryAction
        pack={pack}
        setSnapshot={setSnapshot}
        source="pack_detail"
        summary={summary}
        variant="detail"
      />
      {summary.dueWords.length > 0 ? (
        <Link className="track-b-button track-b-button--quiet" href="/review/due">
          Review due
        </Link>
      ) : null}
      {summary.weakWords.length > 0 ? (
        <Link
          aria-label={`Practice weak ${pack.title}`}
          className="track-b-button track-b-button--quiet"
          href="/review/weak"
        >
          Practice weak
        </Link>
      ) : null}
    </>
  );
}

function PackDetailHero({
  pack,
  summary
}: {
  pack: VlxPackPreview;
  summary: PackLocalSummary;
}) {
  const wordCountLabel =
    formatOptionalCount(pack.wordCount, "word") ?? "Not available yet";
  const previewCountLabel =
    formatOptionalCount(pack.previewCount, "preview card") ??
    "Not available yet";

  return (
    <section className="packs-v2-detail-hero" aria-labelledby="pack-summary">
      <div className="packs-v2-detail-hero__copy">
        <p className="track-b-eyebrow">Plan summary</p>
        <h2 id="pack-summary">{pack.title}</h2>
        <p>
          {pack.targetLabel ??
            "This pack will show a target learner when pack data provides one."}
        </p>
        <p>
          {pack.planFraming ??
            "This is a 30-day visual learning plan surface. Preview cards, review actions, and progress stay tied to real pack data and local memory evidence."}
        </p>
        <PacksV2TokenRow>
          {pack.contentStatusLabel ? (
            <PacksV2Token>{pack.contentStatusLabel}</PacksV2Token>
          ) : null}
          <PacksV2Token>{getStatusLabel(pack.status)}</PacksV2Token>
          <PacksV2Token>{getPreviewAccessLabel(pack)}</PacksV2Token>
          {isPremiumPack(pack) ? (
            <PacksV2Token>Owner-gated beta preview</PacksV2Token>
          ) : null}
        </PacksV2TokenRow>
        <PackAccessNote pack={pack} />
      </div>
      <dl className="packs-v2-detail-facts">
        <DetailFact label="Words" value={wordCountLabel} />
        <DetailFact label="Preview" value={previewCountLabel} />
        <DetailFact label="Plan length" value={getPlanLengthLabel(pack)} />
        <DetailFact label="Target exam" value={formatToken(pack.targetExam)} />
        <DetailFact label="Level" value={pack.levelLabel} />
        <DetailFact label="Difficulty" value={pack.difficultyLabel} />
        <DetailFact label="Themes" value={pack.themes?.join(", ")} />
        <DetailFact label="Source" value={pack.sourceLabel} />
        <DetailFact label="Updated" value={pack.updatedAt} />
      </dl>
      <PackProgressNote pack={pack} summary={summary} variant="detail" />
    </section>
  );
}

function PackDetailMetrics({ summary }: { summary: PackLocalSummary }) {
  if (!summary.computable) {
    return (
      <TrackBEmptyState
        body="No word slugs are available for this pack yet, so due, weak, reviewed, and mastered counts cannot be computed honestly."
        title="No computable pack progress yet"
      />
    );
  }

  const reviewedCount = summary.stateItems.filter(
    (item) => item.correct + item.wrong > 0
  ).length;
  const knownMax = summary.knownSlugs.length;

  return (
    <div className="packs-v2-detail-metrics">
      <TrackBMetricCard
        description="Scheduled by nextDueAt through today for known pack words."
        label="Due"
        tone="due"
        value={summary.dueWords.length}
      />
      <TrackBMetricCard
        description="Weak mastery, misses, or weakScore for known pack words."
        label="Weak"
        tone="weak"
        value={summary.weakWords.length}
      />
      <TrackBMetricCard
        description="Known pack words with at least one answer in review state."
        label="SRS reviewed"
        tone="learning"
        value={reviewedCount}
      />
      <TrackBMetricCard
        description="Only box 5 with Mastered state."
        label="Mastered"
        tone="mastered"
        value={summary.masteredWords.length}
      />
      <TrackBMetricCard
        description="Local answer events recorded for known pack words."
        label="Review events"
        value={summary.reviewEvents.length}
      />
      <TrackBMetricCard
        description={`${summary.savedWords.length} saved locally in this pack. This is a factual slug count, not learning progress.`}
        label="Known slugs"
        value={knownMax}
      />
    </div>
  );
}

function QueueWordList({
  emptyBody,
  emptyTitle,
  title,
  words
}: {
  emptyBody: string;
  emptyTitle: string;
  title: string;
  words: VlxReviewStateItem[];
}) {
  return (
    <article className="packs-v2-queue-panel">
      <h3>{title}</h3>
      {words.length ? (
        <ul className="packs-v2-queue-list">
          {words.slice(0, 5).map((word) => (
            <li key={word.slug}>
              <span>
                <strong>{word.word}</strong>
                <small>
                  Box {word.box} | {word.mastery} | Weak{" "}
                  {Math.round(word.weakScore * 100)}%
                </small>
              </span>
              <Link href={`/word/${word.slug}`}>Open</Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="packs-v2-inline-empty">
          <strong>{emptyTitle}</strong>
          <p>{emptyBody}</p>
        </div>
      )}
    </article>
  );
}

function PackQueues({ summary }: { summary: PackLocalSummary }) {
  if (!summary.computable) {
    return (
      <TrackBEmptyState
        body="Due and weak cards require known pack word slugs plus matching local review state."
        title="No pack queues available"
      />
    );
  }

  return (
    <div className="packs-v2-queue-grid">
      <QueueWordList
        emptyBody="No known cards in this pack are due through today. The page is not inventing due work."
        emptyTitle="No due cards in this pack"
        title="Due within this pack"
        words={summary.dueWords}
      />
      <QueueWordList
        emptyBody="Weak cards appear only after mistakes, Weak mastery, or high weakScore exists in local review state."
        emptyTitle="No weak cards in this pack"
        title="Weak within this pack"
        words={summary.weakWords}
      />
      {summary.weakWords.length > 0 ? (
        <p className="packs-v2-weak-note packs-v2-weak-note--detail">
          {weakReviewRouteNote}
        </p>
      ) : null}
    </div>
  );
}

function PreviewWordCard({ word }: { word: VlxQuizWord }) {
  const imageStyle = getWordImageStyle(word);
  const imageClass = imageStyle
    ? " word-card__visual--image"
    : getVisualClass(word.slug);

  return (
    <article className="packs-v2-word-card">
      <div
        aria-label={`Preview image for ${word.word}`}
        className={`word-card__visual packs-v2-word-card__image${imageClass}`}
        role="img"
        style={imageStyle}
      >
        {!imageStyle ? <span aria-hidden="true">{word.word.slice(0, 1)}</span> : null}
      </div>
      <div className="packs-v2-word-card__body">
        <div className="packs-v2-word-card__topline">
          <h3>{word.word}</h3>
          <PacksV2Token>{word.cefr}</PacksV2Token>
        </div>
        <p>{word.definition}</p>
        <p className="packs-v2-word-card__example">Example: {word.example}</p>
        <p className="packs-v2-word-card__cue">
          Memory cue: {word.memoryHook}
        </p>
        <PacksV2TokenRow>
          <PacksV2Token>{formatToken(word.hub)}</PacksV2Token>
          <PacksV2Token>{formatToken(word.difficulty)}</PacksV2Token>
          <PacksV2Token>{word.partOfSpeech}</PacksV2Token>
        </PacksV2TokenRow>
        <Link className="track-b-button track-b-button--quiet" href={`/word/${word.slug}`}>
          Word detail
        </Link>
      </div>
    </article>
  );
}

function PreviewWords({ pack }: { pack: VlxPackPreview }) {
  if (!pack.previewWords.length) {
    return <TrackBEmptyState body={pack.emptyBody} title={pack.emptyTitle} />;
  }

  return (
    <div className="packs-v2-word-grid">
      {pack.previewWords.map((word) => (
        <PreviewWordCard key={word.slug} word={word} />
      ))}
    </div>
  );
}

function PackDetailLoading({ pack }: { pack: VlxPackPreview }) {
  return (
    <TrackBAppShell activeItemId="packs" currentPath={`/packs/${pack.packId}`}>
      <TrackBPageHeader
        description={pack.description}
        eyebrow={getKindLabel(pack.kind)}
        title={pack.title}
      />
      <TrackBEmptyState
        body="Reading browser-local learning state for this pack without changing review state or review events."
        title="Loading pack plan"
      />
    </TrackBAppShell>
  );
}

export function PackDetailV2View({ pack }: { pack: VlxPackPreview }) {
  const [snapshot, setSnapshotState] = useState<PacksV2Snapshot | null>(null);

  useEffect(() => {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.examPackPreviewView, {
      packId: pack.packId,
      title: pack.title,
      targetLabel: pack.targetLabel,
      wordCount: pack.wordCount,
      previewCount: pack.previewCount,
      status: pack.status,
      userState: "guest",
      source: "pack_preview"
    });
    setSnapshotState(readPacksV2Snapshot());
  }, [
    pack.packId,
    pack.previewCount,
    pack.status,
    pack.targetLabel,
    pack.title,
    pack.wordCount
  ]);

  if (!snapshot) {
    return <PackDetailLoading pack={pack} />;
  }

  const setSnapshot = (nextSnapshot: PacksV2Snapshot) => {
    setSnapshotState(nextSnapshot);
  };
  const summary = getPackLocalSummary(pack, snapshot);

  return (
    <TrackBAppShell activeItemId="packs" currentPath={`/packs/${pack.packId}`}>
      <TrackBPageHeader
        actions={
          <PackDetailActions
            pack={pack}
            setSnapshot={setSnapshot}
            summary={summary}
          />
        }
        description={pack.description}
        eyebrow={getKindLabel(pack.kind)}
        meta={
          <span>
            {getStatusLabel(pack.status)} | {getPreviewAccessLabel(pack)}
          </span>
        }
        title={pack.title}
      />

      <PackDetailHero pack={pack} summary={summary} />

      <TrackBSection
        description="Counts are filtered to known pack word slugs and existing browser-local SRS state."
        id="pack-memory-state"
        title="Progress summary"
      >
        <PackDetailMetrics summary={summary} />
      </TrackBSection>

      <TrackBSection
        description="Due and Weak counts link back to the existing safe review routes. Packs do not write review answers directly."
        id="pack-review-queues"
        title="Review queues in this pack"
      >
        <PackQueues summary={summary} />
      </TrackBSection>

      <TrackBSection
        description="These are the sample cards available from current static pack data."
        id="pack-preview-words"
        title="Preview words"
      >
        <PreviewWords pack={pack} />
      </TrackBSection>

    </TrackBAppShell>
  );
}
