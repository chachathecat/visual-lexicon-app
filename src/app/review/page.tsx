import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import { dueReviewItems, mockReviewItems, weakReviewItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Review"
};

export default function ReviewPage() {
  const previewItems = mockReviewItems.slice(0, 5);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Review"
        title="A short session shell for active recall."
        description="This phase shows the review routes and card surface with mock data only."
        actions={
          <>
            <Link className="button button--primary" href="/review/due">
              Start Due Review
            </Link>
            <Link className="button" href="/review/weak">
              Practice Weak
            </Link>
          </>
        }
      />

      <section className="section" aria-labelledby="review-modes">
        <div className="card-grid card-grid--two">
          <div className="empty-state">
            <h3>Due Review</h3>
            <p>{dueReviewItems.length} words are ready for spaced review.</p>
            <div className="actions">
              <Link className="button button--quiet" href="/review/due">
                Open due queue
              </Link>
            </div>
          </div>
          <div className="empty-state">
            <h3>Weak Review</h3>
            <p>{weakReviewItems.length} words need focused recall practice.</p>
            <div className="actions">
              <Link className="button button--quiet" href="/review/weak">
                Open weak queue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="session-preview">
        <div className="section-heading">
          <h2 className="section-title" id="session-preview">
            Session preview
          </h2>
          <span className="section-note">Five mock cards</span>
        </div>
        {previewItems.length ? (
          <div className="card-grid">
            {previewItems.map((item) => (
              <WordCard ctaLabel="Preview card" item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/saved"
            actionLabel="Open saved"
            body="Review cards will appear after saved words enter memory state."
            title="No review cards"
          />
        )}
      </section>
    </div>
  );
}
