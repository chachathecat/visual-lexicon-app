import Link from "next/link";

type MissionPanelProps = {
  dueCount: number;
  weakCount: number;
  masteredCount: number;
  reviewedToday: number;
  startReviewHref: "/review" | "/review/due";
  hasAnyLocalData: boolean;
};

export function MissionPanel({
  dueCount,
  weakCount,
  masteredCount,
  reviewedToday,
  startReviewHref,
  hasAnyLocalData
}: MissionPanelProps) {
  return (
    <section className="mission-panel" aria-labelledby="mission-title">
      <div>
        <span className="eyebrow">Today</span>
        <h1 id="mission-title">Today&rsquo;s Memory Mission</h1>
        <p className="mission-metric">
          {dueCount} words due &middot; {weakCount} weak &middot; 3 minutes
        </p>
        {!hasAnyLocalData ? (
          <p className="mission-note">
            Start a short starter session to create real review state.
          </p>
        ) : null}
        <div className="actions">
          <Link className="button button--primary" href={startReviewHref}>
            Start Review
          </Link>
          <Link className="button" href="/review/weak">
            Practice Weak Words
          </Link>
          <Link className="button button--quiet" href="/review">
            Continue Starter Deck
          </Link>
        </div>
      </div>
      <div className="mission-panel__summary" aria-label="Memory state">
        <div>
          <span className="mission-panel__value">{reviewedToday}</span>
          <span className="mission-panel__label">Reviewed today</span>
        </div>
        <div>
          <span className="mission-panel__value">{weakCount}</span>
          <span className="mission-panel__label">Weak words</span>
        </div>
        <div>
          <span className="mission-panel__value">{masteredCount}</span>
          <span className="mission-panel__label">Mastered</span>
        </div>
      </div>
    </section>
  );
}
