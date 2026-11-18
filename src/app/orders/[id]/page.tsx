import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { Alert, Breadcrumb, PageHeader, StatusBadge } from "@/components/ui";

const back = (id: string, k: string, m: string) => redirect(`/orders/${id}?${k}=${encodeURIComponent(m)}`);
const sniff = (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 ? ["jpg", "image/jpeg"] : b.subarray(1, 4).toString() === "PNG" ? ["png", "image/png"] : b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" ? ["webp", "image/webp"] : null;

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; submitted?: string } }) {
  const { sb, user } = await requireUser();
  const { data: o } = await sb.from("orders").select("*,order_items(price_etb,books(title))").eq("id", params.id).eq("user_id", user.id).maybeSingle();
  if (!o) notFound();
  const { data: pays } = await sb.from("payments").select("id,status,reviewer_note,reference_no,submitted_at").eq("order_id", o.id).order("submitted_at", { ascending: false });
  const latest = pays?.[0]; const needsInfo = pays?.some((p) => p.status === "needs_info");
  const canPay = ["pending_payment", "rejected"].includes(o.status) || needsInfo;
  const { data: st } = await admin().from("platform_settings").select("key,value").in("key", ["telebirr_number", "telebirr_account_name"]);
  const cfg = Object.fromEntries((st ?? []).map((s) => [s.key, s.value]));

  async function submit(fd: FormData) {
    "use server";
    const { user } = await requireUser(); const db = admin();
    const { data: o } = await db.from("orders").select("id,total_etb,status").eq("id", params.id).eq("user_id", user.id).single();
    if (!o) return;
    const { data: ps } = await db.from("payments").select("id,status").eq("order_id", o.id);
    const needs = ps?.find((p) => p.status === "needs_info");
    if (!(["pending_payment", "rejected"].includes(o.status) || needs)) back(o.id, "error", "This order cannot accept a payment right now.");
    const ref = String(fd.get("reference") ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6,20}$/.test(ref)) back(o.id, "error", "Enter the Telebirr transaction ID exactly as shown on your receipt (letters and digits, 6–20 characters).");
    const f = fd.get("screenshot") as File | null;
    if (!f || f.size === 0 || f.size > 4 * 1024 * 1024) back(o.id, "error", "Upload a screenshot of your receipt (max 4 MB).");
    const buf = Buffer.from(await f!.arrayBuffer()); const kind = sniff(buf);
    if (!kind) back(o.id, "error", "Screenshot must be a JPG, PNG or WebP image.");
    const path = `${user.id}/${o.id}-${Date.now()}.${kind![0]}`;
    const up = await db.storage.from("payment-proofs").upload(path, buf, { contentType: kind![1] });
    if (up.error) back(o.id, "error", "Upload failed. Please try again.");
    if (needs) await db.from("payments").update({ status: "rejected", reviewer_note: "Superseded by resubmission" }).eq("id", needs.id);
    const { data: pay, error } = await db.from("payments").insert({ order_id: o.id, reference_no: ref, amount_etb: o.total_etb }).select("id").single();
    if (error || !pay) {
      await db.storage.from("payment-proofs").remove([path]);
      back(o.id, "error", error?.code === "23505" ? "That Telebirr reference has already been submitted." : "Could not record your payment.");
    }
    await db.from("payment_screenshots").insert({ payment_id: pay!.id, storage_path: path });
    await db.from("orders").update({ status: "awaiting_verification" }).eq("id", o.id);
    redirect(`/orders/${o.id}?submitted=1`);
  }

  return (
    <div className="page-narrow">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Orders", href: "/orders" }, { label: o.order_number }]} />
      <PageHeader eyebrow="Order details" title={o.order_number}
        description={new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
        actions={<StatusBadge value={o.status} />} />

      {searchParams.error && <Alert kind="error" title="Payment not submitted">{searchParams.error}</Alert>}
      {searchParams.submitted && <Alert kind="success" title="Receipt submitted">An administrator will verify it against our Telebirr records. You will be notified once it is reviewed.</Alert>}
      {latest && ["rejected", "needs_info"].includes(latest.status) && (
        <Alert kind="warning" title={latest.status === "rejected" ? "Payment rejected" : "More information needed"}>{latest.reviewer_note}</Alert>
      )}
      {o.status === "paid" && <Alert kind="success" title="Payment verified">
        {o.gift_recipient_email ? <>The gift has been delivered to <strong>{o.gift_recipient_email}</strong>.</> : <>Your books are in <a href="/library" className="link-underline">My Library</a>.</>}
      </Alert>}

      <div className="card mb-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><Icon name="books" className="h-5 w-5 text-forest" />Books in this order</h2>
        <ul className="space-y-2.5 text-sm">
          {(o.order_items as any[]).map((i, k) => <li key={k} className="flex justify-between gap-4 py-1"><span className="text-ink-muted">{i.books?.title}</span><span className="font-semibold">{etb(i.price_etb)}</span></li>)}
        </ul>
        <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          {Number(o.discount_etb) > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{etb(o.discount_etb)}</span></div>}
          <div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-display text-2xl text-forest">{etb(o.total_etb)}</span></div>
        </div>
        {o.gift_recipient_email && <p className="mt-4 flex items-center gap-2 rounded-xl bg-gold-50 px-3.5 py-2.5 text-sm text-gold-600"><Icon name="gift" className="h-4 w-4" />Gift for {o.gift_recipient_email}</p>}
      </div>

      {canPay && (
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line bg-forest-50/60 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-ivory"><Icon name="wallet" className="h-4 w-4" /></span>
            <div><h2 className="font-display text-lg">Pay with Telebirr</h2><p className="text-xs text-ink-muted">Three quick steps to finish your order.</p></div>
          </div>
          <div className="space-y-5 p-5">
            <ol className="space-y-3 text-sm">
              {[
                <>Open Telebirr and send exactly <strong>{etb(o.total_etb)}</strong> to <strong className="select-all text-forest">{String(cfg.telebirr_number ?? "—")}</strong> ({String(cfg.telebirr_account_name ?? "")}).</>,
                <>Take a screenshot of the successful receipt.</>,
                <>Upload it below with the transaction ID.</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-xs font-bold text-forest">{i + 1}</span><span className="text-ink-muted">{step}</span></li>
              ))}
            </ol>
            <form action={submit} className="space-y-4 border-t border-line pt-5">
              <label className="block"><span className="label">Telebirr transaction ID</span>
                <input name="reference" required placeholder="e.g. TXN123456" className="field uppercase" /></label>
              <label className="block"><span className="label">Receipt screenshot <span className="font-normal normal-case tracking-normal text-ink-soft">JPG / PNG / WebP, max 4 MB</span></span>
                <input name="screenshot" type="file" accept="image/jpeg,image/png,image/webp" required className="field" /></label>
              <button className="btn btn-primary w-full"><Icon name="shield" className="h-4 w-4" />Submit for verification</button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
