import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data } = await createClient().from("books").select("slug,published_at").eq("status", "approved");
  return [{ url: base }, { url: `${base}/books` }, { url: `${base}/bestsellers` }, { url: `${base}/categories` }, { url: `${base}/authors` }, { url: `${base}/about` }, { url: `${base}/faq` }, { url: `${base}/terms` }, { url: `${base}/privacy` }, { url: `${base}/contact` },
    ...(data ?? []).map((b) => ({ url: `${base}/books/${b.slug}`, lastModified: b.published_at ?? undefined }))];
}
