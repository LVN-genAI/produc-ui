"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import type { Product, SchemaField } from "@/lib/types";
import { gridFields } from "@/lib/catalog";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductDetailModal } from "@/components/catalog/product-detail-modal";

interface ProductGridProps {
  products: Product[];
  /** Attribute schema keyed by category id (products may span subcategories). */
  schemaByCategory: Record<string, SchemaField[]>;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export function ProductGrid({ products, schemaByCategory }: ProductGridProps) {
  const [selected, setSelected] = useState<Product | null>(null);

  const selectedSchema = selected
    ? schemaByCategory[selected.category_id] ?? []
    : [];

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            gridFields={gridFields(schemaByCategory[product.category_id] ?? [])}
            onSelect={setSelected}
          />
        ))}
      </motion.div>

      <ProductDetailModal
        product={selected}
        schema={selectedSchema}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
