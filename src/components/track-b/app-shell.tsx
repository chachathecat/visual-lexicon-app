import Link from "next/link";
import type { ReactNode } from "react";

import {
  getTrackBNavItemIsActive,
  trackBNavigationItems,
  type TrackBNavigationItem,
  type TrackBNavigationItemId
} from "@/components/track-b/tokens";
import { cx } from "@/components/track-b/utils";

export type TrackBAppShellProps = {
  children: ReactNode;
  activeItemId?: TrackBNavigationItemId;
  currentPath?: string;
  navItems?: readonly TrackBNavigationItem[];
  topActions?: ReactNode;
  sidebarFooter?: ReactNode;
  workspaceLabel?: string;
  mainId?: string;
  className?: string;
};

function TrackBNavList({
  activeItemId,
  className,
  currentPath,
  items
}: {
  activeItemId?: TrackBNavigationItemId;
  className?: string;
  currentPath?: string;
  items: readonly TrackBNavigationItem[];
}) {
  return (
    <nav aria-label="Track B learning navigation" className={className}>
      <ul className="track-b-nav-list">
        {items.map((item) => {
          const active = getTrackBNavItemIsActive({
            activeItemId,
            currentPath,
            item
          });

          return (
            <li key={item.id}>
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={item.ariaLabel}
                className="track-b-nav-link"
                href={item.href}
              >
                <span className="track-b-nav-link__label">{item.label}</span>
                <span className="track-b-nav-link__description">
                  {item.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type TrackBBottomNavProps = {
  activeItemId?: TrackBNavigationItemId;
  currentPath?: string;
  items?: readonly TrackBNavigationItem[];
  className?: string;
};

export function TrackBBottomNav({
  activeItemId,
  className,
  currentPath,
  items = trackBNavigationItems
}: TrackBBottomNavProps) {
  return (
    <nav
      aria-label="Track B mobile navigation"
      className={cx("track-b-bottom-nav", className)}
    >
      {items.map((item) => {
        const active = getTrackBNavItemIsActive({
          activeItemId,
          currentPath,
          item
        });

        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={item.ariaLabel}
            className="track-b-bottom-nav__link"
            href={item.href}
            key={item.id}
          >
            <span aria-hidden="true" className="track-b-bottom-nav__dot" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TrackBAppShell({
  activeItemId,
  children,
  className,
  currentPath,
  mainId = "track-b-main",
  navItems = trackBNavigationItems,
  sidebarFooter,
  topActions,
  workspaceLabel = "app.visuallexicon.org"
}: TrackBAppShellProps) {
  return (
    <div className={cx("track-b-shell", className)}>
      <a className="track-b-shell__skip-link" href={`#${mainId}`}>
        Skip to learning content
      </a>
      <aside className="track-b-shell__sidebar" aria-label="Track B">
        <Link
          aria-label="Visual Lexicon Today dashboard"
          className="track-b-shell__brand"
          href="/dashboard"
        >
          <span className="track-b-shell__brand-mark" aria-hidden="true">
            VL
          </span>
          <span>
            <span className="track-b-shell__brand-name">Visual Lexicon</span>
            <span className="track-b-shell__brand-subline">
              Visual memory review
            </span>
          </span>
        </Link>
        <TrackBNavList
          activeItemId={activeItemId}
          className="track-b-shell__nav"
          currentPath={currentPath}
          items={navItems}
        />
        {sidebarFooter ? (
          <div className="track-b-shell__sidebar-footer">{sidebarFooter}</div>
        ) : null}
      </aside>
      <div className="track-b-shell__workspace">
        <header className="track-b-shell__topbar">
          <span>{workspaceLabel}</span>
          {topActions ? (
            <div className="track-b-shell__topbar-actions">{topActions}</div>
          ) : null}
        </header>
        <main className="track-b-shell__main" id={mainId}>
          {children}
        </main>
      </div>
      <TrackBBottomNav
        activeItemId={activeItemId}
        currentPath={currentPath}
        items={navItems}
      />
    </div>
  );
}
