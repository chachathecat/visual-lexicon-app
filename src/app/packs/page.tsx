import type { Metadata } from "next";

import { PacksV2View } from "@/components/views/packs-v2-view";
import { getPackPreviewCatalog } from "@/lib/packs/preview";

export const metadata: Metadata = {
  title: "Packs"
};

export default async function PacksPage() {
  const packs = await getPackPreviewCatalog();

  return <PacksV2View packs={packs} />;
}
