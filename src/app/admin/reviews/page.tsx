import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { Icon } from "@/components/Icons";
import { Alert, PageHeader } from "@/components/ui";
import { reviewDismiss, reviewDelete } from "../actions";
export const metadata = { title: "Reported Reviews" };

export default async function AdminReviews({ searchParams }: { searchParams: { msg?: string } }) {
  const { sb } = await requireAdmin();
  const { data } = await sb.from("reviews").select("id,rating,body,created_at,books(title)").eq("reported", true).order("created_at");
  return (
    <>
      <AdminNav />
      <div className="page-narrow !py-8">
        <PageHeader eyebrow="Moderation" title="Reported reviews" description="Decide which flagged reviews should stay visible." />
        {searchParams.msg && <Alert kind="info">{searchParams.msg}</Alert>}
        {!data?.length && <p className="card-pad text-sm text-ink-muted">Nothing reported.</p>}
        <div className="space-y-4">
          {(data ?? []).map((r: any) => (
            <form key={r.id} className="card-pad text-sm">
              <input type="hidden" name="id" value={r.id} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-base">{r.books?.title}</p>
                <p className="flex items-center gap-0.5 text-gold">{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-gold" : "text-line"}`} />)}</p>
              </div>
              <p className="prose-kitab my-3 text-sm">{r.body || "(no text)"}</p>
              <p className="mb-4 text-xs text-ink-soft">{new Date(r.created_at).toLocaleString("en-GB")}</p>
              <div className="flex flex-wrap gap-2"><button formAction={reviewDismiss} className="btn btn-outline btn-sm">Keep (dismiss report)</button><button formAction={reviewDelete} className="btn btn-danger btn-sm">Delete review</button></div>
            </form>
          ))}
        </div>
      </div>
    </>
  );
}
