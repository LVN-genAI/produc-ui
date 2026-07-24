"use client";

import { Controller, type Control } from "react-hook-form";

import type { SchemaField } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormValues } from "@/components/admin/product-form";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

interface DynamicFieldProps {
  field: SchemaField;
  control: Control<ProductFormValues>;
}

/**
 * Renders the correct input for a schema field's `type`, wired into the product
 * form under `attributes.<key>`. Required-ness comes from the schema.
 */
export function DynamicField({ field, control }: DynamicFieldProps) {
  const name = `attributes.${field.key}` as const;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </label>

      <Controller
        control={control}
        name={name}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: rhf, fieldState }) => {
          const value = rhf.value ?? "";

          return (
            <>
              {field.type === "text" && (
                <Input
                  value={value as string}
                  onChange={rhf.onChange}
                  onBlur={rhf.onBlur}
                  aria-invalid={!!fieldState.error}
                  placeholder={field.label}
                />
              )}

              {field.type === "number" && (
                <Input
                  type="number"
                  step="any"
                  value={value as string | number}
                  onChange={(e) =>
                    rhf.onChange(
                      e.target.value === "" ? "" : e.target.valueAsNumber,
                    )
                  }
                  onBlur={rhf.onBlur}
                  aria-invalid={!!fieldState.error}
                  placeholder={field.label}
                />
              )}

              {field.type === "select" && (
                <Select
                  value={(value as string) || undefined}
                  onValueChange={rhf.onChange}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === "swatch" && (
                <div className="flex flex-wrap gap-2">
                  {(field.options ?? []).map((option) => {
                    const selected = value === option;
                    const isColor = HEX.test(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => rhf.onChange(option)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                          selected
                            ? "border-primary ring-2 ring-primary/40"
                            : "border-input hover:bg-muted",
                        )}
                        title={option}
                      >
                        <span
                          className="inline-block size-3.5 rounded-full border"
                          style={
                            isColor ? { backgroundColor: option } : undefined
                          }
                        />
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {fieldState.error && (
                <p className="text-xs text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
