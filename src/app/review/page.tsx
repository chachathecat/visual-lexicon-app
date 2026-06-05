import type { Metadata } from "next";

import { ReviewSessionView } from "@/components/views/review-session-view";
import { getHubPack, resolveWordPack } from "@/lib/packs";
import type { VlxQuizWord } from "@/lib/packs/types";
import {
  parseReviewRouteContract,
  type VlxReviewRouteContract,
  type VlxReviewRouteSearchParams
} from "@/lib/review/route-contract";

type ReviewPageProps = {
  searchParams: VlxReviewRouteSearchParams;
};

export const metadata: Metadata = {
  title: "Review"
};

function formatHubLabel(hub: string) {
  return hub
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function resolveRouteSession(route: VlxReviewRouteContract) {
  if (route.mode === "word") {
    if (!route.slug) {
      return {
        label: "Focused word",
        words: [] satisfies VlxQuizWord[],
        emptyTitle: "No word selected",
        emptyBody:
          "This focused review link is missing a slug, so no review card can be built."
      };
    }

    const resolvedWord = await resolveWordPack(route.slug);

    return {
      label: resolvedWord.word
        ? `${resolvedWord.word.word} focus`
        : "Focused word",
      words: resolvedWord.word ? [resolvedWord.word] : [],
      emptyTitle: "Word not found",
      emptyBody: `No review card is available for "${route.slug}" in the current pack data.`
    };
  }

  if (route.mode === "hub") {
    if (!route.hub) {
      return {
        label: "Hub review",
        words: [] satisfies VlxQuizWord[],
        emptyTitle: "No hub selected",
        emptyBody:
          "This hub review link is missing a hub slug, so no review cards can be built."
      };
    }

    const hubPack = await getHubPack(route.hub);

    return {
      label: hubPack?.title ?? `${formatHubLabel(route.hub)} hub`,
      words: hubPack?.words.slice(0, route.limit) ?? [],
      emptyTitle: "Hub pack not found",
      emptyBody: `No review cards are available for "${route.hub}" in the current pack data.`
    };
  }

  return undefined;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const route = parseReviewRouteContract(searchParams);
  const routeSession = await resolveRouteSession(route);

  return (
    <ReviewSessionView
      limit={route.limit}
      mode={route.mode}
      routeSession={routeSession}
    />
  );
}
