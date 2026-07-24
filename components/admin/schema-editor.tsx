"use client";

import { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";

import type { Category, SchemaField, SchemaFieldType } from "@/lib/types";
import { categoriesQueryKey } from "@/hooks/use-categories";
import { updateCategorySchema } from "@/app/admin/actions";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELD_TYPES: { value: SchemaFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "swatch", label: "Swatch" },
];

const KEY_PATTERN = /^[a-z0-9_]+$/;

const fieldSchema = z.object({
  key: z.string().min(1, "Required").regex(KEY_PATTERN, "Use a-z, 0-9, _ only"),
  label: z.string().min(1, "Required"),
  type: z.enum(["text", "number", "select", "swatch"]),
  optionsText: z.string(),
  required: z.boolean(),
  show_in_grid: z.boolean(),
});

const formSchema = z
  .object({ fields: z.array(fieldSchema) })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.fields.forEach((field, index) => {
      if (field.key && seen.has(field.key)) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", index, "key"],
          message: "Duplicate key",
        });
      }
      seen.add(field.key);

      const needsOptions = field.type === "select" || field.type === "swatch";
      if (needsOptions && !field.optionsText.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", index, "optionsText"],
          message: "Add at least one option",
        });
      }
    });
  });

type FormValues = z.infer<typeof formSchema>;

/** Shape of a single row's validation errors (RHF error nodes carry `message`). */
type FieldRowErrors = {
  key?: { message?: string };
  label?: { message?: string };
  optionsText?: { message?: string };
};

function toFormFields(schema: SchemaField[]): FormValues["fields"] {
  return schema.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    optionsText: (field.options ?? []).join(", "),
    required: Boolean(field.required),
    show_in_grid: Boolean(field.show_in_grid),
  }));
}

function fromFormFields(fields: FormValues["fields"]): SchemaField[] {
  return fields.map((field) => {
    const result: SchemaField = {
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      show_in_grid: field.show_in_grid,
    };
    if (field.type === "select" || field.type === "swatch") {
      result.options = field.optionsText
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean);
    }
    return result;
  });
}

const EMPTY_FIELD: FormValues["fields"][number] = {
  key: "",
  label: "",
  type: "text",
  optionsText: "",
  required: false,
  show_in_grid: false,
};

export function SchemaEditor({ category }: { category: Category }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fields: toFormFields(category.attributes_schema) },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "fields" });

  // Reload the form whenever a different category is selected.
  useEffect(() => {
    reset({ fields: toFormFields(category.attributes_schema) });
  }, [category.id, category.attributes_schema, reset]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const res = await updateCategorySchema(
      category.id,
      fromFormFields(values.fields),
    );
    setSaving(false);
    if (res.error) {
      toast.add({ title: "Save failed", description: res.error, type: "error" });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    reset(values); // clears the dirty state
    toast.add({ title: "Schema saved", type: "success" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{category.name}</h2>
          <p className="text-xs text-muted-foreground">
            Attribute blueprint · {fields.length} field
            {fields.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ ...EMPTY_FIELD })}
          >
            <Plus className="mr-1.5 size-4" /> Add field
          </Button>
          <Button type="submit" size="sm" disabled={saving || !isDirty}>
            {saving ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-4" />
            )}
            Save schema
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {fields.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <p>No attributes defined for this category.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...EMPTY_FIELD })}
            >
              <Plus className="mr-1.5 size-4" /> Add the first field
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <SchemaFieldRow
                key={field.id}
                index={index}
                control={control}
                register={register}
                errors={errors.fields?.[index] as FieldRowErrors | undefined}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

interface SchemaFieldRowProps {
  index: number;
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldRowErrors | undefined;
  onRemove: () => void;
}

function SchemaFieldRow({
  index,
  control,
  register,
  errors,
  onRemove,
}: SchemaFieldRowProps) {
  // Per-row hook (safe: this is a component, not a map callback).
  const type = useWatch({ control, name: `fields.${index}.type` });
  const needsOptions = type === "select" || type === "swatch";

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="hidden items-center justify-center text-muted-foreground md:col-span-1 md:flex">
          <GripVertical className="size-4" />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Key
          </label>
          <Input
            placeholder="ram"
            aria-invalid={!!errors?.key}
            {...register(`fields.${index}.key`)}
          />
          {errors?.key && (
            <p className="mt-1 text-xs text-destructive">{errors.key.message}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Label
          </label>
          <Input
            placeholder="RAM"
            aria-invalid={!!errors?.label}
            {...register(`fields.${index}.label`)}
          />
          {errors?.label && (
            <p className="mt-1 text-xs text-destructive">
              {errors.label.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Type
          </label>
          <Controller
            control={control}
            name={`fields.${index}.type`}
            render={({ field: typeField }) => (
              <Select value={typeField.value} onValueChange={typeField.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Options {needsOptions ? "(comma-separated)" : "—"}
          </label>
          <Input
            placeholder={needsOptions ? "8GB, 16GB, 32GB" : "n/a"}
            disabled={!needsOptions}
            aria-invalid={!!errors?.optionsText}
            {...register(`fields.${index}.optionsText`)}
          />
          {errors?.optionsText && (
            <p className="mt-1 text-xs text-destructive">
              {errors.optionsText.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-6 border-t pt-3">
        <Controller
          control={control}
          name={`fields.${index}.required`}
          render={({ field: reqField }) => (
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={reqField.value}
                onCheckedChange={reqField.onChange}
              />
              Required
            </label>
          )}
        />
        <Controller
          control={control}
          name={`fields.${index}.show_in_grid`}
          render={({ field: gridField }) => (
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={gridField.value}
                onCheckedChange={gridField.onChange}
              />
              Show in grid
            </label>
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="mr-1.5 size-4" /> Remove
        </Button>
      </div>
    </div>
  );
}
