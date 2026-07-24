"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

/** Query key factory so mutations can invalidate a category's product list. */
export const productsQueryKey = (categoryId: string | null) =>
  ["products", categoryId] as const;

/** Fetches products for a single category, client-side. */
export function useProducts(categoryId: string | null) {
  return useQuery({
    queryKey: productsQueryKey(categoryId),
    enabled: Boolean(categoryId),
    queryFn: async (): Promise<Product[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId as string)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
  });
}
