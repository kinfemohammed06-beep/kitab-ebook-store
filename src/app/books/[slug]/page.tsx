import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "@/components/BookCard";
import AddToCart from "@/components/AddToCart";
import Reviews, { WishlistButton } from "@/components/Reviews";
import { Icon } from "@/components/Icons";
import { Breadcrumb } from "@/components/ui";
import { etb } from "@/lib/books";

const get = async (slug: string) => (await createClient().from("books")
  .select("*,author_profiles(pen_name,bio),book_categories(categories(name_en))").eq("slug", slug).eq("status", "approved").maybeSingle()).data as any;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const b = await get(params.slug); if (!b) return {};
  const d = (b.description ?? "").slice(0, 155);
  return { title: b.title, description: d, openGraph: { title: b.title, description: d, type: "book" } };
}

export default async function BookPage({ params }: { params: { slug: string } }) {
  const b = await get(params.slug); if (!b) notFound();
  const sb = createClient();
  const { data: reviews } = await sb.from("reviews").select("rating,body,created_at").eq("book_id", b.id).order("created_at", { ascending: false }).limit(20);
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  const ld = { "@context": "https://schema.org", "@type": "Book", name: b.title, author: { "@type": "Person", name: b.author_profiles?.pen_name }, inLanguage: b.language, isbn: b.isbn ?? undefined,
    offers: { "@type": "Offer", price: b.price_etb, priceCurrency: "ETB", availability: "https://schema.org/InStock" },
    ...(avg ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews!.length } } : {}) };
  const rows: [string, any][] = [["Language", b.language], ["Pages", b.pages], ["ISBN", b.isbn], ["Published", b.published_at && new Date(b.published_at).toLocaleDateString("en-GB")]];
  const cats = (b.book_categories ?? []).map((x: any) => x.categories?.name_en).filter(Boolean);

  return (
    <div className="page !py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Books", href: "/books" }, { label: b.title }]} />

      <div className="grid gap-8 lg:grid-cols-[290px_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden bg-forest-50/60 p-5">
            <Cover b={b} className="shadow-card-hover" />
            {b.is_sample_data && <p className="mt-3 text-center text-[11px] text-ink-muted">Demo listing — not a real published book.</p>}
          </div>
          <div className="mt-3 hidden gap-2 lg:flex">
            <span className="badge-forest flex-1 justify-center"><Icon name="shield" className="h-3.5 w-3.5" />Approved listing</span>
            <span className="badge-muted flex-1 justify-center"><Icon name="download" className="h-3.5 w-3.5" />Instant access</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {cats.map((c: string) => <Link key={c} href="/categories" className="badge-forest">{c}</Link>)}
            {Number(b.price_etb) === 0 && <span className="badge-gold"><Icon name="gift" className="h-3.5 w-3.5" />Free book</span>}
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">{b.title}</h1>
          {b.subtitle && <p className="mt-2 font-serif text-lg italic text-ink-muted">{b.subtitle}</p>}
          <p className="mt-4 flex items-center gap-2 font-serif text-sm text-ink-muted">
            <Icon name="feather" className="h-4 w-4 text-forest" />by
            <Link href={`/authors/${b.author_id}`} className="link-underline">{b.author_profiles?.pen_name}</Link>
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {avg ? <><span className="flex text-gold">{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" className={`h-4 w-4 ${n <= Math.round(avg) ? "fill-gold" : "text-line"}`} />)}</span>
              <span className="font-semibold">{avg.toFixed(1)}</span><span className="text-ink-muted">({reviews!.length} {reviews!.length === 1 ? "review" : "reviews"})</span></>
              : <span className="text-ink-muted">No reviews yet</span>}
          </div>

          <div className="card mt-7 flex flex-wrap items-center justify-between gap-5 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Price</p>
              <p className="font-display text-3xl text-forest">{etb(b.price_etb)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AddToCart id={b.id} />
              <AddToCart id={b.id} buyNow />
              <WishlistButton id={b.id} slug={b.slug} />
            </div>
          </div>

          <section className="card mt-6 p-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl"><Icon name="book" className="h-5 w-5 text-forest" />About this book</h2>
            <p className="prose-kitab whitespace-pre-line text-[15px]">{b.description}</p>
          </section>

          {rows.some(([, v]) => v) && (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line bg-forest-50/40 p-5 text-sm sm:grid-cols-4">
              {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-xs text-ink-muted">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>)}
            </dl>
          )}

          <div className="mt-10"><Reviews bookId={b.id} slug={b.slug} /></div>
        </div>
      </div>
    </div>
  );
}
