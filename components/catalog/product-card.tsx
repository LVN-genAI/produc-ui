"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Box, ImageOff } from "lucide-react";

import type { Product, SchemaField } from "@/lib/types";

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface ProductCardProps {
  product: Product;
  gridFields: SchemaField[];
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, gridFields, onSelect }: ProductCardProps) {
  // Normalised pointer position (-0.5 … 0.5) → subtle 3D tilt.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), {
    stiffness: 200,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), {
    stiffness: 200,
    damping: 18,
  });

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  const thumb = product.image_urls[0];

  return (
    <motion.div variants={itemVariants} className="[perspective:1200px]">
      <motion.button
        type="button"
        onClick={() => onSelect(product)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={{ scale: 1.02 }}
        className="group flex w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow duration-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/40">
          {thumb ? (
            <Image
              src={thumb}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8" />
            </div>
          )}

          {/* legibility gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {product.model_3d_url && (
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur">
              <Box className="size-3" /> 3D
            </span>
          )}

          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-background/90 px-2.5 py-1 text-sm font-semibold shadow-sm backdrop-blur">
            {priceFormatter.format(product.base_price)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <h3 className="truncate font-medium leading-tight" title={product.title}>
            {product.title}
          </h3>

          {gridFields.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {gridFields.map((field) => {
                const value = product.attributes?.[field.key];
                if (value === undefined || value === null || value === "")
                  return null;
                const isColor =
                  field.type === "swatch" && HEX.test(String(value));
                return (
                  <span
                    key={field.key}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                    title={`${field.label}: ${value}`}
                  >
                    {isColor && (
                      <span
                        className="inline-block size-2.5 rounded-full border"
                        style={{ backgroundColor: String(value) }}
                      />
                    )}
                    {String(value)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </motion.button>
    </motion.div>
  );
}
