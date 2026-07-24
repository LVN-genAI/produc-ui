import type { Category, SchemaField } from "./types";

export interface ResolvedPath {
  /** The deepest category the URL path resolves to (null at /catalog root). */
  current: Category | null;
  /** Breadcrumb trail from the root down to `current`. */
  trail: Category[];
}

/**
 * Walks a slug path (e.g. ["laptops","gaming"]) down the category tree.
 * Returns null if any segment doesn't resolve → the page should 404.
 */
export function resolveCategoryPath(
  categories: Category[],
  slugs: string[],
): ResolvedPath | null {
  const trail: Category[] = [];
  let parentId: string | null = null;

  for (const slug of slugs) {
    const match = categories.find(
      (c) => c.parent_id === parentId && c.slug === slug,
    );
    if (!match) return null;
    trail.push(match);
    parentId = match.id;
  }

  return { current: trail[trail.length - 1] ?? null, trail };
}

/** Direct children of a category (or top-level categories when parentId null). */
export function childrenOf(
  categories: Category[],
  parentId: string | null,
): Category[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

/** Schema fields flagged to appear on catalog grid cards. */
export function gridFields(schema: SchemaField[]): SchemaField[] {
  return schema.filter((f) => f.show_in_grid);
}

/**
 * All category ids in the subtree rooted at `rootId` (inclusive).
 * Used so a parent category page shows products from every descendant, not
 * only its direct children.
 */
export function descendantIds(
  categories: Category[],
  rootId: string,
): string[] {
  const childrenByParent = new Map<string | null, Category[]>();
  for (const c of categories) {
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }

  const ids: string[] = [];
  const stack: string[] = [rootId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    ids.push(id);
    for (const child of childrenByParent.get(id) ?? []) {
      stack.push(child.id);
    }
  }
  return ids;
}

/** Builds the URL for a category given its breadcrumb trail of slugs. */
export function catalogHref(slugs: string[]): string {
  return slugs.length ? `/catalog/${slugs.join("/")}` : "/catalog";
}
