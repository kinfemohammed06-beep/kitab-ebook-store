import { createClient } from "@/lib/supabase/server";
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export async function GET() {
  const sb = createClient(); const { data: { user } } = await sb.auth.getUser();
  const { data: p } = user ? await sb.from("profiles").select("role,status").eq("id", user.id).single() : { data: null };
  if (p?.role !== "admin" || p.status !== "active") return new Response("Forbidden", { status: 403 });
  const { data } = await sb.from("transactions").select("id,created_at,kind,amount_etb,order_id,payment_id").order("created_at", { ascending: false }).limit(10000);
  const rows = ["id,created_at,kind,amount_etb,order_id,payment_id", ...(data ?? []).map((r) => [r.id, r.created_at, r.kind, r.amount_etb, r.order_id, r.payment_id].map(esc).join(","))];
  return new Response(rows.join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="transactions.csv"' } });
}
