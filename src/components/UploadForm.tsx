"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import { prepareUpload, finalizeUpload } from "@/app/author/actions";
import { Icon } from "./Icons";
export default function UploadForm({ cats }: { cats: { id: number; name_en: string }[] }) {
  const router = useRouter(); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setMsg("Preparing…");
    const cover = f.get("cover") as File, epub = f.get("epub") as File, pdf = f.get("pdf") as File;
    const files: any[] = [{ kind: "cover", size: cover.size, type: cover.type }];
    if (epub.size) files.push({ kind: "epub", size: epub.size, type: "application/epub+zip" });
    if (pdf.size) files.push({ kind: "pdf", size: pdf.size, type: "application/pdf" });
    const prep = await prepareUpload({ title: String(f.get("title")), subtitle: String(f.get("subtitle")), description: String(f.get("description")), language: String(f.get("language")),
      price: Number(f.get("price")), isbn: String(f.get("isbn")), pages: Number(f.get("pages")) || null, categories: f.getAll("categories").map(Number) }, files);
    if ("error" in prep) { setMsg(prep.error ?? "Error"); setBusy(false); return; }
    const sb = browserClient(); const byKind: Record<string, File> = { cover, epub, pdf };
    for (const u of prep.uploads) {
      setMsg(`Uploading ${u.kind}…`);
      const { error } = await sb.storage.from(u.bucket).uploadToSignedUrl(u.path, u.token, byKind[u.kind], { contentType: u.contentType });
      if (error) { await finalizeUpload(prep.bookId, true); setMsg("Upload failed: " + error.message); setBusy(false); return; }
    }
    setMsg("Checking files…"); const fin = await finalizeUpload(prep.bookId, false);
    if (fin.error) { setMsg(fin.error); setBusy(false); return; }
    router.push("/author?uploaded=1");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="card-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-line pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest"><Icon name="book" className="h-4 w-4" /></span>
          <div><h2 className="font-display text-lg">Book details</h2><p className="text-xs text-ink-muted">How your book will appear in the catalogue.</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="label">Title *</span><input name="title" required maxLength={200} placeholder="The title of your book" className="field" /></label>
          <label className="sm:col-span-2"><span className="label">Subtitle</span><input name="subtitle" placeholder="Optional" className="field" /></label>
        </div>
        <label><span className="label">Description *</span><textarea name="description" required rows={6} placeholder="Tell readers what this book is about…" className="field" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="label">Language</span><select name="language" className="field"><option value="en">English</option><option value="am">አማርኛ</option><option value="om">Afaan Oromo</option><option value="ti">ትግርኛ</option></select></label>
          <label><span className="label">Price (ETB) *</span><input name="price" type="number" min="0" step="0.01" required placeholder="0 = free" className="field" /></label>
          <label><span className="label">ISBN</span><input name="isbn" placeholder="Optional" className="field" /></label>
          <label><span className="label">Pages</span><input name="pages" type="number" min="1" placeholder="Optional" className="field" /></label>
        </div>
        <fieldset>
          <legend className="label">Categories <span className="font-normal normal-case tracking-normal text-ink-soft">(up to 5)</span></legend>
          <div className="flex flex-wrap gap-2">{cats.map((c) => (
            <label key={c.id} className="chip cursor-pointer has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-ivory">
              <input type="checkbox" name="categories" value={c.id} className="sr-only" />{c.name_en}
            </label>
          ))}</div>
        </fieldset>
      </section>

      <section className="card-pad space-y-4">
        <div className="flex items-center gap-3 border-b border-line pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest"><Icon name="upload" className="h-4 w-4" /></span>
          <div><h2 className="font-display text-lg">Files</h2><p className="text-xs text-ink-muted">Your files are checked before the book goes live.</p></div>
        </div>
        <label className="block"><span className="label">Cover image * <span className="font-normal normal-case tracking-normal text-ink-soft">JPG / PNG / WebP, max 3 MB</span></span>
          <input name="cover" type="file" required accept="image/jpeg,image/png,image/webp" className="field" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="label">EPUB file <span className="font-normal normal-case tracking-normal text-ink-soft">max 100 MB</span></span>
            <input name="epub" type="file" accept=".epub,application/epub+zip" className="field" /></label>
          <label className="block"><span className="label">PDF file <span className="font-normal normal-case tracking-normal text-ink-soft">max 100 MB</span></span>
            <input name="pdf" type="file" accept="application/pdf" className="field" /></label>
        </div>
        <p className="text-xs text-ink-soft">Upload at least one book file. An administrator reviews every submission before publication.</p>
      </section>

      {msg && <p role="status" className="rounded-xl border border-forest/15 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">{msg}</p>}
      <button disabled={busy} className="btn btn-primary w-full"><Icon name="sparkles" className="h-4 w-4" />{busy ? "Working…" : "Submit for Review"}</button>
    </form>
  );
}
