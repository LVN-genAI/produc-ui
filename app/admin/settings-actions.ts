"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export interface SiteSettingsInput {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  primary_cta_label: string;
  primary_cta_href: string;
  featured_enabled: boolean;
}

/** Updates the single site_settings row (home page content). */
export async function updateSiteSettings(
  input: SiteSettingsInput,
): Promise<ActionResult<SiteSettings>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (!input.hero_title.trim()) return { error: "Hero title is required." };

  const { data, error } = await supabase
    .from("site_settings")
    .update({
      hero_eyebrow: input.hero_eyebrow,
      hero_title: input.hero_title,
      hero_subtitle: input.hero_subtitle,
      primary_cta_label: input.primary_cta_label,
      primary_cta_href: input.primary_cta_href,
      featured_enabled: input.featured_enabled,
    })
    .eq("id", true)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to save settings." };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { data: data as SiteSettings };
}
