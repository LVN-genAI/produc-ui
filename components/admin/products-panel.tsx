"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Box, ImageOff, Loader2, Pencil, Plus } from "lucide-react";

import type { Category, Product } from "@/lib/types";
import { useProducts, productsQueryKey } from "@/hooks/use-products";
import { archiveProduct } from "@/app/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export function ProductsPanel({ category }: { category: Category }) {
  const { data: products, isLoading, isError, error } = useProducts(category.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  async function handleArchive(id: string, title: string) {
    if (
      !window.confirm(
        `Archive “${title}”? You can restore it later from the Archive tab.`,
      )
    )
      return;
    const res = await archiveProduct(id);
    if (res.error) {
      toast.add({
        title: "Couldn't archive",
        description: res.error,
        type: "error",
      });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: productsQueryKey(category.id),
    });
    toast.add({ title: `Archived “${title}”`, type: "success" });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">Products</h2>
          <p className="text-xs text-muted-foreground">
            {products?.length ?? 0} in {category.name}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" /> Add product
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading products…
          </div>
        ) : isError ? (
          <div className="p-4 text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to load products."}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <p>No products in this category yet.</p>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" /> Add the first product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const thumb = product.image_urls[0];
              return (
                <div
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-card"
                >
                  <div className="relative aspect-square bg-muted">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={product.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-6" />
                      </div>
                    )}
                    {product.model_3d_url && (
                      <span
                        className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow"
                        title="Has a 3D model"
                      >
                        <Box className="size-3" /> 3D
                      </span>
                    )}
                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Edit product"
                        onClick={() => openEdit(product)}
                        className="flex size-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Archive product"
                        onClick={() => handleArchive(product.id, product.title)}
                        className="flex size-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-destructive"
                      >
                        <Archive className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="flex flex-1 flex-col gap-0.5 p-2.5 text-left"
                  >
                    <p className="truncate text-sm font-medium" title={product.title}>
                      {product.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {priceFormatter.format(product.base_price)}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>
              Fields adapt to the “{category.name}” attribute schema.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            key={editing?.id ?? "new"}
            category={category}
            product={editing}
            onSaved={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
