export const TRACK_B_APP_SHELL_V2_VERSION = 1;

export type TrackBStatusTone =
  | "due"
  | "weak"
  | "new"
  | "learning"
  | "strong"
  | "mastered";

export type TrackBNavigationItemId =
  | "today"
  | "review"
  | "weak"
  | "packs"
  | "saved"
  | "progress";

export type TrackBNavigationItem = {
  id: TrackBNavigationItemId;
  label: string;
  href: string;
  description: string;
  ariaLabel: string;
};

export const trackBDesignTokens = {
  spacing: {
    "2xs": "var(--vlx-track-b-space-2xs)",
    xs: "var(--vlx-track-b-space-xs)",
    sm: "var(--vlx-track-b-space-sm)",
    md: "var(--vlx-track-b-space-md)",
    lg: "var(--vlx-track-b-space-lg)",
    xl: "var(--vlx-track-b-space-xl)",
    "2xl": "var(--vlx-track-b-space-2xl)"
  },
  radius: {
    sm: "var(--vlx-track-b-radius-sm)",
    md: "var(--vlx-track-b-radius-md)",
    lg: "var(--vlx-track-b-radius-lg)",
    pill: "var(--vlx-track-b-radius-pill)"
  },
  typography: {
    eyebrow: "var(--vlx-track-b-type-eyebrow)",
    body: "var(--vlx-track-b-type-body)",
    small: "var(--vlx-track-b-type-small)",
    title: "var(--vlx-track-b-type-title)",
    display: "var(--vlx-track-b-type-display)",
    metric: "var(--vlx-track-b-type-metric)"
  },
  border: {
    subtle: "var(--vlx-track-b-border-subtle)",
    strong: "var(--vlx-track-b-border-strong)"
  },
  shadow: {
    raised: "var(--vlx-track-b-shadow-raised)",
    panel: "var(--vlx-track-b-shadow-panel)"
  },
  focusRing: {
    outline: "var(--vlx-track-b-focus-outline)",
    shadow: "var(--vlx-track-b-focus-shadow)"
  },
  statusTones: {
    due: {
      label: "Due",
      cssClass: "track-b-status-badge--due",
      foreground: "var(--vlx-track-b-status-due-ink)",
      background: "var(--vlx-track-b-status-due-bg)"
    },
    weak: {
      label: "Weak",
      cssClass: "track-b-status-badge--weak",
      foreground: "var(--vlx-track-b-status-weak-ink)",
      background: "var(--vlx-track-b-status-weak-bg)"
    },
    new: {
      label: "New",
      cssClass: "track-b-status-badge--new",
      foreground: "var(--vlx-track-b-status-new-ink)",
      background: "var(--vlx-track-b-status-new-bg)"
    },
    learning: {
      label: "Learning",
      cssClass: "track-b-status-badge--learning",
      foreground: "var(--vlx-track-b-status-learning-ink)",
      background: "var(--vlx-track-b-status-learning-bg)"
    },
    strong: {
      label: "Strong",
      cssClass: "track-b-status-badge--strong",
      foreground: "var(--vlx-track-b-status-strong-ink)",
      background: "var(--vlx-track-b-status-strong-bg)"
    },
    mastered: {
      label: "Mastered",
      cssClass: "track-b-status-badge--mastered",
      foreground: "var(--vlx-track-b-status-mastered-ink)",
      background: "var(--vlx-track-b-status-mastered-bg)"
    }
  },
  motion: {
    instant: "var(--vlx-track-b-motion-instant)",
    fast: "var(--vlx-track-b-motion-fast)",
    steady: "var(--vlx-track-b-motion-steady)"
  }
} as const;

export const trackBNavigationItems: readonly TrackBNavigationItem[] = [
  {
    id: "today",
    label: "Today",
    href: "/dashboard",
    description: "Today's Memory Mission and the next best review action.",
    ariaLabel: "Today memory mission"
  },
  {
    id: "review",
    label: "Review",
    href: "/review",
    description: "Active recall sessions that write review events.",
    ariaLabel: "Review words"
  },
  {
    id: "weak",
    label: "Weak",
    href: "/review/weak",
    description: "Repair fragile words from mistakes and weak scores.",
    ariaLabel: "Practice weak words"
  },
  {
    id: "packs",
    label: "Packs",
    href: "/packs",
    description: "Course paths and visual vocabulary packs.",
    ariaLabel: "Open packs"
  },
  {
    id: "saved",
    label: "Saved",
    href: "/saved",
    description: "Saved words organized around review readiness.",
    ariaLabel: "Open saved words"
  },
  {
    id: "progress",
    label: "Progress",
    href: "/dashboard#progress",
    description: "Weekly Reviewed Words and real memory-state movement.",
    ariaLabel: "View progress"
  }
];

export function getTrackBNavItemIsActive({
  activeItemId,
  currentPath,
  item
}: {
  activeItemId?: TrackBNavigationItemId;
  currentPath?: string;
  item: TrackBNavigationItem;
}) {
  if (activeItemId) {
    return item.id === activeItemId;
  }

  if (!currentPath) {
    return false;
  }

  if (item.id === "progress") {
    return currentPath.includes("#progress");
  }

  if (item.id === "today") {
    return currentPath === "/dashboard";
  }

  if (item.id === "review") {
    return currentPath === "/review" || currentPath === "/review/due";
  }

  if (item.id === "weak") {
    return (
      currentPath === "/review/weak" ||
      currentPath === "/review/weak-sprint" ||
      currentPath.startsWith("/review/weak/")
    );
  }

  return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
}
