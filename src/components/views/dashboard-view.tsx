import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { MissionPanel } from "@/components/mission-panel";
import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import {
  dashboardStats,
  dueReviewItems,
  mockReviewItems,
  newSavedItems,
  weakReviewItems
} from "@/lib/mock-data";

export function DashboardView() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Learning workspace"
        title="Turn saved visual words into remembered words."
        description="A focused app shell for saved words, review sessions, and memory state."
        actions={
          <>
            <Link className="button button--primary" href="/review/due">
              Start Review
            </Link>
            <Link className="button" href="/saved">
              Saved Library
            </Link>
          </>
        }
      />

      <MissionPanel />

      <section className="section" aria-labelledby="review-queues">
        <div className="section-heading">
          <h2 className="section-title" id="review-queues">
            Review queues
          </h2>
          <span className="section-note">
            {dashboardStats.weeklyReviewedWords} words reviewed this week
          </span>
        </div>
        <div className="card-grid">
          {dueReviewItems.slice(0, 1).map((item) => (
            <WordCard ctaLabel="Review due" item={item} key={item.slug} />
          ))}
          {weakReviewItems.slice(0, 1).map((item) => (
            <WordCard ctaLabel="Practice weak" item={item} key={item.slug} />
          ))}
          {newSavedItems.slice(0, 1).map((item) => (
            <WordCard ctaLabel="Start learning" item={item} key={item.slug} />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="saved-library">
        <div className="section-heading">
          <h2 className="section-title" id="saved-library">
            Saved Library
          </h2>
          <Link className="button button--quiet" href="/saved">
            View all saved
          </Link>
        </div>
        {mockReviewItems.length ? (
          <div className="card-grid">
            {mockReviewItems.slice(0, 3).map((item) => (
              <WordCard item={item} key={item.slug} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/packs"
            actionLabel="Browse packs"
            body="Saved words will appear here after a learner adds the first visual word."
            title="No saved words yet"
          />
        )}
      </section>
    </div>
  );
}
