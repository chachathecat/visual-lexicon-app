"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  resolveAliasMatches,
  type VlxAliasMatch,
  type VlxLanguageCode
} from "@/lib/multilingual";

const ALIAS_SEARCH_SOURCE = "alias_search";

const languageLabels: Record<VlxLanguageCode, string> = {
  en: "English",
  ko: "Korean",
  ja: "Japanese"
};

function formatLanguagePair(match: VlxAliasMatch) {
  return `${languageLabels[match.sourceLanguage]} to ${
    languageLabels[match.targetLanguage]
  }`;
}

function detectQueryLanguage(
  query: string,
  match?: VlxAliasMatch
): VlxLanguageCode | undefined {
  if (match) {
    return match.sourceLanguage;
  }

  if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/u.test(query)) {
    return "ko";
  }

  if (/[\u3040-\u30ff]/u.test(query)) {
    return "ja";
  }

  return undefined;
}

function buildSaveHref(slug: string) {
  return `/save?slug=${encodeURIComponent(slug)}&source=${ALIAS_SEARCH_SOURCE}`;
}

export function MultilingualAliasSearch() {
  const [query, setQuery] = useState("");
  const lastEmittedKey = useRef<string>();
  const trimmedQuery = query.trim();
  const matches = useMemo(
    () =>
      resolveAliasMatches(trimmedQuery, {
        targetLanguage: "en",
        limit: 4
      }),
    [trimmedQuery]
  );
  const queryLanguage = detectQueryLanguage(trimmedQuery, matches[0]);
  const eventKey = `${trimmedQuery.length}|${
    queryLanguage ?? "unknown"
  }|${matches[0]?.slug ?? "none"}|${matches.length ? "matched" : "no_match"}`;

  useEffect(() => {
    if (!trimmedQuery || lastEmittedKey.current === eventKey) {
      return;
    }

    lastEmittedKey.current = eventKey;
    emitVlxEvent(VLX_ANALYTICS_EVENTS.aliasSearch, {
      source: ALIAS_SEARCH_SOURCE,
      query_language: queryLanguage,
      matched_slug: matches[0]?.slug,
      result: matches.length ? "matched" : "no_match"
    });
  }, [eventKey, matches, queryLanguage, trimmedQuery]);

  return (
    <section
      aria-labelledby="alias-search-title"
      className="alias-search"
    >
      <div className="alias-search__heading">
        <span className="eyebrow">Alias Search</span>
        <h2 id="alias-search-title">Alias search</h2>
        <p>
          Korean and Japanese aliases resolve only to canonical English Visual
          Lexicon cards.
        </p>
      </div>

      <div className="alias-search__control">
        <label className="alias-search__label" htmlFor="alias-search-query">
          Search alias
        </label>
        <input
          autoComplete="off"
          className="alias-search__input"
          id="alias-search-query"
          inputMode="search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="불협화음 / 曖昧にする"
          spellCheck={false}
          type="search"
          value={query}
        />

        <div aria-live="polite" className="alias-search__results">
          {!trimmedQuery ? (
            <p className="alias-search__empty">
              Enter a Korean or Japanese alias to check the English card.
            </p>
          ) : matches.length ? (
            matches.map((match) => (
              <article className="alias-search__match" key={match.alias}>
                <div className="alias-search__match-main">
                  <div>
                    <span className="alias-search__alias">{match.alias}</span>
                    <h3>{match.word}</h3>
                  </div>
                  <span className="tag">{formatLanguagePair(match)}</span>
                </div>
                <div className="tag-row">
                  <span className="tag">slug: {match.slug}</span>
                  <span className="tag">source: {match.matchSource}</span>
                </div>
                <div className="actions">
                  <Link className="button button--primary" href={`/word/${match.slug}`}>
                    View card
                  </Link>
                  <Link className="button button--quiet" href={buildSaveHref(match.slug)}>
                    Save to review
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="alias-search__empty">
              No alias match found. No card or save link was created.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
