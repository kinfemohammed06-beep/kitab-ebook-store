import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { etb } from "@/lib/books";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { authorApprove, authorSuspend } from "../actions";
export const metadata = { title: "Author Management" };

export default async function AdminAuthors({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("author_profiles").select("user_id,pen_name,approved,commission_override_pct,available_balance_etb,profiles(full_name,email)").order("approved").order("created_at", { ascending: false });
  const { data: def } = await sb.from("platform_settings").select("value").eq("key", "commission_pct").single();
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="People" title="Author management" description={`Default commission: ${String(def?.value)}%. Leave a field empty to use the default.`} />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        <div className="card divide-y divide-line">
          {(data ?? []).map((a: any) => (
            <form key={a.user_id} className="flex flex-wrap items-center gap-4 p-4">
              <input type="hidden" name="id" value={a.user_id} />
              <div className="min-w-[220px] flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-base">{a.pen_name} <StatusBadge value={a.approved ? "active" : "pending"} /></p>
                <p className="mt-0.5 text-xs text-ink-muted">{a.profiles?.full_name} · {a.profiles?.email} · balance {etb(a.available_balance_etb)}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-muted">Commission %
                <input name="commission" type="number" step="0.01" min="0" max="100" defaultValue={a.commission_override_pct ?? ""} placeholder={String(def?.value ?? "")} className="field field-sm !w-20" />
              </label>
              <div className="flex gap-2"><button formAction={authorApprove} className="btn btn-primary btn-sm">Approve</button><button formAction={authorSuspend} className="btn btn-outline btn-sm">Suspend</button></div>
            </form>
          ))}
          {!data?.length && <p className="p-5 text-sm text-ink-muted">No author profiles yet.</p>}
        </div>
      </div>
    </>
  );
}
