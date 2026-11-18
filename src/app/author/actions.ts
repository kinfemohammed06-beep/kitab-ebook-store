"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
type Kind = "cover" | "epub" | "pdf";
type Meta = { title: string; subtitle: string; description: string; language: string; price: number; isbn: string; pages: number | null; categories: number[] };
const MAX: Record<Kind, number> = { cover: 3 * 1024 ** 2, epub: 100 * 1024 ** 2, pdf: 100 * 1024 ** 2 };
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const isImg = (b: Buffer) => (b[0] === 0xff && b[1] === 0xd8) || b.subarray(1, 4).toString() === "PNG" || (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP");
const slugify = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "book";

export async function applyAsAuthor(fd: FormData) {
  const { sb } = await requireUser();
  const { error } = await sb.rpc("become_author", { p_pen_name: String(fd.get("pen_name") ?? "") });
  redirect(error ? "/author?error=" + encodeURIComponent(error.message) : "/author");
}

export async function prepareUpload(m: Meta, files: { kind: Kind; size: number; type: string }[]) {
  const { user } = await requireUser(); const db = admin();
  const { data: a } = await db.from("author_profiles").select("approved").eq("user_id", user.id).maybeSingle();
  if (!a?.approved) return { error: "Your author account is awaiting admin approval." };
  const title = m.title.trim();
  if (!title || title.length > 200 || m.description.length > 5000) return { error: "Check the title (max 200) and description (max 5000)." };
  if (!(m.price >= 0 && m.price <= 100000)) return { error: "Price must be between 0 and 100,000 ETB." };
  if (m.isbn && !/^[0-9Xx-]{10,17}$/.test(m.isbn)) return { error: "ISBN looks invalid." };
  if (!["en", "am", "om", "ti"].includes(m.language)) return { error: "Unsupported language." };
  const cover = files.find((f) => f.kind === "cover"); const body = files.filter((f) => f.kind !== "cover");
  if (!cover || !EXT[cover.type]) return { error: "Upload a JPG, PNG or WebP cover." };
  if (!body.length) return { error: "Upload an EPUB and/or PDF file." };
  if (files.some((f) => f.size <= 0 || f.size > MAX[f.kind])) return { error: "A file is empty or too large (cover 3 MB, books 100 MB)." };
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: book, error } = await db.from("books").insert({ slug, title, subtitle: m.subtitle.trim() || null, description: m.description.trim(), author_id: user.id,
    language: m.language, price_etb: m.price, isbn: m.isbn.trim() || null, pages: m.pages && m.pages > 0 ? Math.floor(m.pages) : null, status: "draft" }).select("id").single();
  if (error || !book) return { error: error?.code === "23505" ? "A book with this ISBN already exists." : "Could not create the book." };
  if (m.categories.length) await db.from("book_categories").insert(m.categories.slice(0, 5).map((c) => ({ book_id: book.id, category_id: c })));
  const uploads: { kind: Kind; bucket: string; path: string; token: string; contentType: string }[] = [];
  for (const f of files) {
    const bucket = f.kind === "cover" ? "book-covers" : "book-files";
    const path = f.kind === "cover" ? `${book.id}/cover.${EXT[f.type]}` : `${book.id}/book.${f.kind}`;
    const { data } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (!data) { await db.from("books").delete().eq("id", book.id); return { error: "Could not prepare upload." }; }
    uploads.push({ kind: f.kind, bucket, path, token: data.token, contentType: f.kind === "cover" ? f.type : f.kind === "epub" ? "application/epub+zip" : "application/pdf" });
  }
  return { bookId: book.id, uploads };
}

export async function finalizeUpload(bookId: string, abort: boolean): Promise<{ error?: string }> {
  const { user } = await requireUser(); const db = admin();
  const { data: b } = await db.from("books").select("id,status").eq("id", bookId).eq("author_id", user.id).maybeSingle();
  if (!b || b.status !== "draft") return { error: "Book not found." };
  const cleanup = async () => {
    for (const bucket of ["book-files", "book-covers"]) { const { data } = await db.storage.from(bucket).list(bookId); if (data?.length) await db.storage.from(bucket).remove(data.map((o) => `${bookId}/${o.name}`)); }
    await db.from("books").delete().eq("id", bookId);
  };
  if (abort) { await cleanup(); return {}; }
  const head = async (bucket: string, path: string) => {
    const { data } = await db.storage.from(bucket).createSignedUrl(path, 60); if (!data) return null;
    const r = await fetch(data.signedUrl, { headers: { Range: "bytes=0-11" } }); return Buffer.from(await r.arrayBuffer());
  };
  const [{ data: cov }, { data: fl }] = await Promise.all([db.storage.from("book-covers").list(bookId), db.storage.from("book-files").list(bookId)]);
  const fail = async (msg: string) => { await cleanup(); return { error: msg }; };
  const c = cov?.[0]; if (!c) return fail("Cover upload is missing.");
  const ch = await head("book-covers", `${bookId}/${c.name}`); if (!ch || !isImg(ch)) return fail("The cover is not a valid image.");
  const rows: { book_id: string; format: string; storage_path: string; size_bytes: number }[] = [];
  for (const o of fl ?? []) {
    const fmt = o.name === "book.epub" ? "epub" : o.name === "book.pdf" ? "pdf" : null; if (!fmt) continue;
    const h = await head("book-files", `${bookId}/${o.name}`);
    const ok = h && (fmt === "epub" ? h.subarray(0, 4).toString("latin1") === "PK\x03\x04" : h.subarray(0, 4).toString() === "%PDF");
    if (!ok) return fail(`The ${fmt.toUpperCase()} file is not a valid ${fmt.toUpperCase()}.`);
    rows.push({ book_id: bookId, format: fmt, storage_path: `${bookId}/${o.name}`, size_bytes: Number((o.metadata as any)?.size ?? 1) });
  }
  if (!rows.length) return fail("No book file was uploaded.");
  await db.from("book_files").insert(rows);
  await db.from("books").update({ cover_path: `${bookId}/${c.name}`, status: "pending_review" }).eq("id", bookId);
  return {};
}

export async function requestWithdrawal(fd: FormData) {
  const { sb } = await requireUser();
  const { error } = await sb.rpc("request_withdrawal", { p_amount: Number(fd.get("amount")), p_details: String(fd.get("details") ?? "") });
  redirect("/author/earnings?" + (error ? "error=" + encodeURIComponent(error.message) : "requested=1"));
}
