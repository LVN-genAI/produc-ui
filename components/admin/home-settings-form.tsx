"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { Loader2, Save, Sparkles } from "lucide-react";

import type { SiteSettings } from "@/lib/types";
import { updateSiteSettings } from "@/app/admin/settings-actions";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface FormValues {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  primary_cta_label: string;
  primary_cta_href: string;
  featured_enabled: boolean;
}

export function HomeSettingsForm({ settings }: { settings: SiteSettings }) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      hero_eyebrow: settings.hero_eyebrow,
      hero_title: settings.hero_title,
      hero_subtitle: settings.hero_subtitle,
      primary_cta_label: settings.primary_cta_label,
      primary_cta_href: settings.primary_cta_href,
      featured_enabled: settings.featured_enabled,
    },
  });

  const preview = useWatch({ control });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const res = await updateSiteSettings(values);
    setSaving(false);
    if (res.error) {
      toast.add({ title: "Save failed", description: res.error, type: "error" });
      return;
    }
    toast.add({ title: "Home page saved", type: "success" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Eyebrow (small badge text)">
          <Input {...register("hero_eyebrow")} placeholder="Explore the collection" />
        </Field>

        <Field label="Hero title" required error={errors.hero_title?.message}>
          <Input
            {...register("hero_title", { required: "Title is required" })}
            aria-invalid={!!errors.hero_title}
            placeholder="Everything, beautifully organised."
          />
        </Field>

        <Field label="Hero subtitle">
          <Textarea
            {...register("hero_subtitle")}
            rows={3}
            placeholder="Short supporting sentence…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button label">
            <Input {...register("primary_cta_label")} placeholder="Browse the catalog" />
          </Field>
          <Field label="Button link">
            <Input {...register("primary_cta_href")} placeholder="/catalog" />
          </Field>
        </div>

        <Controller
          control={control}
          name="featured_enabled"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              Show featured categories on the home page
            </label>
          )}
        />

        <div className="border-t pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save home page
          </Button>
        </div>
      </form>

      {/* Live preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Preview
        </p>
        <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-10">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br from-violet-500/25 to-fuchsia-500/25 blur-3xl" />
          <div className="relative">
            {preview.hero_eyebrow && (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5" /> {preview.hero_eyebrow}
              </span>
            )}
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {preview.hero_title || "Hero title"}
            </h2>
            {preview.hero_subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">
                {preview.hero_subtitle}
              </p>
            )}
            {preview.primary_cta_label && (
              <span className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {preview.primary_cta_label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
