import Link from "next/link";

import type { MockPack } from "@/lib/mock-data";

export function PackCard({ pack }: { pack: MockPack }) {
  return (
    <article className="pack-card">
      <div className="pack-card__topline">
        <span className="eyebrow">{pack.mode}</span>
        <span className="tag">{pack.wordCount} words</span>
      </div>
      <h3>{pack.title}</h3>
      <p>{pack.description}</p>
      <div className="tag-row">
        <span className="tag">{pack.priceTier}</span>
        <span className="tag">{pack.updatedAt}</span>
      </div>
      <div className="actions">
        <Link className="button button--quiet" href={`/packs/${pack.packId}`}>
          View pack
        </Link>
      </div>
    </article>
  );
}
