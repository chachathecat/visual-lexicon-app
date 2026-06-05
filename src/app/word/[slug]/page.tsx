import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
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
        <WordCard ctaLabel="Back to word" item={word} />
        <div className="detail-panel">
          <h2 className="section-title">Memory state</h2>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Mastery</dt>
              <dd>{word.mastery}</dd>
            </div>
            <div className="detail-row">
              <dt>Box</dt>
              <dd>{word.box}</dd>
            </div>
            <div className="detail-row">
              <dt>Weak score</dt>
              <dd>{word.weakScore}</dd>
            </div>
            <div className="detail-row">
              <dt>Recall</dt>
              <dd>
                {word.correct} correct, {word.wrong} wrong
              </dd>
            </div>
            <div className="detail-row">
              <dt>Example</dt>
              <dd>{word.example}</dd>
            </div>
            <div className="detail-row">
              <dt>Memory hook</dt>
              <dd>{word.memoryHook}</dd>
            </div>
            <div className="detail-row">
              <dt>Next due</dt>
              <dd>{word.nextDueAt ?? "Not scheduled"}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
