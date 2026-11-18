import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata = { title: "Notifications" };

export default async function Notifications() {
  const { sb, user } = await requireUser();
  const { data } = await sb.from("notifications").select("id,message,read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  async function markRead() { "use server"; const { sb, user } = await requireUser(); await sb.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false); revalidatePath("/", "layout"); }
  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Stay in the loop" title="Notifications" description="Updates about your orders, payments and new books."
        actions={unread > 0 ? <form action={markRead}><button className="btn btn-outline"><Icon name="check" className="h-4 w-4" />Mark all read</button></form> : undefined} />
      {data?.length ? (
        <div className="space-y-2.5">
          {data.map((n) => (
            <article key={n.id} className={`card flex gap-3 p-4 ${n.read ? "" : "border-forest/25 bg-forest-50/40"}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-ink/5 text-ink-muted" : "bg-forest text-ivory"}`}><Icon name="bell" className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-6 ${n.read ? "text-ink-muted" : "font-semibold text-ink"}`}>{n.message}</p>
                <p className="mt-1 text-[11px] text-ink-soft">{new Date(n.created_at).toLocaleString("en-GB")}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
            </article>
          ))}
        </div>
      ) : <EmptyState icon="bell" title="Nothing yet" description="Notifications about your orders and payments will appear here." href="/books" actionLabel="Explore books" />}
    </div>
  );
}
