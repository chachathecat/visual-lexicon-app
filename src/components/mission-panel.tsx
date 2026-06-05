import Link from "next/link";

import { dashboardStats } from "@/lib/mock-data";

export function MissionPanel() {
  return (
    <section className="mission-panel" aria-labelledby="mission-title">
      <div>
        <span className="eyebrow">Today</span>
        <h2 id="mission-title">Today&apos;s Memory Mission</h2>
        <p className="mission-metric">
          {dashboardStats.dueCount} words due | {dashboardStats.weakCount} weak
          | 3 minutes
        </p>
        <div className="actions">
          <Link className="button button--primary" href="/review/due">
            Start Review
          </Link>
          <Link className="button" href="/review/weak">
            Practice Weak Words
          </Link>
          <Link className="button button--quiet" href="/review">
            Continue Deck
          </Link>
        </div>
      </div>
      <div className="metric-grid" aria-label="Memory state">
        <div className="metric-card">
          <span className="metric-card__value">{dashboardStats.dueCount}</span>
          <span className="metric-card__label">Due today</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__value">{dashboardStats.weakCount}</span>
          <span className="metric-card__label">Weak words</span>
        </div>
        <div className="metric-card">
          <span className="metric-card__value">
            {dashboardStats.masteredCount}
          </span>
          <span className="metric-card__label">Mastered</span>
        </div>
      </div>
    </section>
  );
}
