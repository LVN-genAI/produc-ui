"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { uploadToCatalog, removeFromCatalog } from "@/lib/storage";
import { toast } from "@/components/ui/toast";

interface ModelDropzoneProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ModelDropzone({ value, onChange }: ModelDropzoneProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setUploading(true);
      try {
        const url = await uploadToCatalog(file, "models");
        onChange(url);
      } catch (error) {
        toast.add({
          title: "3D model upload failed",
          description: (error as Error).message,
          type: "error",
        });
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "model/gltf-binary": [".glb"],
      "model/gltf+json": [".gltf"],
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  if (value) {
    const filename = decodeURIComponent(value.split("/").pop() ?? "model");
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Box className="size-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm" title={filename}>
          {filename}
        </span>
        <button
          type="button"
          aria-label="Remove 3D model"
          onClick={() => {
            onChange(null);
            void removeFromCatalog(value);
          }}
          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
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
        <Box className="size-6 text-muted-foreground" />
      )}
      <p className="text-muted-foreground">
        {uploading ? "Uploading…" : "Drop a 3D model here or click (.glb, .gltf)"}
      </p>
    </div>
  );
}
