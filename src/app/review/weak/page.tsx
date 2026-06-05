import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import { weakReviewItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Weak Review"
};

export default function WeakReviewPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Weak words"
        title="Focused practice for fragile recall."
        description="Weak words are separated from due review so mistakes stay visible."
        actions={
          <Link className="button button--primary" href="/review/due">
            Start Due Review
          </Link>
        }
      />

      <section className="section" aria-labelledby="weak-list">
        <div className="section-heading">
          <h2 className="section-title" id="weak-list">
            Weak queue
          </h2>
          <span className="section-note">{weakReviewItems.length} words</span>
        </div>
        {weakReviewItems.length ? (
          <div className="card-grid">
            {weakReviewItems.map((item) => (
              <WordCard ctaLabel="Practice word" item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/review"
            actionLabel="Review deck"
            body="Weak words will appear here after repeated mistakes or high weakScore."
            title="No weak words"
          />
        )}
      </section>
    </div>
  );
}
