import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const url = new URL(req.url); const code = url.searchParams.get("code"); const next = url.searchParams.get("next") ?? "/";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";      // never redirect off-site
  if (code) { const { error } = await createClient().auth.exchangeCodeForSession(code); if (error) return NextResponse.redirect(new URL("/login?error=" + encodeURIComponent("That link has expired. Please try again."), url.origin)); }
  return NextResponse.redirect(new URL(safe, url.origin));
}
