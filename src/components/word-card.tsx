import Link from "next/link";

import type { MockReviewItem } from "@/lib/mock-data";

type WordCardProps = {
  item: MockReviewItem;
  ctaLabel?: string;
};

export function WordCard({ item, ctaLabel = "Open word" }: WordCardProps) {
  const masteryClass =
    item.mastery === "Weak"
      ? "tag tag--weak"
      : item.mastery === "Strong" || item.mastery === "Mastered"
        ? "tag tag--strong"
        : "tag";

  return (
    <article className="word-card">
      <div
        aria-label={`Visual cue for ${item.word}`}
        className={`word-card__visual word-card__visual--${item.visual}`}
        role="img"
      />
      <div className="word-card__body">
        <div className="word-card__topline">
          <h3>{item.word}</h3>
          <span className={masteryClass}>{item.mastery}</span>
        </div>
        <p>{item.definition}</p>
        <div className="tag-row">
          <span className="tag">Box {item.box}</span>
          <span className="tag">{item.hub}</span>
        </div>
        <div className="actions">
          <Link className="button button--quiet" href={`/word/${item.slug}`}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
