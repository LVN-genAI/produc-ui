"use client";

import { useMemo, useState } from "react";
import { Tree, type NodeRendererProps } from "react-arborist";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buildCategoryTree, type CategoryTreeNode } from "@/lib/tree";
import { useCategories, categoriesQueryKey } from "@/hooks/use-categories";
import { useActiveCategory } from "@/hooks/use-active-category";
import { useResizeObserver } from "@/hooks/use-resize-observer";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  deleteCategory,
  renameCategory,
} from "@/app/admin/actions";

export function CategoryTree() {
  const { data: categories, isLoading, isError, error } = useCategories();
  const [activeId, setActiveId] = useActiveCategory();
  const queryClient = useQueryClient();
  const { ref, size } = useResizeObserver<HTMLDivElement>();
  const [busy, setBusy] = useState(false);

  const treeData = useMemo<CategoryTreeNode[]>(
    () => (categories ? buildCategoryTree(categories) : []),
    [categories],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: categoriesQueryKey });

  async function handleAddRoot() {
    const name = window.prompt("New root category name");
    if (!name?.trim()) return;
    setBusy(true);
    const res = await createCategory({ name, parentId: null });
    setBusy(false);
    if (res.error || !res.data) {
      toast.add({ title: "Couldn't create category", description: res.error, type: "error" });
      return;
    }
    await invalidate();
    setActiveId(res.data.id);
    toast.add({ title: `Created “${res.data.name}”`, type: "success" });
  }

  async function handleAddChild(parent: CategoryTreeNode) {
    const name = window.prompt(`New subcategory under “${parent.name}”`);
    if (!name?.trim()) return;
    setBusy(true);
    const res = await createCategory({ name, parentId: parent.id });
    setBusy(false);
    if (res.error || !res.data) {
      toast.add({ title: "Couldn't create category", description: res.error, type: "error" });
      return;
    }
    await invalidate();
    setActiveId(res.data.id);
    toast.add({ title: `Created “${res.data.name}”`, type: "success" });
  }

  async function handleDelete(node: CategoryTreeNode) {
    const hasChildren = node.children.length > 0;
    const confirmed = window.confirm(
      hasChildren
        ? `Delete “${node.name}” and ALL its subcategories and products? This cannot be undone.`
        : `Delete “${node.name}”? This cannot be undone.`,
    );
    if (!confirmed) return;
    setBusy(true);
    const res = await deleteCategory(node.id);
    setBusy(false);
    if (res.error) {
      toast.add({ title: "Couldn't delete", description: res.error, type: "error" });
      return;
    }
    await invalidate();
    if (activeId === node.id) setActiveId(null);
    toast.add({ title: `Deleted “${node.name}”`, type: "success" });
  }

  async function handleRename(id: string, name: string) {
    const res = await renameCategory(id, name);
    if (res.error) {
      toast.add({ title: "Couldn't rename", description: res.error, type: "error" });
      return;
    }
    await invalidate();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Categories</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleAddRoot}
          disabled={busy}
          className="h-7 gap-1.5 px-2 text-xs"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FolderPlus className="size-3.5" />
          )}
          Add root
        </Button>
      </div>

      <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : isError ? (
          <div className="p-4 text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to load categories."}
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">No categories yet.</p>
            <Button size="sm" variant="outline" onClick={handleAddRoot}>
              <FolderPlus className="mr-1.5 size-4" /> Create the first one
            </Button>
          </div>
        ) : (
          size.height > 0 && (
            <Tree<CategoryTreeNode>
              data={treeData}
              width={size.width}
              height={size.height}
              rowHeight={34}
              indent={16}
              openByDefault
              selection={activeId ?? undefined}
              onActivate={(node) => setActiveId(node.id)}
              onRename={({ id, name }) => handleRename(id, name)}
            >
              {(props) => (
                <CategoryNode
                  {...props}
                  onAddChild={handleAddChild}
                  onDelete={handleDelete}
                />
              )}
            </Tree>
          )
        )}
      </div>
    </div>
  );
}

interface CategoryNodeProps extends NodeRendererProps<CategoryTreeNode> {
  onAddChild: (node: CategoryTreeNode) => void;
  onDelete: (node: CategoryTreeNode) => void;
}

function CategoryNode({
  node,
  style,
  dragHandle,
  onAddChild,
  onDelete,
}: CategoryNodeProps) {
  const hasChildren = node.data.children.length > 0;

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        "group flex h-full items-center gap-1 rounded-md px-1 pr-2 text-sm",
        node.isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted",
      )}
    >
      <button
        type="button"
        aria-label={hasChildren ? (node.isOpen ? "Collapse" : "Expand") : undefined}
        onClick={(e) => {
          e.stopPropagation();
          node.toggle();
        }}
        className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
      >
        {hasChildren ? (
          node.isOpen ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )
        ) : (
          <span className="inline-block size-4" />
        )}
      </button>

      {node.isEditing ? (
        <input
          autoFocus
          defaultValue={node.data.name}
          className="min-w-0 flex-1 rounded border bg-background px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          onBlur={() => node.reset()}
          onKeyDown={(e) => {
            if (e.key === "Enter") node.submit(e.currentTarget.value);
            if (e.key === "Escape") node.reset();
          }}
        />
      ) : (
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left"
          onClick={() => node.activate()}
          onDoubleClick={() => node.edit()}
          title={node.data.name}
        >
          {node.data.name}
        </button>
      )}

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          aria-label="Add subcategory"
          title="Add subcategory"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(node.data);
          }}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Delete category"
          title="Delete category"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.data);
          }}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
