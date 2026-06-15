import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PackDetailV2View } from "@/components/views/packs-v2-view";
import { getPackPreviewById, packPreviewIds } from "@/lib/packs/preview";

type PackPageProps = {
  params: {
    packId: string;
  };
};

export function generateStaticParams() {
  return packPreviewIds.map((packId) => ({
    packId
  }));
}

export async function generateMetadata({
  params
}: PackPageProps): Promise<Metadata> {
  const pack = await getPackPreviewById(params.packId);

  return {
    title: pack ? pack.title : "Pack"
  };
}

export default async function PackDetailPage({ params }: PackPageProps) {
  const pack = await getPackPreviewById(params.packId);

  if (!pack) {
    notFound();
  }

  return <PackDetailV2View pack={pack} />;
}
