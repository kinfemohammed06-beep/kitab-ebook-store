import { requireUser } from "@/lib/auth";
import BookCard from "@/components/BookCard";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata = { title: "Wishlist" };

export default async function Wishlist() {
  const { sb, user } = await requireUser();
  const { data } = await sb.from("wishlists").select("books(id,slug,title,price_etb,is_free,language,cover_path,status,author_profiles(pen_name))").eq("user_id", user.id);
  const books = ((data ?? []) as any[]).map((r) => r.books).filter((b) => b && b.status === "approved");
  return (
    <div className="page">
      <PageHeader eyebrow="Saved for later" title="Wishlist" description="Keep track of the books you'd like to read next." />
      {books.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((b) => <BookCard key={b.id} b={b} />)}
        </div>
      ) : <EmptyState icon="heart" title="Nothing saved yet" description="Tap the wishlist button on any book to keep it here for later."
        href="/books" actionLabel="Explore books" />}
    </div>
  );
}
