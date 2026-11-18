import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icons";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata = { title: "Categories" };

export default async function Categories() {
  const { data } = await createClient().from("categories").select("id,slug,name_en,parent_id").order("name_en");
  const top = (data ?? []).filter((c) => !c.parent_id);
  return (
    <div className="page">
      <PageHeader eyebrow="Find your subject" title="Categories"
        description="Explore the collection one subject at a time — from fiction and history to faith, business and poetry." />
      {top.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((c) => {
            const kids = (data ?? []).filter((s) => s.parent_id === c.id);
            return (
              <div key={c.id} className="card card-pad group">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest transition group-hover:bg-forest group-hover:text-ivory"><Icon name="book" className="h-5 w-5" /></span>
                <Link href={`/categories/${c.slug}`} className="mt-4 block font-display text-xl transition group-hover:text-forest">{c.name_en}</Link>
                {kids.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {kids.map((s) => <Link key={s.id} href={`/categories/${s.slug}`} className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink-muted transition hover:bg-forest-50 hover:text-forest">{s.name_en}</Link>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : <EmptyState title="No categories yet" description="Categories will appear here once they have been added." />}
    </div>
  );
}
