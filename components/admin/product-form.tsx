"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, PackagePlus } from "lucide-react";

import type { Category, ProductAttributes } from "@/lib/types";
import { createProduct } from "@/app/admin/product-actions";
import { productsQueryKey } from "@/hooks/use-products";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DynamicField } from "@/components/admin/dynamic-field";
import { ImageDropzone } from "@/components/admin/uploads/image-dropzone";
import { ModelDropzone } from "@/components/admin/uploads/model-dropzone";

/** Form shape. `attributes` keys are dynamic (from the category schema). */
export interface ProductFormValues {
  title: string;
  base_price: string;
  attributes: Record<string, string | number>;
}

export function ProductForm({
  category,
  onCreated,
}: {
  category: Category;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: { title: "", base_price: "", attributes: {} },
  });

  async function onSubmit(values: ProductFormValues) {
    setSubmitting(true);

    // Bundle schema-driven values into the `attributes` JSON payload,
    // coercing each value to the type its schema field declares.
    const attributes: ProductAttributes = {};
    for (const field of category.attributes_schema) {
      const raw = values.attributes?.[field.key];
      if (raw === undefined || raw === null || raw === "") {
        attributes[field.key] = null;
        continue;
      }
      attributes[field.key] =
        field.type === "number" ? Number(raw) : String(raw);
    }

    const res = await createProduct({
      categoryId: category.id,
      title: values.title,
      basePrice: Number(values.base_price),
      attributes,
      imageUrls,
      model3dUrl: modelUrl,
    });

    setSubmitting(false);
    if (res.error || !res.data) {
      toast.add({
        title: "Couldn't create product",
        description: res.error,
        type: "error",
      });
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: productsQueryKey(category.id),
    });
    toast.add({ title: `Added “${res.data.title}”`, type: "success" });
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Standard fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Aurora 15 Pro"
            aria-invalid={!!errors.title}
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Base price <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            aria-invalid={!!errors.base_price}
            {...register("base_price", {
              required: "Base price is required",
              validate: (v) =>
                (v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0) ||
                "Enter a valid non-negative price",
            })}
          />
          {errors.base_price && (
            <p className="text-xs text-destructive">
              {errors.base_price.message}
            </p>
          )}
        </div>
      </div>

      {/* Dynamic, schema-driven fields */}
      {category.attributes_schema.length > 0 && (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Attributes · {category.name}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.attributes_schema.map((field) => (
              <DynamicField key={field.key} field={field} control={control} />
            ))}
          </div>
        </div>
      )}

      {/* Media — direct client-side uploads to catalog-assets */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Images</label>
          <ImageDropzone value={imageUrls} onChange={setImageUrls} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">3D model</label>
          <ModelDropzone value={modelUrl} onChange={setModelUrl} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <PackagePlus className="mr-2 size-4" />
          )}
          Create product
        </Button>
      </div>
    </form>
  );
}
