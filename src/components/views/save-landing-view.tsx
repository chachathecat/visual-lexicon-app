"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import type {
  VlxSavePackSource,
  VlxSaveWordResult
} from "@/lib/analytics";
import { readLocalPlanState, type VlxPlanId } from "@/lib/entitlements";
import { normalizeExtensionSource } from "@/lib/extension/bridge";
import type { VlxWordFoundSource } from "@/lib/packs";
import { getMockQuizWordBySlug } from "@/lib/packs/mock-data";
import type { VlxQuizWord } from "@/lib/packs/types";
import {
  evaluateSaveLimitPaywall,
  type VlxPaywallPrompt
} from "@/lib/paywall";
import {
  createReviewItemFromSavedWord,
  readReviewState,
  readSavedWords,
  writeSavedWords
} from "@/lib/srs/storage";
import type {
  VlxReviewStateItem,
  VlxSavedWord,
  VlxSavedWordSource
} from "@/lib/srs/types";

type SaveLandingViewProps = {
  slug?: string;
  source?: string;
  word?: VlxQuizWord | null;
  wordFoundSource?: VlxWordFoundSource;
};

type SaveStatus =
  | "checking"
  | "missing_slug"
  | "unknown_word"
  | "saved"
  | "storage_unavailable"
  | "storage_error";

type SaveOutcome = {
  status: SaveStatus;
  savedWord?: VlxSavedWord;
  reviewItem?: VlxReviewStateItem;
  alreadySaved?: boolean;
  alreadyQueued?: boolean;
};

type SaveAnalyticsWord = {
  word?: string;
  hub?: string;
};

type SavePaywallSurface = {
  prompt: VlxPaywallPrompt;
  userState: VlxPlanId;
};

const validSources = new Set<string>([
  "word_page",
  "hub_page",
  "extension",
  "app",
  "exam_pack",
  "manual"
]);

const visualCueSlugs = new Set([
  "dissonance",
  "abundance",
  "resilient",
  "laconic",
  "obfuscate",
  "lucid"
]);

function normalizeSlug(value?: string) {
  const slug = value?.trim().toLocaleLowerCase();

  return slug || undefined;
}

function normalizeSource(value?: string): VlxSavedWordSource | undefined {
  const extensionSource = normalizeExtensionSource(value);

  if (extensionSource) {
    return extensionSource;
  }

  const source = value?.trim();

  if (!source || !validSources.has(source)) {
    return undefined;
  }

  return source as VlxSavedWordSource;
}

function normalizeAnalyticsSource(value?: string) {
  const source = value?.trim();

  return source || undefined;
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

function formatSourceLabel(source?: string) {
  if (!source) {
    return "Source not provided";
  }

  return source
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .join(" ");
}

function canUseLocalStorage() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  } catch {
    return false;
  }
}

function toSavedWord(
  word: VlxQuizWord,
  source: VlxSavedWordSource | undefined,
  savedAt: string
): VlxSavedWord {
  return {
    slug: word.slug,
    word: word.word,
    image: word.image,
    definition: word.definition,
    hub: word.hub,
    source,
    savedAt
  };
}

function getVisualClass(slug: string) {
  return visualCueSlugs.has(slug) ? ` word-card__visual--${slug}` : "";
}

function getInitialOutcome(slug?: string, word?: VlxQuizWord): SaveOutcome {
  if (!slug) {
    return { status: "missing_slug" };
  }

  if (!word) {
    return { status: "unknown_word" };
  }

  return { status: "checking" };
}

function emitSaveWordAnalytics(input: {
  slug?: string;
  source?: string;
  result: VlxSaveWordResult;
  word?: SaveAnalyticsWord;
  packSource: VlxSavePackSource;
}) {
  emitVlxEvent(VLX_ANALYTICS_EVENTS.saveWordClick, {
    slug: input.slug ?? "",
    source: normalizeAnalyticsSource(input.source),
    user_state: "guest",
    result: input.result,
    word: input.word?.word,
    hub: input.word?.hub,
    pack_source: input.packSource
  });
}

function getAnalyticsPackSource(input: {
  packWord?: VlxQuizWord | null;
  word?: VlxQuizWord;
  wordFoundSource: VlxWordFoundSource;
}): VlxSavePackSource {
  if (!input.word) {
    return "unavailable";
  }

  if (!input.packWord) {
    return "mock";
  }

  if (input.wordFoundSource === "r2_pack") {
    return "r2";
  }

  if (input.wordFoundSource === "mock_fallback") {
    return "fallback";
  }

  return "unavailable";
}

export function SaveLandingView({
  slug,
  source,
  word: packWord,
  wordFoundSource = "missing"
}: SaveLandingViewProps) {
  const normalizedSlug = useMemo(() => normalizeSlug(slug), [slug]);
  const normalizedSource = useMemo(() => normalizeSource(source), [source]);
  const fallbackWord = useMemo(
    () =>
      normalizedSlug && !packWord
        ? getMockQuizWordBySlug(normalizedSlug)
        : undefined,
    [normalizedSlug, packWord]
  );
  const word = packWord ?? fallbackWord;
  const resolvedWordFoundSource: VlxWordFoundSource = word
    ? packWord
      ? wordFoundSource
      : "mock_fallback"
    : "missing";
  const packSource = getAnalyticsPackSource({
    packWord,
    word,
    wordFoundSource: resolvedWordFoundSource
  });
  const [outcome, setOutcome] = useState<SaveOutcome>(() =>
    getInitialOutcome(normalizedSlug, word)
  );
  const [paywallSurface, setPaywallSurface] =
    useState<SavePaywallSurface | null>(null);

  useEffect(() => {
    if (!normalizedSlug) {
      setOutcome({ status: "missing_slug" });
      setPaywallSurface(null);
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "missing",
        packSource: "unavailable"
      });
      return;
    }

    if (!word) {
      setOutcome({ status: "unknown_word" });
      setPaywallSurface(null);
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "missing",
        packSource
      });
      return;
    }

    if (!canUseLocalStorage()) {
      setOutcome({ status: "storage_unavailable" });
      setPaywallSurface(null);
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "storage_error",
        word,
        packSource
      });
      return;
    }

    try {
      const savedAt = new Date().toISOString();
      const savedWords = readSavedWords();
      const reviewState = readReviewState();
      const existingSavedWord = savedWords[word.slug];
      const savedWord =
        existingSavedWord ?? toSavedWord(word, normalizedSource, savedAt);
      const nextSavedWords = existingSavedWord
        ? savedWords
        : {
            ...savedWords,
            [savedWord.slug]: savedWord
          };

      if (!existingSavedWord) {
        writeSavedWords(nextSavedWords);
      }

      const reviewItem = createReviewItemFromSavedWord(savedWord, savedAt);
      const userState = readLocalPlanState().plan;
      const savedCount = Object.keys(readSavedWords()).length;
      const paywallPrompt = evaluateSaveLimitPaywall({
        plan: userState,
        savedCount,
        source: "save_confirmation"
      });

      setOutcome({
        status: "saved",
        savedWord,
        reviewItem,
        alreadySaved: Boolean(existingSavedWord),
        alreadyQueued: Boolean(reviewState[word.slug])
      });
      setPaywallSurface(
        paywallPrompt ? { prompt: paywallPrompt, userState } : null
      );
      emitSaveWordAnalytics({
        slug: word.slug,
        source,
        result: existingSavedWord ? "duplicate" : "saved",
        word: savedWord,
        packSource
      });
    } catch {
      setOutcome({ status: "storage_error" });
      setPaywallSurface(null);
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "storage_error",
        word,
        packSource
      });
    }
  }, [normalizedSlug, normalizedSource, packSource, source, word]);

  if (outcome.status === "checking") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Save"
          title="Preparing save."
          description="The app is checking the pack word and local review state."
        />
        <section className="empty-state" aria-live="polite">
          <h3>Reading local memory state</h3>
          <p>Saved words and review state are stored in this browser.</p>
        </section>
      </div>
    );
  }

  if (outcome.status === "missing_slug") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Save"
          title="No word selected."
          description="This save link is missing a slug, so the app cannot add a word to the review queue."
        />
        <EmptyState
          actionHref="/dashboard"
          actionLabel="View dashboard"
          body="Open a save link with a word slug, for example /save?slug=dissonance&source=word_page."
          title="Missing save target"
        />
      </div>
    );
  }

  if (outcome.status === "unknown_word") {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Save"
          title="Word not found."
          description={`The app could not find "${normalizedSlug}" in the current pack data.`}
        />
        <EmptyState
          actionHref="/dashboard"
          actionLabel="View dashboard"
          body="No saved word or review state was created for this link."
          title="Unknown save target"
        />
      </div>
    );
  }

  if (
    outcome.status === "storage_unavailable" ||
    outcome.status === "storage_error"
  ) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Save"
          title="Save unavailable."
          description="The app could not write to local storage, so this word was not added to review."
        />
        <EmptyState
          actionHref="/dashboard"
          actionLabel="View dashboard"
          body="Try again in a browser context where local storage is available."
          title="Local save failed"
        />
      </div>
    );
  }

  const savedWord = outcome.savedWord;
  const reviewItem = outcome.reviewItem;
  const reviewHref = savedWord
    ? `/review?mode=word&slug=${encodeURIComponent(savedWord.slug)}&limit=5`
    : "/review";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Save"
        title="Saved to review"
        description="This word is saved locally and ready for the memory loop."
        actions={
          <>
            <Link className="button button--primary" href={reviewHref}>
              Start 5-card review
            </Link>
            <Link className="button" href="/dashboard">
              View dashboard
            </Link>
          </>
        }
      />

      <section className="save-panel" aria-live="polite">
        {savedWord ? (
          <>
            <div
              aria-label={`Visual cue for ${savedWord.word}`}
              className={`word-card__visual save-panel__visual${getVisualClass(
                savedWord.slug
              )}`}
              role="img"
            />
            <div className="save-panel__body">
              <div>
                <span className="eyebrow">
                  {outcome.alreadySaved ? "Already saved" : "Local save complete"}
                </span>
                <h2>{savedWord.word}</h2>
                {savedWord.definition ? <p>{savedWord.definition}</p> : null}
              </div>
              <div className="tag-row">
                <span className="tag">{formatHubLabel(savedWord.hub)}</span>
                <span className="tag">
                  {source && !normalizedSource
                    ? "Source not recognized"
                    : formatSourceLabel(normalizedSource)}
                </span>
                {reviewItem ? (
                  <span className="tag">Box {reviewItem.box}</span>
                ) : null}
                {reviewItem ? (
                  <span className="tag">{reviewItem.mastery}</span>
                ) : null}
              </div>
              <p className="save-panel__note">
                {outcome.alreadyQueued
                  ? "The review item was already present, so no duplicate queue entry was created."
                  : "A new review item was created from the saved word."}
              </p>
            </div>
          </>
        ) : (
          <p className="save-panel__note">Preparing save confirmation.</p>
        )}
      </section>

      {paywallSurface ? (
        <PaywallPrompt
          prompt={paywallSurface.prompt}
          userState={paywallSurface.userState}
        />
      ) : null}
    </div>
  );
}
