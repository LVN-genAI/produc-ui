"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";

export const archivedCategoriesKey = ["archived", "categories"] as const;
export const archivedProductsKey = ["archived", "products"] as const;

/** Archived categories (soft-deleted), newest first. */
export function useArchivedCategories() {
  return useQuery({
    queryKey: archivedCategoriesKey,
    queryFn: async (): Promise<Category[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Category[];
    },
  });
}

/** Archived products (soft-deleted), newest first. */
export function useArchivedProducts() {
  return useQuery({
    queryKey: archivedProductsKey,
    queryFn: async (): Promise<Product[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
  });
}
