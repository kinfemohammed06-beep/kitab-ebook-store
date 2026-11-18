"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icons";

type Props = {
  user: boolean;
  role: string | null;
  unread: number;
  cartCount: number;
  logoutAction: () => Promise<void>;
};

const browse: { href: string; label: string; icon: IconName; desc: string }[] = [
  { href: "/books", label: "Explore all books", icon: "books", desc: "Browse the full catalogue" },
  { href: "/books?sort=new", label: "New releases", icon: "sparkles", desc: "The latest additions" },
  { href: "/books?free=1", label: "Free books", icon: "gift", desc: "Read without paying" },
  { href: "/bestsellers", label: "Bestsellers", icon: "chart", desc: "What readers love most" },
  { href: "/categories", label: "Categories", icon: "grid", desc: "Find your next subject" },
  { href: "/authors", label: "Authors", icon: "feather", desc: "Meet the writers" },
];

export default function HeaderNav({ user, role, unread, cartCount, logoutAction }: Props) {
  const pathname = usePathname();
  const [menu, setMenu] = useState<"browse" | "account" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMenu(null); setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(null); setMobileOpen(false); } };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const browseActive = browse.some((b) => active(b.href.split("?")[0]));
  const dropClass = "absolute left-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-card-hover animate-fade-in";

  const guestItems: { href: string; label: string; icon: IconName }[] = [
    { href: "/login", label: "Log in", icon: "lock" },
    { href: "/register", label: "Create account", icon: "user" },
  ];
  const accountItems: { href: string; label: string; icon: IconName }[] = [
    { href: "/library", label: "My library", icon: "library" },
    { href: "/orders", label: "Orders", icon: "receipt" },
    { href: "/wishlist", label: "Wishlist", icon: "heart" },
    { href: "/notifications", label: "Notifications", icon: "bell" },
    ...(role === "author" || role === "publisher" ? [{ href: "/author", label: "Author dashboard", icon: "feather" } as const]
      : [{ href: "/register?role=author", label: "Become an author", icon: "feather" } as const]),
    ...(role === "admin" ? [{ href: "/admin", label: "Admin console", icon: "shield" } as const] : []),
  ];

  return (
    <div ref={navRef} className="flex flex-1 items-center gap-2">
      {/* Primary navigation */}
      <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
        <div className="relative">
          <button type="button" onClick={() => setMenu(menu === "browse" ? null : "browse")} aria-expanded={menu === "browse"} aria-haspopup="true"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-forest-50 hover:text-forest ${browseActive ? "text-forest" : "text-ink-muted"}`}>
            Browse <Icon name="chevron-down" className={`h-4 w-4 transition-transform ${menu === "browse" ? "rotate-180" : ""}`} />
          </button>
          {menu === "browse" && (
            <div className={dropClass}>
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-ink-soft">Explore the catalogue</p>
              {browse.map((b) => (
                <Link key={b.href} href={b.href} onClick={() => setMenu(null)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-forest-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest"><Icon name={b.icon} className="h-4 w-4" /></span>
                  <span><span className="block text-sm font-semibold text-ink">{b.label}</span><span className="block text-xs text-ink-muted">{b.desc}</span></span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Link href="/about" className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-forest-50 hover:text-forest ${active("/about") ? "text-forest" : "text-ink-muted"}`}>About</Link>
        <Link href="/faq" className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-forest-50 hover:text-forest ${active("/faq") ? "text-forest" : "text-ink-muted"}`}>How it works</Link>
        <Link href={user ? "/author" : "/register?role=author"} className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-forest-50 hover:text-forest ${active("/author") ? "text-forest" : "text-ink-muted"}`}>
          {role === "author" || role === "publisher" ? "Author dashboard" : "Become an author"}
        </Link>
      </nav>

      {/* Search */}
      <form action="/books" role="search" className="relative ml-auto hidden w-full max-w-[260px] md:block xl:max-w-xs">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input name="q" aria-label="Search books" placeholder="Search books, authors…"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm shadow-sm placeholder:text-ink-soft focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15" />
      </form>

      {/* Quick actions */}
      <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
        {user && <>
          <Link href="/wishlist" aria-label="Wishlist" className="btn-icon hidden sm:inline-flex"><Icon name="heart" /></Link>
          <Link href="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="btn-icon relative hidden sm:inline-flex">
            <Icon name="bell" />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-forest-950">{unread > 9 ? "9+" : unread}</span>}
          </Link>
        </>}
        <Link href="/cart" aria-label={`Shopping cart, ${cartCount} items`} className="btn-icon relative">
          <Icon name="cart" />{cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[9px] font-bold text-ivory">{cartCount}</span>}
        </Link>

        {user ? (
          <div className="relative ml-1 hidden lg:block">
            <button type="button" onClick={() => setMenu(menu === "account" ? null : "account")} aria-expanded={menu === "account"} aria-haspopup="true"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-2 text-sm font-semibold text-ink transition hover:border-forest/30 hover:bg-forest-50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-ivory"><Icon name="user" className="h-4 w-4" /></span>
              Account <Icon name="chevron-down" className={`h-3.5 w-3.5 transition-transform ${menu === "account" ? "rotate-180" : ""}`} />
            </button>
            {menu === "account" && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 rounded-2xl border border-line bg-surface p-2 shadow-card-hover animate-fade-in">
                {accountItems.map((it) => <Link key={it.href} href={it.href} onClick={() => setMenu(null)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-forest-50 hover:text-forest">
                  <Icon name={it.icon} className="h-4 w-4 text-ink-muted" />{it.label}
                </Link>)}
                <div className="my-1.5 h-px bg-line" />
                <form action={logoutAction}><button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"><Icon name="logout" className="h-4 w-4" />Sign out</button></form>
              </div>
            )}
          </div>
        ) : (
          <div className="ml-1 hidden items-center gap-2 lg:flex">
            <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
          </div>
        )}

        <button type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}
          className="btn-icon ml-1 lg:hidden">
          <Icon name={mobileOpen ? "close" : "menu"} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-70px)] overflow-y-auto border-b border-line bg-paper px-4 py-5 shadow-card-hover sm:px-6 lg:hidden">
          <form action="/books" role="search" className="relative mb-5">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input name="q" aria-label="Search books" placeholder="Search books, authors…" className="field pl-10" />
          </form>
          <p className="label">Browse</p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {browse.map((b) => <Link key={b.href} href={b.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium transition hover:border-forest/30 hover:bg-forest-50">
              <Icon name={b.icon} className="h-4 w-4 shrink-0 text-forest" /><span className="truncate">{b.label}</span>
            </Link>)}
          </div>
          <p className="label">Your account</p>
          <div className="grid grid-cols-2 gap-2">
            {(user ? accountItems : guestItems).map((it) => (
              <Link key={it.href} href={it.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium transition hover:border-forest/30 hover:bg-forest-50">
                <Icon name={it.icon} className="h-4 w-4 shrink-0 text-forest" /><span className="truncate">{it.label}</span>
              </Link>
            ))}
          </div>
          {user && <form action={logoutAction} className="mt-3"><button className="btn btn-outline w-full"><Icon name="logout" className="h-4 w-4" />Sign out</button></form>}
          <div className="mt-5 flex gap-2 border-t border-line pt-4 text-xs text-ink-muted">
            <Link href="/about" onClick={() => setMobileOpen(false)} className="hover:text-forest">About</Link><span>·</span>
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="hover:text-forest">How it works</Link><span>·</span>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="hover:text-forest">Contact</Link>
          </div>
        </div>
      )}
    </div>
  );
}
