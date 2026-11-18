import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { SETTINGS } from "@/lib/settings";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader } from "@/components/ui";
import { saveSettings } from "../actions";
export const metadata = { title: "Website Settings" };

export default async function Settings({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("platform_settings").select("key,value");
  const v = (k: string) => String((data ?? []).find((r) => r.key === k)?.value ?? "");
  return (
    <>
      <AdminNav />
      <div className="page-narrow !py-8">
        <PageHeader eyebrow="Configuration" title="Website settings" description="Contact details, payment information and the content of legal pages." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        <form action={saveSettings} className="card-pad space-y-5">
          {SETTINGS.map(([k, label, type]) => (
            <label key={k} className="block"><span className="label">{label}</span>
              {type === "area" ? <textarea name={k} defaultValue={v(k)} rows={k === "announcement" ? 2 : 8} className="field" />
                : <input name={k} type={type} step="0.01" defaultValue={v(k)} className="field" />}
            </label>
          ))}
          <div className="border-t border-line pt-5">
            <button className="btn btn-primary"><Icon name="check" className="h-4 w-4" />Save settings</button>
            <p className="mt-3 text-xs text-ink-soft">Changes to these settings are recorded in the activity log.</p>
          </div>
        </form>
      </div>
    </>
  );
}
