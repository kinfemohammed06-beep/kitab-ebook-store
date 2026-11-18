import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Activity Logs" };

export default async function Logs() {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("admin_logs").select("id,action,target_type,target_id,detail,created_at,profiles(full_name,email)").order("created_at", { ascending: false }).limit(100);
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Audit trail" title="Admin activity log" description="A record of changes made from the admin console." />
        <div className="card divide-y divide-line">
          {(data ?? []).map((l: any) => (
            <div key={l.id} className="flex gap-3 p-4 text-sm">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest"><Icon name="list" className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold capitalize">{l.action.replace(/_/g, " ")} <span className="font-normal text-ink-muted">· {l.profiles?.full_name || l.profiles?.email || "System"} · {new Date(l.created_at).toLocaleString("en-GB")}</span></p>
                <p className="mt-1 break-all text-xs text-ink-muted">{l.target_type} {l.target_id}{l.detail ? ` · ${JSON.stringify(l.detail)}` : ""}</p>
              </div>
            </div>
          ))}
          {!data?.length && <p className="p-5 text-sm text-ink-muted">No activity recorded yet.</p>}
        </div>
      </div>
    </>
  );
}
