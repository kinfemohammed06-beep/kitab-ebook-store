import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { authorBooks } from "@/lib/books";
import { UUID } from "@/lib/cart";
import BookCard from "@/components/BookCard";
import { Icon } from "@/components/Icons";
import { Breadcrumb, EmptyState, PageHeader } from "@/components/ui";

const get = async (id: string) => UUID.test(id) ? (await createClient().from("author_profiles").select("pen_name,bio").eq("user_id", id).eq("approved", true).maybeSingle()).data : null;
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = await get(params.id); return a ? { title: a.pen_name, description: (a.bio ?? "").slice(0, 155) } : {};
}

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const a = await get(params.id); if (!a) notFound();
  const books = await authorBooks(params.id);
  return (
    <div className="page">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Authors", href: "/authors" }, { label: a.pen_name }]} />
      <div className="card mb-10 overflow-hidden">
        <div className="h-24 bg-forest-gradient paper-pattern" />
        <div className="px-6 pb-6 sm:px-8">
          <span className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-surface bg-forest font-display text-2xl text-ivory shadow-soft">
            {a.pen_name.charAt(0).toUpperCase()}
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{a.pen_name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><Icon name="book" className="h-4 w-4 text-forest" />{books.length} published {books.length === 1 ? "book" : "books"}</p>
          {a.bio && <p className="prose-kitab mt-4 max-w-2xl whitespace-pre-line text-[15px]">{a.bio}</p>}
        </div>
      </div>
      <PageHeader eyebrow="Books by this author" title="The collection" />
      {books.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((b) => <BookCard key={b.id} b={b} />)}
        </div>
      ) : <EmptyState title="No published books yet" description="Check back soon — this author is working on something new." href="/books" actionLabel="Explore books" />}
    </div>
  );
}
