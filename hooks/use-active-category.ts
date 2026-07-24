"use client";

import { useQueryState } from "nuqs";

/**
 * The currently selected category id, mirrored to the URL (`?category=<id>`),
 * so the tree selection and the workspace stay in sync and are shareable.
 */
export function useActiveCategory() {
  return useQueryState("category");
}
