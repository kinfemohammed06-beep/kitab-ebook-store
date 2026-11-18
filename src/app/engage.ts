"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
const slugOf = (fd: FormData) => { const s = String(fd.get("slug") ?? ""); return /^[a-z0-9-]+$/.test(s) ? s : ""; };
export async function saveReview(fd: FormData) {
  const { sb, user } = await requireUser(); const rating = Number(fd.get("rating"));
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5)   // the libraries foreign key rejects anyone who has not bought the book
    await sb.from("reviews").upsert({ user_id: user.id, book_id: String(fd.get("book_id")), rating, body: String(fd.get("body") ?? "").slice(0, 2000) }, { onConflict: "user_id,book_id" });
  redirect(`/books/${slugOf(fd)}#reviews`);
}
export async function reportReview(fd: FormData) {
  const { sb } = await requireUser(); await sb.rpc("report_review", { p_review_id: String(fd.get("id")) });
  redirect(`/books/${slugOf(fd)}?reported=1#reviews`);
}
export async function toggleWishlist(fd: FormData) {
  const { sb, user } = await requireUser(); const book_id = String(fd.get("book_id"));
  const { data } = await sb.from("wishlists").select("book_id").eq("user_id", user.id).eq("book_id", book_id).maybeSingle();
  if (data) await sb.from("wishlists").delete().eq("user_id", user.id).eq("book_id", book_id); else await sb.from("wishlists").insert({ user_id: user.id, book_id });
  redirect(`/books/${slugOf(fd)}`);
}
