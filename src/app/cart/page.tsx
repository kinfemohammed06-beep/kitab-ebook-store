import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart";
import { etb } from "@/lib/books";
import { Cover } from "@/components/BookCard";
import { Icon } from "@/components/Icons";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { createOrder, removeFromCart } from "../actions";
export const metadata = { title: "Shopping Cart" };

export default async function Cart({ searchParams }: { searchParams: { error?: string } }) {
  const ids = getCart();
  const { data } = ids.length ? await createClient().from("books").select("id,title,slug,price_etb,cover_path,author_profiles(pen_name)").in("id", ids).eq("status", "approved") : { data: [] };
  const books = (data ?? []) as any[];
  const total = books.reduce((a, b) => a + Number(b.price_etb), 0);

  return (
    <div className="page">
      <PageHeader eyebrow="Almost there" title="Shopping cart"
        description="Review your selection, then continue to payment." />
      {searchParams.error && <Alert kind="error" title="Checkout couldn't continue">{searchParams.error}</Alert>}

      {!books.length ? (
        <EmptyState icon="cart" title="Your cart is empty" description="Browse the catalogue and add a few books you'd like to read."
          href="/books" actionLabel="Explore books" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl">{books.length} {books.length === 1 ? "book" : "books"}</h2><Link href="/books" className="link-underline text-xs">Continue browsing</Link></div>
            <ul className="space-y-3">
              {books.map((b) => (
                <li key={b.id} className="card flex items-center gap-4 p-4">
                  <Link href={`/books/${b.slug}`} className="w-14 shrink-0 sm:w-16"><Cover b={b} /></Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/books/${b.slug}`} className="font-display text-base transition hover:text-forest">{b.title}</Link>
                    <p className="mt-0.5 text-xs text-ink-muted">{b.author_profiles?.pen_name}</p>
                    <p className="mt-1 font-semibold text-forest">{etb(b.price_etb)}</p>
                  </div>
                  <form action={removeFromCart}>
                    <input type="hidden" name="id" value={b.id} />
                    <button aria-label={`Remove ${b.title} from cart`} title="Remove" className="btn-icon !h-9 !w-9 !text-red-600 hover:!bg-red-50"><Icon name="trash" className="h-4 w-4" /></button>
                  </form>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <form action={createOrder} className="card sticky top-24 space-y-4 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg"><Icon name="receipt" className="h-5 w-5 text-forest" />Order summary</h2>
              <div className="divide-y divide-line border-y border-line py-3 text-sm">
                <div className="flex justify-between py-1.5"><span className="text-ink-muted">Subtotal</span><span className="font-semibold">{etb(total)}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-ink-muted">Discount</span><span className="text-ink-muted">Applied at checkout</span></div>
                <div className="flex justify-between pt-3"><span className="font-semibold">Total</span><span className="font-display text-2xl text-forest">{etb(total)}</span></div>
              </div>
              <label className="block"><span className="label">Coupon code <span className="font-normal normal-case tracking-normal text-ink-soft">(optional)</span></span>
                <div className="relative"><Icon name="tag" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                  <input name="coupon" placeholder="e.g. READER10" className="field pl-9" /></div>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-paper p-3 text-sm">
                <input type="checkbox" name="gift" className="mt-0.5" /><span><span className="font-semibold">This is a gift</span><span className="block text-xs text-ink-muted">Send the books to someone else's library.</span></span>
              </label>
              <label className="block"><span className="label">Recipient's email <span className="font-normal normal-case tracking-normal text-ink-soft">(for gifts)</span></span>
                <input name="gift_email" type="email" placeholder="friend@example.com" className="field" /></label>
              <button className="btn btn-primary w-full"><Icon name="arrow-right" className="h-4 w-4" />Proceed to checkout</button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-soft"><Icon name="shield" className="h-3.5 w-3.5" />Payments are verified by our team</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
