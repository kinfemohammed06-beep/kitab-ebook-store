import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { couponCreate, couponExpire } from "../actions";
export const metadata = { title: "Coupons" };

export default async function Coupons({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("coupons").select("*").order("code");
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Promotions" title="Coupons" description="Create discount codes and keep an eye on how they are used." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        <form className="card mb-7 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <label><span className="label">Code</span><input name="code" required placeholder="READER10" className="field field-sm uppercase" /></label>
          <label><span className="label">Type</span><select name="type" className="field field-sm"><option value="percent">% off</option><option value="fixed">ETB off</option></select></label>
          <label><span className="label">Value</span><input name="value" type="number" step="0.01" min="1" required placeholder="10" className="field field-sm" /></label>
          <label><span className="label">Expires</span><input name="expires" type="date" className="field field-sm" /></label>
          <label><span className="label">Max uses</span><input name="max" type="number" min="1" placeholder="Unlimited" className="field field-sm" /></label>
          <div className="sm:col-span-2 lg:col-span-5"><button formAction={couponCreate} className="btn btn-primary"><Icon name="plus" className="h-4 w-4" />Create coupon</button></div>
        </form>
        <div className="card divide-y divide-line">
          {(data ?? []).map((c) => {
            const dead = c.expires_at && new Date(c.expires_at) < new Date();
            return (
              <form key={c.id} className="flex flex-wrap items-center gap-4 p-4 text-sm">
                <input type="hidden" name="id" value={c.id} />
                <span className="min-w-[110px] font-display text-base">{c.code}</span>
                <span className="badge-gold">{c.percent_off ? `${c.percent_off}% off` : `ETB ${c.fixed_off_etb} off`}</span>
                <span className="text-ink-muted">used {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</span>
                <span className="text-ink-muted">{c.expires_at ? `${dead ? "expired" : "expires"} ${new Date(c.expires_at).toLocaleDateString("en-GB")}` : "no expiry"}</span>
                <StatusBadge value={dead ? "expired" : "active"} />
                {!dead && <button formAction={couponExpire} className="btn btn-danger btn-sm ml-auto">Expire now</button>}
              </form>
            );
          })}
          {!data?.length && <p className="p-5 text-sm text-ink-muted">No coupons yet.</p>}
        </div>
      </div>
    </>
  );
}
