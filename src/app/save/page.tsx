import type { Metadata } from "next";

import { SaveLandingView } from "@/components/views/save-landing-view";
import { resolveWordPack } from "@/lib/packs";

type SavePageProps = {
  searchParams: {
    slug?: string | string[];
    source?: string | string[];
  };
};

export const metadata: Metadata = {
  title: "Save"
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSlug(value?: string) {
  const slug = value?.trim().toLocaleLowerCase();

  return slug || undefined;
}

export default async function SavePage({ searchParams }: SavePageProps) {
  const slug = normalizeSlug(firstParam(searchParams.slug));
  const resolvedWord = slug ? await resolveWordPack(slug) : null;

  return (
    <SaveLandingView
      slug={slug}
      source={firstParam(searchParams.source)}
      word={resolvedWord?.word ?? null}
      wordFoundSource={resolvedWord?.wordFoundSource ?? "missing"}
    />
  );
}
