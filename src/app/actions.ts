"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCart, setCart, UUID } from "@/lib/cart";
import { requireUser } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";

export async function addToCart(fd: FormData) {
  const id = String(fd.get("id"));
  if (UUID.test(id)) setCart([...getCart(), id]);
  revalidatePath("/", "layout");
  if (fd.get("next") === "cart") redirect("/cart");
}
export async function removeFromCart(fd: FormData) {
  const id = String(fd.get("id")); setCart(getCart().filter((i) => i !== id)); revalidatePath("/cart");
}
export async function createOrder(fd: FormData) {
  const { user } = await requireUser();
  const ids = getCart(); const db = admin();
  const { data: books } = ids.length ? await db.from("books").select("id,price_etb").in("id", ids).eq("status", "approved") : { data: [] };
  const { data: owned } = ids.length ? await db.from("libraries").select("book_id").eq("user_id", user.id).in("book_id", ids) : { data: [] };
  const own = new Set((owned ?? []).map((o) => o.book_id));
  const gift = fd.get("gift") === "on"; const giftEmail = String(fd.get("gift_email") ?? "").trim().toLowerCase();
  if (gift && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(giftEmail)) redirect("/cart?error=" + encodeURIComponent("Enter the recipient's email address for the gift."));
  const items = (books ?? []).filter((b) => gift || !own.has(b.id));
  if (!items.length) { setCart([]); redirect("/cart?error=" + encodeURIComponent("Nothing to buy: your cart is empty or already owned.")); }
  const subtotal = items.reduce((a, b) => a + Number(b.price_etb), 0);
  let discount = 0, couponId: string | null = null;
  const code = String(fd.get("coupon") ?? "").trim().toUpperCase();
  if (code) {
    const { data: c } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    const ok = c && (!c.expires_at || new Date(c.expires_at) > new Date()) && (c.max_uses == null || c.used_count < c.max_uses);
    if (!ok) redirect("/cart?error=" + encodeURIComponent("Invalid or expired coupon."));
    discount = c.percent_off ? Math.round(subtotal * c.percent_off) / 100 : Math.min(Number(c.fixed_off_etb), subtotal);
    couponId = c.id;
  }
  const total = Math.round((subtotal - discount) * 100) / 100;
  if (gift && total === 0) redirect("/cart?error=" + encodeURIComponent("Free books cannot be sent as gifts; the recipient can get them for free themselves."));
  const { data: order, error } = await db.from("orders").insert({ user_id: user.id, gift_recipient_email: gift ? giftEmail : null, coupon_id: couponId, subtotal_etb: subtotal, discount_etb: discount, total_etb: total, status: total === 0 ? "paid" : "pending_payment" }).select("id").single();
  if (error || !order) redirect("/cart?error=" + encodeURIComponent("Could not create order."));
  await db.from("order_items").insert(items.map((b) => ({ order_id: order.id, book_id: b.id, price_etb: b.price_etb })));
  if (couponId) {
    await db.from("coupon_redemptions").insert({ coupon_id: couponId, order_id: order.id, user_id: user.id });
    await db.rpc("increment_coupon", { p_id: couponId }).then(() => {}, () => {});
  }
  setCart([]);
  if (total === 0) { // nothing to verify: free books / fully discounted
    await db.from("libraries").insert(items.map((b) => ({ user_id: user.id, book_id: b.id, order_id: order.id })));
    redirect("/library");
  }
  redirect(`/orders/${order.id}`);
}
