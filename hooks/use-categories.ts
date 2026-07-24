"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";

/** Shared query key so mutations can invalidate the category cache. */
export const categoriesQueryKey = ["categories"] as const;

/** Fetches all categories (flat) for the admin tree, client-side. */
export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: async (): Promise<Category[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("archived_at", null)
        .order("position", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Category[];
    },
  });
}
