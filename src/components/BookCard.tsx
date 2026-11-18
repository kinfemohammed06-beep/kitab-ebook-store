import Link from "next/link";
import AddToCart from "./AddToCart";
import { Icon } from "./Icons";
import { etb, type BookRow } from "@/lib/books";

export function Cover({ b, className = "" }: { b: Pick<BookRow, "title" | "cover_path">; className?: string }) {
  const src = b.cover_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${b.cover_path}` : null;
  return src ? (
    <img src={src} alt={`Cover of ${b.title}`} loading="lazy" className={`aspect-[2/3] w-full rounded-xl object-cover shadow-soft ${className}`} />
  ) : (
    <div className={`relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-xl bg-forest-gradient p-4 text-center shadow-soft ring-1 ring-gold/30 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold/80">Kitab</span>
      <span className="font-display text-lg leading-snug text-ivory">{b.title}</span>
      <span className="text-[9px] uppercase tracking-widest text-ivory/50">Ethiopian ebooks</span>
      <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-gold/20" />
    </div>
  );
}

export default function BookCard({ b }: { b: BookRow }) {
  const free = Number(b.price_etb) === 0 || b.is_free;
  return (
    <article className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-forest/20 hover:shadow-card-hover">
      <Link href={`/books/${b.slug}`} aria-label={`View ${b.title}`} className="relative block bg-forest-50/60 p-3 pb-0">
        <div className="overflow-hidden rounded-xl">
          <Cover b={b} className="transition-transform duration-500 group-hover:scale-[1.04]" />
        </div>
        {free && <span className="badge-gold absolute left-5 top-5 shadow-sm">Free</span>}
        {b.language && b.language !== "en" && <span className="badge absolute right-5 top-5 bg-forest-950/75 text-ivory backdrop-blur">{b.language.toUpperCase()}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/books/${b.slug}`} className="group/title">
          <h3 className="line-clamp-2 font-display text-[17px] leading-snug text-ink transition group-hover/title:text-forest">{b.title}</h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{b.author_profiles?.pen_name ?? "Kitab author"}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {b.reviews ? <><Icon name="star" className="h-3.5 w-3.5 fill-gold text-gold" /><span className="font-semibold text-ink">{Number(b.rating).toFixed(1)}</span><span className="text-ink-soft">({b.reviews})</span></>
            : <span className="text-ink-soft">New release</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span className={`font-display text-xl ${free ? "text-forest-600" : "text-ink"}`}>{etb(b.price_etb)}</span>
          <AddToCart id={b.id} variant="icon" />
        </div>
        <Link href={`/books/${b.slug}`} className="btn btn-outline btn-sm mt-3 w-full">View details</Link>
      </div>
    </article>
  );
}
