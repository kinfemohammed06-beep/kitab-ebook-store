import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui";
import { Icon } from "@/components/Icons";
export const metadata = { title: "Forgot Password" };

export default function Forgot({ searchParams }: { searchParams: { sent?: string } }) {
  async function send(fd: FormData) {
    "use server";
    await createClient().auth.resetPasswordForEmail(String(fd.get("email")), { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password` });
    redirect("/forgot-password?sent=1");   // same answer whether or not the account exists
  }
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to set a new one."
      footer={<Link href="/login" className="link-underline">← Back to login</Link>}>
      <form action={send} className="space-y-4">
        {searchParams.sent && <Alert kind="success" title="Check your inbox">If an account exists for that email, a reset link is on its way.</Alert>}
        <label><span className="label">Email address</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" /></label>
        <button className="btn btn-primary w-full"><Icon name="mail" className="h-4 w-4" />Send reset link</button>
      </form>
    </AuthShell>
  );
}
