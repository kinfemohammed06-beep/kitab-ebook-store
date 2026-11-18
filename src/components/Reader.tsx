"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { saveProgress, addMark, deleteMark } from "@/app/read/actions";
import { Icon, type IconName } from "./Icons";
type Mark = { id: string; location: string; note: string | null; highlight_text: string | null };
type Hit = { target: string | number; text: string };
type Props = { bookId: string; title: string; kind: "epub" | "pdf"; url: string; start: string | null; marks: Mark[] };

export default function Reader({ bookId, title, kind, url, start, marks: m0 }: Props) {
  const host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const eng = useRef<any>({}), timer = useRef<any>();
  const [dark, setDark] = useState(false), [size, setSize] = useState(100), [width, setWidth] = useState(800);
  const [panel, setPanel] = useState<"toc" | "marks" | "search" | null>(null);
  const [toc, setToc] = useState<{ label: string; target: string | number }[]>([]);
  const [marks, setMarks] = useState<Mark[]>(m0);
  const [pct, setPct] = useState(0), [loc, setLoc] = useState(start ?? "");
  const [sel, setSel] = useState<{ cfi: string; text: string } | null>(null);
  const [q, setQ] = useState(""), [hits, setHits] = useState<Hit[]>([]), [busy, setBusy] = useState(false);
  const [note, setNote] = useState(""), [err, setErr] = useState("");
  const persist = (l: string, p: number) => { clearTimeout(timer.current); timer.current = setTimeout(() => saveProgress(bookId, l, p), 1200); };

  const renderPdf = useCallback(async (n: number) => {
    const { doc } = eng.current; if (!doc || !canvas.current) return;
    n = Math.min(Math.max(n, 1), doc.numPages); eng.current.page = n;
    const page = await doc.getPage(n); const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: (width / base.width) * (size / 100) });
    const c = canvas.current; c.width = vp.width; c.height = vp.height;
    eng.current.task?.cancel(); const task = page.render({ canvasContext: c.getContext("2d")!, viewport: vp }); eng.current.task = task;
    try { await task.promise; } catch { return; }
    const p = Math.round((n / doc.numPages) * 100); setPct(p); setLoc(String(n)); persist(String(n), p);
  }, [width, size]); // eslint-disable-line

  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      try {
        if (kind === "epub") {
          const ePub = (await import("epubjs")).default;
          const book: any = ePub(url, { openAs: "epub" });           // signed URLs have a query string, so force the type
          const r = book.renderTo(host.current!, { width: "100%", height: "100%", flow: "paginated", spread: "none" });
          eng.current = { book, r };
          m0.filter((x) => x.highlight_text).forEach((x) => r.annotations.highlight(x.location, {}, () => {}, "hl", { fill: "#C6A15B", "fill-opacity": "0.4" }));
          await r.display(start || undefined);
          book.loaded.navigation.then((n: any) => setToc(n.toc.map((t: any) => ({ label: t.label.trim(), target: t.href }))));
          book.ready.then(() => book.locations.generate(1200)).then(() => { eng.current.ready = true; });
          r.on("relocated", (l: any) => {
            const p = eng.current.ready ? Math.round(book.locations.percentageFromCfi(l.start.cfi) * 100) : -1;
            if (p >= 0) setPct(p); setLoc(l.start.cfi); setSel(null); persist(l.start.cfi, p);
          });
          r.on("selected", (cfi: string) => book.getRange(cfi).then((rg: any) => setSel({ cfi, text: rg.toString() })));
          cleanup = () => book.destroy();
        } else {
          const pdfjs: any = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const doc = await pdfjs.getDocument(url).promise;
          eng.current = { doc, page: Math.min(Math.max(parseInt(start ?? "1") || 1, 1), doc.numPages) };
          await renderPdf(eng.current.page);
          const out = (await doc.getOutline()) ?? []; const items: { label: string; target: number }[] = [];
          for (const it of out) { try { const d = typeof it.dest === "string" ? await doc.getDestination(it.dest) : it.dest; items.push({ label: it.title, target: (await doc.getPageIndex(d[0])) + 1 }); } catch {} }
          setToc(items);
          cleanup = () => doc.destroy();
        }
      } catch { setErr("Could not open this book. Try downloading it from your library instead."); }
    })();
    return () => cleanup();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (kind === "epub" && eng.current.r) {
      const r = eng.current.r; r.themes.fontSize(size + "%");
      r.themes.override("color", dark ? "#E9E1D2" : "#242424"); r.themes.override("background", dark ? "#1b1b1b" : "#F7F3E9");
    } else if (kind === "pdf") renderPdf(eng.current.page ?? 1);
  }, [size, dark, kind, renderPdf]);
  useEffect(() => { if (kind === "epub") setTimeout(() => eng.current.r?.resize("100%", "100%"), 150); else renderPdf(eng.current.page ?? 1); }, [width]); // eslint-disable-line

  const next = () => (kind === "epub" ? eng.current.r?.next() : renderPdf((eng.current.page ?? 1) + 1));
  const prev = () => (kind === "epub" ? eng.current.r?.prev() : renderPdf((eng.current.page ?? 1) - 1));
  const goTo = (t: string | number) => (kind === "epub" ? eng.current.r?.display(String(t)) : renderPdf(Number(t)));
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return; if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }); // eslint-disable-line

  const add = async (highlight?: string) => {
    const where = highlight ? sel!.cfi : loc; if (!where) return;
    const m = await addMark(bookId, where, note.trim() || null, highlight ?? null);
    if (m) { setMarks([m as Mark, ...marks]); setNote(""); if (highlight) { eng.current.r.annotations.highlight(where, {}, () => {}, "hl", { fill: "#C6A15B", "fill-opacity": "0.4" }); setSel(null); } }
  };
  const remove = async (m: Mark) => { await deleteMark(m.id); setMarks(marks.filter((x) => x.id !== m.id)); if (kind === "epub" && m.highlight_text) eng.current.r.annotations.remove(m.location, "highlight"); };
  const search = async () => {
    const needle = q.trim().toLowerCase(); if (!needle) return; setBusy(true); setHits([]); const out: Hit[] = [];
    if (kind === "epub") { const { book } = eng.current; for (const it of book.spine.spineItems) { await it.load(book.load.bind(book)); (it.find(q.trim()) ?? []).forEach((f: any) => out.push({ target: f.cfi, text: f.excerpt })); it.unload(); if (out.length >= 50) break; } }
    else { const { doc } = eng.current; for (let n = 1; n <= doc.numPages && out.length < 50; n++) { const t = (await (await doc.getPage(n)).getTextContent()).items.map((i: any) => i.str).join(" "); const i = t.toLowerCase().indexOf(needle); if (i >= 0) out.push({ target: n, text: `p.${n}: …${t.slice(Math.max(0, i - 40), i + 70)}…` }); } }
    setHits(out); setBusy(false);
  };
  const label = (m: Mark) => (m.highlight_text ? `“${m.highlight_text.slice(0, 90)}”` : m.note ?? "Bookmark") + (kind === "pdf" ? ` · p.${m.location}` : "");
  const tab = (k: typeof panel, t: string, icon: IconName) => (
    <button onClick={() => setPanel(panel === k ? null : k)} aria-expanded={panel === k}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${panel === k ? "bg-ivory/15 text-gold" : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory"}`}>
      <Icon name={icon} className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t}</span>
    </button>
  );
  const tool = (label: string, fn: () => void) => <button onClick={fn} title={label} aria-label={label} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-ivory/75 transition hover:bg-ivory/10 hover:text-ivory">{label}</button>;
  const bg = dark ? "bg-[#151d19] text-beige" : "bg-ivory text-charcoal";

  return (<div className={`fixed inset-0 z-40 flex flex-col ${bg}`}>
    <div className="flex flex-wrap items-center gap-2 border-b border-ivory/10 bg-forest-950 px-3 py-2 text-sm text-ivory sm:px-4">
      <Link href="/library" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-ivory/75 transition hover:bg-ivory/10 hover:text-ivory"><Icon name="arrow-left" className="h-4 w-4" /><span className="hidden sm:inline">Library</span></Link>
      <span className="max-w-[35%] truncate font-display text-sm sm:max-w-md sm:text-base">{title}</span>
      <div className="ml-auto flex flex-wrap items-center gap-0.5">
        {tab("toc", "Contents", "list")}{tab("marks", "Marks", "bookmark")}{tab("search", "Search", "search")}
        <span className="mx-1 hidden h-5 w-px bg-ivory/15 sm:block" />
        {tool("A−", () => setSize(Math.max(70, size - 10)))}{tool("A+", () => setSize(Math.min(200, size + 10)))}
        {tool(`${width}`, () => setWidth(width === 640 ? 800 : width === 800 ? 1000 : 640))}
        <button onClick={() => setDark(!dark)} title={dark ? "Light mode" : "Dark mode"} aria-label={dark ? "Light mode" : "Dark mode"}
          className="rounded-lg p-2 text-ivory/75 transition hover:bg-ivory/10 hover:text-ivory"><Icon name={dark ? "sun" : "moon"} className="h-4 w-4" /></button>
      </div>
    </div>
    <div className="flex min-h-0 flex-1">
      {panel && (<aside className={`w-72 shrink-0 overflow-y-auto border-r border-forest/10 p-4 text-sm ${bg}`}>
        {panel === "toc" && (toc.length ? toc.map((t, i) => <button key={i} onClick={() => goTo(t.target)} className="block w-full rounded-lg px-2 py-2 text-left text-sm transition hover:bg-forest/5 hover:text-forest">{t.label}</button>) : <p className="text-sm text-ink-muted">No table of contents.</p>)}
        {panel === "marks" && (<div className="space-y-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" rows={2} className="field text-charcoal" />
          <div className="flex flex-wrap gap-2"><button onClick={() => add()} className="btn btn-outline btn-sm">Bookmark here</button>
            {kind === "epub" && sel && <button onClick={() => add(sel.text)} className="btn btn-primary btn-sm">Highlight selection</button>}</div>
          {kind === "pdf" && <p className="text-xs text-ink-muted">PDF supports bookmarks and notes per page; text highlighting is for EPUB.</p>}
          {marks.map((m) => (<div key={m.id} className="flex justify-between gap-2 border-b border-line py-2"><button onClick={() => goTo(m.location)} className="text-left text-xs transition hover:text-forest">{label(m)}</button><button onClick={() => remove(m)} aria-label="Delete bookmark" className="text-ink-soft hover:text-red-700"><Icon name="trash" className="h-3.5 w-3.5" /></button></div>))}</div>)}
        {panel === "search" && (<div className="space-y-3"><div className="flex gap-1"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search in book" className="field text-charcoal" /><button onClick={search} className="btn btn-primary btn-sm">Go</button></div>
          {busy && <p className="text-xs text-ink-muted">Searching…</p>}{hits.map((h, i) => <button key={i} onClick={() => goTo(h.target)} className="block w-full rounded-lg px-2 py-2 text-left text-xs transition hover:bg-forest/5 hover:text-forest">{h.text}</button>)}</div>)}
      </aside>)}
      <div className="flex min-w-0 flex-1 justify-center overflow-auto">
        {err ? <div className="m-auto max-w-sm p-10 text-center"><p className="font-display text-xl">{err}</p></div> : kind === "epub"
          ? <div ref={host} style={{ maxWidth: width }} className="h-full w-full" />
          : <canvas ref={canvas} className="m-4 self-start rounded-lg shadow-card" style={dark ? { filter: "invert(0.9) hue-rotate(180deg)" } : undefined} />}
      </div></div>
    <div className="flex items-center gap-3 border-t border-ivory/10 bg-forest-950 px-3 py-2.5 text-sm text-ivory sm:px-4">
      <button onClick={prev} className="inline-flex items-center gap-1.5 rounded-lg bg-ivory/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-ivory/20"><Icon name="arrow-left" className="h-3.5 w-3.5" />Prev</button>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ivory/20"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} /></div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums">{pct}%</span>
      <button onClick={next} className="inline-flex items-center gap-1.5 rounded-lg bg-ivory/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-ivory/20">Next<Icon name="arrow-right" className="h-3.5 w-3.5" /></button></div>
  </div>);
}
