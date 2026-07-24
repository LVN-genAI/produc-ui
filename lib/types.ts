/**
 * TypeScript interfaces mirroring SUPABASE_SCHEMA.sql.
 * These are the single source of truth for row shapes across the app.
 */

/** Field types the schema editor can produce. */
export type SchemaFieldType = "text" | "number" | "select" | "swatch";

/**
 * One entry in a category's `attributes_schema` JSONB array — the blueprint
 * the admin edits and the product form / catalog render dynamically from.
 */
export interface SchemaField {
  /** Machine key used as the property name inside `products.attributes`. */
  key: string;
  /** Human-readable label shown in forms and on cards. */
  label: string;
  /** Controls which input is rendered and how the value is stored. */
  type: SchemaFieldType;
  /** Choices for `select` / `swatch` types. Ignored otherwise. */
  options?: string[];
  /** Whether the product form must provide a value. */
  required: boolean;
  /** Surface this attribute directly on catalog grid cards. */
  show_in_grid?: boolean;
}

/** A node in the N-level category tree. */
export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  attributes_schema: SchemaField[];
  position: number;
  created_at: string;
  updated_at: string;
}

/** Values keyed by the schema's field keys. */
export type ProductAttributes = Record<string, string | number | null>;

/** A catalog product belonging to exactly one category. */
export interface Product {
  id: string;
  category_id: string;
  title: string;
  base_price: number;
  attributes: ProductAttributes;
  image_urls: string[];
  model_3d_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Payloads for inserts (id / timestamps are DB-generated). */
export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at">;
export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
