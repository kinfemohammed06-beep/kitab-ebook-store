"use server";
import { requireUser } from "@/lib/auth";
const cap = (s: string | null, n: number) => (s == null ? null : String(s).slice(0, n));
// All three run with the reader's own session, so RLS + the libraries foreign key enforce ownership.
export async function saveProgress(bookId: string, location: string, percent: number) {
  const { sb, user } = await requireUser();
  const row: Record<string, unknown> = { user_id: user.id, book_id: bookId, location: cap(location, 500), updated_at: new Date().toISOString() };
  if (percent >= 0) row.percent = Math.min(100, percent);
  await sb.from("reading_progress").upsert(row);
}
export async function addMark(bookId: string, location: string, note: string | null, highlight: string | null) {
  const { sb, user } = await requireUser();
  const { data } = await sb.from("bookmarks").insert({ user_id: user.id, book_id: bookId, location: cap(location, 500), note: cap(note, 2000), highlight_text: cap(highlight, 2000) })
    .select("id,location,note,highlight_text").single();
  return data;
}
export async function deleteMark(id: string) {
  const { sb, user } = await requireUser();
  await sb.from("bookmarks").delete().eq("id", id).eq("user_id", user.id);
}
