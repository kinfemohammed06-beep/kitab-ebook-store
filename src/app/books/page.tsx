import Link from "next/link";
import { searchBooks } from "@/lib/books";
import BookCard from "@/components/BookCard";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader } from "@/components/ui";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Explore Books" };

export default async function Books({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const s = searchParams;
  const [books, { data: cats }] = await Promise.all([searchBooks(s), createClient().from("categories").select("slug,name_en").order("name_en")]);
  const hasFilters = !!(s.q || s.category || s.lang || s.free || s.sort);

  return (
    <div className="page">
      <PageHeader eyebrow="The catalogue" title="Explore books"
        description="Browse the full Kitab collection. Filter by subject, language or price to find your next read." />

      <form className="card mb-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <label className="lg:col-span-2"><span className="label">Search</span>
          <div className="relative"><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input name="q" defaultValue={s.q} placeholder="Title, author, ISBN, keyword" className="field pl-9" /></div>
        </label>
        <label><span className="label">Category</span>
          <select name="category" defaultValue={s.category ?? ""} className="field"><option value="">All categories</option>{cats?.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}</select>
        </label>
        <label><span className="label">Language</span>
          <select name="lang" defaultValue={s.lang ?? ""} className="field"><option value="">Any language</option><option value="en">English</option><option value="am">አማርኛ</option><option value="om">Afaan Oromo</option><option value="ti">ትግርኛ</option></select>
        </label>
        <label><span className="label">Availability</span>
          <select name="free" defaultValue={s.free ?? ""} className="field"><option value="">Free &amp; paid</option><option value="1">Free only</option><option value="0">Paid only</option></select>
        </label>
        <label><span className="label">Sort by</span>
          <select name="sort" defaultValue={s.sort ?? ""} className="field"><option value="">Newest</option><option value="popular">Most popular</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button className="btn btn-primary"><Icon name="filter" className="h-4 w-4" />Apply filters</button>
          {hasFilters && <Link href="/books" className="btn btn-ghost"><Icon name="refresh" className="h-4 w-4" />Reset</Link>}
          <span className="ml-auto self-center text-xs text-ink-muted">{books.length} {books.length === 1 ? "book" : "books"} found</span>
        </div>
      </form>

      {books.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((b) => <BookCard key={b.id} b={b} />)}
        </div>
      ) : (
        <EmptyState icon="search" title="No books match those filters" description="Try a different keyword, or clear the filters to see everything in the catalogue."
          href="/books" actionLabel="Clear filters" />
      )}
    </div>
  );
}
