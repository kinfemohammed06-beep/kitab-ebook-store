import { publicSettings } from "@/lib/settings";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Privacy Policy" };

export default async function Page() {
  const t = String((await publicSettings()).privacy ?? "");
  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="How Kitab handles the information you share with us." />
      <div className="card-pad">
        <div className="mb-5 flex items-center gap-2 border-b border-line pb-4 text-sm font-semibold text-forest"><Icon name="shield" className="h-5 w-5" />Your information</div>
        <p className="prose-kitab whitespace-pre-line text-[15px]">{t || "This page has not been published yet."}</p>
      </div>
    </div>
  );
}
