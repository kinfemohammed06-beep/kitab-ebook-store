import Link from "next/link";
import { Icon } from "@/components/Icons";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "FAQ" };

const QA: [string, string][] = [
  ["How do I pay with Telebirr?", "At checkout you will see our Telebirr number and the exact amount. Send the payment in Telebirr, then upload a screenshot of the receipt and enter the transaction ID."],
  ["When do I get my book?", "An administrator checks each receipt against our Telebirr records by hand. Once approved, the book appears in My Library and you get a notification. If the receipt is rejected or more information is needed, we tell you why and you can submit again."],
  ["Can I read and download my books?", "Yes. Purchased books can be read online and downloaded as EPUB or PDF, depending on what the author uploaded. Downloads use short-lived private links tied to your account."],
  ["Can I buy a book as a gift?", "Yes. Tick “This is a gift” in your cart and enter the recipient's email. The book goes to their library when they have a confirmed account."],
  ["How do I publish a book?", "Register as an author, wait for approval, then upload your book from the Author Dashboard. New books are reviewed before they go on sale."],
  ["How do authors get paid?", "Each sale credits the author's balance after the platform commission. Authors request a withdrawal and an administrator pays it manually."],
];

export default function FAQ() {
  return (
    <div className="page">
      <PageHeader eyebrow="Good to know" title="Frequently asked questions"
        description="Everything you need to know about buying, reading and publishing on Kitab." />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-pad bg-forest-gradient !text-ivory">
            <Icon name="info" className="h-6 w-6 text-gold" />
            <h2 className="mt-3 font-display text-xl">Still have a question?</h2>
            <p className="mt-2 font-serif text-sm leading-7 text-ivory/80">If an answer isn’t here, our team can help you directly.</p>
            <Link href="/contact" className="btn btn-gold btn-sm mt-5"><Icon name="mail" className="h-4 w-4" />Contact us</Link>
          </div>
        </aside>
        <div className="space-y-3">
          {QA.map(([q, a], i) => (
            <details key={q} className="group card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-left font-display text-base font-semibold transition hover:bg-forest-50/50 sm:text-lg [&::-webkit-details-marker]:hidden">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-xs font-bold text-forest">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{q}</span>
                <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="prose-kitab border-t border-line px-5 py-4 pl-16 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
