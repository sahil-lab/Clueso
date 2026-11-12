import type { ReactNode } from "react";

const drawings = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
  film: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4" />
    </>
  ),
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  layers: <path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5" />,
  sparkles: (
    <path d="m14 3 2.5 6.5L23 12l-6.5 2.5L14 21l-2.5-6.5L5 12l6.5-2.5zM4 2v5M1.5 4.5h5" />
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  play: <path d="m9 5 11 7-11 7z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  code: <path d="m7 7-5 5 5 5M17 7l5 5-5 5M14 4l-4 16" />,
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m7 9 3 3-3 3M13 15h4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  cursor: <path d="m5 3 14 10-7 1-3 7z" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  refresh: (
    <path d="M20 7v5h-5M4 17v-5h5M6.2 6.2a8 8 0 0 1 13 2M4.8 15.8a8 8 0 0 0 13 2" />
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="3" />
      <path d="M12 17v4M8 21h8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  branch: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M6 7v10M18 7v2a6 6 0 0 1-6 6H6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof drawings;

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[name]}
    </svg>
  );
}
