import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import { dueReviewItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Due Review"
};

export default function DueReviewPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Due review"
        title="Words scheduled for today."
        description="A route shell for the spaced review queue. The SRS engine will replace this mock list in a later phase."
        actions={
          <Link className="button button--primary" href="/review">
            Review Overview
          </Link>
        }
      />

      <section className="section" aria-labelledby="due-list">
        <div className="section-heading">
          <h2 className="section-title" id="due-list">
            Due queue
          </h2>
          <span className="section-note">{dueReviewItems.length} words</span>
        </div>
        {dueReviewItems.length ? (
          <div className="card-grid">
            {dueReviewItems.map((item) => (
              <WordCard ctaLabel="Review word" item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/saved"
            actionLabel="Open saved"
            body="Due words will appear here when their nextDueAt time arrives."
            title="No words due today"
          />
        )}
      </section>
    </div>
  );
}
