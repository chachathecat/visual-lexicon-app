import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { WordCard } from "@/components/word-card";
import { getPackById, getPackWords, mockPacks } from "@/lib/mock-data";

type PackPageProps = {
  params: {
    packId: string;
  };
};

export function generateStaticParams() {
  return mockPacks.map((pack) => ({
    packId: pack.packId
  }));
}

export function generateMetadata({ params }: PackPageProps): Metadata {
  const pack = getPackById(params.packId);

  return {
    title: pack ? pack.title : "Pack"
  };
}

export default function PackDetailPage({ params }: PackPageProps) {
  const pack = getPackById(params.packId);

  if (!pack) {
    notFound();
  }

  const words = getPackWords(pack);

  return (
    <div className="page">
      <PageHeader
        eyebrow={pack.mode}
        title={pack.title}
        description={pack.description}
      />

      <section className="section" aria-labelledby="pack-detail">
        <div className="detail-grid">
          <div className="settings-panel">
            <h2 className="section-title" id="pack-detail">
              Pack details
            </h2>
            <dl className="detail-list">
              <div className="detail-row">
                <dt>Pack ID</dt>
                <dd>{pack.packId}</dd>
              </div>
              <div className="detail-row">
                <dt>Tier</dt>
                <dd>{pack.priceTier}</dd>
              </div>
              <div className="detail-row">
                <dt>Words</dt>
                <dd>{pack.wordCount}</dd>
              </div>
              <div className="detail-row">
                <dt>Updated</dt>
                <dd>{pack.updatedAt}</dd>
              </div>
            </dl>
          </div>
          <div className="section">
            <h2 className="section-title">Preview words</h2>
            <div className="card-grid card-grid--two">
              {words.map((item) => (
                <WordCard ctaLabel="Open word" item={item} key={item.slug} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
