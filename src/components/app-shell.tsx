"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Navigation } from "@/components/navigation";

const trackBAppShellRoutePrefixes = [
  "/dashboard",
  "/packs",
  "/pricing",
  "/review",
  "/saved"
] as const;

function isTrackBAppShellRoute(pathname: string) {
  return trackBAppShellRoutePrefixes.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname && isTrackBAppShellRoute(pathname)) {
    return <>{children}</>;
  }

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
