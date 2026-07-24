"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { uploadToCatalog, removeFromCatalog } from "@/lib/storage";
import { toast } from "@/components/ui/toast";

interface ImageDropzoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImageDropzone({ value, onChange }: ImageDropzoneProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setUploading(true);
      try {
        const urls = await Promise.all(
          accepted.map((file) => uploadToCatalog(file, "images")),
        );
        onChange([...value, ...urls]);
      } catch (error) {
        toast.add({
          title: "Image upload failed",
          description: (error as Error).message,
          type: "error",
        });
      } finally {
        setUploading(false);
      }
    },
    [value, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    disabled: uploading,
  });

  async function handleRemove(url: string) {
    onChange(value.filter((u) => u !== url));
    void removeFromCatalog(url); // best-effort cleanup
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm transition-colors",
          isDragActive ? "border-primary bg-accent" : "hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <p className="text-muted-foreground">
          {uploading
            ? "Uploading…"
            : "Drop images here or click to upload (PNG, WebP, JPG)"}
        </p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <Image
                src={url}
                alt="Product"
                fill
                sizes="120px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => handleRemove(url)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
