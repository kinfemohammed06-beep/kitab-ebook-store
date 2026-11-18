import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { wdApprove, wdPaid, wdReject } from "../actions";
export const metadata = { title: "Withdrawals" };

export default async function AdminWithdrawals({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("withdrawal_requests").select("id,amount_etb,status,payout_details,admin_note,created_at,author_profiles(pen_name)").in("status", ["pending", "approved"]).order("created_at");
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Payouts" title="Withdrawals" description="Send the money manually (Telebirr or bank), then record the outcome here." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        {!data?.length && <p className="card-pad text-sm text-ink-muted">No open requests.</p>}
        <div className="space-y-4">
          {(data ?? []).map((w: any) => (
            <form key={w.id} className="card-pad text-sm">
              <input type="hidden" name="id" value={w.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-lg">{w.author_profiles?.pen_name} <span className="ml-2 font-sans font-semibold text-forest">{etb(w.amount_etb)}</span></p>
                <div className="flex items-center gap-2"><StatusBadge value={w.status} /><span className="text-xs text-ink-muted">{new Date(w.created_at).toLocaleDateString("en-GB")}</span></div>
              </div>
              <p className="mt-3 rounded-xl bg-paper px-3.5 py-2.5 text-xs"><span className="font-semibold text-ink-muted">Pay to:</span> {w.payout_details}</p>
              <label className="mt-4 block"><span className="label">Note / payout reference <span className="font-normal normal-case tracking-normal text-ink-soft">(required to reject)</span></span>
                <input name="note" placeholder="Add a reference" className="field" /></label>
              <div className="mt-4 flex flex-wrap gap-2">
                {w.status === "pending" && <button formAction={wdApprove} className="btn btn-outline btn-sm">Approve</button>}
                {w.status === "approved" && <button formAction={wdPaid} className="btn btn-primary btn-sm"><Icon name="check" className="h-4 w-4" />Mark paid</button>}
                <button formAction={wdReject} className="btn btn-danger btn-sm">Reject</button>
              </div>
            </form>
          ))}
        </div>
        <p className="mt-5 text-xs text-ink-soft">Rejecting refunds the amount to the author's balance.</p>
      </div>
    </>
  );
}
