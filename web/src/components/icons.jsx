// Real JSX icon paths — no dangerouslySetInnerHTML. Decorative by default
// (aria-hidden); the surrounding link/button carries the accessible label.

const PATHS = {
  logo: <>
    <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M3 17v2a2 2 0 0 0 2 2h2" />
    <circle cx="12" cy="12" r="2.5" /><path d="M12 6v2M12 16v2M6 12h2M16 12h2" />
  </>,
  prototypes: <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
  sandbox: <>
    <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
  </>,
  screenshots: <>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
    <circle cx="12" cy="13" r="3.5" />
  </>,
  tests: <>
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </>,
  server: <>
    <rect x="2" y="3" width="20" height="6" rx="2" /><rect x="2" y="13" width="20" height="6" rx="2" />
    <path d="M6 6h.01M6 16h.01" />
  </>,
  settings: <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8M4.6 9a1.6 1.6 0 0 0-.3-1.8" />
  </>,
  back: <path d="M15 18l-6-6 6-6" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  monitor: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18M8 18v2M16 18v2" /></>,
  mobile: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M11 18h2" /></>,
};

export const Icon = ({ n, sw = 1.8, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={sw} aria-hidden="true" {...props}>{PATHS[n]}</svg>
);
