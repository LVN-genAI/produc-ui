"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  Loader2,
  Package,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  useArchivedCategories,
  useArchivedProducts,
  archivedCategoriesKey,
  archivedProductsKey,
} from "@/hooks/use-archive";
import { categoriesQueryKey } from "@/hooks/use-categories";
import { restoreCategory, deleteCategory } from "@/app/admin/actions";
import { restoreProduct, deleteProduct } from "@/app/admin/product-actions";
import { resetDatabase } from "@/app/admin/danger-actions";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export function ArchivePanel() {
  const categories = useArchivedCategories();
  const products = useArchivedProducts();
  const queryClient = useQueryClient();
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [resetting, setResetting] = useState(false);

  function invalidateAll() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: archivedCategoriesKey }),
      queryClient.invalidateQueries({ queryKey: archivedProductsKey }),
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);
  }

  async function onRestoreCategory(id: string, name: string) {
    const res = await restoreCategory(id);
    if (res.error) {
      toast.add({ title: "Couldn't restore", description: res.error, type: "error" });
      return;
    }
    await invalidateAll();
    toast.add({ title: `Restored “${name}”`, type: "success" });
  }

  async function onDeleteCategory(id: string, name: string) {
    if (
      !window.confirm(
        `Permanently delete “${name}” and everything under it? This cannot be undone.`,
      )
    )
      return;
    const res = await deleteCategory(id);
    if (res.error) {
      toast.add({ title: "Couldn't delete", description: res.error, type: "error" });
      return;
    }
    await invalidateAll();
    toast.add({ title: `Deleted “${name}” permanently`, type: "success" });
  }

  async function onRestoreProduct(id: string, title: string) {
    const res = await restoreProduct(id);
    if (res.error) {
      toast.add({ title: "Couldn't restore", description: res.error, type: "error" });
      return;
    }
    await invalidateAll();
    toast.add({ title: `Restored “${title}”`, type: "success" });
  }

  async function onDeleteProduct(id: string, title: string) {
    if (!window.confirm(`Permanently delete “${title}”? This cannot be undone.`))
      return;
    const res = await deleteProduct(id);
    if (res.error) {
      toast.add({ title: "Couldn't delete", description: res.error, type: "error" });
      return;
    }
    await invalidateAll();
    toast.add({ title: `Deleted “${title}” permanently`, type: "success" });
  }

  async function onReset() {
    if (
      !window.confirm(
        "This permanently deletes ALL categories and products (active and archived). Continue?",
      )
    )
      return;
    setResetting(true);
    const res = await resetDatabase(confirmPhrase);
    setResetting(false);
    if (res.error) {
      toast.add({ title: "Reset failed", description: res.error, type: "error" });
      return;
    }
    setConfirmPhrase("");
    await invalidateAll();
    toast.add({ title: "Database reset", type: "success" });
  }

  const archivedCategories = categories.data ?? [];
  const archivedProducts = products.data ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Archived items are hidden from the catalog and admin lists. Restore
          them anytime, or delete permanently.
        </p>
      </div>

      {/* Archived categories */}
      <section className="rounded-xl border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Boxes className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Categories</h2>
          <span className="text-xs text-muted-foreground">
            {archivedCategories.length}
          </span>
        </div>
        {categories.isLoading ? (
          <Loading />
        ) : archivedCategories.length === 0 ? (
          <Empty label="No archived categories." />
        ) : (
          <ul className="divide-y">
            {archivedCategories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Archived {formatDate(c.archived_at)}
                  </p>
                </div>
                <RowActions
                  onRestore={() => onRestoreCategory(c.id, c.name)}
                  onDelete={() => onDeleteCategory(c.id, c.name)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Archived products */}
      <section className="rounded-xl border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Package className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Products</h2>
          <span className="text-xs text-muted-foreground">
            {archivedProducts.length}
          </span>
        </div>
        {products.isLoading ? (
          <Loading />
        ) : archivedProducts.length === 0 ? (
          <Empty label="No archived products." />
        ) : (
          <ul className="divide-y">
            {archivedProducts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Archived {formatDate(p.archived_at)}
                  </p>
                </div>
                <RowActions
                  onRestore={() => onRestoreProduct(p.id, p.title)}
                  onDelete={() => onDeleteProduct(p.id, p.title)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/40 bg-destructive/5">
        <div className="flex items-center gap-2 border-b border-destructive/30 px-4 py-3">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Permanently delete <strong>all</strong> categories and products
            (active and archived). Storage files are not removed. This cannot be
            undone. Type <strong>RESET</strong> to enable the button.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="Type RESET"
              className="sm:max-w-[200px]"
            />
            <Button
              variant="destructive"
              onClick={onReset}
              disabled={confirmPhrase !== "RESET" || resetting}
            >
              {resetting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Reset database
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function RowActions({
  onRestore,
  onDelete,
}: {
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button size="sm" variant="outline" onClick={onRestore}>
        <RotateCcw className="mr-1.5 size-3.5" /> Restore
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-muted-foreground">{label}</p>
  );
}
