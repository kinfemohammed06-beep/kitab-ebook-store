import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { userSave } from "../actions";
export const metadata = { title: "User Management" };

export default async function Users({ searchParams }: { searchParams: { q?: string; msg?: string } }) {
  const { sb } = await requireAdmin(); const q = (searchParams.q ?? "").replace(/[,()%*]/g, " ").trim();
  let query = sb.from("profiles").select("id,full_name,email,role,status,created_at").order("created_at", { ascending: false }).limit(50);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data } = await query; const ids = (data ?? []).map((u) => u.id);
  const { data: ords } = ids.length ? await sb.from("orders").select("user_id,total_etb").eq("status", "paid").in("user_id", ids) : { data: [] };
  const spent = (u: string) => { const o = (ords ?? []).filter((x) => x.user_id === u); return `${o.length} orders · ${etb(o.reduce((s, x) => s + Number(x.total_etb), 0))}`; };
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="People" title="User management" description="Find accounts, change roles and manage account status." />
        <form className="mb-6 flex flex-wrap gap-2" role="search">
          <div className="relative min-w-[240px] flex-1"><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input name="q" defaultValue={q} placeholder="Search name or email" className="field pl-9" /></div>
          <button className="btn btn-primary"><Icon name="search" className="h-4 w-4" />Search</button>
        </form>
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        <div className="card divide-y divide-line">
          {(data ?? []).map((u) => (
            <form key={u.id} className="flex flex-wrap items-center gap-4 p-4">
              <input type="hidden" name="id" value={u.id} />
              <div className="min-w-[220px] flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-base">{u.full_name || "(no name)"} <StatusBadge value={u.status} /></p>
                <p className="mt-0.5 text-xs text-ink-muted">{u.email} · {spent(u.id)}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-muted">Role
                <select name="role" defaultValue={u.role} className="field field-sm !w-28">{["reader", "author", "publisher", "admin"].map((r) => <option key={r}>{r}</option>)}</select>
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">Status
                <select name="status" defaultValue={u.status} className="field field-sm !w-28"><option>active</option><option>suspended</option></select>
              </label>
              <button formAction={userSave} className="btn btn-outline btn-sm">Save</button>
            </form>
          ))}
          {!data?.length && <p className="p-5 text-sm text-ink-muted">No users found.</p>}
        </div>
      </div>
    </>
  );
}
