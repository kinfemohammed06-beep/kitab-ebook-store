import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { Alert, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { applyAsAuthor } from "./actions";
export const metadata = { title: "Author Dashboard" };

export default async function AuthorHome({ searchParams }: { searchParams: { uploaded?: string; saved?: string; error?: string } }) {
  const { sb, user } = await requireUser();
  const { data: a } = await sb.from("author_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!a) return (
    <div className="page-narrow">
      <PageHeader eyebrow="Share your work" title="Become an author" description="Apply to publish on Kitab. An administrator reviews every author before their books go live." />
      <form action={applyAsAuthor} className="card-pad space-y-4">
        {searchParams.error && <Alert kind="error">{searchParams.error}</Alert>}
        <label className="block"><span className="label">Pen name</span><input name="pen_name" required placeholder="The name readers will see" className="field" /></label>
        <p className="rounded-xl bg-forest-50/70 px-3.5 py-2.5 text-xs leading-5 text-forest-800">New authors are reviewed by an administrator before they can publish.</p>
        <button className="btn btn-primary"><Icon name="feather" className="h-4 w-4" />Apply now</button>
      </form>
    </div>
  );

  const { data: books } = await sb.from("books").select("id,title,slug,status,rejection_reason,price_etb").eq("author_id", user.id).order("created_at", { ascending: false });
  const ids = (books ?? []).map((b) => b.id);
  const [{ data: earn }, { count: dl }, { data: rat }] = await Promise.all([
    sb.from("author_earnings").select("net_etb,order_item_id").eq("author_id", user.id),
    ids.length ? admin().from("downloads").select("id", { count: "exact", head: true }).in("book_id", ids) : Promise.resolve({ count: 0 } as any),
    ids.length ? sb.from("book_ratings").select("*").in("book_id", ids) : Promise.resolve({ data: [] } as any)]);
  const revenue = (earn ?? []).reduce((s, e) => s + Number(e.net_etb), 0);

  async function saveProfile(fd: FormData) {
    "use server";
    const { sb, user } = await requireUser(); const pen = String(fd.get("pen_name") ?? "").trim().slice(0, 80);
    if (pen) await sb.from("author_profiles").update({ pen_name: pen, bio: String(fd.get("bio") ?? "").slice(0, 1500) }).eq("user_id", user.id);
    redirect("/author");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Creator space" title="Author dashboard"
        description="Keep track of your books, sales and public author profile."
        actions={a.approved ? <Link href="/author/upload" className="btn btn-primary"><Icon name="upload" className="h-4 w-4" />Upload book</Link> : undefined} />
      {!a.approved && <Alert kind="warning" title="Application under review">Your author account is awaiting admin approval. You will be notified.</Alert>}
      {searchParams.uploaded && <Alert kind="success" title="Book submitted">It is pending review until an administrator approves it.</Alert>}
      {searchParams.saved && <Alert kind="success" title="Changes saved">Your book has been resubmitted for review.</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sales" value={earn?.length ?? 0} icon="receipt" />
        <StatCard label="Total earned" value={etb(revenue)} icon="coins" />
        <StatCard label="Available balance" value={etb(a.available_balance_etb)} icon="wallet" />
        <StatCard label="Downloads" value={dl ?? 0} icon="download" />
      </div>
      <Link href="/author/earnings" className="link-underline mt-4 inline-flex items-center gap-1.5 text-sm">Earnings &amp; withdrawals <Icon name="arrow-right" className="h-4 w-4" /></Link>

      <section className="mt-10">
        <h2 className="section-title mb-4">Your books</h2>
        {books?.length ? (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Book</th><th>Price</th><th>Status</th><th>Performance</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{books.map((b) => {
              const r = (rat ?? []).find((x: any) => x.book_id === b.id);
              return <tr key={b.id}>
                <td><span className="font-semibold">{b.title}</span></td>
                <td>{etb(b.price_etb)}</td>
                <td><StatusBadge value={b.status} /></td>
                <td className="text-xs text-ink-muted">{r ? `★ ${r.avg_rating} (${r.review_count})` : "—"}</td>
                <td className="text-right text-xs">
                  <span className="flex justify-end gap-3">
                    {b.status === "approved" && <Link href={`/books/${b.slug}`} className="link-underline">View</Link>}
                    {["pending_review", "rejected", "draft"].includes(b.status) && <Link href={`/author/books/${b.id}`} className="link-underline">Edit</Link>}
                  </span>
                </td>
              </tr>;
            })}</tbody>
          </table></div>
        ) : <EmptyState icon="book" title="No books yet" description="Upload your first title to start building your shelf." href="/author/upload" actionLabel="Upload a book" />}
        {books?.some((b) => b.status === "rejected" && b.rejection_reason) && (
          <div className="mt-4 space-y-2">{books.filter((b) => b.status === "rejected" && b.rejection_reason).map((b) => <Alert key={b.id} kind="error" title={b.title}>Rejected: {b.rejection_reason}</Alert>)}</div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="section-title mb-4">Public profile</h2>
        <form action={saveProfile} className="card-pad max-w-2xl space-y-4">
          <label className="block"><span className="label">Pen name</span><input name="pen_name" defaultValue={a.pen_name} required className="field" /></label>
          <label className="block"><span className="label">Bio</span><textarea name="bio" defaultValue={a.bio ?? ""} rows={4} placeholder="Short bio shown on your author page" className="field" /></label>
          <button className="btn btn-outline"><Icon name="check" className="h-4 w-4" />Save profile</button>
        </form>
      </section>
    </div>
  );
}
