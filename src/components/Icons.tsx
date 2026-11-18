import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "search" | "cart" | "heart" | "bell" | "user" | "menu" | "close" | "chevron-down" | "chevron-right"
  | "arrow-right" | "arrow-left" | "book" | "books" | "library" | "bookmark" | "star" | "check"
  | "check-circle" | "download" | "upload" | "gift" | "clock" | "shield" | "wallet" | "sun" | "moon"
  | "tag" | "list" | "grid" | "file" | "image" | "logout" | "settings" | "chart" | "info" | "alert"
  | "mail" | "phone" | "sparkles" | "feather" | "receipt" | "coins" | "trash" | "plus" | "filter"
  | "lock" | "key" | "eye" | "home" | "percent" | "play" | "external" | "users" | "refresh";

const paths: Record<IconName, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3.5h2.2l2.3 11h11l2.2-8H6" /></>,
  heart: <path d="M20.8 5.6a5.3 5.3 0 0 0-7.5 0L12 6.9l-1.3-1.3a5.3 5.3 0 1 0-7.5 7.5L12 21l8.8-7.9a5.3 5.3 0 0 0 0-7.5Z" />,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 15c2.4.6 4 2.3 4 5" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "arrow-right": <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
  "arrow-left": <><path d="M20 12H5" /><path d="m11 6-6 6 6 6" /></>,
  book: <><path d="M12 6.5C9.4 4.8 5.6 4.5 2.5 5.7v13c3.1-1.2 6.9-.9 9.5.8 2.6-1.7 6.4-2 9.5-.8v-13c-3.1-1.2-6.9-.9-9.5.8Z" /><path d="M12 6.5v13" /></>,
  books: <><path d="M3 5.5h6v14H3zM10 8h5.5v11.5H10z" /><path d="m17 9 3.5 1-3.2 10-3.3-1" /></>,
  library: <><path d="M3 5h3v14H3zM8 5h3v14H8z" /><path d="m13.5 6 5-1.4 3 13.2-5 1.4z" /></>,
  bookmark: <path d="M6.5 3.5h11v17L12 16.8l-5.5 3.7z" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
  check: <path d="m4 12 5 5L20 6" />,
  "check-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16 9.5" /></>,
  download: <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></>,
  upload: <><path d="M12 17V5" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
  gift: <><path d="M3 10h18v3H3zM5 13h14v8H5zM12 10v11" /><path d="M12 10C9 10 6 9.3 6 6.8A2.6 2.6 0 0 1 8.6 4.5c1.9 0 3.4 3.5 3.4 5.5ZM12 10c3 0 6-.7 6-3.2a2.6 2.6 0 0 0-2.6-2.3C13.5 4.5 12 8 12 10Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></>,
  shield: <><path d="M12 2.5 20 6v6c0 5-3.2 8.1-8 9.5C7.2 20.1 4 17 4 12V6l8-3.5Z" /><path d="m9 12 2 2 4-4" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M3 10h18M16 15h2" /><path d="M6 6V4.5A1.5 1.5 0 0 1 7.5 3H17" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  tag: <><path d="M3 11.5V4h7.5l10 10-7.5 7.5-10-10Z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  file: <><path d="M6 2.5h8l4 4V21H6z" /><path d="M14 2.5v4h4M9 12h6M9 16h6" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 18 5-5 4 4 2.5-2.5L20 19" /></>,
  logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M14 8l4 4-4 4M18 12H8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6M20 16v-9" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 3.5 21.5 20H2.5L12 3.5Z" /><path d="M12 9v5M12 17h.01" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></>,
  phone: <path d="M6 3h3l1.5 5-2 1.5a13 13 0 0 0 6 6L16 13.5l5 1.5v3a3 3 0 0 1-3.2 3A17 17 0 0 1 3 6.2 3 3 0 0 1 6 3Z" />,
  sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
  feather: <><path d="M20 4c-7 0-13 3-15 9l-2 7 7-2c6-2 9-8 10-14Z" /><path d="M5 20 17 8M9 15h5" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  coins: <><ellipse cx="9" cy="6" rx="6" ry="3" /><path d="M3 6v5c0 1.7 2.7 3 6 3s6-1.3 6-3V6" /><path d="M15 10c3.3 0 6 1.3 6 3v5c0 1.7-2.7 3-6 3s-6-1.3-6-3v-5" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />,
  lock: <><rect x="4.5" y="10" width="15" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9 2 2-2 2 1.5 1.5-2.5 2.5-1.5-1.5L14 12" /></>,
  eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.8" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5.5 9.5V21h13V9.5M10 21v-6h4v6" /></>,
  percent: <><path d="M5 19 19 5" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-1.5 6" /><path d="M20 4v7h-7" /></>,
};

export function Icon({ name, className = "h-5 w-5", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} {...rest}>
      {paths[name]}
    </svg>
  );
}
