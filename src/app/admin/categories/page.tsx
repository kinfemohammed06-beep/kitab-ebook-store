import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader } from "@/components/ui";
import { catAdd, catSave, catDelete } from "../actions";
export const metadata = { title: "Categories" };

export default async function Categories({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("categories").select("*").order("name_en");
  const f = "field field-sm";
  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Catalogue" title="Categories" description="Organise how readers browse the collection." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        <form className="card mb-7 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label><span className="label">Slug</span><input name="slug" required placeholder="e.g. poetry" className={f} /></label>
          <label><span className="label">English name</span><input name="name_en" required placeholder="Poetry" className={f} /></label>
          <label><span className="label">አማርኛ</span><input name="name_am" placeholder="ግጥም" className={f} /></label>
          <label><span className="label">Afaan Oromo</span><input name="name_om" className={f} /></label>
          <label><span className="label">ትግርኛ</span><input name="name_ti" className={f} /></label>
          <label><span className="label">Parent category</span><select name="parent" className={f}><option value="">No parent</option>{(data ?? []).filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></label>
          <div className="sm:col-span-2 lg:col-span-3"><button formAction={catAdd} className="btn btn-primary"><Icon name="plus" className="h-4 w-4" />Add category</button></div>
        </form>
        <div className="card divide-y divide-line">
          {(data ?? []).map((c) => (
            <form key={c.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center">
              <input type="hidden" name="id" value={c.id} />
              <input name="name_en" defaultValue={c.name_en} aria-label="English name" className={f} />
              <input name="name_am" defaultValue={c.name_am ?? ""} aria-label="Amharic name" className={f} />
              <input name="name_om" defaultValue={c.name_om ?? ""} aria-label="Afaan Oromo name" className={f} />
              <input name="name_ti" defaultValue={c.name_ti ?? ""} aria-label="Tigrinya name" className={f} />
              <div className="flex gap-2"><button formAction={catSave} className="btn btn-outline btn-sm">Save</button><button formAction={catDelete} className="btn btn-danger btn-sm">Delete</button></div>
            </form>
          ))}
          {!data?.length && <p className="p-5 text-sm text-ink-muted">No categories yet.</p>}
        </div>
      </div>
    </>
  );
}
