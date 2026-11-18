import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { Cover } from "@/components/BookCard";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata = { title: "My Library" };

export default async function Library() {
  const { sb, user } = await requireUser();
  const { data } = await sb.from("libraries").select("acquired_at,books(id,slug,title,cover_path,author_profiles(pen_name))").eq("user_id", user.id).order("acquired_at", { ascending: false });
  const rows = (data ?? []) as any[];
  const { data: files } = rows.length ? await admin().from("book_files").select("book_id,format").eq("is_sample", false).in("book_id", rows.map((r) => r.books.id)) : { data: [] };
  const { data: prog } = await sb.from("reading_progress").select("book_id,percent").eq("user_id", user.id);
  const fmt = (id: string) => (files ?? []).filter((f) => f.book_id === id).map((f) => f.format);
  const pct = (id: string) => prog?.find((p) => p.book_id === id)?.percent;

  return (
    <div className="page">
      <PageHeader eyebrow="Your collection" title="My library"
        description="Every book you own, ready to read online or download whenever you like."
        actions={<Link href="/books" className="btn btn-outline"><Icon name="plus" className="h-4 w-4" />Find more books</Link>} />
      {rows.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map((r) => {
            const progress = pct(r.books.id);
            return (
              <article key={r.books.id} className="card card-hover flex h-full flex-col overflow-hidden">
                <Link href={`/books/${r.books.slug}`} className="bg-forest-50/60 p-3 pb-0"><Cover b={r.books} /></Link>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 font-display text-base leading-snug">{r.books.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{r.books.author_profiles?.pen_name}</p>
                  {progress != null && (
                    <div className="mt-3"><div className="flex justify-between text-[10px] font-semibold text-ink-muted"><span>Progress</span><span>{Math.round(progress)}%</span></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest-100"><div className="h-full rounded-full bg-forest" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
                    </div>
                  )}
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {fmt(r.books.id).length ? <>
                      <Link href={`/read/${r.books.id}`} className="btn btn-primary btn-sm"><Icon name="play" className="h-3.5 w-3.5" />Read</Link>
                      {fmt(r.books.id).map((f) => <a key={f} href={`/api/download/${r.books.id}/${f}`} className="btn btn-outline btn-sm uppercase"><Icon name="download" className="h-3.5 w-3.5" />{f}</a>)}
                    </> : <p className="text-xs text-ink-soft">File not available yet.</p>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState icon="library" title="Your library is empty" description="Books you purchase will appear here, ready to read or download."
        href="/books" actionLabel="Explore books" />}
    </div>
  );
}
