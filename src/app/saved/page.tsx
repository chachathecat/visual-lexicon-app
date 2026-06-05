import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import { mockReviewItems, newSavedItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Saved"
};

export default function SavedPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Saved words"
        title="Saved words enter the review path."
        description="The library is placed after learning actions so saved words keep moving toward recall."
        actions={
          <>
            <Link className="button button--primary" href="/review">
              Continue Deck
            </Link>
            <Link className="button" href="/packs">
              Browse Packs
            </Link>
          </>
        }
      />

      <section className="section" aria-labelledby="new-saved">
        <div className="section-heading">
          <h2 className="section-title" id="new-saved">
            New saved
          </h2>
          <span className="section-note">Ready to become review items</span>
        </div>
        {newSavedItems.length ? (
          <div className="card-grid">
            {newSavedItems.map((item) => (
              <WordCard ctaLabel="Start learning" item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/packs"
            actionLabel="Find words"
            body="New saves will appear here before their first review."
            title="No new saved words"
          />
        )}
      </section>

      <section className="section" aria-labelledby="saved-library">
        <div className="section-heading">
          <h2 className="section-title" id="saved-library">
            Saved Library
          </h2>
          <span className="section-note">{mockReviewItems.length} mock words</span>
        </div>
        {mockReviewItems.length ? (
          <div className="card-grid">
            {mockReviewItems.map((item) => (
              <WordCard item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/packs"
            actionLabel="Browse packs"
            body="A learner's saved visual words will appear here."
            title="No saved words yet"
          />
        )}
      </section>
    </div>
  );
}
