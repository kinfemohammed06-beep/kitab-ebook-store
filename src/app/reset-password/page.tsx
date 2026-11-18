import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui";
import { Icon } from "@/components/Icons";
export const metadata = { title: "Reset Password" };

export default async function Reset({ searchParams }: { searchParams: { error?: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/forgot-password");
  async function save(fd: FormData) {
    "use server";
    const pw = String(fd.get("password") ?? "");
    if (pw.length < 8) redirect("/reset-password?error=" + encodeURIComponent("Use at least 8 characters."));
    const { error } = await createClient().auth.updateUser({ password: pw });
    redirect(error ? "/reset-password?error=" + encodeURIComponent(error.message) : "/");
  }
  return (
    <AuthShell title="Choose a new password" subtitle="Use at least eight characters to keep your account safe.">
      <form action={save} className="space-y-4">
        {searchParams.error && <Alert kind="error" title="Couldn't save password">{searchParams.error}</Alert>}
        <label><span className="label">New password</span>
          <input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" className="field" /></label>
        <button className="btn btn-primary w-full"><Icon name="key" className="h-4 w-4" />Save password</button>
      </form>
    </AuthShell>
  );
}
