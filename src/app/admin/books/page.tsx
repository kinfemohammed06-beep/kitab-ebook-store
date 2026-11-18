import { requireAdmin } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import AdminNav from "@/components/AdminNav";
import { Cover } from "@/components/BookCard";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { bookApprove, bookReject, bookSave, bookRemove } from "../actions";
export const metadata = { title: "Book Management" };

export default async function AdminBooks({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin(); const db = admin();
  const sel = "id,title,description,price_etb,cover_path,is_featured,isbn,author_profiles(pen_name),book_files(format,storage_path,size_bytes,is_sample)";
  const [{ data: pending }, { data: live }] = await Promise.all([
    sb.from("books").select(sel).eq("status", "pending_review").order("created_at"),
    sb.from("books").select(sel).eq("status", "approved").order("published_at", { ascending: false }).limit(50)]);
  const rows = (pending ?? []) as any[];
  for (const b of rows) for (const f of b.book_files) f.url = (await db.storage.from("book-files").createSignedUrl(f.storage_path, 600)).data?.signedUrl;

  return (
    <>
      <AdminNav />
      <div className="page !py-8">
        <PageHeader eyebrow="Catalogue" title="Book management" description="Review new submissions and manage published titles." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}

        <section className="mb-12">
          <div className="mb-4 flex items-center gap-3"><h2 className="section-title">Pending review</h2><span className="badge-warning">{rows.length}</span></div>
          {rows.length ? <div className="space-y-5">
            {rows.map((b) => (
              <form key={b.id} className="card grid gap-5 p-5 sm:grid-cols-[130px_1fr]">
                <input type="hidden" name="id" value={b.id} />
                <Cover b={b} />
                <div className="min-w-0 text-sm">
                  <h3 className="font-display text-xl">{b.title}</h3>
                  <p className="mt-1 text-ink-muted">by {b.author_profiles?.pen_name} · ETB {b.price_etb}{b.isbn ? ` · ISBN ${b.isbn}` : ""}</p>
                  <p className="prose-kitab mt-3 line-clamp-5 whitespace-pre-line text-sm">{b.description}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-ink-muted">Files:</span>
                    {b.book_files.length ? b.book_files.map((f: any) => <a key={f.format} href={f.url} target="_blank" rel="noreferrer" className="link-underline uppercase">{f.format} ({Math.round(f.size_bytes / 1024)} KB) <Icon name="external" className="inline h-3 w-3" /></a>) : "none"}
                  </p>
                  <label className="mt-4 block"><span className="label">Reason (required to reject)</span><textarea name="note" rows={2} placeholder="Explain what needs to change…" className="field" /></label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button formAction={bookApprove} className="btn btn-primary"><Icon name="check" className="h-4 w-4" />Approve &amp; publish</button>
                    <button formAction={bookReject} className="btn btn-danger"><Icon name="close" className="h-4 w-4" />Reject</button>
                  </div>
                </div>
              </form>
            ))}
          </div> : <p className="rounded-xl border border-line bg-surface px-4 py-5 text-sm text-ink-muted">No submissions waiting for review.</p>}
        </section>

        <section>
          <h2 className="section-title mb-4">Published <span className="badge-forest align-middle">{live?.length ?? 0}</span></h2>
          <div className="card divide-y divide-line">
            {(live ?? []).map((b: any) => (
              <form key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                <input type="hidden" name="id" value={b.id} />
                <span className="min-w-[200px] flex-1 font-display text-base">{b.title}</span>
                <label className="flex items-center gap-2 text-xs text-ink-muted">ETB
                  <input name="price" type="number" step="0.01" min="0" defaultValue={b.price_etb} aria-label={`Price for ${b.title}`} className="field field-sm !w-24" />
                </label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="featured" defaultChecked={b.is_featured} />Featured</label>
                <div className="flex gap-2"><button formAction={bookSave} className="btn btn-outline btn-sm">Save</button><button formAction={bookRemove} className="btn btn-danger btn-sm">Remove</button></div>
              </form>
            ))}
            {!live?.length && <p className="p-5 text-sm text-ink-muted">No published books yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
