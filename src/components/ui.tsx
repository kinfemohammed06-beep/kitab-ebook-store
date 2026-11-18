import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icons";

export function PageHeader({ eyebrow, title, description, actions, back }: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        {back && <Link href={back.href} className="link-underline mb-3 inline-flex items-center gap-1.5 text-xs">
          <Icon name="arrow-left" className="h-3.5 w-3.5" />{back.label}
        </Link>}
        {eyebrow && <span className="eyebrow mb-2"><span className="h-px w-6 bg-gold" />{eyebrow}</span>}
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="prose-kitab mt-3 max-w-2xl text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ title, subtitle, href, linkLabel = "See all" }: {
  title: string; subtitle?: string; href?: string; linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {href && <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-700">
        {linkLabel}<Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>}
    </div>
  );
}

export function EmptyState({ icon = "book", title, description, href, actionLabel }: {
  icon?: IconName; title: string; description?: string; href?: string; actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-forest/20 bg-forest-50/40 px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-forest shadow-soft">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="font-display text-xl">{title}</h3>
      {description && <p className="prose-kitab mt-2 max-w-md text-sm">{description}</p>}
      {href && actionLabel && <Link href={href} className="btn btn-primary mt-5"><Icon name="arrow-right" className="h-4 w-4" />{actionLabel}</Link>}
    </div>
  );
}

export function StatCard({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: IconName; hint?: string }) {
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
        {icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest"><Icon name={icon} className="h-4 w-4" /></span>}
      </div>
      <p className="mt-2 break-words font-display text-2xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

const alertTones = {
  info: "border-forest/15 bg-forest-50 text-forest-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};
const alertIcons: Record<keyof typeof alertTones, IconName> = { info: "info", success: "check-circle", warning: "alert", error: "alert" };

export function Alert({ kind = "info", children, title }: { kind?: keyof typeof alertTones; children: ReactNode; title?: string }) {
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`mb-5 flex gap-3 rounded-xl border px-4 py-3 text-sm ${alertTones[kind]}`}>
      <Icon name={alertIcons[kind]} className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{title && <p className="font-semibold">{title}</p>}<div>{children}</div></div>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase().replace(/_/g, " ");
  const tone = ["approved", "paid", "active", "completed", "delivered"].includes(v) ? "badge-success"
    : ["pending", "awaiting", "submitted", "needs info", "pending review", "draft"].includes(v) ? "badge-warning"
    : ["rejected", "suspended", "expired", "cancelled"].includes(v) ? "badge-danger" : "badge-muted";
  return <span className={tone}>{v.replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <Icon name="chevron-right" className="h-3 w-3 text-ink-soft" />}
          {it.href ? <Link href={it.href} className="hover:text-forest">{it.label}</Link> : <span className="font-semibold text-forest">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
