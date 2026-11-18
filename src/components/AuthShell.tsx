import type { ReactNode } from "react";
import Logo from "./Logo";
import { Icon } from "./Icons";

const points = [
  { icon: "book", text: "Thousands of stories, one library" },
  { icon: "wallet", text: "Simple Telebirr payments in Birr" },
  { icon: "feather", text: "A home for Ethiopian writers" },
] as const;

export default function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-line bg-surface shadow-card md:grid-cols-2">
        <div className="relative hidden flex-col overflow-hidden bg-forest-gradient p-10 text-ivory md:flex">
          <div className="paper-pattern pointer-events-none absolute inset-0 opacity-15" />
          <div className="relative"><Logo light className="h-11 w-auto" /></div>
          <div className="relative mt-auto">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold"><span className="h-px w-6 bg-gold" />Welcome to Kitab</span>
            <h2 className="mt-4 font-display text-3xl leading-tight">Every story starts somewhere.</h2>
            <p className="mt-3 max-w-sm font-serif text-sm leading-7 text-ivory/75">Join a growing community of Ethiopian readers and the writers they love.</p>
            <ul className="mt-8 space-y-3">
              {points.map((p) => <li key={p.text} className="flex items-center gap-3 text-sm text-ivory/85">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ivory/10 text-gold"><Icon name={p.icon} className="h-4 w-4" /></span>{p.text}
              </li>)}
            </ul>
          </div>
          <p className="relative mt-10 text-xs text-ivory/50">© {new Date().getFullYear()} Kitab · Ethiopian ebooks</p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-6 md:hidden"><Logo className="h-9 w-auto" /></div>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="prose-kitab mt-2 text-sm">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-7 border-t border-line pt-5 text-sm text-ink-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
