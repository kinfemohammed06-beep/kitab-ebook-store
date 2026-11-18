import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import UploadForm from "@/components/UploadForm";
import { Breadcrumb, PageHeader } from "@/components/ui";
export const metadata = { title: "Upload Book" };

export default async function Upload() {
  const { sb, user } = await requireUser();
  const { data: a } = await sb.from("author_profiles").select("approved").eq("user_id", user.id).maybeSingle();
  if (!a) redirect("/author");
  const { data: cats } = await sb.from("categories").select("id,name_en").order("name_en");
  return (
    <div className="page-narrow">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Author dashboard", href: "/author" }, { label: "Upload book" }]} />
      <PageHeader eyebrow="New title" title="Upload a book" description="Add the details and files for your book. Every submission is reviewed before it goes on sale." />
      {a.approved ? <UploadForm cats={cats ?? []} /> : <p className="card-pad text-sm text-ink-muted">Your author account must be approved before you can upload.</p>}
    </div>
  );
}
