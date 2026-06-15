import Link from "next/link";
import type { ReactNode } from "react";

import {
  trackBDesignTokens,
  type TrackBStatusTone
} from "@/components/track-b/tokens";
import { cx } from "@/components/track-b/utils";

type ActionLink = {
  href: string;
  label: string;
  ariaLabel?: string;
};

type TrackBCardTone = "neutral" | TrackBStatusTone;

export type TrackBStatusBadgeProps = {
  status: TrackBStatusTone;
  detail?: string;
  className?: string;
};

export function TrackBStatusBadge({
  className,
  detail,
  status
}: TrackBStatusBadgeProps) {
  const tone = trackBDesignTokens.statusTones[status];
  const label = detail ? `${tone.label}: ${detail}` : tone.label;

  return (
    <span
      aria-label={label}
      className={cx("track-b-status-badge", tone.cssClass, className)}
    >
      <span className="track-b-status-badge__label">{tone.label}</span>
      {detail ? (
        <span className="track-b-status-badge__detail">{detail}</span>
      ) : null}
    </span>
  );
}

export type TrackBProgressBadgeProps = {
  label: string;
  value: number;
  max?: number;
  detail?: string;
  tone?: TrackBCardTone;
  className?: string;
};

export function TrackBProgressBadge({
  className,
  detail,
  label,
  max,
  tone = "neutral",
  value
}: TrackBProgressBadgeProps) {
  const progressValue =
    typeof max === "number" && max > 0
      ? Math.max(0, Math.min(100, Math.round((value / max) * 100)))
      : null;
  const displayValue = typeof max === "number" ? `${value}/${max}` : value;
  const ariaLabel = detail
    ? `${label}: ${displayValue}. ${detail}`
    : `${label}: ${displayValue}`;

  return (
    <span
      aria-label={ariaLabel}
      className={cx(
        "track-b-progress-badge",
        `track-b-progress-badge--${tone}`,
        className
      )}
    >
      <span className="track-b-progress-badge__copy">
        <span className="track-b-progress-badge__label">{label}</span>
        <strong className="track-b-progress-badge__value">{displayValue}</strong>
      </span>
      {detail ? (
        <span className="track-b-progress-badge__detail">{detail}</span>
      ) : null}
      {progressValue !== null ? (
        <span
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressValue}
          className="track-b-progress-badge__bar"
          role="progressbar"
        >
          <span style={{ width: `${progressValue}%` }} />
        </span>
      ) : null}
    </span>
  );
}

export type TrackBPrimaryActionCardProps = {
  eyebrow?: string;
  title: string;
  body: string;
  action: ActionLink;
  secondaryAction?: ActionLink;
  metric?: {
    label: string;
    value: string | number;
  };
  status?: TrackBStatusTone;
  children?: ReactNode;
  className?: string;
};

export function TrackBPrimaryActionCard({
  action,
  body,
  children,
  className,
  eyebrow,
  metric,
  secondaryAction,
  status,
  title
}: TrackBPrimaryActionCardProps) {
  return (
    <article className={cx("track-b-primary-action-card", className)}>
      <div className="track-b-primary-action-card__copy">
        {eyebrow ? <p className="track-b-eyebrow">{eyebrow}</p> : null}
        <div className="track-b-primary-action-card__topline">
          <h2 className="track-b-primary-action-card__title">{title}</h2>
          {status ? <TrackBStatusBadge status={status} /> : null}
        </div>
        <p className="track-b-primary-action-card__body">{body}</p>
      </div>
      {metric ? (
        <div
          aria-label={`${metric.label}: ${metric.value}`}
          className="track-b-primary-action-card__metric"
        >
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      ) : null}
      {children ? (
        <div className="track-b-primary-action-card__content">{children}</div>
      ) : null}
      <div className="track-b-action-row">
        <Link
          aria-label={action.ariaLabel}
          className="track-b-button track-b-button--primary"
          href={action.href}
        >
          {action.label}
        </Link>
        {secondaryAction ? (
          <Link
            aria-label={secondaryAction.ariaLabel}
            className="track-b-button track-b-button--quiet"
            href={secondaryAction.href}
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export type TrackBMetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
  tone?: TrackBCardTone;
  className?: string;
};

export function TrackBMetricCard({
  className,
  description,
  label,
  tone = "neutral",
  value
}: TrackBMetricCardProps) {
  return (
    <article
      aria-label={`${label}: ${value}`}
      className={cx("track-b-metric-card", `track-b-metric-card--${tone}`, className)}
    >
      <span className="track-b-metric-card__label">{label}</span>
      <strong className="track-b-metric-card__value">{value}</strong>
      {description ? (
        <p className="track-b-metric-card__description">{description}</p>
      ) : null}
    </article>
  );
}

export type TrackBUpgradeNudgeProps = {
  title: string;
  body: string;
  action?: ActionLink;
  badgeLabel?: string;
  className?: string;
};

export function TrackBUpgradeNudge({
  action,
  badgeLabel = "Upgrade",
  body,
  className,
  title
}: TrackBUpgradeNudgeProps) {
  return (
    <aside
      className={cx("track-b-upgrade-nudge", className)}
      data-visual-only="true"
    >
      <div className="track-b-upgrade-nudge__copy">
        <span className="track-b-upgrade-nudge__badge">{badgeLabel}</span>
        <h2 className="track-b-upgrade-nudge__title">{title}</h2>
        <p className="track-b-upgrade-nudge__body">{body}</p>
      </div>
      {action ? (
        <Link
          aria-label={action.ariaLabel}
          className="track-b-button track-b-button--secondary"
          href={action.href}
        >
          {action.label}
        </Link>
      ) : null}
    </aside>
  );
}
