import Link from "next/link";
import { publicSettings } from "@/lib/settings";
import Logo from "./Logo";
import { Icon, type IconName } from "./Icons";

const explore: { href: string; label: string }[] = [
  { href: "/books", label: "All books" }, { href: "/books?sort=new", label: "New releases" },
  { href: "/books?free=1", label: "Free books" }, { href: "/bestsellers", label: "Bestsellers" },
  { href: "/categories", label: "Categories" }, { href: "/authors", label: "Authors" },
];
const readers: { href: string; label: string }[] = [
  { href: "/library", label: "My library" }, { href: "/orders", label: "Order history" },
  { href: "/wishlist", label: "Wishlist" }, { href: "/faq", label: "How it works" },
];
const company: { href: string; label: string }[] = [
  { href: "/about", label: "About Kitab" }, { href: "/contact", label: "Contact us" },
  { href: "/register?role=author", label: "Become an author" }, { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

function LinkGroup({ title, links, icon }: { title: string; links: { href: string; label: string }[]; icon: IconName }) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
        <Icon name={icon} className="h-3.5 w-3.5" />{title}
      </h3>
      <ul className="space-y-2.5 text-sm text-ivory/70">
        {links.map((l) => <li key={l.href}><Link href={l.href} className="transition hover:text-ivory">{l.label}</Link></li>)}
      </ul>
    </div>
  );
}

export default async function Footer() {
  const s = await publicSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-forest-700/60 bg-forest-950 text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo light className="h-11 w-auto" />
            <p className="mt-5 max-w-xs font-serif text-sm leading-7 text-ivory/70">
              A home for Ethiopian stories and ideas. Discover books, support the people who write them, and keep your library with you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-ivory/60">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 px-3 py-1.5"><Icon name="shield" className="h-3.5 w-3.5 text-gold" />Verified payments</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 px-3 py-1.5"><Icon name="book" className="h-3.5 w-3.5 text-gold" />Read anywhere</span>
            </div>
          </div>
          <div className="lg:col-span-2"><LinkGroup title="Explore" links={explore} icon="books" /></div>
          <div className="lg:col-span-2"><LinkGroup title="For readers" links={readers} icon="user" /></div>
          <div className="lg:col-span-2"><LinkGroup title="Kitab" links={company} icon="feather" /></div>
          <div className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold"><Icon name="mail" className="h-3.5 w-3.5" />Get in touch</h3>
            <div className="space-y-3 text-sm text-ivory/70">
              {s.contact_email ? <a href={`mailto:${String(s.contact_email)}`} className="flex items-start gap-2 break-all transition hover:text-ivory"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{String(s.contact_email)}</a> : null}
              {s.contact_phone ? <a href={`tel:${String(s.contact_phone)}`} className="flex items-center gap-2 transition hover:text-ivory"><Icon name="phone" className="h-4 w-4 shrink-0 text-gold" />{String(s.contact_phone)}</a> : null}
              {!s.contact_email && !s.contact_phone && <p><Link href="/contact" className="link-underline !text-ivory/80">Contact details</Link></p>}
              <p className="pt-2 font-serif text-xs leading-6 text-ivory/50">Payments are made through Telebirr and reviewed by our team before books are released.</p>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Kitab. Books by Ethiopian and international authors.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-ivory">Terms</Link>
            <Link href="/privacy" className="hover:text-ivory">Privacy</Link>
            <Link href="/contact" className="hover:text-ivory">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
