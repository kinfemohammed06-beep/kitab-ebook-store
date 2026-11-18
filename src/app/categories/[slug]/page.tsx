import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchBooks, type BookRow } from "@/lib/books";
import BookCard from "@/components/BookCard";
import { Icon } from "@/components/Icons";
import { Breadcrumb, EmptyState, PageHeader } from "@/components/ui";

const get = async (slug: string) => (await createClient().from("categories").select("id,slug,name_en").eq("slug", slug).maybeSingle()).data;
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await get(params.slug); return c ? { title: c.name_en, description: `Browse ${c.name_en} ebooks on Kitab.` } : {};
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const c = await get(params.slug); if (!c) notFound();
  const { data: kids } = await createClient().from("categories").select("slug,name_en").eq("parent_id", c.id);
  const seen = new Set<string>(); const books: BookRow[] = [];
  for (const s of [c.slug, ...(kids ?? []).map((k) => k.slug)]) for (const b of await searchBooks({ category: s })) if (!seen.has(b.id)) { seen.add(b.id); books.push(b); }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Categories", href: "/categories" }, { label: c.name_en }]} />
      <PageHeader eyebrow="Category" title={c.name_en} description={`Browse ${c.name_en} ebooks from Ethiopian and international authors.`} />
      {!!kids?.length && (
        <div className="mb-8 flex flex-wrap gap-2">
          {kids.map((k) => <Link key={k.slug} href={`/categories/${k.slug}`} className="chip"><Icon name="chevron-right" className="h-3.5 w-3.5 text-forest" />{k.name_en}</Link>)}
        </div>
      )}
      {books.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((b) => <BookCard key={b.id} b={b} />)}
        </div>
      ) : <EmptyState title="No books in this category yet" description="New titles are added all the time. Explore the full catalogue in the meantime."
        href="/books" actionLabel="Explore all books" />}
    </div>
  );
}
