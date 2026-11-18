import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { saveReview, reportReview, toggleWishlist } from "@/app/engage";
import { Icon } from "./Icons";

export async function WishlistButton({ id, slug }: { id: string; slug: string }) {
  const sb = createClient(); const { data: { user } } = await sb.auth.getUser();
  const saved = user ? !!(await sb.from("wishlists").select("book_id").eq("user_id", user.id).eq("book_id", id).maybeSingle()).data : false;
  return (
    <form action={toggleWishlist} className="inline">
      <input type="hidden" name="book_id" value={id} /><input type="hidden" name="slug" value={slug} />
      <button className={`btn ${saved ? "btn-gold" : "btn-outline"}`}>
        <Icon name="heart" className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />{saved ? "In wishlist" : "Wishlist"}
      </button>
    </form>
  );
}

export default async function Reviews({ bookId, slug }: { bookId: string; slug: string }) {
  const sb = createClient(); const { data: { user } } = await sb.auth.getUser();
  const { data } = await sb.from("reviews").select("id,user_id,rating,body,created_at").eq("book_id", bookId).order("created_at", { ascending: false }).limit(30);
  const rows = data ?? [];
  const { data: names } = rows.length ? await admin().from("profiles").select("id,full_name").in("id", rows.map((r) => r.user_id)) : { data: [] };
  const first = (id: string) => (names?.find((n) => n.id === id)?.full_name ?? "Reader").split(" ")[0] || "Reader";
  const owned = user ? !!(await sb.from("libraries").select("book_id").eq("user_id", user.id).eq("book_id", bookId).maybeSingle()).data : false;
  const mine = rows.find((r) => r.user_id === user?.id);

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-line pt-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="section-title">Reader reviews</h2>
        <span className="badge-muted">{rows.length} {rows.length === 1 ? "review" : "reviews"}</span>
      </div>
      {owned ? (
        <form action={saveReview} className="mb-7 rounded-2xl border border-forest/15 bg-forest-50/50 p-5">
          <input type="hidden" name="book_id" value={bookId} /><input type="hidden" name="slug" value={slug} />
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-forest-800"><Icon name="feather" className="h-4 w-4" />{mine ? "Edit your review" : "Rate this book"}</p>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <label><span className="sr-only">Rating</span>
              <select name="rating" defaultValue={mine?.rating ?? 5} className="field !w-full">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}</select>
            </label>
            <textarea name="body" defaultValue={mine?.body ?? ""} rows={3} maxLength={2000} aria-label="Your review" placeholder="Share your thoughts (optional)" className="field" />
          </div>
          <button className="btn btn-primary mt-3"><Icon name="check" className="h-4 w-4" />Save review</button>
        </form>
      ) : <p className="mb-6 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-muted">Only verified purchasers can review this book.</p>}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 font-display text-sm font-bold text-forest">
                  {first(r.user_id).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{first(r.user_id)}</p>
                    <span className="flex items-center gap-0.5 text-gold">{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-gold" : "text-line"}`} />)}</span>
                  </div>
                  {r.body && <p className="prose-kitab mt-2 whitespace-pre-line text-sm">{r.body}</p>}
                  <p className="mt-2 text-[11px] text-ink-soft">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  {user && r.user_id !== user.id && (
                    <form action={reportReview} className="mt-1">
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="slug" value={slug} />
                      <button className="text-xs text-ink-soft underline underline-offset-2 hover:text-red-700">Report</button>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="text-sm text-ink-muted">No reviews yet — be the first to share your thoughts.</p>}
    </section>
  );
}
