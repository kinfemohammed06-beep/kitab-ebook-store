import { createClient } from "@/lib/supabase/server";
export type BookRow = { id: string; slug: string; title: string; price_etb: number; is_free: boolean; language: string; cover_path: string | null; author_profiles: { pen_name: string } | null; rating?: number; reviews?: number };
export const etb = (n: number) => (n === 0 ? "Free" : `ETB ${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
const COLS = "id,slug,title,price_etb,is_free,language,cover_path,author_profiles(pen_name)";
async function withRatings(rows: any[]): Promise<BookRow[]> {
  if (!rows.length) return [];
  const { data } = await createClient().from("book_ratings").select("*").in("book_id", rows.map((r) => r.id));
  const m = new Map((data ?? []).map((r: any) => [r.book_id, r]));
  return rows.map((r) => ({ ...r, rating: m.get(r.id)?.avg_rating, reviews: m.get(r.id)?.review_count }));
}
export async function searchBooks(p: { q?: string; category?: string; lang?: string; free?: string; sort?: string; limit?: number }) {
  const sb = createClient();
  let query = sb.from("books").select(COLS).eq("status", "approved");
  const q = (p.q ?? "").replace(/[,()%*]/g, " ").trim();
  if (q) {
    const { data: au } = await sb.from("author_profiles").select("user_id").ilike("pen_name", `%${q}%`);
    const ids = (au ?? []).map((a) => a.user_id);
    query = query.or([`title.ilike.%${q}%`, `isbn.eq.${q}`, `description.ilike.%${q}%`, ids.length ? `author_id.in.(${ids.join(",")})` : ""].filter(Boolean).join(","));
  }
  if (p.category) {
    const { data: c } = await sb.from("categories").select("id").eq("slug", p.category).maybeSingle();
    const { data: bc } = await sb.from("book_categories").select("book_id").eq("category_id", c?.id ?? -1);
    query = query.in("id", (bc ?? []).map((b) => b.book_id));
  }
  if (p.lang) query = query.eq("language", p.lang);
  if (p.free === "1") query = query.eq("is_free", true);
  if (p.free === "0") query = query.eq("is_free", false);
  if (p.sort === "price_asc") query = query.order("price_etb");
  else if (p.sort === "price_desc") query = query.order("price_etb", { ascending: false });
  else query = query.order("published_at", { ascending: false });
  const want = p.limit ?? 48;
  const { data } = await query.limit(p.sort === "popular" ? 300 : want);
  let rows: any[] = data ?? [];
  if (p.sort === "popular" && rows.length) {
    const { data: s } = await sb.from("book_sales").select("book_id,sales").in("book_id", rows.map((r) => r.id));
    const m = new Map((s ?? []).map((x) => [x.book_id, x.sales]));
    rows = [...rows].sort((a, b) => (m.get(b.id) ?? 0) - (m.get(a.id) ?? 0)).slice(0, want);
  }
  return withRatings(rows);
}

export async function booksByIds(ids: string[]): Promise<BookRow[]> {
  if (!ids.length) return [];
  const { data } = await createClient().from("books").select(COLS).eq("status", "approved").in("id", ids);
  const order = new Map(ids.map((id, i) => [id, i]));
  return withRatings([...(data ?? [])].sort((a: any, b: any) => order.get(a.id)! - order.get(b.id)!));
}
export async function popularBooks(limit = 6, exclude: string[] = []): Promise<BookRow[]> {
  const { data } = await createClient().from("book_sales").select("book_id,sales").order("sales", { ascending: false }).limit(limit + exclude.length + 20);
  const ids = (data ?? []).map((r) => r.book_id).filter((i) => !exclude.includes(i));
  return (await booksByIds(ids)).slice(0, limit);
}
export async function authorBooks(authorId: string): Promise<BookRow[]> {
  const { data } = await createClient().from("books").select(COLS).eq("author_id", authorId).eq("status", "approved").order("published_at", { ascending: false });
  return withRatings(data ?? []);
}
// Books in the categories of what the reader owns or wishlisted, best-selling first; padded with bestsellers.
export async function recommendations(userId: string, limit = 6): Promise<BookRow[]> {
  const sb = createClient();
  const [{ data: lib }, { data: wl }] = await Promise.all([sb.from("libraries").select("book_id").eq("user_id", userId), sb.from("wishlists").select("book_id").eq("user_id", userId)]);
  const owned = (lib ?? []).map((l) => l.book_id); const seeds = [...new Set([...owned, ...(wl ?? []).map((w) => w.book_id)])];
  let ids: string[] = [];
  if (seeds.length) {
    const { data: bc } = await sb.from("book_categories").select("category_id").in("book_id", seeds);
    const cats = [...new Set((bc ?? []).map((x) => x.category_id))];
    if (cats.length) {
      const { data: cand } = await sb.from("book_categories").select("book_id").in("category_id", cats);
      ids = [...new Set((cand ?? []).map((c) => c.book_id))].filter((i) => !owned.includes(i));
    }
  }
  if (ids.length) {
    const { data: s } = await sb.from("book_sales").select("book_id,sales").in("book_id", ids); const m = new Map((s ?? []).map((x) => [x.book_id, x.sales]));
    ids.sort((a, b) => (m.get(b) ?? 0) - (m.get(a) ?? 0));
  }
  const picks = (await booksByIds(ids.slice(0, limit + 6))).slice(0, limit);
  if (picks.length >= limit) return picks;
  return [...picks, ...(await popularBooks(limit - picks.length, [...owned, ...picks.map((p) => p.id)]))];
}
