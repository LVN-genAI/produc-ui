import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

/** Fallback used if the migration hasn't run or the row is missing. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: true,
  hero_eyebrow: "Explore the collection",
  hero_title: "Everything, beautifully organised.",
  hero_subtitle:
    "Browse by category to discover products — complete with rich specs and interactive 3D previews.",
  primary_cta_label: "Browse the catalog",
  primary_cta_href: "/catalog",
  featured_enabled: true,
  updated_at: new Date(0).toISOString(),
};

/** Reads the single site_settings row (server-side), falling back to defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  return (data as SiteSettings | null) ?? DEFAULT_SITE_SETTINGS;
}
