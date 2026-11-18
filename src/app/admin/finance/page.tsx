import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { PageHeader, StatCard } from "@/components/ui";
export const metadata = { title: "Financial Reports" };

export default async function Finance() {
  const { sb } = await requireAdmin();
  const [{ data: s }, { data: au }, { data: tx }, { data: po }] = await Promise.all([
    sb.from("admin_stats").select("revenue,commissions").single(), sb.from("author_earning_totals").select("*").order("net", { ascending: false }),
    sb.from("transactions").select("id,kind,amount_etb,created_at").order("created_at", { ascending: false }).limit(50), sb.from("transactions").select("amount_etb").eq("kind", "payout")]);
  const paid = (po ?? []).reduce((a, r) => a + Number(r.amount_etb), 0); const owed = (au ?? []).reduce((a, r) => a + Number(r.balance), 0);
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Reports" title="Financial reports" description="Revenue, commissions and what is owed to authors."
          actions={<Link href="/admin/finance/export" className="btn btn-outline"><Icon name="download" className="h-4 w-4" />Export CSV</Link>} />
        <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Verified revenue" value={etb(Number(s?.revenue ?? 0))} icon="coins" />
          <StatCard label="Platform commission" value={etb(Number(s?.commissions ?? 0))} icon="percent" />
          <StatCard label="Owed to authors" value={etb(owed)} icon="wallet" />
          <StatCard label="Paid out" value={etb(paid)} icon="check-circle" />
        </div>

        <section className="mb-10">
          <h2 className="section-title mb-4">By author</h2>
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Author</th><th>Sales</th><th>Gross</th><th>Commission</th><th>Net</th><th>Balance</th></tr></thead>
            <tbody>{(au ?? []).map((a) => <tr key={a.author_id}><td className="font-semibold">{a.pen_name}</td><td>{a.sales}</td><td>{etb(a.gross)}</td><td>{etb(a.commission)}</td><td>{etb(a.net)}</td><td className="font-semibold text-forest">{etb(a.balance)}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section>
          <h2 className="section-title mb-4">Recent transactions</h2>
          <div className="card divide-y divide-line">
            {(tx ?? []).map((t) => <div key={t.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm"><span className="text-ink-muted">{new Date(t.created_at).toLocaleString("en-GB")} · {t.kind}</span><span className="font-semibold">{etb(t.amount_etb)}</span></div>)}
            {!tx?.length && <p className="p-5 text-sm text-ink-muted">No transactions yet.</p>}
          </div>
          <p className="mt-4 text-xs text-ink-soft">Refund records are not built yet; refunds would need their own flow and ledger entries.</p>
        </section>
      </div>
    </>
  );
}
