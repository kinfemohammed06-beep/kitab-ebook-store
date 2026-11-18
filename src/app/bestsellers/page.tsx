import { popularBooks } from "@/lib/books";
import BookCard from "@/components/BookCard";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata = { title: "Bestsellers" };

export default async function Bestsellers() {
  const books = await popularBooks(24);
  return (
    <div className="page">
      <PageHeader eyebrow="Reader favourites" title="Bestsellers"
        description="The books that readers keep coming back to — ranked by copies sold." />
      {books.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((b, i) => <div key={b.id} className="relative"><BookCard b={b} />
            {i < 3 && <span className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-forest-950 shadow-soft">#{i + 1}</span>}
          </div>)}
        </div>
      ) : <EmptyState icon="chart" title="Bestsellers appear here once books have been purchased"
        description="In the meantime, explore the newest titles in the catalogue." href="/books" actionLabel="Explore books" />}
    </div>
  );
}
