"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Boxes, Layers, Package } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CategorySummary {
  id: string;
  name: string;
  href: string;
  productCount: number;
  childCount: number;
}

// Full literal class strings so Tailwind keeps them in the build.
const GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-emerald-500",
  "from-fuchsia-500 to-purple-500",
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

function summaryLabel({ productCount, childCount }: CategorySummary): string {
  const parts: string[] = [];
  if (childCount)
    parts.push(`${childCount} ${childCount === 1 ? "subcategory" : "subcategories"}`);
  if (productCount)
    parts.push(`${productCount} ${productCount === 1 ? "product" : "products"}`);
  return parts.join(" · ") || "Empty";
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

export function CategoryGrid({ categories }: { categories: CategorySummary[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {categories.map((cat) => {
        const gradient = gradientFor(cat.name);
        return (
          <motion.div key={cat.id} variants={item}>
            <Link
              href={cat.href}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* soft glow */}
              <div
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-30",
                  gradient,
                )}
              />
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    gradient,
                  )}
                >
                  <Boxes className="size-6" />
                </span>
                <ArrowUpRight className="size-5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
              <div className="relative">
                <h3 className="text-lg font-semibold tracking-tight">
                  {cat.name}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  {cat.childCount > 0 && <Layers className="size-3.5" />}
                  {cat.childCount === 0 && cat.productCount > 0 && (
                    <Package className="size-3.5" />
                  )}
                  {summaryLabel(cat)}
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
