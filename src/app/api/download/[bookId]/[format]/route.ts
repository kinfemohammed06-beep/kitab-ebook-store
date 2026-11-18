import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { UUID } from "@/lib/cart";
export async function GET(_: Request, { params }: { params: { bookId: string; format: string } }) {
  const sb = createClient(); const { data: { user } } = await sb.auth.getUser();
  if (!user) return new NextResponse("Login required", { status: 401 });
  if (!UUID.test(params.bookId) || !["epub", "pdf"].includes(params.format)) return new NextResponse("Not found", { status: 404 });
  const { data: own } = await sb.from("libraries").select("book_id").eq("user_id", user.id).eq("book_id", params.bookId).maybeSingle();
  if (!own) return new NextResponse("You do not own this book", { status: 403 });
  const db = admin();
  const [{ data: f }, { data: b }] = await Promise.all([
    db.from("book_files").select("storage_path").eq("book_id", params.bookId).eq("format", params.format).eq("is_sample", false).maybeSingle(),
    db.from("books").select("slug").eq("id", params.bookId).single()]);
  if (!f) return new NextResponse("File not available", { status: 404 });
  const { data: s } = await db.storage.from("book-files").createSignedUrl(f.storage_path, 60, { download: `${b?.slug ?? "book"}.${params.format}` });
  if (!s) return new NextResponse("Could not create link", { status: 500 });
  await db.from("downloads").insert({ user_id: user.id, book_id: params.bookId, format: params.format });
  return NextResponse.redirect(s.signedUrl);   // link expires in 60 seconds
}
