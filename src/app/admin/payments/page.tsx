import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { etb } from "@/lib/books";
import AdminNav from "@/components/AdminNav";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
export const metadata = { title: "Payment Verification" };

const go = (m: string) => redirect(`/admin/payments?msg=${encodeURIComponent(m)}`);
async function act(fd: FormData, fn: "approve_payment" | "reject_payment" | "request_payment_info") {
  "use server";
  const { sb } = await requireAdmin();   // RPCs also re-check is_admin() inside the database
  const id = String(fd.get("id")); const note = String(fd.get("note") ?? "").trim();
  const { error } = fn === "approve_payment" ? await sb.rpc(fn, { p_payment_id: id }) : await sb.rpc(fn, fn === "reject_payment" ? { p_payment_id: id, p_reason: note } : { p_payment_id: id, p_message: note });
  revalidatePath("/admin/payments"); go(error ? `Error: ${error.message}` : "Done.");
}

export default async function Payments({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const approve = async (fd: FormData) => { "use server"; await act(fd, "approve_payment"); };
  const reject = async (fd: FormData) => { "use server"; await act(fd, "reject_payment"); };
  const info = async (fd: FormData) => { "use server"; await act(fd, "request_payment_info"); };
  const { data } = await sb.from("payments").select("id,reference_no,amount_etb,status,reviewer_note,submitted_at,orders(order_number,total_etb,profiles(full_name,email)),payment_screenshots(storage_path)")
    .in("status", ["submitted", "needs_info"]).order("submitted_at");
  const { data: all } = await sb.from("payments").select("id,reference_no");
  const counts = new Map<string, number>(); (all ?? []).forEach((p) => counts.set(p.reference_no.toUpperCase(), (counts.get(p.reference_no.toUpperCase()) ?? 0) + 1));
  const db = admin(); const rows = (data ?? []) as any[];
  for (const r of rows) { const sp = r.payment_screenshots?.[0]?.storage_path; r.url = sp ? (await db.storage.from("payment-proofs").createSignedUrl(sp, 300)).data?.signedUrl : null; }

  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Payments" title="Payment verification"
          description="Compare the reference and amount with your Telebirr account statement before approving. A screenshot alone is not proof of payment." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        {!rows.length && <p className="card-pad text-sm text-ink-muted">No payments awaiting review.</p>}
        <div className="space-y-6">
          {rows.map((r) => (
            <form key={r.id} className="card grid gap-5 p-5 md:grid-cols-[240px_1fr]">
              <input type="hidden" name="id" value={r.id} />
              {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line bg-paper">
                <img src={r.url} alt="Payment receipt" className="max-h-72 w-full object-contain" />
              </a> : <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-muted">No screenshot</div>}
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="font-display text-lg">{r.orders?.order_number}</span><StatusBadge value={r.status} /></div>
                <p className="mt-1 text-ink-muted">{r.orders?.profiles?.full_name} ({r.orders?.profiles?.email})</p>
                <div className="mt-3 grid gap-2 rounded-xl bg-paper p-3 sm:grid-cols-2">
                  <p>Expected: <strong className="text-forest">{etb(r.orders?.total_etb)}</strong></p>
                  <p>Reference: <strong className="select-all">{r.reference_no}</strong></p>
                </div>
                {counts.get(r.reference_no.toUpperCase())! > 1 && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-700"><Icon name="alert" className="h-4 w-4" />Reference used in another submission</p>}
                <p className="mt-2 text-xs text-ink-muted">Submitted {new Date(r.submitted_at).toLocaleString("en-GB")}</p>
                <label className="mt-4 block"><span className="label">Reason / message to customer</span>
                  <textarea name="note" placeholder="Required for Reject and Request Info" className="field" rows={2} /></label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button formAction={approve} className="btn btn-primary"><Icon name="check" className="h-4 w-4" />Approve payment</button>
                  <button formAction={reject} className="btn btn-danger"><Icon name="close" className="h-4 w-4" />Reject payment</button>
                  {r.status === "submitted" && <button formAction={info} className="btn btn-outline"><Icon name="info" className="h-4 w-4" />Request info</button>}
                </div>
              </div>
            </form>
          ))}
        </div>
      </div>
    </>
  );
}
