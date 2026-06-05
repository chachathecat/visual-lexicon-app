import type {
  VlxDailyStatsStore,
  VlxReviewEventsStore,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

export type VlxHubProgressItem = {
  hub: string;
  total: number;
  due: number;
  weak: number;
  newSaved: number;
  mastered: number;
  reviewed: number;
};

function toItems(reviewState: VlxReviewStateStore) {
  return Object.values(reviewState);
}

function toDate(value: string | Date) {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function endOfUtcDay(now: string | Date) {
  const date = toDate(now);
  const end = isValidDate(date) ? date : new Date();
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function startOfUtcDay(now: string | Date) {
  const date = toDate(now);
  const start = isValidDate(date) ? date : new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function toUtcDateKey(now: string | Date) {
  return startOfUtcDay(now).toISOString().slice(0, 10);
}

function isDueBy(item: VlxReviewStateItem, dueBy: Date) {
  if (!item.nextDueAt) {
    return true;
  }

  const nextDueAt = toDate(item.nextDueAt);

  return isValidDate(nextDueAt) && nextDueAt.getTime() <= dueBy.getTime();
}

function sortByDueThenWeakness(
  first: VlxReviewStateItem,
  second: VlxReviewStateItem
) {
  const firstDue = first.nextDueAt ? Date.parse(first.nextDueAt) : 0;
  const secondDue = second.nextDueAt ? Date.parse(second.nextDueAt) : 0;

  if (firstDue !== secondDue) {
    return firstDue - secondDue;
  }

  return second.weakScore - first.weakScore;
}

function sortByUpdatedDesc(
  first: VlxReviewStateItem,
  second: VlxReviewStateItem
) {
  return Date.parse(second.updatedAt) - Date.parse(first.updatedAt);
}

function sortSavedBySavedAtDesc(first: VlxSavedWord, second: VlxSavedWord) {
  return Date.parse(second.savedAt) - Date.parse(first.savedAt);
}

function isWeak(item: VlxReviewStateItem) {
  const reviewCount = item.correct + item.wrong;

  return (
    item.mastery === "Weak" ||
    item.weakScore >= 0.6 ||
    item.wrong >= 3 ||
    (item.wrong > 0 && item.wrong >= item.correct && reviewCount > 1)
  );
}

export function getDueToday(
  reviewState: VlxReviewStateStore,
  now: string | Date = new Date()
) {
  const dueBy = endOfUtcDay(now);

  return toItems(reviewState)
    .filter((item) => item.mastery !== "Mastered" && isDueBy(item, dueBy))
    .sort(sortByDueThenWeakness);
}

export function getWeakWords(reviewState: VlxReviewStateStore) {
  return toItems(reviewState).filter(isWeak).sort((first, second) => {
    if (first.weakScore !== second.weakScore) {
      return second.weakScore - first.weakScore;
    }

    return second.wrong - first.wrong;
  });
}

export function getNewSaved(
  savedWords: VlxSavedWordsStore,
  reviewState: VlxReviewStateStore = {}
) {
  return Object.values(savedWords)
    .filter((savedWord) => {
      const state = reviewState[savedWord.slug];

      return (
        !state ||
        (state.mastery === "New" && state.correct + state.wrong === 0)
      );
    })
    .sort(sortSavedBySavedAtDesc);
}

export function getSavedLibrary(savedWords: VlxSavedWordsStore) {
  return Object.values(savedWords).sort(sortSavedBySavedAtDesc);
}

export function getMastered(reviewState: VlxReviewStateStore) {
  return toItems(reviewState)
    .filter((item) => item.box === 5 && item.mastery === "Mastered")
    .sort(sortByUpdatedDesc);
}

export function getWeeklyReviewedWords(
  reviewEvents: VlxReviewEventsStore,
  now: string | Date = new Date()
) {
  const end = endOfUtcDay(now);
  const start = startOfUtcDay(now);
  start.setUTCDate(start.getUTCDate() - 6);

  return new Set(
    reviewEvents
      .filter((event) => {
        const createdAt = toDate(event.createdAt);

        return (
          isValidDate(createdAt) &&
          createdAt.getTime() >= start.getTime() &&
          createdAt.getTime() <= end.getTime()
        );
      })
      .map((event) => event.slug)
  ).size;
}

export function getReviewedToday(
  dailyStats: VlxDailyStatsStore,
  now: string | Date = new Date()
) {
  return dailyStats[toUtcDateKey(now)]?.reviewed ?? 0;
}

export function getReviewStreak(
  dailyStats: VlxDailyStatsStore,
  now: string | Date = new Date()
) {
  const reviewedDates = new Set(
    Object.values(dailyStats)
      .filter((item) => item.reviewed > 0)
      .map((item) => item.date)
  );
  const cursor = startOfUtcDay(now);
  let streak = 0;

  while (reviewedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function getHubProgress(
  savedWords: VlxSavedWordsStore,
  reviewState: VlxReviewStateStore,
  now: string | Date = new Date()
) {
  const dueSlugs = new Set(getDueToday(reviewState, now).map((item) => item.slug));
  const weakSlugs = new Set(getWeakWords(reviewState).map((item) => item.slug));
  const newSavedSlugs = new Set(
    getNewSaved(savedWords, reviewState).map((item) => item.slug)
  );
  const masteredSlugs = new Set(
    getMastered(reviewState).map((item) => item.slug)
  );
  const slugs = new Set([
    ...Object.keys(savedWords),
    ...Object.keys(reviewState)
  ]);
  const progress = new Map<string, VlxHubProgressItem>();

  function getProgressItem(hub: string) {
    const existing = progress.get(hub);

    if (existing) {
      return existing;
    }

    const item: VlxHubProgressItem = {
      hub,
      total: 0,
      due: 0,
      weak: 0,
      newSaved: 0,
      mastered: 0,
      reviewed: 0
    };

    progress.set(hub, item);
    return item;
  }

  slugs.forEach((slug) => {
    const state = reviewState[slug];
    const savedWord = savedWords[slug];
    const hub = state?.hub ?? savedWord?.hub ?? "Unsorted";
    const item = getProgressItem(hub);

    item.total += 1;
    item.due += dueSlugs.has(slug) ? 1 : 0;
    item.weak += weakSlugs.has(slug) ? 1 : 0;
    item.newSaved += newSavedSlugs.has(slug) ? 1 : 0;
    item.mastered += masteredSlugs.has(slug) ? 1 : 0;
    item.reviewed += state && state.correct + state.wrong > 0 ? 1 : 0;
  });

  return Array.from(progress.values()).sort((first, second) => {
    if (first.total !== second.total) {
      return second.total - first.total;
    }

    return first.hub.localeCompare(second.hub);
  });
}
