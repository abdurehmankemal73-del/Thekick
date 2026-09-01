"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { NewsImage } from "@/components/news-image";

export function ImageUploader({
  label,
  value,
  onChange,
  multiple = false,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await api<{ url: string }>("/api/admin/uploads", {
          method: "POST",
          body: form,
        });
        if (!res.url) {
          throw new ApiError(500, "Image upload did not return a file URL");
        }
        uploaded.push(res.url);
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(0, 1));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border border-line">
            <NewsImage
              src={url}
              alt=""
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full"
            />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-bg/80 p-1 text-cream"
              onClick={() => onChange(value.filter((item) => item !== url))}
              aria-label="Remove image"
            >
              <Icon icon={X} />
            </button>
          </div>
        ))}
        <label className="inline-flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-muted hover:border-gold hover:text-gold">
          {uploading ? <Icon icon={LoaderCircle} className="animate-spin" /> : <Icon icon={ImagePlus} />}
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            {uploading ? "Uploading" : "Upload"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            className="sr-only"
            onChange={(event) => onFile(event.target.files)}
          />
        </label>
      </div>
      {value.length === 0 && !uploading ? (
        <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
      ) : null}
      {uploading ? (
        <Button type="button" variant="ghost" size="sm" className="mt-2" disabled>
          Uploading…
        </Button>
      ) : null}
    </div>
  );
}
