import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { childrenOf, catalogHref } from "@/lib/catalog";
import type { Category } from "@/lib/types";
import { SiteHeader } from "@/components/catalog/site-header";
import { SiteFooter } from "@/components/catalog/site-footer";
import {
  CategoryGrid,
  type CategorySummary,
} from "@/components/catalog/category-grid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSiteSettings();
  const supabase = await createClient();

  const { data: catRows } = await supabase
    .from("categories")
    .select("*")
    .is("archived_at", null)
    .order("position", { ascending: true });
  const categories = (catRows ?? []) as Category[];
  const topLevel = childrenOf(categories, null);

  let summaries: CategorySummary[] = [];
  if (settings.featured_enabled && topLevel.length > 0) {
    const ids = topLevel.map((c) => c.id);
    const counts = new Map<string, number>();
    const { data: countRows } = await supabase
      .from("products")
      .select("category_id")
      .is("archived_at", null)
      .in("category_id", ids);
    for (const row of (countRows ?? []) as { category_id: string }[]) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
    summaries = topLevel.map((c) => ({
      id: c.id,
      name: c.name,
      href: catalogHref([c.slug]),
      productCount: counts.get(c.id) ?? 0,
      childCount: categories.filter((x) => x.parent_id === c.id).length,
    }));
  }

  const ctaLabel = settings.primary_cta_label?.trim();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10">
        {/* Hero (admin-managed) */}
        <section className="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 shadow-sm sm:px-12 sm:py-24">
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            {settings.hero_eyebrow && (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5" /> {settings.hero_eyebrow}
              </span>
            )}
            <h1 className="mt-4 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
              {settings.hero_title}
            </h1>
            {settings.hero_subtitle && (
              <p className="mt-4 text-lg text-muted-foreground">
                {settings.hero_subtitle}
              </p>
            )}
            {ctaLabel && (
              <Link
                href={settings.primary_cta_href || "/catalog"}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                {ctaLabel}
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </section>

        {/* Featured categories */}
        {settings.featured_enabled && summaries.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Featured categories
            </h2>
            <CategoryGrid categories={summaries} />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
