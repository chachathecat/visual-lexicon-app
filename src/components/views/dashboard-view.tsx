"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { MissionPanel } from "@/components/mission-panel";
import { MultilingualAliasSearch } from "@/components/multilingual-alias-search";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { readLocalPlanState, type VlxPlanId } from "@/lib/entitlements";
import {
  evaluateMasteryExportLockedPaywall,
  evaluateWeakWordsSprintLockedPaywall,
  type VlxPaywallPrompt
} from "@/lib/paywall";
import {
  getDueToday,
  getHubProgress,
  getMastered,
  getNewSaved,
  getReviewedToday,
  getReviewStreak,
  getSavedLibrary,
  getWeakWords,
  getWeeklyReviewedWords,
  type VlxHubProgressItem
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

type DashboardSnapshot = {
  plan: VlxPlanId;
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: VlxReviewEventsStore;
  dailyStats: VlxDailyStatsStore;
  dueToday: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  mastered: VlxReviewStateItem[];
  savedLibrary: VlxSavedWord[];
  hubProgress: VlxHubProgressItem[];
  reviewedToday: number;
  reviewStreak: number;
  weeklyReviewedWords: number;
  weakWordsPaywallPrompt: VlxPaywallPrompt | null;
  masteryExportPaywallPrompt: VlxPaywallPrompt | null;
  hasAnyLocalData: boolean;
};

type DashboardWord = {
  slug: string;
  word: string;
  definition?: string;
  image?: string;
  hub?: string;
  mastery?: VlxMasteryLabel;
  box?: number;
  weakScore?: number;
  detail?: string;
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

function readDashboardSnapshot(): DashboardSnapshot {
  const now = new Date();
  const plan = readLocalPlanState().plan;
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const dailyStats = readDailyStats();
  const dueToday = getDueToday(reviewState, now);
  const weakWords = getWeakWords(reviewState);
  const newSaved = getNewSaved(savedWords, reviewState);
  const mastered = getMastered(reviewState);
  const weakWordsPaywallPrompt = evaluateWeakWordsSprintLockedPaywall({
    plan,
    weakCount: weakWords.length,
    source: "dashboard_weak_words"
  });
  const masteryExportPaywallPrompt =
    mastered.length > 0
      ? evaluateMasteryExportLockedPaywall({
          plan,
          masteredCount: mastered.length,
          source: "dashboard_mastery_export"
        })
      : null;

  return {
    plan,
    savedWords,
    reviewState,
    reviewEvents,
    dailyStats,
    dueToday,
    weakWords,
    newSaved,
    mastered,
    savedLibrary: getSavedLibrary(savedWords),
    hubProgress: getHubProgress(savedWords, reviewState, now),
    reviewedToday: getReviewedToday(dailyStats, now),
    reviewStreak: getReviewStreak(dailyStats, now),
    weeklyReviewedWords: getWeeklyReviewedWords(reviewEvents, now),
    weakWordsPaywallPrompt,
    masteryExportPaywallPrompt,
    hasAnyLocalData:
      hasKeys(savedWords) ||
      hasKeys(reviewState) ||
      reviewEvents.length > 0 ||
      hasKeys(dailyStats)
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

function getVisualClass(slug: string, image?: string) {
  if (image || !visualCueSlugs.has(slug)) {
    return "";
  }

  return ` word-card__visual--${slug}`;
}

function fromStateItem(item: VlxReviewStateItem): DashboardWord {
  const shortDueDate = formatShortDate(item.nextDueAt);

  return {
    slug: item.slug,
    word: item.word,
    definition: item.definition,
    image: item.image,
    hub: item.hub,
    mastery: item.mastery,
    box: item.box,
    weakScore: item.weakScore,
    detail: shortDueDate ? `Due ${shortDueDate}` : "Due now"
  };
}

function fromSavedWord(savedWord: VlxSavedWord): DashboardWord {
  const savedDate = formatShortDate(savedWord.savedAt);

  return {
    slug: savedWord.slug,
    word: savedWord.word,
    definition: savedWord.definition,
    image: savedWord.image,
    hub: savedWord.hub,
    mastery: "New",
    box: 0,
    detail: savedDate ? `Saved ${savedDate}` : "Saved"
  };
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

function DashboardWordList({
  words,
  emptyText,
  ctaLabel
}: {
  words: DashboardWord[];
  emptyText: string;
  ctaLabel: string;
}) {
  if (!words.length) {
    return <p className="dashboard-card__empty">{emptyText}</p>;
  }

  return (
    <div className="dashboard-word-list">
      {words.map((word) => (
        <article className="dashboard-word" key={word.slug}>
          <div
            aria-label={`Visual cue for ${word.word}`}
            className={`dashboard-word__visual word-card__visual${getVisualClass(
              word.slug,
              word.image
            )}${word.image ? " dashboard-word__visual--image" : ""}`}
            role="img"
            style={
              word.image ? { backgroundImage: `url(${word.image})` } : undefined
            }
          />
          <div className="dashboard-word__body">
            <div className="dashboard-word__topline">
              <h3>{word.word}</h3>
              {word.mastery ? (
                <span className={masteryClass(word.mastery)}>
                  {word.mastery}
                </span>
              ) : null}
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
              {word.hub ? (
                <span className="tag">{formatHubLabel(word.hub)}</span>
              ) : null}
              {word.detail ? <span className="tag">{word.detail}</span> : null}
            </div>
            <Link className="button button--quiet" href={`/word/${word.slug}`}>
              {ctaLabel}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function QueueModule({
  title,
  count,
  note,
  actionHref,
  actionLabel,
  words,
  emptyText,
  ctaLabel
}: {
  title: string;
  count: number;
  note: string;
  actionHref: string;
  actionLabel: string;
  words: DashboardWord[];
  emptyText: string;
  ctaLabel: string;
}) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card__topline">
        <div>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        <span className="dashboard-card__count">{count}</span>
      </div>
      <DashboardWordList
        ctaLabel={ctaLabel}
        emptyText={emptyText}
        words={words}
      />
      <Link className="button button--quiet" href={actionHref}>
        {actionLabel}
      </Link>
    </article>
  );
}

function MetricModule({
  title,
  value,
  label,
  body
}: {
  title: string;
  value: number;
  label: string;
  body: string;
}) {
  return (
    <article className="dashboard-card dashboard-card--metric">
      <div>
        <h2>{title}</h2>
        <span className="dashboard-card__metric">{value}</span>
        <span className="dashboard-card__label">{label}</span>
      </div>
      <p>{body}</p>
    </article>
  );
}

function HubProgress({ items }: { items: VlxHubProgressItem[] }) {
  if (!items.length) {
    return (
      <EmptyState
        actionHref="/review"
        actionLabel="Start starter review"
        body="Hub progress appears after saved or reviewed words have local memory state."
        title="No hub progress yet"
      />
    );
  }

  return (
    <div className="hub-progress-list">
      {items.map((item) => {
        const masteredPercent = item.total
          ? Math.round((item.mastered / item.total) * 100)
          : 0;

        return (
          <article className="hub-progress-row" key={item.hub}>
            <div>
              <h3>{formatHubLabel(item.hub)}</h3>
              <p>
                {item.reviewed} reviewed of {item.total} local words
              </p>
            </div>
            <div className="hub-progress-row__stats">
              <span className="tag">Due {item.due}</span>
              <span className="tag tag--weak">Weak {item.weak}</span>
              <span className="tag">New {item.newSaved}</span>
              <span className="tag tag--strong">Mastered {item.mastered}</span>
            </div>
            <div
              aria-label={`${masteredPercent}% mastered in ${formatHubLabel(
                item.hub
              )}`}
              className="hub-progress-bar"
              role="img"
            >
              <span style={{ width: `${masteredPercent}%` }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function DashboardView() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(readDashboardSnapshot());
  }, []);

  const dashboardWords = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return {
      dueToday: snapshot.dueToday.slice(0, 3).map(fromStateItem),
      weakWords: snapshot.weakWords.slice(0, 3).map(fromStateItem),
      newSaved: snapshot.newSaved.slice(0, 3).map(fromSavedWord),
      mastered: snapshot.mastered.slice(0, 3).map(fromStateItem),
      savedLibrary: snapshot.savedLibrary.slice(0, 6).map(fromSavedWord)
    };
  }, [snapshot]);

  if (!snapshot || !dashboardWords) {
    return (
      <div className="page">
        <section className="empty-state" aria-live="polite">
          <h1>Loading dashboard state</h1>
          <p>Reading saved words, review state, review events, and daily stats.</p>
        </section>
      </div>
    );
  }

  const startReviewHref = snapshot.dueToday.length ? "/review/due" : "/review";

  return (
    <div className="page">
      <MissionPanel
        dueCount={snapshot.dueToday.length}
        hasAnyLocalData={snapshot.hasAnyLocalData}
        masteredCount={snapshot.mastered.length}
        reviewedToday={snapshot.reviewedToday}
        startReviewHref={startReviewHref}
        weakCount={snapshot.weakWords.length}
      />

      <MultilingualAliasSearch />

      {!snapshot.hasAnyLocalData ? (
        <EmptyState
          actionHref="/review"
          actionLabel="Start starter review"
          body="No local memory state exists yet. A starter review session will create review events, daily stats, and real SRS state."
          title="No memory loop data yet"
        />
      ) : null}

      <section className="section" aria-labelledby="learning-modules">
        <div className="section-heading">
          <h2 className="section-title" id="learning-modules">
            Learning modules
          </h2>
          <span className="section-note">Counts come from local SRS state</span>
        </div>
        <div className="dashboard-grid">
          <QueueModule
            actionHref="/review/due"
            actionLabel="Review due"
            count={snapshot.dueToday.length}
            ctaLabel="Open word"
            emptyText={
              snapshot.hasAnyLocalData
                ? "No words are due today."
                : "Due words appear after the first review session."
            }
            note="Scheduled by nextDueAt and SRS box state."
            title="Due Today"
            words={dashboardWords.dueToday}
          />
          <QueueModule
            actionHref="/review/weak"
            actionLabel="Practice weak"
            count={snapshot.weakWords.length}
            ctaLabel="Open word"
            emptyText="Weak words appear after missed or fragile recall."
            note="Words with repeated misses or high weakScore."
            title="Weak Words"
            words={dashboardWords.weakWords}
          />
          {snapshot.weakWordsPaywallPrompt ? (
            <PaywallPrompt
              prompt={snapshot.weakWordsPaywallPrompt}
              userState={snapshot.plan}
            />
          ) : null}
          <QueueModule
            actionHref="/review"
            actionLabel="Start learning"
            count={snapshot.newSaved.length}
            ctaLabel="Open word"
            emptyText="New saved words will appear before their first review."
            note="Saved words that have not yet become reviewed items."
            title="New Saved"
            words={dashboardWords.newSaved}
          />
          <QueueModule
            actionHref="/review"
            actionLabel="Continue review"
            count={snapshot.mastered.length}
            ctaLabel="Open word"
            emptyText="No mastered words yet. Mastery requires delayed recall."
            note="Only box 5 words with Mastered memory state."
            title="Mastered"
            words={dashboardWords.mastered}
          />
          {snapshot.masteryExportPaywallPrompt ? (
            <PaywallPrompt
              prompt={snapshot.masteryExportPaywallPrompt}
              userState={snapshot.plan}
            />
          ) : null}
          <MetricModule
            body={
              snapshot.reviewStreak
                ? "Consecutive UTC days with at least one reviewed word."
                : "Review today to begin a real streak."
            }
            label="day streak"
            title="Streak"
            value={snapshot.reviewStreak}
          />
          <MetricModule
            body="Unique words reviewed in the last seven UTC days."
            label="weekly reviewed words"
            title="Weekly Reviewed Words"
            value={snapshot.weeklyReviewedWords}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="hub-progress">
        <div className="section-heading">
          <h2 className="section-title" id="hub-progress">
            Hub Progress
          </h2>
          <span className="section-note">
            {snapshot.hubProgress.length} local hubs
          </span>
        </div>
        <HubProgress items={snapshot.hubProgress} />
      </section>

      <section className="section" aria-labelledby="saved-library">
        <div className="section-heading">
          <h2 className="section-title" id="saved-library">
            Saved Library
          </h2>
          <Link className="button button--quiet" href="/saved">
            View all saved
          </Link>
        </div>
        {dashboardWords.savedLibrary.length ? (
          <DashboardWordList
            ctaLabel="Open word"
            emptyText="No saved words yet."
            words={dashboardWords.savedLibrary}
          />
        ) : (
          <EmptyState
            actionHref="/review"
            actionLabel="Start starter review"
            body="Saved visual words will appear here after the learner saves them locally."
            title="No saved words yet"
          />
        )}
      </section>
    </div>
  );
}
