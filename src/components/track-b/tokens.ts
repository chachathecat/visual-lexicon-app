export const TRACK_B_APP_SHELL_V2_VERSION = 2;

export type TrackBStatusTone =
  | "due"
  | "weak"
  | "new"
  | "learning"
  | "strong"
  | "mastered";

export type TrackBNavigationItemId =
  | "today"
  | "save"
  | "review"
  | "weak"
  | "packs"
  | "saved"
  | "pricing";

export type TrackBNavigationItem = {
  id: TrackBNavigationItemId;
  label: string;
  href: string;
  description: string;
  ariaLabel: string;
  icon?: "home" | "layers" | "book" | "clock";
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
  cardElevation: {
    flat: "var(--vlx-track-b-card-elevation-flat)",
    panel: "var(--vlx-track-b-card-elevation-panel)",
    raised: "var(--vlx-track-b-card-elevation-raised)"
  },
  buttonHierarchy: {
    primary: {
      className: "track-b-button track-b-button--primary",
      background: "var(--vlx-track-b-button-primary-bg)",
      foreground: "var(--vlx-track-b-button-primary-fg)",
      border: "var(--vlx-track-b-button-primary-border)"
    },
    secondary: {
      className: "track-b-button track-b-button--secondary",
      background: "var(--vlx-track-b-button-secondary-bg)",
      foreground: "var(--vlx-track-b-button-secondary-fg)",
      border: "var(--vlx-track-b-button-secondary-border)"
    },
    quiet: {
      className: "track-b-button track-b-button--quiet",
      background: "var(--vlx-track-b-button-quiet-bg)",
      foreground: "var(--vlx-track-b-button-quiet-fg)",
      border: "var(--vlx-track-b-button-quiet-border)"
    }
  },
  focusRing: {
    outline: "var(--vlx-track-b-focus-outline)",
    shadow: "var(--vlx-track-b-focus-shadow)"
  },
  focusStates: {
    visibleOutline: "var(--vlx-track-b-focus-outline)",
    visibleShadow: "var(--vlx-track-b-focus-shadow)",
    offset: "var(--vlx-track-b-focus-offset)",
    selector: ":focus-visible"
  },
  mobileSpacing: {
    pageInline: "var(--vlx-track-b-mobile-page-inline)",
    pageBlock: "var(--vlx-track-b-mobile-page-block)",
    sectionGap: "var(--vlx-track-b-mobile-section-gap)",
    bottomNavReserved: "var(--vlx-track-b-bottom-nav-reserved)"
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
    label: "Dashboard",
    href: "/dashboard",
    description: "Today's Memory Mission and the next best review action.",
    ariaLabel: "Dashboard memory mission"
  },
  {
    id: "save",
    label: "Save Word",
    href: "/save",
    description: "Turn a word into a visual review card.",
    ariaLabel: "Save Word"
  },
  {
    id: "review",
    label: "Review",
    href: "/review",
    description: "Active recall sessions that write review events.",
    ariaLabel: "Review words"
  },
  {
    id: "saved",
    label: "Queue",
    href: "/saved",
    description: "Saved words organized around review readiness.",
    ariaLabel: "Open memory queue"
  },
  {
    id: "pricing",
    label: "Early Access",
    href: "/pricing",
    description: "Invite-only paid beta interest.",
    ariaLabel: "Open Early Access pricing"
  }
];

export const trackBMobileNavigationItems: readonly TrackBNavigationItem[] = [
  {
    id: "today",
    label: "Home",
    href: "/dashboard",
    description: "Today's Memory Mission.",
    ariaLabel: "Home dashboard",
    icon: "home"
  },
  {
    id: "saved",
    label: "Queue",
    href: "/saved",
    description: "Saved words organized around review readiness.",
    ariaLabel: "Open memory queue",
    icon: "layers"
  },
  {
    id: "review",
    label: "Review",
    href: "/review",
    description: "Active recall sessions.",
    ariaLabel: "Review words",
    icon: "book"
  },
  {
    id: "pricing",
    label: "Access",
    href: "/pricing",
    description: "Invite-only beta access.",
    ariaLabel: "Open Early Access",
    icon: "clock"
  }
];

export const trackBScreenLabels: Record<
  Extract<TrackBNavigationItemId, "today" | "save" | "review" | "saved" | "pricing">,
  string
> = {
  today: "Dashboard",
  save: "Save Word",
  review: "Review",
  saved: "Queue",
  pricing: "Early Access"
};

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

  if (item.id === "today") {
    return currentPath === "/dashboard";
  }

  if (item.id === "save") {
    return currentPath === "/save";
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

  if (item.id === "pricing") {
    return currentPath === "/pricing";
  }

  return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
}
