import Link from "next/link";
import type { ReactNode } from "react";

import {
  getTrackBNavItemIsActive,
  trackBMobileNavigationItems,
  trackBNavigationItems,
  trackBScreenLabels,
  type TrackBNavigationItem,
  type TrackBNavigationItemId
} from "@/components/track-b/tokens";
import {
  BookOpenIcon,
  ClockIcon,
  HomeIcon,
  LayersIcon
} from "@/components/track-b/icons";
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
                prefetch={false}
              >
                <span className="track-b-nav-link__label">{item.label}</span>
                <span className="track-b-nav-link__description" aria-hidden="true">
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

function getBottomNavIcon(item: TrackBNavigationItem, active: boolean) {
  const iconProps = {
    className: "track-b-bottom-nav__icon",
    size: 20,
    strokeWidth: active ? 2.3 : 1.8
  };

  if (item.icon === "layers") {
    return <LayersIcon {...iconProps} />;
  }

  if (item.icon === "book") {
    return <BookOpenIcon {...iconProps} />;
  }

  if (item.icon === "clock") {
    return <ClockIcon {...iconProps} />;
  }

  return <HomeIcon {...iconProps} />;
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
  items = trackBMobileNavigationItems
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
            prefetch={false}
          >
            {getBottomNavIcon(item, active)}
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
  workspaceLabel
}: TrackBAppShellProps) {
  const mobileScreenLabel = activeItemId
    ? trackBScreenLabels[
        activeItemId as keyof typeof trackBScreenLabels
      ] ?? "Visual Lexicon"
    : "Visual Lexicon";

  return (
    <div className={cx("track-b-shell", className)}>
      <a className="track-b-shell__skip-link" href={`#${mainId}`}>
        Skip to learning content
      </a>
      <header className="track-b-shell__header">
        <Link
          aria-label="Visual Lexicon Today dashboard"
          className="track-b-shell__brand"
          href="/dashboard"
          prefetch={false}
        >
          <span className="track-b-shell__brand-mark" aria-hidden="true">
            <BookOpenIcon size={13} strokeWidth={2.3} />
          </span>
          <span>
            <span className="track-b-shell__brand-name">Visual Lexicon</span>
            <span className="track-b-shell__brand-subline">
              Visual memory review
            </span>
          </span>
        </Link>
        <span className="track-b-shell__mobile-screen-label">
          {mobileScreenLabel}
        </span>
        <TrackBNavList
          activeItemId={activeItemId}
          className="track-b-shell__desktop-nav"
          currentPath={currentPath}
          items={navItems}
        />
        <div className="track-b-shell__header-meta">
          {workspaceLabel ? (
            <span className="track-b-shell__workspace-label">
              {workspaceLabel}
            </span>
          ) : null}
          {topActions ? (
            <div className="track-b-shell__topbar-actions">{topActions}</div>
          ) : null}
          {sidebarFooter ? (
            <div className="track-b-shell__sidebar-footer">{sidebarFooter}</div>
          ) : null}
        </div>
      </header>
      <main className="track-b-shell__main" id={mainId}>
        {children}
      </main>
      <TrackBBottomNav
        activeItemId={activeItemId}
        currentPath={currentPath}
      />
    </div>
  );
}
