import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui";
import { Icon } from "@/components/Icons";
export const metadata = { title: "Register" };

export default function Register({ searchParams }: { searchParams: { error?: string; role?: string } }) {
  async function register(fd: FormData) {
    "use server";
    const role = ["reader", "author", "publisher"].includes(String(fd.get("role"))) ? String(fd.get("role")) : "reader";
    const { error } = await createClient().auth.signUp({ email: String(fd.get("email")), password: String(fd.get("password")),
      options: { data: { full_name: String(fd.get("name")), role }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback` } });
    if (error) redirect("/register?error=" + encodeURIComponent(error.message));
    redirect("/login?registered=1");
  }
  return (
    <AuthShell title="Create your account" subtitle="Join readers and writers on Kitab. It only takes a minute."
      footer={<>Already have an account? <Link href="/login" className="link-underline">Log in</Link></>}>
      <form action={register} className="space-y-4">
        {searchParams.error && <Alert kind="error" title="Couldn't create account">{searchParams.error}</Alert>}
        <label><span className="label">Full name</span><input name="name" required autoComplete="name" placeholder="Your name" className="field" /></label>
        <label><span className="label">Email address</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" /></label>
        <label><span className="label">Password</span><input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="field" /></label>
        <label><span className="label">I want to</span>
          <select name="role" defaultValue={searchParams.role === "author" ? "author" : "reader"} className="field">
            <option value="reader">Read and buy books</option><option value="author">Publish my writing</option><option value="publisher">Publish as a publisher</option>
          </select>
        </label>
        <p className="rounded-xl bg-forest-50/70 px-3.5 py-2.5 text-xs leading-5 text-forest-800">Author accounts need admin approval before books can be published.</p>
        <button className="btn btn-primary w-full"><Icon name="sparkles" className="h-4 w-4" />Create account</button>
      </form>
    </AuthShell>
  );
}
