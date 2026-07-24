import { createClient } from "@/lib/supabase/client";

export const CATALOG_BUCKET = "catalog-assets";

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "bin";
}

/**
 * Uploads a single file DIRECTLY from the browser to the catalog-assets bucket
 * (RLS allows authenticated inserts) and returns its public URL.
 *
 * @param file   The file from a dropzone.
 * @param folder Logical subfolder, e.g. "images" or "models".
 */
export async function uploadToCatalog(
  file: File,
  folder: "images" | "models",
): Promise<string> {
  const supabase = createClient();
  const ext = fileExtension(file.name);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CATALOG_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort removal of an uploaded asset by its public URL. */
export async function removeFromCatalog(publicUrl: string): Promise<void> {
  const supabase = createClient();
  const marker = `/${CATALOG_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(CATALOG_BUCKET).remove([path]);
}
