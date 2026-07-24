"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Category, SchemaField } from "@/lib/types";

/** Standard result envelope for every admin action. */
type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ensures a signed-in user before any write (RLS also enforces this). */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Creates a category as a root (parentId null) or child. Generates a slug from
 * the name and retries with a random suffix on a sibling-slug collision.
 */
export async function createCategory(input: {
  name: string;
  parentId: string | null;
}): Promise<ActionResult<Category>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const name = input.name.trim();
  if (!name) return { error: "Category name is required." };

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        parent_id: input.parentId,
        attributes_schema: [],
        position: 0,
      })
      .select("*")
      .single();

    if (!error && data) {
      revalidatePath("/admin");
      return { data: data as Category };
    }
    // 23505 = unique_violation (sibling slug clash) → retry with a suffix.
    if (error?.code === "23505") {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      continue;
    }
    return { error: error?.message ?? "Failed to create category." };
  }

  return { error: "Could not generate a unique slug. Try a different name." };
}

/** Renames a category (used by inline tree editing). */
export async function renameCategory(
  categoryId: string,
  name: string,
): Promise<ActionResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name cannot be empty." };

  const { error } = await supabase
    .from("categories")
    .update({ name: trimmed })
    .eq("id", categoryId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { data: true };
}

/**
 * Deletes a category. ON DELETE CASCADE removes descendant categories and their
 * products, so warn the user in the UI before calling this.
 */
export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { data: true };
}

/** Persists the JSONB attribute blueprint for a category. */
export async function updateCategorySchema(
  categoryId: string,
  schema: SchemaField[],
): Promise<ActionResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("categories")
    .update({ attributes_schema: schema })
    .eq("id", categoryId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { data: true };
}
