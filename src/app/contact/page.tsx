import Link from "next/link";
import { publicSettings } from "@/lib/settings";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Contact" };

export default async function Contact() {
  const s = await publicSettings();
  return (
    <div className="page-narrow">
      <PageHeader eyebrow="We're here to help" title="Contact"
        description="Questions about a book, a payment or your account? Reach out and we'll point you in the right direction." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card card-pad">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest"><Icon name="mail" className="h-5 w-5" /></span>
          <h2 className="mt-4 font-display text-lg">Email us</h2>
          {s.contact_email ? <a href={`mailto:${String(s.contact_email)}`} className="link-underline mt-1 inline-block break-all">{String(s.contact_email)}</a>
            : <p className="mt-1 text-sm text-ink-muted">No email has been published yet.</p>}
          <p className="mt-3 text-xs text-ink-soft">For payment questions, include your order number and transaction ID.</p>
        </div>
        <div className="card card-pad">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest"><Icon name="phone" className="h-5 w-5" /></span>
          <h2 className="mt-4 font-display text-lg">Call us</h2>
          {s.contact_phone ? <a href={`tel:${String(s.contact_phone)}`} className="link-underline mt-1 inline-block">{String(s.contact_phone)}</a>
            : <p className="mt-1 text-sm text-ink-muted">No phone number has been published yet.</p>}
          <p className="mt-3 text-xs text-ink-soft">Payment verification can take a little time — check your notifications first.</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-forest/15 bg-forest-50/50 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg"><Icon name="info" className="h-5 w-5 text-forest" />Looking for a quicker answer?</h2>
        <p className="prose-kitab mt-2 text-sm">Our FAQ covers payments, delivery, downloads, gifting and publishing.</p>
        <Link href="/faq" className="btn btn-outline btn-sm mt-4"><Icon name="arrow-right" className="h-4 w-4" />Read the FAQ</Link>
      </div>
    </div>
  );
}
