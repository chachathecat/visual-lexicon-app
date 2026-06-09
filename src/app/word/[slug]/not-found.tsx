import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function WordNotFound() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Word"
        title="Word not found."
        description="This word is not available in the current Track B word content."
        actions={
          <>
            <Link className="button button--primary" href="/packs">
              Browse packs
            </Link>
            <Link className="button" href="/dashboard">
              Dashboard
            </Link>
          </>
        }
      />
      <EmptyState
        actionHref="/saved"
        actionLabel="Saved Library"
        body="No local saved state, review state, mastery, box, or due date is shown for this missing word."
        title="No word content available"
      />
    </div>
  );
}
