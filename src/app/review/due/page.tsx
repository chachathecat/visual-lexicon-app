import type { Metadata } from "next";

import { ReviewSessionView } from "@/components/views/review-session-view";

export const metadata: Metadata = {
  title: "Due Review"
};

export default function DueReviewPage() {
  return <ReviewSessionView mode="due" />;
}
