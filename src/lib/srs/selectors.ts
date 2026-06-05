import type {
  VlxReviewEventsStore,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";

function toItems(reviewState: VlxReviewStateStore) {
  return Object.values(reviewState);
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
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
