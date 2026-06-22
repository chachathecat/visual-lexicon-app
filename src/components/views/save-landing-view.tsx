"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";

import { PaywallPrompt } from "@/components/paywall-prompt";
import { ArrowRightIcon, CheckIcon } from "@/components/track-b/icons";
import {
  TrackBAppShell,
  TrackBEmptyState,
  TrackBPageHeader
} from "@/components/track-b";
import { WordVisualImage } from "@/components/word-visual-image";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import type { VlxSaveWordResult } from "@/lib/analytics";
import { readLocalPlanState, type VlxPlanId } from "@/lib/entitlements";
import { normalizeExtensionSource } from "@/lib/extension/bridge";
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
import {
  getWordVisualFallbackClass,
  getWordVisualImage
} from "@/lib/word-visuals";

type SaveLandingViewProps = {
  slug?: string;
  source?: string;
  word?: VlxQuizWord | null;
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
  "alias_search",
  "app",
  "exam_pack",
  "manual"
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

function getSavedWordVisualClass(savedWord: VlxSavedWord) {
  if (getWordVisualImage(savedWord.slug) || savedWord.image) {
    return " word-card__visual--image";
  }

  return getWordVisualFallbackClass(savedWord.slug);
}

function getSavedWordVisualStyle(
  savedWord: VlxSavedWord
): CSSProperties | undefined {
  return !getWordVisualImage(savedWord.slug) && savedWord.image
    ? { backgroundImage: `url("${savedWord.image}")` }
    : undefined;
}

function getSavedWordLocalVisual(savedWord: VlxSavedWord) {
  return getWordVisualImage(savedWord.slug);
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
  hasLocalReviewState?: boolean;
  hasLocalSavedWord?: boolean;
}) {
  emitVlxEvent(VLX_ANALYTICS_EVENTS.saveWord, {
    slug: input.slug ?? "",
    source: normalizeAnalyticsSource(input.source),
    result: input.result,
    word: input.word?.word,
    hasLocalReviewState: input.hasLocalReviewState,
    hasLocalSavedWord: input.hasLocalSavedWord
  });
}

function SaveShell({ children }: { children: ReactNode }) {
  return (
    <TrackBAppShell
      activeItemId="save"
      currentPath="/save"
    >
      {children}
    </TrackBAppShell>
  );
}

function getSavedWordPhonetic(savedWord: VlxSavedWord) {
  return `/${savedWord.word.toLocaleLowerCase()}/`;
}

function getSaveMemoryState(reviewItem?: VlxReviewStateItem) {
  if (!reviewItem || reviewItem.mastery === "New") {
    return "new";
  }

  if (reviewItem.mastery === "Weak" || reviewItem.weakScore > 0) {
    return "weak";
  }

  return "due";
}

function getSaveStatusMessage(outcome: SaveOutcome) {
  if (outcome.status === "checking") {
    return "Loading save state from local storage.";
  }

  if (outcome.status === "missing_slug") {
    return "Save failed because no word slug was provided.";
  }

  if (outcome.status === "unknown_word") {
    return "Save failed because the word was not found in the current pack data.";
  }

  if (
    outcome.status === "storage_unavailable" ||
    outcome.status === "storage_error"
  ) {
    return "Save failed because local storage could not be written.";
  }

  const savedWord = outcome.savedWord;

  if (!savedWord) {
    return "Preparing save confirmation.";
  }

  const queueStatus = outcome.alreadySaved
    ? `${savedWord.word} was already in your saved words.`
    : `${savedWord.word} was added to your saved words.`;
  const reviewStatus = outcome.alreadyQueued
    ? "The existing review state was preserved."
    : "A local review state item was created.";
  const masteryStatus = outcome.reviewItem?.mastery ?? "New";

  return `${queueStatus} ${reviewStatus} Memory state is ${masteryStatus}.`;
}

function SaveMemoryPill({
  state
}: {
  state: "due" | "weak" | "new";
}) {
  const label =
    state === "new" ? "New" : state === "weak" ? "Needs work" : "Due now";

  return (
    <span className={`save-v2-memory-pill save-v2-memory-pill--${state}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}

export function SaveLandingView({
  slug,
  source,
  word: packWord
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
        result: "missing"
      });
      return;
    }

    if (!word) {
      setOutcome({ status: "unknown_word" });
      setPaywallSurface(null);
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "missing"
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
        word
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
      const hasLocalReviewState = Boolean(readReviewState()[word.slug]);
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
        hasLocalReviewState,
        hasLocalSavedWord: true
      });
    } catch {
      setOutcome({ status: "storage_error" });
      setPaywallSurface(null);
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "storage_error",
        word
      });
    }
  }, [normalizedSlug, normalizedSource, source, word]);

  if (outcome.status === "checking") {
    return (
      <SaveShell>
        <div
          aria-atomic="true"
          aria-live="polite"
          className="sr-only"
          role="status"
        >
          {getSaveStatusMessage(outcome)}
        </div>
        <TrackBPageHeader
          eyebrow="Save"
          title="Preparing save."
          description="The app is checking the pack word and local review state."
        />
        <TrackBEmptyState
          body="Saved words and review state are stored in this browser."
          title="Reading local memory state"
        />
      </SaveShell>
    );
  }

  if (outcome.status === "missing_slug") {
    return (
      <SaveShell>
        <div className="sr-only" role="alert">
          {getSaveStatusMessage(outcome)}
        </div>
        <TrackBPageHeader
          eyebrow="Save"
          title="No word selected."
          description="This save link is missing a slug, so the app cannot add a word to the review queue."
        />
        <TrackBEmptyState
          action={{ href: "/dashboard", label: "Go to dashboard" }}
          body="Open a save link with a word slug, for example /save?slug=dissonance&source=word_page."
          title="Missing save target"
        />
      </SaveShell>
    );
  }

  if (outcome.status === "unknown_word") {
    return (
      <SaveShell>
        <div className="sr-only" role="alert">
          {getSaveStatusMessage(outcome)}
        </div>
        <TrackBPageHeader
          eyebrow="Save"
          title="Word not found."
          description={`The app could not find "${normalizedSlug}" in the current pack data.`}
        />
        <TrackBEmptyState
          action={{ href: "/dashboard", label: "Go to dashboard" }}
          body="No saved word or review state was created for this link."
          title="Unknown save target"
        />
      </SaveShell>
    );
  }

  if (
    outcome.status === "storage_unavailable" ||
    outcome.status === "storage_error"
  ) {
    return (
      <SaveShell>
        <div className="sr-only" role="alert">
          {getSaveStatusMessage(outcome)}
        </div>
        <TrackBPageHeader
          eyebrow="Save"
          title="Save unavailable."
          description="The app could not write to local storage, so this word was not added to review."
        />
        <TrackBEmptyState
          action={{ href: "/dashboard", label: "Go to dashboard" }}
          body="Try again in a browser context where local storage is available."
          title="Local save failed"
        />
      </SaveShell>
    );
  }

  const savedWord = outcome.savedWord;
  const reviewItem = outcome.reviewItem;
  const reviewHref = savedWord
    ? `/review?mode=word&slug=${encodeURIComponent(savedWord.slug)}&limit=5`
    : "/review";

  return (
    <SaveShell>
      <section className="save-v2-confirm" aria-labelledby="save-v2-heading">
        {savedWord ? (
          <>
            <div
              aria-atomic="true"
              aria-live="polite"
              className="sr-only"
              data-testid="save-live-region"
              role="status"
            >
              {getSaveStatusMessage(outcome)}
            </div>
            <div className="save-v2-status">
              <span aria-hidden="true">
                <CheckIcon size={11} strokeWidth={3} />
              </span>
              <strong>Added to your review queue</strong>
              <span className="sr-only">
                This word is now in your review queue.
              </span>
            </div>

            <header className="save-v2-heading">
              <h1 id="save-v2-heading">{savedWord.word}</h1>
              <p>{getSavedWordPhonetic(savedWord)}</p>
            </header>

            <div className="save-v2-card">
              <div
                aria-label={`Visual cue for ${savedWord.word}`}
                className={`word-card__visual save-v2-card__visual${getSavedWordVisualClass(
                  savedWord
                )}`}
                role="img"
                style={getSavedWordVisualStyle(savedWord)}
              >
                {getSavedWordLocalVisual(savedWord) ? (
                  <WordVisualImage
                    sizes="(max-width: 768px) 100vw, 560px"
                    src={getSavedWordLocalVisual(savedWord) ?? ""}
                  />
                ) : null}
              </div>
              <div className="save-v2-card__body">
                <SaveMemoryPill state={getSaveMemoryState(reviewItem)} />
                {savedWord.definition ? <p>{savedWord.definition}</p> : null}
                <div className="save-v2-memory-hook">
                  <span>Visual memory</span>
                  <p>
                    {word?.memoryHook ??
                      "The image becomes the recall cue when this word returns."}
                  </p>
                </div>
              </div>
            </div>

            <p className="save-v2-note">
              We&apos;ll bring this back before you forget it. Your first review is
              in a few minutes.
            </p>

            <div className="save-v2-actions">
              <Link className="track-b-button track-b-button--primary" href={reviewHref}>
                <span>Review now</span>
                <ArrowRightIcon size={15} />
              </Link>
              <Link
                aria-label="Go to dashboard"
                className="track-b-button track-b-button--quiet"
                href="/dashboard"
              >
                Back to dashboard
              </Link>
            </div>
          </>
        ) : (
          <p className="save-v2-note">Preparing save confirmation.</p>
        )}
      </section>

      {paywallSurface ? (
        <PaywallPrompt
          prompt={paywallSurface.prompt}
          userState={paywallSurface.userState}
        />
      ) : null}
    </SaveShell>
  );
}
