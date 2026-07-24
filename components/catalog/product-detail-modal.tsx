"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Box, ImageOff, Loader2 } from "lucide-react";

import type { Product, SchemaField } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Lazily loaded, client-only. The 3D library is fetched only when this
// component actually mounts — i.e. when a modal shows the 3D view.
const ModelViewer = dynamic(
  () => import("@/components/catalog/model-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading 3D viewer…
      </div>
    ),
  },
);

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

interface ProductDetailModalProps {
  product: Product | null;
  schema: SchemaField[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  schema,
  open,
  onOpenChange,
}: ProductDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {product && (
          // key remounts the body (and resets media state) per product.
          <DetailBody key={product.id} product={product} schema={schema} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({
  product,
  schema,
}: {
  product: Product;
  schema: SchemaField[];
}) {
  const hasModel = Boolean(product.model_3d_url);
  const images = product.image_urls;
  const [view, setView] = useState<"photos" | "3d">(
    hasModel ? "3d" : "photos",
  );
  const [activeImage, setActiveImage] = useState(0);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{product.title}</DialogTitle>
        <DialogDescription>
          {priceFormatter.format(product.base_price)}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Media */}
        <div className="space-y-2">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {view === "3d" && product.model_3d_url ? (
              <ModelViewer src={product.model_3d_url} alt={product.title} />
            ) : images[activeImage] ? (
              <Image
                src={images[activeImage]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-10" />
              </div>
            )}
          </div>

          {(hasModel || images.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {hasModel && (
                <button
                  type="button"
                  onClick={() => setView("3d")}
                  className={cn(
                    "flex size-14 items-center justify-center rounded-md border text-xs",
                    view === "3d"
                      ? "border-primary ring-2 ring-primary/40"
                      : "hover:bg-muted",
                  )}
                  title="View in 3D"
                >
                  <Box className="size-5" />
                </button>
              )}
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setView("photos");
                    setActiveImage(index);
                  }}
                  className={cn(
                    "relative size-14 overflow-hidden rounded-md border",
                    view === "photos" && activeImage === index
                      ? "border-primary ring-2 ring-primary/40"
                      : "hover:opacity-80",
                  )}
                >
                  <Image
                    src={url}
                    alt={`${product.title} ${index + 1}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attributes */}
        <div className="space-y-3">
          {schema.length > 0 ? (
            <dl className="divide-y rounded-lg border">
              {schema.map((field) => {
                const value = product.attributes?.[field.key];
                const isColor =
                  field.type === "swatch" && HEX.test(String(value ?? ""));
                return (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="flex items-center gap-1.5 font-medium">
                      {isColor && (
                        <span
                          className="inline-block size-3.5 rounded-full border"
                          style={{ backgroundColor: String(value) }}
                        />
                      )}
                      {value === undefined || value === null || value === ""
                        ? "—"
                        : String(value)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No additional attributes.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
