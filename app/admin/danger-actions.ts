"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

const CONFIRM_PHRASE = "RESET";

/**
 * DANGER: permanently deletes ALL products and ALL categories (active AND
 * archived). Requires the caller to pass the exact confirmation phrase.
 * Storage assets in the bucket are NOT removed by this action.
 */
export async function resetDatabase(
  confirmation: string,
): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  if (confirmation !== CONFIRM_PHRASE) {
    return { error: `Type ${CONFIRM_PHRASE} to confirm.` };
  }

  // Delete products first, then categories (categories also cascade, but this
  // is explicit and clear). Guard clause `neq` matches every row.
  const { error: pErr } = await supabase
    .from("products")
    .delete()
    .not("id", "is", null);
  if (pErr) return { error: pErr.message };

  const { error: cErr } = await supabase
    .from("categories")
    .delete()
    .not("id", "is", null);
  if (cErr) return { error: cErr.message };

  revalidatePath("/admin");
  revalidatePath("/catalog", "layout");
  revalidatePath("/");
  return { data: true };
}
