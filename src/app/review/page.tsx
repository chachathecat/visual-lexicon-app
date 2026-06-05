import type { Metadata } from "next";

import { ReviewSessionView } from "@/components/views/review-session-view";

export const metadata: Metadata = {
  title: "Review"
};

export default function ReviewPage() {
  return <ReviewSessionView mode="mixed" />;
}
