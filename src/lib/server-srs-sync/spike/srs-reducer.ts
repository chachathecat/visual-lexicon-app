import { applyReviewAnswer } from "@/lib/srs/engine";
import type {
  VlxDailyStatsItem,
  VlxReviewAnswerInput,
  VlxReviewEvent,
  VlxReviewStateItem
} from "@/lib/srs/types";

export type VlxServerSrsReducerInput = VlxReviewAnswerInput & {
  eventId: string;
  sessionId: string;
  createdAt: string;
};

export type VlxServerSrsReducerResult = {
  event: VlxReviewEvent;
  reviewState: VlxReviewStateItem;
  dailyStats: VlxDailyStatsItem;
  grantsPaidEntitlement: false;
};

export function reduceServerReviewEvent(
  input: VlxServerSrsReducerInput,
  previousReviewState?: VlxReviewStateItem,
  previousDailyStats?: VlxDailyStatsItem
): VlxServerSrsReducerResult {
  const output = applyReviewAnswer(input, {
    currentState: previousReviewState,
    dailyStats: previousDailyStats,
    countSession: true
  });

  return {
    event: output.event,
    reviewState: output.state,
    dailyStats: output.dailyStats,
    grantsPaidEntitlement: false
  };
}
