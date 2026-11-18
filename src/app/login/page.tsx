import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui";
import { Icon } from "@/components/Icons";
export const metadata = { title: "Login" };

export default function Login({ searchParams }: { searchParams: { error?: string; registered?: string } }) {
  async function login(fd: FormData) {
    "use server";
    const { error } = await createClient().auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
    if (error) redirect("/login?error=" + encodeURIComponent(error.message));
    redirect("/");
  }
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue to your library."
      footer={<>New to Kitab? <Link href="/register" className="link-underline">Create an account</Link></>}>
      <form action={login} className="space-y-4">
        {searchParams.registered && <Alert kind="success" title="Account created">Check your email to confirm, then log in.</Alert>}
        {searchParams.error && <Alert kind="error" title="Couldn't log in">{searchParams.error}</Alert>}
        <label><span className="label">Email address</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" /></label>
        <label><span className="label">Password</span>
          <input name="password" type="password" required autoComplete="current-password" placeholder="Your password" className="field" /></label>
        <div className="flex justify-end"><Link href="/forgot-password" className="link-underline text-xs">Forgot password?</Link></div>
        <button className="btn btn-primary w-full"><Icon name="lock" className="h-4 w-4" />Log in</button>
      </form>
    </AuthShell>
  );
}
