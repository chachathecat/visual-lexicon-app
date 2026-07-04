"use client";

import { useEffect, useState } from "react";

import { PaywallPrompt } from "@/components/paywall-prompt";
import { readPackProgressStore } from "@/lib/packs/progress";
import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMasteryExportLockedPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateReviewLimitPaywall,
  evaluateSaveLimitPaywall,
  evaluateWeakWordsSprintLockedPaywall,
  type VlxPaywallPrompt
} from "@/lib/paywall";
import { getMastered, getReviewedToday, getWeakWords } from "@/lib/srs/selectors";
import {
  readDailyStats,
  readReviewEvents,
  readReviewState,
  readSavedWords
} from "@/lib/srs/storage";
import { readLocalPlanState } from "@/lib/entitlements";

type PaywallTriggerSnapshot = {
  checked: boolean;
  prompts: VlxPaywallPrompt[];
};

function getLocalPaywallPrompts() {
  const plan = readLocalPlanState().plan;
  const savedWords = readSavedWords();
  const reviewState = readReviewState();
  const dailyStats = readDailyStats();
  const reviewEvents = readReviewEvents();
  const packProgressStore = readPackProgressStore();

  const savedCount = Object.keys(savedWords).length;
  const weakCount = getWeakWords(reviewState).length;
  const masteredCount = getMastered(reviewState).length;
  const dailyReviewedCount = getReviewedToday(dailyStats);
  const completedPreview = Object.values(packProgressStore).find(
    (progress) => Boolean(progress.previewCompletedAt)
  );
  const wrongEvents = reviewEvents.filter((event) => event.result === "wrong");
  const lastWrongEvent = wrongEvents.at(-1);

  return [
    evaluateSaveLimitPaywall({
      plan,
      savedCount,
      source: "settings_save_limit"
    }),
    evaluateReviewLimitPaywall({
      plan,
      dailyReviewedCount,
      source: "settings_review_limit"
    }),
    completedPreview
      ? evaluateExamPackPreviewEndPaywall({
          plan,
          packId: completedPreview.packId,
          previewCompleted: true,
          source: "settings_pack_preview_end"
        })
      : null,
    evaluateWeakWordsSprintLockedPaywall({
      plan,
      weakCount,
      source: "settings_weak_words_sprint_locked"
    }),
    masteredCount > 0
      ? evaluateMasteryExportLockedPaywall({
          plan,
          masteredCount,
          source: "settings_mastery_export_locked"
        })
      : null,
    lastWrongEvent
      ? evaluateMistakeExplanationLockedPaywall({
          plan,
          wrongCount: wrongEvents.length,
          slug: lastWrongEvent.slug,
          source: "settings_mistake_explanation_locked"
        })
      : null
  ].filter((prompt): prompt is VlxPaywallPrompt => Boolean(prompt));
}

export function LocalPaywallTriggerPanel() {
  const [snapshot, setSnapshot] = useState<PaywallTriggerSnapshot>({
    checked: false,
    prompts: []
  });

  useEffect(() => {
    setSnapshot({
      checked: true,
      prompts: getLocalPaywallPrompts().slice(0, 3)
    });
  }, []);

  return (
    <section className="section" aria-labelledby="paywall-trigger-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Paid beta</span>
          <h2 className="section-title" id="paywall-trigger-panel">
            Local paywall triggers
          </h2>
        </div>
      </div>

      {snapshot.prompts.length > 0 ? (
        <div className="paywall-prompt-list">
          {snapshot.prompts.map((prompt) => (
            <PaywallPrompt key={`${prompt.id}-${prompt.source}`} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>
            {snapshot.checked
              ? "No local paywall trigger is active from the current browser state."
              : "Checking local trigger state."}
          </p>
        </div>
      )}
    </section>
  );
}
