import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { etb } from "@/lib/books";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
export const metadata = { title: "Order History" };

export default async function Orders() {
  const { sb, user } = await requireUser();
  const { data } = await sb.from("orders").select("id,order_number,total_etb,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Your purchases" title="Order history" description="Track your orders and revisit payment details at any time." />
      {data?.length ? (
        <div className="space-y-3">
          {data.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card card-pad group flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest"><Icon name="receipt" className="h-5 w-5" /></span>
                <div><p className="font-display text-base transition group-hover:text-forest">{o.order_number}</p>
                  <p className="text-xs text-ink-muted">{new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div>
              </div>
              <div className="flex items-center gap-4"><StatusBadge value={o.status} /><span className="font-display text-lg">{etb(o.total_etb)}</span><Icon name="chevron-right" className="h-4 w-4 text-ink-soft" /></div>
            </Link>
          ))}
        </div>
      ) : <EmptyState icon="receipt" title="No orders yet" description="When you buy a book, your order will show up here."
        href="/books" actionLabel="Explore books" />}
    </div>
  );
}
