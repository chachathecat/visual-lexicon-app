import type { Metadata } from "next";

import { SaveLandingView } from "@/components/views/save-landing-view";

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

export default function SavePage({ searchParams }: SavePageProps) {
  return (
    <SaveLandingView
      slug={firstParam(searchParams.slug)}
      source={firstParam(searchParams.source)}
    />
  );
}
