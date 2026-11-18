import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/cart";
import Logo from "./Logo";
import HeaderNav from "./HeaderNav";
import { Icon } from "./Icons";

export default async function Header({ announcement = "" }: { announcement?: string }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const role = user ? (await sb.from("profiles").select("role").eq("id", user.id).single()).data?.role : null;
  const n = getCart().length;
  const unread = user ? (await sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)).count ?? 0 : 0;
  async function logout() { "use server"; await createClient().auth.signOut(); redirect("/"); }

  return (
    <>
      <div className="bg-forest-950 text-ivory/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] sm:px-6 lg:px-8">
          <span className="truncate">{announcement || "Curated ebooks from Ethiopia and beyond · Pay securely with Telebirr"}</span>
          <Link href="/faq" className="hidden shrink-0 items-center gap-0.5 font-semibold text-gold transition hover:text-ivory sm:inline-flex">
            How it works <Icon name="chevron-right" className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <header className="relative z-40 border-b border-line bg-paper/95 shadow-soft backdrop-blur-lg lg:sticky lg:top-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[70px] items-center gap-3">
            <Link href="/" aria-label="Kitab home" className="shrink-0"><Logo className="h-10 w-auto sm:h-11" /></Link>
            <HeaderNav user={!!user} role={role ?? null} unread={unread} cartCount={n} logoutAction={logout} />
          </div>
        </div>
      </header>
    </>
  );
}
