import { createClient } from "@/lib/supabase/server";
export const SETTINGS: [string, string, "text" | "number" | "area"][] = [
  ["site_name", "Website name", "text"], ["telebirr_number", "Telebirr number customers pay to", "text"], ["telebirr_account_name", "Telebirr account name", "text"],
  ["commission_pct", "Default platform commission (%)", "number"], ["min_withdrawal_etb", "Minimum withdrawal (ETB)", "number"],
  ["contact_email", "Contact email", "text"], ["contact_phone", "Contact phone", "text"],
  ["announcement", "Site announcement banner (empty = none)", "area"], ["terms", "Terms and Conditions", "area"], ["privacy", "Privacy Policy", "area"]];
export async function publicSettings(): Promise<Record<string, any>> {
  const { data } = await createClient().from("platform_settings").select("key,value").in("key", ["site_name", "contact_email", "contact_phone", "announcement", "terms", "privacy"]);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}
