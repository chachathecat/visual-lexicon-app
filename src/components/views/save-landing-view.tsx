"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import type {
  VlxSaveWordFoundSource,
  VlxSaveWordResult
} from "@/lib/analytics";
import { getMockQuizWordBySlug } from "@/lib/packs/mock-data";
import type { VlxQuizWord } from "@/lib/packs/types";
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
  wordFoundSource?: VlxSaveWordFoundSource;
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
  wordFoundSource: VlxSaveWordFoundSource;
}) {
  emitVlxEvent(VLX_ANALYTICS_EVENTS.saveWordClick, {
    slug: input.slug ?? "",
    source: normalizeAnalyticsSource(input.source),
    result: input.result,
    word: input.word?.word,
    hub: input.word?.hub,
    word_found_source: input.wordFoundSource
  });
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
  const resolvedWordFoundSource: VlxSaveWordFoundSource = word
    ? packWord
      ? wordFoundSource
      : "mock_fallback"
    : "missing";
  const [outcome, setOutcome] = useState<SaveOutcome>(() =>
    getInitialOutcome(normalizedSlug, word)
  );

  useEffect(() => {
    if (!normalizedSlug) {
      setOutcome({ status: "missing_slug" });
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "missing",
        wordFoundSource: "missing"
      });
      return;
    }

    if (!word) {
      setOutcome({ status: "unknown_word" });
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "missing",
        wordFoundSource: "missing"
      });
      return;
    }

    if (!canUseLocalStorage()) {
      setOutcome({ status: "storage_unavailable" });
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "storage_error",
        word,
        wordFoundSource: resolvedWordFoundSource
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

      if (!existingSavedWord) {
        writeSavedWords({
          ...savedWords,
          [savedWord.slug]: savedWord
        });
      }

      const reviewItem = createReviewItemFromSavedWord(savedWord, savedAt);

      setOutcome({
        status: "saved",
        savedWord,
        reviewItem,
        alreadySaved: Boolean(existingSavedWord),
        alreadyQueued: Boolean(reviewState[word.slug])
      });
      emitSaveWordAnalytics({
        slug: word.slug,
        source,
        result: existingSavedWord ? "duplicate" : "saved",
        word: savedWord,
        wordFoundSource: resolvedWordFoundSource
      });
    } catch {
      setOutcome({ status: "storage_error" });
      emitSaveWordAnalytics({
        slug: normalizedSlug,
        source,
        result: "storage_error",
        word,
        wordFoundSource: resolvedWordFoundSource
      });
    }
  }, [normalizedSlug, normalizedSource, resolvedWordFoundSource, source, word]);

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
    </div>
  );
}
