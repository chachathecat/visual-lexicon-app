import Link from "next/link";
import type { ReactNode } from "react";

import { Navigation } from "@/components/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <Link className="brand" href="/">
          <span className="brand__name">Visual Lexicon</span>
          <span className="brand__subline">Memory app</span>
        </Link>
        <Navigation />
      </aside>
      <main className="app-main">
        <div className="top-strip" aria-label="Workspace status">
          <span>app.visuallexicon.org</span>
          <span>Mock learning workspace</span>
        </div>
        {children}
      </main>
    </div>
  );
}
