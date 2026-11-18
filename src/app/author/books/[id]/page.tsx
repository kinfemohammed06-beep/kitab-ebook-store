import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Icon } from "@/components/Icons";
import { Alert, Breadcrumb, PageHeader } from "@/components/ui";
export const metadata = { title: "Edit Book" };

export default async function EditBook({ params }: { params: { id: string } }) {
  const { sb, user } = await requireUser();
  const { data: b } = await sb.from("books").select("*").eq("id", params.id).eq("author_id", user.id).maybeSingle();
  if (!b) notFound();
  async function save(fd: FormData) {
    "use server";
    const { sb, user } = await requireUser();
    const price = Number(fd.get("price")); const title = String(fd.get("title")).trim();
    if (!title || !(price >= 0 && price <= 100000)) redirect(`/author/books/${params.id}`);
    const { error } = await sb.from("books").update({ title, subtitle: String(fd.get("subtitle")).trim() || null, description: String(fd.get("description")).trim().slice(0, 5000),
      price_etb: price, isbn: String(fd.get("isbn")).trim() || null, pages: Number(fd.get("pages")) || null, status: "pending_review", rejection_reason: null }).eq("id", params.id).eq("author_id", user.id);
    redirect(error ? `/author/books/${params.id}` : "/author?saved=1");   // RLS refuses edits once a book is approved
  }
  const editable = ["draft", "pending_review", "rejected"].includes(b.status);

  return (
    <div className="page-narrow">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Author dashboard", href: "/author" }, { label: "Edit book" }]} />
      <PageHeader eyebrow="Book details" title="Edit book" description="Update the information readers see. Saving resubmits the book for review." />
      {b.status === "rejected" && <Alert kind="error" title="This book was rejected">{b.rejection_reason}. Saving resubmits it for review.</Alert>}
      {!editable ? <Alert kind="info" title="Published books are locked">Published books can only be changed by an administrator.</Alert> : (
        <form action={save} className="card-pad space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Title</span><input name="title" defaultValue={b.title} required className="field" /></label>
            <label className="sm:col-span-2"><span className="label">Subtitle</span><input name="subtitle" defaultValue={b.subtitle ?? ""} className="field" /></label>
          </div>
          <label><span className="label">Description</span><textarea name="description" defaultValue={b.description ?? ""} rows={6} className="field" /></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label><span className="label">Price (ETB)</span><input name="price" type="number" step="0.01" min="0" defaultValue={b.price_etb} className="field" /></label>
            <label><span className="label">ISBN</span><input name="isbn" defaultValue={b.isbn ?? ""} className="field" /></label>
            <label><span className="label">Pages</span><input name="pages" type="number" defaultValue={b.pages ?? ""} className="field" /></label>
          </div>
          <button className="btn btn-primary"><Icon name="check" className="h-4 w-4" />Save &amp; submit for review</button>
        </form>
      )}
    </div>
  );
}
