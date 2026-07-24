"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductAttributes } from "@/lib/types";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export interface CreateProductInput {
  categoryId: string;
  title: string;
  basePrice: number;
  attributes: ProductAttributes;
  imageUrls: string[];
  model3dUrl: string | null;
}

/** Inserts a product with its schema-driven `attributes` payload + media URLs. */
export async function createProduct(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const title = input.title.trim();
  if (!title) return { error: "Title is required." };
  if (!Number.isFinite(input.basePrice) || input.basePrice < 0) {
    return { error: "Base price must be a non-negative number." };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id: input.categoryId,
      title,
      base_price: input.basePrice,
      attributes: input.attributes,
      image_urls: input.imageUrls,
      model_3d_url: input.model3dUrl,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create product." };
  }

  revalidatePath("/admin");
  revalidatePath("/catalog", "layout");
  return { data: data as Product };
}

/** Updates an existing product (title, price, attributes, media). */
export async function updateProduct(
  productId: string,
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const title = input.title.trim();
  if (!title) return { error: "Title is required." };
  if (!Number.isFinite(input.basePrice) || input.basePrice < 0) {
    return { error: "Base price must be a non-negative number." };
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      title,
      base_price: input.basePrice,
      attributes: input.attributes,
      image_urls: input.imageUrls,
      model_3d_url: input.model3dUrl,
    })
    .eq("id", productId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to update product." };
  }

  revalidatePath("/admin");
  revalidatePath("/catalog", "layout");
  return { data: data as Product };
}

/** Archives (soft-deletes) a product. */
export async function archiveProduct(
  productId: string,
): Promise<ActionResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("products")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/catalog", "layout");
  return { data: true };
}

/** Restores an archived product back to active. */
export async function restoreProduct(
  productId: string,
): Promise<ActionResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("products")
    .update({ archived_at: null })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/catalog", "layout");
  return { data: true };
}

/** PERMANENTLY deletes a product. Used from the Archive view. */
export async function deleteProduct(
  productId: string,
): Promise<ActionResult<true>> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/catalog", "layout");
  return { data: true };
}
