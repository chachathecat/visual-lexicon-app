import type { VlxReviewStateItem } from "@/lib/srs/types";

export type VlxSelectableReviewStateItem = Pick<
  VlxReviewStateItem,
  | "slug"
  | "box"
  | "mastery"
  | "correct"
  | "wrong"
  | "nextDueAt"
  | "weakScore"
  | "updatedAt"
>;

export type VlxReviewStateSelectorInput<
  TItem extends VlxSelectableReviewStateItem = VlxSelectableReviewStateItem
> = readonly TItem[] | Record<string, TItem>;

function toItems<TItem extends VlxSelectableReviewStateItem>(
  reviewState: VlxReviewStateSelectorInput<TItem>
) {
  return Array.isArray(reviewState)
    ? [...reviewState]
    : Object.values(reviewState);
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

function toTime(value?: string) {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function isDueBy(item: VlxSelectableReviewStateItem, dueBy: Date) {
  if (!item.nextDueAt) {
    return true;
  }

  const nextDueAt = new Date(item.nextDueAt);

  return isValidDate(nextDueAt) && nextDueAt.getTime() <= dueBy.getTime();
}

function isWeak(item: VlxSelectableReviewStateItem) {
  const reviewCount = item.correct + item.wrong;

  return (
    item.mastery === "Weak" ||
    item.weakScore >= 0.6 ||
    item.wrong >= 3 ||
    (item.wrong > 0 && item.wrong >= item.correct && reviewCount > 1)
  );
}

function sortByDueThenWeakness<
  TItem extends VlxSelectableReviewStateItem
>(first: TItem, second: TItem) {
  const firstDue = toTime(first.nextDueAt);
  const secondDue = toTime(second.nextDueAt);

  if (firstDue !== secondDue) {
    return firstDue - secondDue;
  }

  return second.weakScore - first.weakScore;
}

function sortByWeakness<TItem extends VlxSelectableReviewStateItem>(
  first: TItem,
  second: TItem
) {
  if (first.weakScore !== second.weakScore) {
    return second.weakScore - first.weakScore;
  }

  return second.wrong - first.wrong;
}

function sortByUpdatedDesc<TItem extends VlxSelectableReviewStateItem>(
  first: TItem,
  second: TItem
) {
  return Date.parse(second.updatedAt) - Date.parse(first.updatedAt);
}

export function selectDueReviewState<
  TItem extends VlxSelectableReviewStateItem
>(
  reviewState: VlxReviewStateSelectorInput<TItem>,
  now: string | Date = new Date()
) {
  const dueBy = endOfUtcDay(now);

  return toItems(reviewState)
    .filter((item) => item.mastery !== "Mastered" && isDueBy(item, dueBy))
    .sort(sortByDueThenWeakness);
}

export function selectWeakReviewState<
  TItem extends VlxSelectableReviewStateItem
>(reviewState: VlxReviewStateSelectorInput<TItem>) {
  return toItems(reviewState).filter(isWeak).sort(sortByWeakness);
}

export function selectMasteredReviewState<
  TItem extends VlxSelectableReviewStateItem
>(reviewState: VlxReviewStateSelectorInput<TItem>) {
  return toItems(reviewState)
    .filter((item) => item.box === 5 && item.mastery === "Mastered")
    .sort(sortByUpdatedDesc);
}

export const selectDueQueue = selectDueReviewState;
export const selectWeakQueue = selectWeakReviewState;
export const selectMasteredWords = selectMasteredReviewState;
