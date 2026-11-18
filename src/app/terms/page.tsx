import { publicSettings } from "@/lib/settings";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Terms and Conditions" };

export default async function Page() {
  const t = String((await publicSettings()).terms ?? "");
  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Legal" title="Terms and Conditions" description="The ground rules for buying, reading and publishing on Kitab." />
      <div className="card-pad">
        <div className="mb-5 flex items-center gap-2 border-b border-line pb-4 text-sm font-semibold text-forest"><Icon name="file" className="h-5 w-5" />Agreement</div>
        <p className="prose-kitab whitespace-pre-line text-[15px]">{t || "This page has not been published yet."}</p>
      </div>
    </div>
  );
}
