import type { Category } from "./types";

/** A category enriched with its resolved children, for React Arborist. */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

/**
 * Turns a flat list of categories (id + parent_id) into a nested tree,
 * sorted by `position` then `name` at every level.
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>();
  for (const category of categories) {
    byId.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: CategoryTreeNode[]) => {
    nodes.sort(
      (a, b) => a.position - b.position || a.name.localeCompare(b.name),
    );
    for (const node of nodes) sort(node.children);
  };
  sort(roots);

  return roots;
}
