"use client";

import { FolderTree } from "lucide-react";

import { useCategories } from "@/hooks/use-categories";
import { useActiveCategory } from "@/hooks/use-active-category";
import { CategoryTree } from "@/components/admin/category-tree";
import { SchemaEditor } from "@/components/admin/schema-editor";
import { ProductsPanel } from "@/components/admin/products-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminWorkspace() {
  const { data: categories } = useCategories();
  const [activeId] = useActiveCategory();

  const activeCategory = categories?.find((c) => c.id === activeId) ?? null;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[30%_70%]">
      {/* Left: category tree */}
      <aside className="min-h-0 border-b md:border-b-0 md:border-r">
        <CategoryTree />
      </aside>

      {/* Right: schema editor + products, tabbed */}
      <section className="min-h-0 overflow-hidden">
        {activeCategory ? (
          <Tabs
            key={activeCategory.id}
            defaultValue="schema"
            className="flex h-full flex-col gap-0"
          >
            <TabsList className="m-3 self-start">
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
            <TabsContent
              value="schema"
              className="min-h-0 flex-1 overflow-hidden border-t"
            >
              <SchemaEditor category={activeCategory} />
            </TabsContent>
            <TabsContent
              value="products"
              className="min-h-0 flex-1 overflow-hidden border-t"
            >
              <ProductsPanel category={activeCategory} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
            <FolderTree className="size-10" />
            <div>
              <p className="font-medium text-foreground">No category selected</p>
              <p className="text-sm">
                Pick a category on the left to edit its attribute schema and add
                products, or create one to get started.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
