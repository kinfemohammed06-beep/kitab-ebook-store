import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata = { title: "Authors" };

export default async function Authors() {
  const sb = createClient();
  const { data: books } = await sb.from("books").select("author_id").eq("status", "approved");
  const count = new Map<string, number>(); (books ?? []).forEach((b) => count.set(b.author_id, (count.get(b.author_id) ?? 0) + 1));
  const { data } = count.size ? await sb.from("author_profiles").select("user_id,pen_name,bio").eq("approved", true).in("user_id", [...count.keys()]) : { data: [] };
  const authors = [...(data ?? [])].sort((a, b) => count.get(b.user_id)! - count.get(a.user_id)!);

  return (
    <div className="page">
      <PageHeader eyebrow="The people behind the pages" title="Authors"
        description="Meet the writers and publishers sharing their work with readers on Kitab." />
      {authors.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => (
            <Link key={a.user_id} href={`/authors/${a.user_id}`} className="card card-pad group flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-gradient font-display text-lg text-ivory">
                {a.pen_name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-lg transition group-hover:text-forest">{a.pen_name}</span>
                  <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-ink-soft transition group-hover:translate-x-1 group-hover:text-forest" />
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-muted"><Icon name="book" className="h-3.5 w-3.5" />{count.get(a.user_id)} {count.get(a.user_id) === 1 ? "book" : "books"}</span>
                {a.bio && <span className="mt-2 line-clamp-2 block font-serif text-sm leading-6 text-ink-muted">{a.bio}</span>}
              </span>
            </Link>
          ))}
        </div>
      ) : <EmptyState icon="feather" title="No authors have published yet" description="Authors appear here once their first book is approved."
        href="/register?role=author" actionLabel="Become an author" />}
    </div>
  );
}
