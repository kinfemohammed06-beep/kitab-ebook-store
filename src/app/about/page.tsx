import Link from "next/link";
import { Icon, type IconName } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "About Us" };

const values: { icon: IconName; title: string; text: string }[] = [
  { icon: "feather", title: "Written here, read everywhere", text: "A storefront built for Ethiopian voices, with books available in English, Amharic, Afaan Oromo and Tigrinya." },
  { icon: "shield", title: "Reviewed by people", text: "Every book is approved by an administrator before it is published, so the catalogue stays trustworthy." },
  { icon: "wallet", title: "Pay in Birr", text: "Pay with Telebirr in Ethiopian Birr. A real person checks your receipt before your books are released." },
  { icon: "library", title: "Your library, your way", text: "Read online in the built-in reader or download your books as EPUB or PDF with private, short-lived links." },
];

export default function About() {
  return (
    <div className="page">
      <PageHeader eyebrow="Our story" title="About Kitab"
        description="A home for Ethiopian stories and the readers who love them." />
      <div className="card-pad mb-10 border-forest/10 bg-forest-gradient !text-ivory">
        <p className="font-display text-2xl leading-snug sm:text-3xl">
          “Kitab is an ebook marketplace built for Ethiopian readers and writers.”
        </p>
        <p className="prose-kitab mt-4 max-w-3xl !text-ivory/80">
          Authors and publishers upload their books, readers buy them in Ethiopian Birr, and read or download them from a personal library.
          Every book is reviewed by an administrator before it is published, and every payment is checked by a person against our Telebirr records before books are released to your library.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="card card-pad flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest"><Icon name={v.icon} className="h-5 w-5" /></span>
            <div><h2 className="font-display text-lg">{v.title}</h2><p className="prose-kitab mt-1.5 text-sm">{v.text}</p></div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div><h2 className="font-display text-xl">Ready to find your next read?</h2><p className="mt-1 text-sm text-ink-muted">Explore a catalogue that grows with every new author.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/books" className="btn btn-primary">Explore books</Link><Link href="/faq" className="btn btn-outline">How it works</Link></div>
      </div>
    </div>
  );
}
