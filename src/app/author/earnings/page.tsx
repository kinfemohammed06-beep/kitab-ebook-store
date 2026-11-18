import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { requestWithdrawal } from "../actions";
export const metadata = { title: "Earnings" };

export default async function Earnings({ searchParams }: { searchParams: { error?: string; requested?: string } }) {
  const { sb, user } = await requireUser();
  const { data: a } = await sb.from("author_profiles").select("available_balance_etb,approved").eq("user_id", user.id).maybeSingle();
  if (!a) redirect("/author");
  const [{ data: earn }, { data: wd }] = await Promise.all([
    admin().from("author_earnings").select("gross_etb,commission_pct,commission_etb,net_etb,created_at,order_items(books(title))").eq("author_id", user.id).order("created_at", { ascending: false }).limit(50),
    sb.from("withdrawal_requests").select("amount_etb,status,admin_note,created_at").eq("author_id", user.id).order("created_at", { ascending: false })]);

  return (
    <div className="page">
      <PageHeader eyebrow="Your numbers" title="Earnings"
        description="Track sales, commissions and withdrawal requests in one place." />
      <div className="card mb-7 flex flex-wrap items-center justify-between gap-4 bg-forest-gradient !border-forest-700 p-6 text-ivory">
        <div><p className="text-xs font-bold uppercase tracking-widest text-gold">Available balance</p><p className="mt-1 font-display text-4xl">{etb(a.available_balance_etb)}</p></div>
        <Icon name="wallet" className="h-10 w-10 text-ivory/30" />
      </div>
      {searchParams.error && <Alert kind="error">{searchParams.error}</Alert>}
      {searchParams.requested && <Alert kind="success" title="Withdrawal requested">An administrator will process it manually.</Alert>}
      {a.approved && (
        <form action={requestWithdrawal} className="card mb-10 grid gap-3 p-5 sm:grid-cols-[160px_1fr_auto]">
          <label className="sm:self-end"><span className="label">Amount (ETB)</span><input name="amount" type="number" step="0.01" min="1" required placeholder="0.00" className="field" /></label>
          <label className="sm:self-end"><span className="label">Payout details</span><input name="details" required placeholder="Telebirr number or bank account + name" className="field" /></label>
          <button className="btn btn-primary sm:self-end"><Icon name="arrow-right" className="h-4 w-4" />Request withdrawal</button>
        </form>
      )}

      <section className="mb-10">
        <h2 className="section-title mb-4">Withdrawals</h2>
        {wd?.length ? (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>{wd.map((w, i) => <tr key={i}><td className="whitespace-nowrap">{new Date(w.created_at).toLocaleDateString("en-GB")}</td><td className="font-semibold">{etb(w.amount_etb)}</td><td><StatusBadge value={w.status} /></td><td className="text-ink-muted">{w.admin_note ?? "—"}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="text-sm text-ink-muted">No withdrawals yet.</p>}
      </section>

      <section>
        <h2 className="section-title mb-4">Sales</h2>
        {earn?.length ? (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Book</th><th>Price</th><th>Commission</th><th>You earned</th></tr></thead>
            <tbody>{earn.map((e: any, i) => <tr key={i}><td>{e.order_items?.books?.title}</td><td>{etb(e.gross_etb)}</td><td>{e.commission_pct}% ({etb(e.commission_etb)})</td><td className="font-semibold text-forest">{etb(e.net_etb)}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="text-sm text-ink-muted">No sales yet.</p>}
      </section>
    </div>
  );
}
