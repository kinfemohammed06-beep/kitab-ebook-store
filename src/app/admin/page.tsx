import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { etb } from "@/lib/books";
import { type IconName } from "@/components/Icons";
import { PageHeader, StatCard } from "@/components/ui";
export const metadata = { title: "Admin Overview" };

export default async function AdminHome() {
  const { sb } = await requireAdmin();
  const { data: s } = await sb.from("admin_stats").select("*").single();
  const cards: [string, string | number, IconName][] = [
    ["Registered users", s?.users ?? 0, "users"], ["Authors", s?.authors ?? 0, "feather"],
    ["Published books", s?.published ?? 0, "books"], ["Pending submissions", s?.pending_books ?? 0, "clock"],
    ["Sales", s?.sales ?? 0, "receipt"], ["Revenue", etb(Number(s?.revenue ?? 0)), "coins"],
    ["Platform commissions", etb(Number(s?.commissions ?? 0)), "percent"], ["Pending payments", s?.pending_payments ?? 0, "wallet"],
    ["Approved payments", s?.approved_payments ?? 0, "check-circle"], ["Pending withdrawals", s?.pending_withdrawals ?? 0, "download"],
  ];
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Control centre" title="Admin overview" description="A live snapshot of the marketplace, straight from the database." />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {cards.map(([label, value, icon]) => <StatCard key={label} label={label} value={value} icon={icon} />)}
        </div>
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink-muted">
          Figures come straight from the database. Export a transaction CSV from the <a href="/admin/finance" className="link-underline">Finance</a> page.
        </p>
      </div>
    </>
  );
}
