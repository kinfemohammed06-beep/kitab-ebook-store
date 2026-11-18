import Link from "next/link";
import Logo from "@/components/Logo";
import { Icon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <Logo className="h-10 w-auto" />
      <span className="mt-10 font-display text-7xl text-forest-100">404</span>
      <h1 className="mt-2 font-display text-3xl">This page isn’t on the shelf</h1>
      <p className="prose-kitab mt-3 text-sm">
        The page you’re looking for may have moved, or the link might be out of date.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary"><Icon name="home" className="h-4 w-4" />Back home</Link>
        <Link href="/books" className="btn btn-outline"><Icon name="books" className="h-4 w-4" />Explore books</Link>
      </div>
    </div>
  );
}
