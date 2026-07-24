"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Box, ImageOff, Loader2, Plus, Trash2 } from "lucide-react";

import type { Category } from "@/lib/types";
import { useProducts, productsQueryKey } from "@/hooks/use-products";
import { deleteProduct } from "@/app/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export function ProductsPanel({ category }: { category: Category }) {
  const { data: products, isLoading, isError, error } = useProducts(category.id);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    const res = await deleteProduct(id);
    if (res.error) {
      toast.add({
        title: "Couldn't delete",
        description: res.error,
        type: "error",
      });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: productsQueryKey(category.id),
    });
    toast.add({ title: `Deleted “${title}”`, type: "success" });
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <Plus className="mr-1.5 size-4" /> Add product
              </Button>
            }
          />
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New product</DialogTitle>
              <DialogDescription>
                Fields adapt to the “{category.name}” attribute schema.
              </DialogDescription>
            </DialogHeader>
            <ProductForm category={category} onCreated={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
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
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
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
                    <button
                      type="button"
                      aria-label="Delete product"
                      onClick={() => handleDelete(product.id, product.title)}
                      className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                    <p className="truncate text-sm font-medium" title={product.title}>
                      {product.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {priceFormatter.format(product.base_price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
