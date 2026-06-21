import type { ReactNode } from "react";

type TrackBIconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
};

function TrackBIcon({
  children,
  className,
  size = 16,
  strokeWidth = 2
}: TrackBIconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </TrackBIcon>
  );
}

export function BookOpenIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="M12 7v14" />
      <path d="M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <path d="M21 5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2z" />
    </TrackBIcon>
  );
}

export function CheckIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="m20 6-11 11-5-5" />
    </TrackBIcon>
  );
}

export function ChevronRightIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </TrackBIcon>
  );
}

export function ClockIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </TrackBIcon>
  );
}

export function HomeIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </TrackBIcon>
  );
}

export function LayersIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="m12 2 9 5-9 5-9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </TrackBIcon>
  );
}

export function RotateCcwIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
    </TrackBIcon>
  );
}

export function XIcon(props: TrackBIconProps) {
  return (
    <TrackBIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </TrackBIcon>
  );
}
