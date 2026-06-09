import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import { WordMemoryStatePanel } from "@/components/views/word-memory-state-panel";
import { getWordBySlug, mockReviewItems } from "@/lib/mock-data";

type WordPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return mockReviewItems.map((word) => ({
    slug: word.slug
  }));
}

export function generateMetadata({ params }: WordPageProps): Metadata {
  const word = getWordBySlug(params.slug);

  return {
    title: word ? word.word : "Word"
  };
}

export default function WordPage({ params }: WordPageProps) {
  const word = getWordBySlug(params.slug);

  if (!word) {
    notFound();
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={word.hub}
        title={word.word}
        description={word.definition}
        actions={
          <>
            <Link className="button button--primary" href="/review">
              Review
            </Link>
            <Link className="button" href="/saved">
              Saved Library
            </Link>
          </>
        }
      />

      <section className="detail-grid" aria-label={`${word.word} details`}>
        <WordCard
          ctaLabel="Back to word"
          item={word}
          showMemoryState={false}
        />
        <WordMemoryStatePanel slug={word.slug} />
      </section>

      <section className="detail-panel" aria-labelledby="word-notes">
        <h2 className="section-title" id="word-notes">
          Word notes
        </h2>
        <div>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Example</dt>
              <dd>{word.example}</dd>
            </div>
            <div className="detail-row">
              <dt>Memory hook</dt>
              <dd>{word.memoryHook}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
