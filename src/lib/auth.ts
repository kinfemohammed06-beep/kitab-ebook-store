import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function requireUser() {
  const sb = createClient(); const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await sb.from("profiles").select("status").eq("id", user.id).single();
  if (p?.status === "suspended") { await sb.auth.signOut(); redirect("/login?error=" + encodeURIComponent("This account has been suspended.")); }
  return { sb, user };
}
export async function requireAdmin() {
  const { sb, user } = await requireUser();
  const { data: p } = await sb.from("profiles").select("role,status").eq("id", user.id).single();
  if (p?.role !== "admin" || p.status !== "active") notFound();
  return { sb, user };
}
