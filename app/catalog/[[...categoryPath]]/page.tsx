import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, PackageOpen, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  resolveCategoryPath,
  childrenOf,
  catalogHref,
  descendantIds,
} from "@/lib/catalog";
import type { Category, Product, SchemaField } from "@/lib/types";
import { SiteHeader } from "@/components/catalog/site-header";
import { SiteFooter } from "@/components/catalog/site-footer";
import {
  CategoryGrid,
  type CategorySummary,
} from "@/components/catalog/category-grid";
import { ProductGrid } from "@/components/catalog/product-grid";

export const metadata = {
  title: "Catalog",
};

interface CatalogPageProps {
  params: Promise<{ categoryPath?: string[] }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { categoryPath = [] } = await params;
  const supabase = await createClient();

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("*")
    .is("archived_at", null)
    .order("position", { ascending: true });
  const categories = (categoryRows ?? []) as Category[];

  const resolved = resolveCategoryPath(categories, categoryPath);
  if (!resolved) notFound();

  const { current, trail } = resolved;
  const trailSlugs = trail.map((c) => c.slug);
  const subcategories = childrenOf(categories, current?.id ?? null);

  // Direct product counts for the visible subcategories (single query).
  const subIds = subcategories.map((s) => s.id);
  const productCounts = new Map<string, number>();
  if (subIds.length > 0) {
    const { data: countRows } = await supabase
      .from("products")
      .select("category_id")
      .is("archived_at", null)
      .in("category_id", subIds);
    for (const row of (countRows ?? []) as { category_id: string }[]) {
      productCounts.set(
        row.category_id,
        (productCounts.get(row.category_id) ?? 0) + 1,
      );
    }
  }

  const categorySummaries: CategorySummary[] = subcategories.map((sub) => ({
    id: sub.id,
    name: sub.name,
    href: catalogHref([...trailSlugs, sub.slug]),
    productCount: productCounts.get(sub.id) ?? 0,
    childCount: categories.filter((c) => c.parent_id === sub.id).length,
  }));

  // Products across the current category AND its descendants (server-rendered,
  // zero-JS first paint). Each product keeps its own category's schema.
  let products: Product[] = [];
  let schemaByCategory: Record<string, SchemaField[]> = {};
  if (current) {
    const ids = descendantIds(categories, current.id);
    const { data: productRows } = await supabase
      .from("products")
      .select("*")
      .in("category_id", ids)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    products = (productRows ?? []) as Product[];
    schemaByCategory = Object.fromEntries(
      categories.map((c) => [c.id, c.attributes_schema]),
    );
  }

  const isRoot = !current;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link
            href="/catalog"
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
          >
            <Home className="size-3.5" /> Catalog
          </Link>
          {trail.map((node, index) => {
            const href = catalogHref(trailSlugs.slice(0, index + 1));
            const isLast = index === trail.length - 1;
            return (
              <span key={node.id} className="flex items-center gap-1">
                <ChevronRight className="size-3.5 opacity-60" />
                {isLast ? (
                  <span className="font-medium text-foreground">
                    {node.name}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
                  >
                    {node.name}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Hero */}
        {isRoot ? (
          <section className="relative mb-10 overflow-hidden rounded-3xl border bg-card px-6 py-12 shadow-sm sm:px-10 sm:py-16">
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 size-64 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 blur-3xl" />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="size-3.5" /> Explore the collection
              </span>
              <h1 className="mt-4 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                Everything, beautifully organised.
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Browse by category to discover products — complete with rich
                specs and interactive 3D previews.
              </p>
            </div>
          </section>
        ) : (
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {current.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length > 0
                ? `${products.length} ${products.length === 1 ? "product" : "products"}`
                : "No products yet"}
              {subcategories.length > 0 &&
                ` · ${subcategories.length} ${subcategories.length === 1 ? "subcategory" : "subcategories"}`}
            </p>
          </header>
        )}

        {/* Subcategories */}
        {categorySummaries.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isRoot ? "Browse categories" : "Subcategories"}
            </h2>
            <CategoryGrid categories={categorySummaries} />
          </section>
        )}

        {/* Products */}
        {current && (
          <section>
            {subcategories.length > 0 && (
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Products
              </h2>
            )}
            {products.length > 0 ? (
              <ProductGrid
                products={products}
                schemaByCategory={schemaByCategory}
              />
            ) : (
              <EmptyState message="No products in this category yet." />
            )}
          </section>
        )}

        {/* Empty root */}
        {isRoot && categorySummaries.length === 0 && (
          <EmptyState
            message="No categories yet."
            action={
              <Link href="/admin" className="font-medium text-foreground underline underline-offset-4">
                Create some in the Admin
              </Link>
            }
          />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <PackageOpen className="size-6" />
      </div>
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}
