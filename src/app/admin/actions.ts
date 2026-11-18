"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
// Each action re-checks the admin role here AND inside the SQL function.
async function call(fn: string, args: Record<string, unknown>, back: string) {
  const { sb } = await requireAdmin(); const { error } = await sb.rpc(fn, args);
  revalidatePath(back); redirect(`${back}?msg=${encodeURIComponent(error ? "Error: " + error.message : "Done.")}`);
}
const id = (fd: FormData) => String(fd.get("id")); const note = (fd: FormData) => String(fd.get("note") ?? "").trim() || null;
export async function bookApprove(fd: FormData) { await call("review_book", { p_book_id: id(fd), p_approve: true, p_reason: null }, "/admin/books"); }
export async function bookReject(fd: FormData) { await call("review_book", { p_book_id: id(fd), p_approve: false, p_reason: note(fd) }, "/admin/books"); }
export async function bookSave(fd: FormData) { await call("admin_update_book", { p_book_id: id(fd), p_featured: fd.get("featured") === "on", p_price: Number(fd.get("price")), p_remove: false }, "/admin/books"); }
export async function bookRemove(fd: FormData) { await call("admin_update_book", { p_book_id: id(fd), p_featured: false, p_price: Number(fd.get("price")), p_remove: true }, "/admin/books"); }
const comm = (fd: FormData) => { const c = String(fd.get("commission") ?? "").trim(); return c === "" ? null : Number(c); };
export async function authorApprove(fd: FormData) { await call("review_author", { p_user_id: id(fd), p_approved: true, p_commission: comm(fd) }, "/admin/authors"); }
export async function authorSuspend(fd: FormData) { await call("review_author", { p_user_id: id(fd), p_approved: false, p_commission: comm(fd) }, "/admin/authors"); }
export async function wdApprove(fd: FormData) { await call("process_withdrawal", { p_id: id(fd), p_action: "approve", p_note: note(fd) }, "/admin/withdrawals"); }
export async function wdPaid(fd: FormData) { await call("process_withdrawal", { p_id: id(fd), p_action: "paid", p_note: note(fd) }, "/admin/withdrawals"); }
export async function wdReject(fd: FormData) { await call("process_withdrawal", { p_id: id(fd), p_action: "reject", p_note: note(fd) }, "/admin/withdrawals"); }

import { SETTINGS } from "@/lib/settings";
const back = (path: string, m: string) => redirect(`${path}?msg=${encodeURIComponent(m)}`);
export async function userSave(fd: FormData) {
  const role = String(fd.get("role")), status = String(fd.get("status"));
  if (!["reader", "author", "publisher", "admin"].includes(role) || !["active", "suspended"].includes(status)) return back("/admin/users", "Invalid values");
  await call("admin_set_user", { p_user_id: id(fd), p_role: role, p_status: status }, "/admin/users");
}
export async function couponCreate(fd: FormData) {
  const t = String(fd.get("type")), v = Number(fd.get("value")), exp = String(fd.get("expires") || ""), mx = String(fd.get("max") || "");
  await call("admin_create_coupon", { p_code: String(fd.get("code")).trim().toUpperCase(), p_percent: t === "percent" ? v : null, p_fixed: t === "fixed" ? v : null,
    p_expires: exp ? new Date(exp + "T23:59:59Z").toISOString() : null, p_max: mx ? Number(mx) : null }, "/admin/coupons");
}
export async function couponExpire(fd: FormData) {
  const { sb } = await requireAdmin(); await sb.from("coupons").update({ expires_at: new Date().toISOString() }).eq("id", id(fd)); back("/admin/coupons", "Coupon expired.");
}
export async function reviewDismiss(fd: FormData) { await call("admin_review_action", { p_id: id(fd), p_delete: false }, "/admin/reviews"); }
export async function reviewDelete(fd: FormData) { await call("admin_review_action", { p_id: id(fd), p_delete: true }, "/admin/reviews"); }
export async function saveSettings(fd: FormData) {
  const { sb } = await requireAdmin(); const errs: string[] = [];
  for (const [k, , type] of SETTINGS) {
    const raw = String(fd.get(k) ?? "").trim(); const value = type === "number" ? Number(raw) : raw;
    if (type === "number" && raw === "") continue;
    const { error } = await sb.rpc("admin_set_setting", { p_key: k, p_value: value }); if (error) errs.push(`${k}: ${error.message}`);
  }
  revalidatePath("/", "layout"); back("/admin/settings", errs.length ? "Error: " + errs.join("; ") : "Saved.");
}
const cat = (fd: FormData) => ({ name_en: String(fd.get("name_en")).trim(), name_am: String(fd.get("name_am") ?? "").trim() || null, name_om: String(fd.get("name_om") ?? "").trim() || null, name_ti: String(fd.get("name_ti") ?? "").trim() || null });
export async function catAdd(fd: FormData) {
  const { sb } = await requireAdmin(); const slug = String(fd.get("slug")).trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug) || !cat(fd).name_en) return back("/admin/categories", "Slug (a-z, 0-9, -) and English name are required.");
  const { error } = await sb.from("categories").insert({ slug, ...cat(fd), parent_id: Number(fd.get("parent")) || null }); revalidatePath("/", "layout"); back("/admin/categories", error ? "Error: " + error.message : "Added.");
}
export async function catSave(fd: FormData) { const { sb } = await requireAdmin(); const { error } = await sb.from("categories").update(cat(fd)).eq("id", Number(id(fd))); revalidatePath("/", "layout"); back("/admin/categories", error ? "Error: " + error.message : "Saved."); }
export async function catDelete(fd: FormData) { const { sb } = await requireAdmin(); const { error } = await sb.from("categories").delete().eq("id", Number(id(fd))); revalidatePath("/", "layout"); back("/admin/categories", error ? "Error: " + error.message : "Deleted."); }
