import type { Metadata } from "next";

import { SavedLibraryView } from "@/components/views/saved-library-view";

export const metadata: Metadata = {
  title: "Saved Library"
};

export default function SavedPage() {
  return <SavedLibraryView />;
}
