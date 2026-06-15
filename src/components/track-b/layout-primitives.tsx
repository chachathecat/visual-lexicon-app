import Link from "next/link";
import type { ReactNode } from "react";

import { cx } from "@/components/track-b/utils";

type HeadingLevel = 2 | 3 | 4;

type ActionLink = {
  href: string;
  label: string;
  ariaLabel?: string;
};

function TrackBHeading({
  children,
  className,
  id,
  level
}: {
  children: ReactNode;
  className: string;
  id?: string;
  level: 1 | HeadingLevel;
}) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag className={className} id={id}>
      {children}
    </HeadingTag>
  );
}

export type TrackBPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

export function TrackBPageHeader({
  actions,
  className,
  description,
  eyebrow,
  meta,
  title
}: TrackBPageHeaderProps) {
  return (
    <header className={cx("track-b-page-header", className)}>
      <div className="track-b-page-header__copy">
        <p className="track-b-eyebrow">{eyebrow}</p>
        <h1 className="track-b-page-header__title">{title}</h1>
        {description ? (
          <p className="track-b-page-header__description">{description}</p>
        ) : null}
      </div>
      {meta || actions ? (
        <div className="track-b-page-header__aside">
          {meta ? <div className="track-b-page-header__meta">{meta}</div> : null}
          {actions ? (
            <div className="track-b-action-row">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export type TrackBSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headingLevel?: HeadingLevel;
};

export function TrackBSection({
  actions,
  children,
  className,
  description,
  eyebrow,
  headingLevel = 2,
  id,
  title
}: TrackBSectionProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      aria-labelledby={headingId}
      className={cx("track-b-section", className)}
      id={id}
    >
      <div className="track-b-section__header">
        <div className="track-b-section__copy">
          {eyebrow ? <p className="track-b-eyebrow">{eyebrow}</p> : null}
          <TrackBHeading
            className="track-b-section__title"
            id={headingId}
            level={headingLevel}
          >
            {title}
          </TrackBHeading>
          {description ? (
            <p className="track-b-section__description">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="track-b-action-row">{actions}</div> : null}
      </div>
      <div className="track-b-section__body">{children}</div>
    </section>
  );
}

export type TrackBFocusPanelProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  headingLevel?: HeadingLevel;
  id?: string;
};

export function TrackBFocusPanel({
  children,
  className,
  description,
  eyebrow,
  footer,
  headingLevel = 2,
  id,
  title
}: TrackBFocusPanelProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      aria-labelledby={headingId}
      className={cx("track-b-focus-panel", className)}
      id={id}
    >
      <div className="track-b-focus-panel__copy">
        {eyebrow ? <p className="track-b-eyebrow">{eyebrow}</p> : null}
        <TrackBHeading
          className="track-b-focus-panel__title"
          id={headingId}
          level={headingLevel}
        >
          {title}
        </TrackBHeading>
        {description ? (
          <p className="track-b-focus-panel__description">{description}</p>
        ) : null}
      </div>
      {children ? <div className="track-b-focus-panel__body">{children}</div> : null}
      {footer ? <div className="track-b-focus-panel__footer">{footer}</div> : null}
    </section>
  );
}

export type TrackBEmptyStateProps = {
  title: string;
  body: string;
  action?: ActionLink;
  secondaryAction?: ActionLink;
  className?: string;
  headingLevel?: HeadingLevel;
};

export function TrackBEmptyState({
  action,
  body,
  className,
  headingLevel = 2,
  secondaryAction,
  title
}: TrackBEmptyStateProps) {
  return (
    <section className={cx("track-b-empty-state", className)}>
      <TrackBHeading className="track-b-empty-state__title" level={headingLevel}>
        {title}
      </TrackBHeading>
      <p className="track-b-empty-state__body">{body}</p>
      {action || secondaryAction ? (
        <div className="track-b-action-row">
          {action ? (
            <Link
              aria-label={action.ariaLabel}
              className="track-b-button track-b-button--primary"
              href={action.href}
            >
              {action.label}
            </Link>
          ) : null}
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
      ) : null}
    </section>
  );
}
