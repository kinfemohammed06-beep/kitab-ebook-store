import Link from "next/link";
import BookCard, { Cover } from "@/components/BookCard";
import { Icon, type IconName } from "@/components/Icons";
import { EmptyState, SectionHeading } from "@/components/ui";
import { searchBooks, popularBooks, recommendations } from "@/lib/books";
import { createClient } from "@/lib/supabase/server";

function Shelf({ title, subtitle, href, books }: { title: string; subtitle?: string; href: string; books: Awaited<ReturnType<typeof searchBooks>> }) {
  if (!books.length) return null;
  return (
    <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading title={title} subtitle={subtitle} href={href} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
        {books.map((b) => <BookCard key={b.id} b={b} />)}
      </div>
    </section>
  );
}

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "search", title: "Find your next read", text: "Browse by subject, language or author — from Ethiopian literature to business and poetry." },
  { icon: "wallet", title: "Pay with Telebirr", text: "Send the exact amount and upload your receipt. Our team verifies every payment by hand." },
  { icon: "book", title: "Read or download", text: "Approved books appear in your library, ready to read online or download as EPUB or PDF." },
];

export default async function Home() {
  const [latest, free] = await Promise.all([searchBooks({ limit: 6 }), searchBooks({ free: "1", limit: 6 })]);
  const { data: cats } = await createClient().from("categories").select("slug,name_en").is("parent_id", null).order("name_en");
  const { data: { user } } = await createClient().auth.getUser();
  const [rec, popular] = await Promise.all([user ? recommendations(user.id) : Promise.resolve([]), popularBooks(6)]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-paper-glow">
        <div className="paper-pattern pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow"><span className="h-px w-7 bg-gold" />Ethiopian &amp; international literature</span>
            <h1 className="mt-5 font-display text-display">Stories worth reading.<br /><span className="text-forest">Knowledge worth keeping.</span></h1>
            <p className="prose-kitab mt-6 max-w-xl text-base sm:text-lg">
              Discover digital books from Ethiopian and international authors. Read, learn, and support the people behind every story.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/books" className="btn btn-primary"><Icon name="books" className="h-4 w-4" />Explore books</Link>
              <Link href="/register?role=author" className="btn btn-outline"><Icon name="feather" className="h-4 w-4" />Become an author</Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3">
              {([
                ["shield", "Curated catalogue", "Reviewed before publishing"],
                ["wallet", "Pay in Birr", "Secure Telebirr payments"],
                ["book", "Yours to keep", "Read online or download"],
              ] as [IconName, string, string][]).map(([icon, title, text]) => (
                <div key={title} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest"><Icon name={icon} className="h-4 w-4" /></span>
                  <span><span className="block text-xs font-bold text-ink">{title}</span><span className="block text-[11px] leading-4 text-ink-muted">{text}</span></span>
                </div>
              ))}
            </div>
          </div>

          {latest.length > 0 && (
            <div className="relative hidden lg:block" aria-hidden="true">
              <div className="absolute -inset-10 rounded-full bg-gold/10 blur-3xl" />
              <div className="relative mx-auto grid max-w-md grid-cols-3 gap-4 -rotate-3">
                {latest.slice(0, 3).map((b, i) => (
                  <div key={b.id} className={i === 1 ? "mt-10 animate-float" : i === 2 ? "mt-4 animate-float [animation-delay:1.2s]" : "animate-float [animation-delay:0.6s]"}>
                    <Cover b={b} className="shadow-card-hover" />
                  </div>
                ))}
              </div>
              <div className="card absolute -bottom-8 left-2 flex items-center gap-3 px-4 py-3 shadow-card-hover animate-float [animation-delay:2s]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-ivory"><Icon name="play" className="h-5 w-5" /></span>
                <span><span className="block text-xs font-bold">Read anywhere</span><span className="block text-[11px] text-ink-muted">Your library travels with you</span></span>
              </div>
            </div>
          )}
        </div>
      </section>

      <Shelf title="Recommended for you" subtitle="Picked from the subjects you love" href="/books?sort=popular" books={rec} />
      <Shelf title="Bestsellers" subtitle="The books readers keep coming back to" href="/bestsellers" books={popular} />
      <Shelf title="New releases" subtitle="Freshly added to the shelf" href="/books?sort=new" books={latest} />
      <Shelf title="Free books" subtitle="Great reads, no payment needed" href="/books?free=1" books={free} />

      {!latest.length && (
        <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <EmptyState title="The shelves are being prepared" description="No books have been published yet. Explore the catalogue to see what is available." href="/books" actionLabel="Explore books" />
        </div>
      )}

      {!!cats?.length && (
        <section className="mx-auto mt-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Browse by category" subtitle="Find a subject that speaks to you" href="/categories" linkLabel="All categories" />
          <div className="flex flex-wrap gap-2.5">
            {cats.map((c) => <Link key={c.slug} href={`/books?category=${c.slug}`} className="chip"><Icon name="book" className="h-4 w-4 text-forest" />{c.name_en}</Link>)}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="How Kitab works" subtitle="From discovery to your digital shelf in three steps" href="/faq" linkLabel="Read the FAQ" />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="card card-pad relative">
              <span className="absolute right-5 top-4 font-display text-5xl text-forest-50">0{i + 1}</span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest"><Icon name={s.icon} className="h-5 w-5" /></span>
              <h3 className="relative mt-4 font-display text-lg">{s.title}</h3>
              <p className="prose-kitab relative mt-2 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-forest-gradient px-6 py-12 text-center text-ivory shadow-glow sm:px-12 sm:py-16">
          <div className="paper-pattern pointer-events-none absolute inset-0 opacity-10" />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/10 px-4 py-1.5 text-xs font-semibold text-gold"><Icon name="feather" className="h-3.5 w-3.5" />For writers &amp; publishers</span>
            <h2 className="mt-5 font-display text-3xl sm:text-4xl">Publish with Kitab</h2>
            <p className="mx-auto mt-3 max-w-xl font-serif text-sm leading-7 text-ivory/80 sm:text-base">
              Upload your ebook, set your price in Ethiopian Birr, and earn from every sale. We handle the storefront — you keep telling the story.
            </p>
            <Link href="/register?role=author" className="btn btn-gold mt-7"><Icon name="arrow-right" className="h-4 w-4" />Become an author</Link>
          </div>
        </div>
      </section>
    </>
  );
}
