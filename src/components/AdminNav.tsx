"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icons";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Overview", icon: "chart" },
  { href: "/admin/payments", label: "Payments", icon: "wallet" },
  { href: "/admin/books", label: "Books", icon: "books" },
  { href: "/admin/authors", label: "Authors", icon: "feather" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "coins" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/categories", label: "Categories", icon: "grid" },
  { href: "/admin/coupons", label: "Coupons", icon: "tag" },
  { href: "/admin/reviews", label: "Reviews", icon: "star" },
  { href: "/admin/finance", label: "Finance", icon: "receipt" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/logs", label: "Logs", icon: "list" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="border-b border-line bg-forest-50/60 lg:sticky lg:top-[70px] lg:z-30">
      <div className="scroll-thin mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
        {links.map((l) => {
          const active = pathname === l.href;
          return <Link key={l.href} href={l.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? "bg-forest text-ivory shadow-soft" : "text-ink-muted hover:bg-surface hover:text-forest"}`}>
            <Icon name={l.icon} className="h-3.5 w-3.5" />{l.label}
          </Link>;
        })}
      </div>
    </nav>
  );
}
