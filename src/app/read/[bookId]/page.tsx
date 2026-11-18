import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { UUID } from "@/lib/cart";
import Reader from "@/components/Reader";
import { EmptyState } from "@/components/ui";
export const metadata = { title: "Reader" };
export default async function Read({ params }: { params: { bookId: string } }) {
  if (!UUID.test(params.bookId)) notFound();
  const { sb, user } = await requireUser();
  const { data: lib } = await sb.from("libraries").select("books(title)").eq("user_id", user.id).eq("book_id", params.bookId).maybeSingle();
  if (!lib) notFound();                                            // not purchased: no access
  const db = admin();
  const { data: files } = await db.from("book_files").select("format,storage_path").eq("book_id", params.bookId).eq("is_sample", false);
  const f = files?.find((x) => x.format === "epub") ?? files?.find((x) => x.format === "pdf");
  if (!f) return <div className="page-narrow"><EmptyState icon="book" title="No readable file yet" description="This book has no EPUB or PDF file available. You can still download it from your library if a file is added later." href="/library" actionLabel="Back to library" /></div>;
  const { data: s } = await db.storage.from("book-files").createSignedUrl(f.storage_path, 3600);
  const [{ data: prog }, { data: marks }] = await Promise.all([
    sb.from("reading_progress").select("location").eq("user_id", user.id).eq("book_id", params.bookId).maybeSingle(),
    sb.from("bookmarks").select("id,location,note,highlight_text").eq("user_id", user.id).eq("book_id", params.bookId).order("created_at", { ascending: false })]);
  return <Reader bookId={params.bookId} title={(lib as any).books?.title ?? ""} kind={f.format as "epub" | "pdf"} url={s!.signedUrl} start={prog?.location ?? null} marks={marks ?? []} />;
}
